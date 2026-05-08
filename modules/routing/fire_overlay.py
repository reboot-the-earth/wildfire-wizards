"""
Fire overlay — tag road-graph edges with fire risk levels.

Reads fire perimeter polygons (current + projected) and computes:
  - Edge fire-risk status (blocked / at_risk_2hr / at_risk_4hr / near_fire / smoke / safe)
  - Modified edge weights for Dijkstra routing
  - Smoke dispersion cone based on wind direction
  - Minimum distance from a path to the nearest fire perimeter
"""

import math
from shapely.geometry import shape, LineString, Point, Polygon

# Weight multipliers (from spec)
WEIGHT_BLOCKED = float("inf")
WEIGHT_NEAR_FIRE = 5.0       # within 1 km
WEIGHT_AT_RISK_2HR = 10.0
WEIGHT_AT_RISK_4HR = 3.0
WEIGHT_SMOKE = 2.0
WEIGHT_EVAC_TRAFFIC = 1.5    # within 15 km of fire
NEAR_FIRE_KM = 1.0
EVAC_TRAFFIC_KM = 15.0


def _build_fire_shapes(fire_polygons):
    """Parse fire polygon dict into Shapely geometries."""
    current = shape(fire_polygons["current_perimeter"])

    projected = {}
    pp = fire_polygons.get("projected_perimeters", {})
    for key in ("1hr", "2hr", "4hr", "6hr"):
        if key in pp:
            projected[key] = shape(pp[key])

    return current, projected


def _build_smoke_cone(fire_polygons, length_km=20, half_angle_deg=30):
    """
    Build a simple triangular smoke cone downwind of the fire.

    Wind direction is where wind blows FROM, so smoke goes in the opposite
    direction. Returns a Shapely Polygon.
    """
    wind = fire_polygons.get("wind", {})
    wind_from_deg = wind.get("direction_deg", 55)
    origin = fire_polygons.get("origin", fire_polygons.get("fire_origin", {}))
    if not origin:
        return None

    lat0 = origin.get("lat", 33.24)
    lon0 = origin.get("lon", -117.18)

    smoke_dir_deg = (wind_from_deg + 180) % 360
    smoke_dir_rad = math.radians(smoke_dir_deg)

    km_per_deg_lat = 111.0
    km_per_deg_lon = 111.0 * math.cos(math.radians(lat0))

    tip_dlat = length_km * math.cos(smoke_dir_rad) / km_per_deg_lat
    tip_dlon = length_km * math.sin(smoke_dir_rad) / km_per_deg_lon

    spread_km = length_km * math.tan(math.radians(half_angle_deg))
    perp_rad = smoke_dir_rad + math.pi / 2

    perp_dlat = spread_km * math.cos(perp_rad) / km_per_deg_lat
    perp_dlon = spread_km * math.sin(perp_rad) / km_per_deg_lon

    tip_lat = lat0 + tip_dlat
    tip_lon = lon0 + tip_dlon

    coords = [
        (lon0, lat0),
        (tip_lon + perp_dlon, tip_lat + perp_dlat),
        (tip_lon - perp_dlon, tip_lat - perp_dlat),
        (lon0, lat0),
    ]
    return Polygon(coords)


def _edge_line(graph, u, v):
    """Build a LineString for a graph edge from its endpoint coordinates."""
    ux, uy = graph.nodes[u].get("x", 0), graph.nodes[u].get("y", 0)
    vx, vy = graph.nodes[v].get("x", 0), graph.nodes[v].get("y", 0)
    return LineString([(ux, uy), (vx, vy)])


def _point_to_km(p1, p2, ref_lat=33.24):
    """Approximate distance in km between two Shapely points using flat-earth."""
    km_per_deg_lat = 111.0
    km_per_deg_lon = 111.0 * math.cos(math.radians(ref_lat))
    dx = (p1.x - p2.x) * km_per_deg_lon
    dy = (p1.y - p2.y) * km_per_deg_lat
    return math.sqrt(dx * dx + dy * dy)


def tag_edges_with_fire_risk(graph, fire_polygons):
    """
    Tag every edge in the graph with a fire_status and adjust weights.

    Mutates the graph in-place and returns it.
    """
    current, projected = _build_fire_shapes(fire_polygons)
    smoke_cone = _build_smoke_cone(fire_polygons)
    fire_centroid = current.centroid

    for u, v, data in graph.edges(data=True):
        edge_line = _edge_line(graph, u, v)
        base_time = data.get("travel_time", data.get("length", 1000) / 13.4)
        multiplier = 1.0
        status = "safe"

        if current.intersects(edge_line):
            multiplier = WEIGHT_BLOCKED
            status = "blocked"
        elif "2hr" in projected and projected["2hr"].intersects(edge_line):
            multiplier = WEIGHT_AT_RISK_2HR
            status = "at_risk_in_2hr"
        elif "4hr" in projected and projected["4hr"].intersects(edge_line):
            multiplier = WEIGHT_AT_RISK_4HR
            status = "at_risk_in_4hr"
        else:
            edge_mid = edge_line.interpolate(0.5, normalized=True)
            dist_km = _point_to_km(edge_mid, fire_centroid)

            if dist_km < NEAR_FIRE_KM:
                multiplier = WEIGHT_NEAR_FIRE
                status = "near_fire"
            elif smoke_cone and smoke_cone.contains(Point(edge_mid.x, edge_mid.y)):
                multiplier = WEIGHT_SMOKE
                status = "smoke"
            elif dist_km < EVAC_TRAFFIC_KM:
                multiplier = WEIGHT_EVAC_TRAFFIC
                status = "evacuation_traffic"

        data["fire_status"] = status
        data["weight"] = base_time * multiplier
        data["base_time"] = base_time

    return graph


def calc_min_fire_distance(graph, path, fire_polygons):
    """
    Calculate the minimum distance (in km) from any point along a path
    to the nearest fire perimeter edge.
    """
    current, _ = _build_fire_shapes(fire_polygons)

    min_dist = float("inf")
    for node_id in path:
        nd = graph.nodes[node_id]
        pt = Point(nd.get("x", 0), nd.get("y", 0))
        dist_deg = current.exterior.distance(pt)
        dist_km = dist_deg * 111.0 * math.cos(math.radians(nd.get("y", 33.24)))
        if dist_km < min_dist:
            min_dist = dist_km

    return round(min_dist, 1) if min_dist < float("inf") else 999.0


def get_segment_status(graph, u, v):
    """Return the fire status of a single edge."""
    edge_data = graph.get_edge_data(u, v)
    if edge_data is None:
        return "unknown"
    return edge_data.get("fire_status", "safe")

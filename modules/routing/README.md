# Person 2: Road Network & Safe Route Engine

**Role:** The navigator. Given a farm location and candidate destinations (from Person 3), this module finds the safest drivable route to each one, avoiding fire zones, closed roads, and smoke.

## Your Deliverable

A single function that takes farm coordinates + facility list + fire polygons and returns ranked routes as GeoJSON with safety scores. Tested with Lilac Fire scenario showing it avoids Highway 76.

## Data Sources

| Dataset | What It Gives You | Where to Get It |
|---------|-------------------|-----------------|
| OpenStreetMap via OSMnx | Complete road network with speed limits, road type, weight restrictions | `pip install osmnx` then `ox.graph_from_place("San Diego County, California", network_type="drive")`. Takes 2-3 min. Cache as GraphML. **Do this in hour 1.** |
| CalTrans LCSM | Real-time lane closures for San Diego (District 11) | `https://cwwp2.dot.ca.gov/`. For hackathon, hardcode Lilac Fire road closures. |
| Fire danger zones | Areas to avoid | Read Person 1's output from shared `data/fire_data.json` |
| Smoke dispersion | Downwind roads with reduced visibility | Derived: simple cone downwind of fire. Roads in cone get 2x time penalty. |

## Hour-by-Hour Plan

| Hour | Task |
|------|------|
| 0-1 | Download SD County road graph via OSMnx. Cache as `data/sd_roads.graphml`. Confirm ~200k+ edges. Test basic routing between two known points. |
| 1-3 | Build fire zone avoidance. For each edge, check intersection with fire polygons (current + projected). Tag edges: `safe` / `at_risk_in_2hr` / `at_risk_in_4hr` / `blocked`. Use Shapely `intersects()` with spatial indexing. |
| 3-5 | Build weighted routing. Modify edge weights: blocked=infinity, at_risk_2hr=10x, at_risk_4hr=3x, smoke=2x, within 1km of fire=5x. Run Dijkstra on modified graph. |
| 5-7 | Build multi-destination scoring. Input: one farm + 5-10 candidate facilities. Route to each. Return ranked by: total time, safety score (min distance from fire along route), number of risky segments. Handle "no safe route" as valid result. |
| 7-8 | Build heavy vehicle filter. Exclude edges tagged residential/service/unclassified for cattle trailer routes. Only use primary/secondary/trunk/motorway. Add `trailer_friendly` flag. |

## Core Algorithm

```python
import osmnx as ox
import networkx as nx
from shapely.geometry import shape, LineString

def find_safe_routes(graph, farm_coords, facility_list, fire_polygons):
    # Step 1: Tag every edge with fire risk
    for u, v, data in graph.edges(data=True):
        edge_line = LineString([
            (graph.nodes[u]['x'], graph.nodes[u]['y']),
            (graph.nodes[v]['x'], graph.nodes[v]['y'])
        ])

        base_time = data.get('travel_time', data['length'] / 13.4)  # 30mph default

        for fp in fire_polygons:
            if shape(fp['current']).intersects(edge_line):
                data['weight'] = float('inf')  # blocked
                break
            elif shape(fp['2hr']).intersects(edge_line):
                data['weight'] = base_time * 10
                break
            elif shape(fp['4hr']).intersects(edge_line):
                data['weight'] = base_time * 3
                break
        else:
            data['weight'] = base_time

    # Step 2: Route from farm to each facility
    farm_node = ox.nearest_nodes(graph, farm_coords[1], farm_coords[0])
    routes = []

    for facility in facility_list:
        fac_node = ox.nearest_nodes(graph, facility['lon'], facility['lat'])
        try:
            path = nx.dijkstra_path(graph, farm_node, fac_node, weight='weight')
            total_time = nx.dijkstra_path_length(graph, farm_node, fac_node, weight='weight')
            min_fire_dist = calc_min_fire_distance(graph, path, fire_polygons)

            routes.append({
                "facility": facility,
                "path": nodes_to_geojson(graph, path),
                "time_minutes": round(total_time),
                "safety_score": round(min_fire_dist, 1),
                "trailer_friendly": check_trailer_friendly(graph, path),
                "status": "safe" if min_fire_dist > 2 else "risky",
                "segments": build_segments(graph, path, fire_polygons)
            })
        except nx.NetworkXNoPath:
            routes.append({
                "facility": facility,
                "status": "no_safe_route",
                "reason": "All access roads intersect current fire perimeter"
            })

    return sorted(routes, key=lambda r: r.get('time_minutes', float('inf')))
```

## Edge Weighting Table

| Condition | Weight Multiplier | Rationale |
|-----------|-------------------|-----------|
| Safe road | 1x (base travel time) | Normal |
| Within 1km of fire | 5x | Heat, falling debris |
| At risk in 4 hours | 3x | May become blocked during return trip |
| At risk in 2 hours | 10x | Likely blocked before evacuation complete |
| In smoke cone | 2x | Reduced visibility, health risk |
| Currently blocked | infinity | Impassable |
| Evacuation traffic zone (within 15km of fire) | 1.5x | Congestion from other evacuees |

## Edge Cases You Must Handle

| Condition | How to Handle |
|-----------|---------------|
| Dead-end roads / single-access canyons | If the one road out is cut, flag `NO SAFE ROUTE - SHELTER IN PLACE` immediately |
| Cattle trailers | Penalize roads tagged residential/service/unclassified. Only use primary/secondary/trunk/motorway. |
| Route recalculation | Build function to be re-runnable every 30 min as fire perimeter updates |
| One-way evacuation roads | For demo: manually flag Highway 76 as outbound-only during Lilac Fire |
| Sharp turns / steep grades | Penalize for trailer routes using OSM road geometry |

## File Structure

```
modules/routing/
  README.md                <- you are here
  route_engine.py          <- main module with find_safe_routes()
  graph_loader.py          <- OSMnx download and caching
  fire_overlay.py          <- edge tagging based on fire polygons
  trailer_filter.py        <- heavy vehicle road filtering
  download_roads.py        <- script to pre-download and cache road graph
  tests/
    test_routing.py        <- validate Highway 76 avoidance in Lilac Fire scenario
  requirements.txt
```

## Your Export Function

```python
def find_safe_routes(
    farm_coords: tuple,              # (lat, lon)
    facility_list: list[dict],       # [{"facility_id": ..., "lat": ..., "lon": ...}, ...]
    fire_polygons: dict              # Person 1's output (projected_perimeters + current_perimeter)
) -> dict:
    """Returns the output JSON schema below"""
```

## Output JSON Schema

```json
{
  "farm": {"id": "valley_center_ranch", "lat": 33.22, "lon": -117.03},
  "routes_to_facilities": [
    {
      "rank": 1,
      "facility_id": "ramona_rodeo",
      "facility_name": "Ramona Rodeo Grounds",
      "total_time_min": 38,
      "total_distance_km": 24,
      "safety_score": 92,
      "min_fire_distance_km": 6.1,
      "trailer_friendly": true,
      "route_geometry": {"type": "LineString", "coordinates": [["..."]]},
      "segments": [
        {"road": "Valley Center Rd", "status": "safe", "time_min": 12},
        {"road": "CA-78 West", "status": "safe", "time_min": 15},
        {"road": "Ramona St", "status": "safe", "time_min": 11}
      ],
      "warnings": []
    },
    {
      "rank": 2,
      "facility_id": "bonsall_fairgrounds",
      "facility_name": "Bonsall Community Grounds",
      "total_time_min": 45,
      "total_distance_km": 30,
      "safety_score": 61,
      "min_fire_distance_km": 2.3,
      "trailer_friendly": true,
      "route_geometry": {"type": "LineString", "coordinates": [["..."]]},
      "segments": [
        {"road": "Valley Center Rd", "status": "safe", "time_min": 12},
        {"road": "Old Highway 395", "status": "at_risk_in_4hr", "time_min": 18},
        {"road": "Mission Rd", "status": "safe", "time_min": 15}
      ],
      "warnings": ["Passes within 2.3km of projected 4hr fire line on Old Highway 395"]
    },
    {
      "rank": null,
      "facility_id": "san_luis_rey",
      "facility_name": "San Luis Rey Training Center",
      "status": "no_safe_route",
      "reason": "All access roads intersect current fire perimeter"
    }
  ],
  "timestamp": "2026-05-08T14:30:00Z",
  "next_recalculation": "2026-05-08T15:00:00Z"
}
```

## How Your Output Is Used

- **Person 5 (Frontend)** renders your routes as color-coded polylines on the map (green=safe, yellow=at_risk_4hr, red=at_risk_2hr). Rank 1 route is thick and solid, others are thin and dashed.
- **Person 3 (Facilities)** uses your `total_time_min` to calculate round-trip times for multi-trip evacuation schedules.
- **Person 4 (Farmer Input)** uses your route time to compute total evacuation duration (loading + driving + unloading per trip).

## What You Read from Other Modules

- **Person 1's output** (`data/fire_data.json`): `current_perimeter`, `projected_perimeters`, `wind` - used to tag edges and compute smoke cone
- **Person 3's output** (`data/facilities.json`): facility coordinates as routing destinations

## Lilac Fire Demo Validation

Your routing must demonstrate:
- Highway 76 is BLOCKED (intersects fire perimeter) - route avoids it
- I-15 has intermittent closures - route penalizes it
- Old Highway 395 through Fallbrook is the alternate but congested - shown as viable but slower
- San Luis Rey Training Center returns `no_safe_route` (its single access road is cut)
- **Demo contrast:** "Google Maps says 15 min via Highway 76. NoHerdLeft says 38 min via Valley Center Rd - because Highway 76 is on fire."

## Tech Stack

```
pip install osmnx networkx shapely scipy
```

- **OSMnx** - download and query OpenStreetMap road networks
- **NetworkX** - graph algorithms (Dijkstra shortest path)
- **Shapely** - geometry operations (edge-polygon intersection)
- **scipy** - spatial indexing for fast intersection checks

## Demo Assignment

**Judge question you own:** "Is this open source?"

**Your answer:** "Yes. MIT license. Built entirely on open data - NASA FIRMS, OpenStreetMap, NOAA. The facility database is the community-contributed layer - any county can add their own facilities and the routing works immediately."

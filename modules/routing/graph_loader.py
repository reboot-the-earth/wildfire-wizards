"""
Road network graph loading and caching.

Supports two modes:
  - Real mode: downloads San Diego County roads via OSMnx, caches as GraphML
  - Demo mode: builds a synthetic graph with realistic Lilac Fire-area roads
"""

import os
import math
import networkx as nx

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
GRAPH_CACHE = os.path.join(DATA_DIR, "sd_roads.graphml")


def download_road_graph(place="San Diego County, California", cache_path=None):
    """Download the real road network via OSMnx and cache as GraphML."""
    import osmnx as ox

    cache_path = cache_path or GRAPH_CACHE
    print(f"Downloading road graph for {place}...")
    G = ox.graph_from_place(place, network_type="drive")
    G = ox.add_edge_speeds(G)
    G = ox.add_edge_travel_times(G)
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    ox.save_graphml(G, cache_path)
    print(f"Saved {G.number_of_nodes()} nodes, {G.number_of_edges()} edges to {cache_path}")
    return G


def load_road_graph(cache_path=None):
    """Load cached GraphML if available, otherwise fall back to demo graph."""
    cache_path = cache_path or GRAPH_CACHE
    if os.path.exists(cache_path):
        import osmnx as ox
        print(f"Loading cached road graph from {cache_path}")
        return ox.load_graphml(cache_path)
    print("No cached road graph found — using demo graph")
    return build_demo_graph()


def _haversine_m(lat1, lon1, lat2, lon2):
    """Distance in meters between two WGS84 points."""
    R = 6_371_000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Demo graph — synthetic road network for the Lilac Fire area
# ---------------------------------------------------------------------------

# Nodes keyed by id → (lat, lon).  Ids encode rough location / intersection.
_DEMO_NODES = {
    # Valley Center area (farm 1 region)
    "vc_ranch":      (33.220, -117.030),
    "vc_rd_1":       (33.210, -117.040),
    "vc_rd_2":       (33.195, -117.055),
    "vc_rd_3":       (33.175, -117.065),
    "vc_rd_4":       (33.150, -117.070),

    # CA-78 corridor to Ramona
    "ca78_1":        (33.140, -117.050),
    "ca78_2":        (33.120, -117.010),
    "ca78_3":        (33.100, -116.970),
    "ca78_4":        (33.080, -116.930),
    "ca78_5":        (33.060, -116.900),
    "ramona":        (33.050, -116.870),

    # Highway 76 (E-W through fire zone — should be BLOCKED)
    "hwy76_w":       (33.240, -117.300),
    "hwy76_1":       (33.240, -117.260),
    "hwy76_2":       (33.240, -117.220),
    "hwy76_fire":    (33.240, -117.180),  # fire origin
    "hwy76_3":       (33.240, -117.140),
    "hwy76_4":       (33.240, -117.100),
    "hwy76_e":       (33.240, -117.050),

    # I-15 corridor (N-S, near fire — intermittent closures)
    "i15_n":         (33.380, -117.170),
    "i15_1":         (33.340, -117.170),
    "i15_2":         (33.300, -117.170),
    "i15_bonsall":   (33.260, -117.175),
    "i15_3":         (33.220, -117.175),
    "i15_4":         (33.180, -117.175),
    "i15_5":         (33.130, -117.180),
    "i15_6":         (33.080, -117.185),
    "i15_s":         (33.020, -117.190),

    # Old Highway 395 / Fallbrook corridor
    "fb_stables":    (33.370, -117.250),
    "oh395_1":       (33.340, -117.245),
    "oh395_2":       (33.310, -117.240),
    "oh395_3":       (33.280, -117.235),

    # Bonsall / Mission Rd area
    "bonsall_comm":  (33.280, -117.300),
    "mission_1":     (33.270, -117.270),
    "mission_2":     (33.260, -117.250),

    # San Luis Rey Training Center (inside fire zone)
    "slr_center":    (33.240, -117.170),

    # Del Mar / coastal route
    "dm_fair":       (32.960, -117.260),
    "coast_1":       (33.000, -117.260),
    "coast_2":       (33.040, -117.255),
    "coast_3":       (33.080, -117.250),
    "coast_4":       (33.120, -117.245),
    "coast_5":       (33.160, -117.240),

    # Valley Center Staging
    "vc_staging":    (33.220, -116.920),

    # Connectors
    "conn_vc_i15":   (33.220, -117.100),
    "conn_78_i15":   (33.140, -117.100),
    "conn_fb_i15":   (33.380, -117.210),
    "conn_coast_i15": (33.080, -117.220),
}

# Edges: (from, to, road_name, highway_type, speed_mph)
_DEMO_EDGES = [
    # Valley Center Rd — from ranch toward CA-78
    ("vc_ranch",    "vc_rd_1",     "Valley Center Rd",  "secondary",  35),
    ("vc_rd_1",     "vc_rd_2",     "Valley Center Rd",  "secondary",  35),
    ("vc_rd_2",     "vc_rd_3",     "Valley Center Rd",  "secondary",  35),
    ("vc_rd_3",     "vc_rd_4",     "Valley Center Rd",  "secondary",  35),
    ("vc_rd_4",     "ca78_1",      "Valley Center Rd",  "secondary",  35),

    # CA-78 to Ramona
    ("ca78_1",      "ca78_2",      "CA-78",             "primary",    50),
    ("ca78_2",      "ca78_3",      "CA-78",             "primary",    50),
    ("ca78_3",      "ca78_4",      "CA-78",             "primary",    50),
    ("ca78_4",      "ca78_5",      "CA-78",             "primary",    50),
    ("ca78_5",      "ramona",      "Ramona St",         "secondary",  35),

    # Highway 76 (E-W, passes through fire)
    ("hwy76_w",     "hwy76_1",     "Highway 76",        "primary",    55),
    ("hwy76_1",     "hwy76_2",     "Highway 76",        "primary",    55),
    ("hwy76_2",     "hwy76_fire",  "Highway 76",        "primary",    55),
    ("hwy76_fire",  "hwy76_3",     "Highway 76",        "primary",    55),
    ("hwy76_3",     "hwy76_4",     "Highway 76",        "primary",    55),
    ("hwy76_4",     "hwy76_e",     "Highway 76",        "primary",    55),

    # I-15 (N-S, near fire zone)
    ("i15_n",       "i15_1",       "I-15",              "motorway",   65),
    ("i15_1",       "i15_2",       "I-15",              "motorway",   65),
    ("i15_2",       "i15_bonsall", "I-15",              "motorway",   65),
    ("i15_bonsall", "i15_3",       "I-15",              "motorway",   65),
    ("i15_3",       "i15_4",       "I-15",              "motorway",   65),
    ("i15_4",       "i15_5",       "I-15",              "motorway",   65),
    ("i15_5",       "i15_6",       "I-15",              "motorway",   65),
    ("i15_6",       "i15_s",       "I-15",              "motorway",   65),

    # Old Highway 395 / Fallbrook
    ("fb_stables",  "oh395_1",     "Old Highway 395",   "secondary",  40),
    ("oh395_1",     "oh395_2",     "Old Highway 395",   "secondary",  40),
    ("oh395_2",     "oh395_3",     "Old Highway 395",   "secondary",  40),
    ("oh395_3",     "mission_1",   "Old Highway 395",   "secondary",  40),

    # Mission Rd / Bonsall connectors
    ("bonsall_comm", "mission_1",  "Mission Rd",        "secondary",  35),
    ("mission_1",   "mission_2",   "Mission Rd",        "secondary",  35),
    ("mission_2",   "hwy76_2",     "Mission Rd",        "secondary",  35),

    # Coastal route to Del Mar
    ("dm_fair",     "coast_1",     "I-5 / Coast Hwy",   "motorway",   60),
    ("coast_1",     "coast_2",     "I-5 / Coast Hwy",   "motorway",   60),
    ("coast_2",     "coast_3",     "I-5 / Coast Hwy",   "motorway",   60),
    ("coast_3",     "coast_4",     "I-5 / Coast Hwy",   "motorway",   60),
    ("coast_4",     "coast_5",     "I-5 / Coast Hwy",   "motorway",   60),
    ("coast_5",     "hwy76_w",     "I-5 / Coast Hwy",   "motorway",   60),

    # Cross-connectors
    ("vc_ranch",    "conn_vc_i15", "Woods Valley Rd",   "secondary",  30),
    ("conn_vc_i15", "hwy76_e",     "Woods Valley Rd",   "secondary",  30),
    ("conn_vc_i15", "i15_3",       "Old Castle Rd",     "secondary",  30),
    ("vc_rd_4",     "conn_78_i15", "Lake Wohlford Rd",  "secondary",  30),
    ("conn_78_i15", "i15_5",       "Lake Wohlford Rd",  "secondary",  30),
    ("conn_78_i15", "ca78_1",      "Lake Wohlford Rd",  "secondary",  30),
    ("fb_stables",  "conn_fb_i15", "E Mission Rd",      "secondary",  35),
    ("conn_fb_i15", "i15_n",       "E Mission Rd",      "secondary",  35),
    ("coast_3",     "conn_coast_i15", "Palomar Airport Rd", "primary", 45),
    ("conn_coast_i15", "i15_6",    "Palomar Airport Rd", "primary",   45),

    # San Luis Rey — only accessible via Highway 76 through fire zone
    ("hwy76_fire",  "slr_center",  "Training Center Rd", "residential", 25),

    # Highway 76 connectors to I-15
    ("hwy76_2",     "i15_bonsall", "Pala Rd",           "secondary",  35),
    ("hwy76_4",     "i15_3",       "Circle R Dr",       "secondary",  30),

    # Valley Center Staging — off CA-78 spur
    ("ca78_3",      "vc_staging",  "San Pasqual Rd",    "secondary",  35),

    # Old 395 to coast
    ("oh395_3",     "coast_5",     "Olive Hill Rd",     "secondary",  30),

    # Fallbrook to coastal
    ("oh395_1",     "coast_4",     "S Mission Rd",      "secondary",  35),
]


def build_demo_graph():
    """Build a synthetic but geographically realistic road graph for the Lilac Fire demo."""
    G = nx.DiGraph()

    for node_id, (lat, lon) in _DEMO_NODES.items():
        G.add_node(node_id, y=lat, x=lon, street_count=2)

    for u, v, name, highway, speed_mph in _DEMO_EDGES:
        lat1, lon1 = _DEMO_NODES[u]
        lat2, lon2 = _DEMO_NODES[v]
        length_m = _haversine_m(lat1, lon1, lat2, lon2)
        speed_mps = speed_mph * 0.44704
        travel_time = length_m / speed_mps if speed_mps > 0 else float("inf")

        edge_attrs = {
            "length": length_m,
            "name": name,
            "highway": highway,
            "maxspeed": f"{speed_mph} mph",
            "speed_kph": speed_mph * 1.60934,
            "travel_time": travel_time,
        }
        G.add_edge(u, v, **edge_attrs)
        G.add_edge(v, u, **edge_attrs)

    return G

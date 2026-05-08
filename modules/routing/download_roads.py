#!/usr/bin/env python3
"""
Pre-download and cache the San Diego County road network.

Run this BEFORE the hackathon to avoid slow downloads during the demo:
    python -m modules.routing.download_roads

The graph is saved to data/sd_roads.graphml (~50-100 MB).
If the file already exists, this script skips the download.
"""

import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
GRAPH_CACHE = os.path.join(DATA_DIR, "sd_roads.graphml")


def main():
    if os.path.exists(GRAPH_CACHE):
        size_mb = os.path.getsize(GRAPH_CACHE) / (1024 * 1024)
        print(f"Road graph already cached at {GRAPH_CACHE} ({size_mb:.1f} MB)")
        print("Delete the file and re-run to force a fresh download.")
        return

    try:
        import osmnx as ox
    except ImportError:
        print("ERROR: osmnx not installed. Run: pip install osmnx networkx shapely scipy")
        sys.exit(1)

    place = "San Diego County, California"
    print(f"Downloading road network for {place}...")
    print("This takes 2-3 minutes. Do not interrupt.")

    G = ox.graph_from_place(place, network_type="drive")
    G = ox.add_edge_speeds(G)
    G = ox.add_edge_travel_times(G)

    os.makedirs(DATA_DIR, exist_ok=True)
    ox.save_graphml(G, GRAPH_CACHE)

    print(f"\nDone! Saved {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    print(f"File: {GRAPH_CACHE} ({os.path.getsize(GRAPH_CACHE) / (1024*1024):.1f} MB)")


if __name__ == "__main__":
    main()

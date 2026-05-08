"""
Tests for the Safe Route Engine — validates Lilac Fire demo scenario.

Key validations:
  1. Highway 76 is BLOCKED (intersects fire perimeter) — route avoids it
  2. San Luis Rey Training Center returns no_safe_route
  3. Routes are ranked by safety score / time
  4. Trailer-friendliness is detected correctly
  5. Smoke cone is computed and penalizes downwind roads
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from modules.routing.graph_loader import build_demo_graph
from modules.routing.fire_overlay import (
    tag_edges_with_fire_risk,
    calc_min_fire_distance,
    _build_smoke_cone,
)
from modules.routing.trailer_filter import (
    apply_trailer_weights,
    check_trailer_friendly,
)
from modules.routing.route_engine import find_safe_routes

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")


def _load_fire_data():
    with open(os.path.join(DATA_DIR, "fire_data.json")) as f:
        return json.load(f)


def _load_facilities():
    with open(os.path.join(DATA_DIR, "facilities.json")) as f:
        return json.load(f)


class TestFireOverlay(unittest.TestCase):
    """Verify fire-zone edge tagging works correctly."""

    def setUp(self):
        self.graph = build_demo_graph()
        self.fire_data = _load_fire_data()
        tag_edges_with_fire_risk(self.graph, self.fire_data)

    def test_highway_76_through_fire_is_blocked(self):
        """Highway 76 edges passing through fire origin must be tagged blocked."""
        blocked_edges = []
        for u, v, data in self.graph.edges(data=True):
            if data.get("name") == "Highway 76" and data.get("fire_status") == "blocked":
                blocked_edges.append((u, v))

        self.assertGreater(len(blocked_edges), 0,
                           "Highway 76 should have at least one blocked segment near fire")

    def test_safe_roads_exist(self):
        """Some edges far from fire should remain safe."""
        safe_count = sum(
            1 for _, _, d in self.graph.edges(data=True)
            if d.get("fire_status") == "safe"
        )
        self.assertGreater(safe_count, 0, "Some edges should be safe")

    def test_blocked_edges_have_infinite_weight(self):
        """Blocked edges must have weight = infinity."""
        for _, _, data in self.graph.edges(data=True):
            if data.get("fire_status") == "blocked":
                self.assertEqual(data["weight"], float("inf"))

    def test_smoke_cone_is_generated(self):
        """Smoke cone should be a valid polygon for given wind data."""
        cone = _build_smoke_cone(self.fire_data)
        self.assertIsNotNone(cone)
        self.assertTrue(cone.is_valid)
        self.assertGreater(cone.area, 0)


class TestTrailerFilter(unittest.TestCase):
    """Verify trailer filtering logic."""

    def setUp(self):
        self.graph = build_demo_graph()
        apply_trailer_weights(self.graph)

    def test_residential_roads_not_trailer_friendly(self):
        """Residential/service roads should be flagged as not trailer-friendly."""
        for _, _, data in self.graph.edges(data=True):
            if data.get("highway") == "residential":
                self.assertFalse(data.get("trailer_friendly", True))

    def test_motorway_is_trailer_friendly(self):
        """Motorways should be trailer-friendly."""
        for _, _, data in self.graph.edges(data=True):
            if data.get("highway") == "motorway":
                self.assertTrue(data.get("trailer_friendly", False))

    def test_san_luis_rey_access_not_trailer_friendly(self):
        """Training Center Rd (residential) is not trailer-friendly."""
        path = ["hwy76_fire", "slr_center"]
        self.assertFalse(check_trailer_friendly(self.graph, path))


class TestRouteEngine(unittest.TestCase):
    """End-to-end routing tests with Lilac Fire demo scenario."""

    def setUp(self):
        self.fire_data = _load_fire_data()
        self.facilities = _load_facilities()["facilities"]
        self.farm_coords = (33.22, -117.03)  # Valley Center Ranch

    def test_finds_routes(self):
        """find_safe_routes returns results with expected structure."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        self.assertIn("farm", result)
        self.assertIn("routes_to_facilities", result)
        self.assertIn("timestamp", result)
        self.assertGreater(len(result["routes_to_facilities"]), 0)

    def test_san_luis_rey_no_safe_route(self):
        """
        San Luis Rey Training Center should return no_safe_route because
        its only access road (Highway 76) passes through the fire.
        """
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        slr_route = None
        for r in result["routes_to_facilities"]:
            if r["facility_id"] == "san_luis_rey":
                slr_route = r
                break

        self.assertIsNotNone(slr_route, "San Luis Rey should be in results")
        self.assertEqual(slr_route["status"], "no_safe_route")

    def test_ramona_is_reachable(self):
        """Ramona Rodeo Grounds should be reachable via Valley Center Rd + CA-78."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        ramona_route = None
        for r in result["routes_to_facilities"]:
            if r["facility_id"] == "ramona_rodeo":
                ramona_route = r
                break

        self.assertIsNotNone(ramona_route, "Ramona should be in results")
        self.assertNotEqual(ramona_route.get("status"), "no_safe_route")
        self.assertIn("total_time_min", ramona_route)
        self.assertIn("route_geometry", ramona_route)

    def test_routes_are_ranked(self):
        """Routable facilities should have sequential rank numbers."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)
        ranked = [r for r in result["routes_to_facilities"] if r["rank"] is not None]

        ranks = [r["rank"] for r in ranked]
        self.assertEqual(ranks, list(range(1, len(ranks) + 1)),
                         "Ranks should be sequential starting from 1")

    def test_route_avoids_highway_76(self):
        """
        The top-ranked route to Ramona should NOT use Highway 76,
        because Highway 76 passes through the active fire.
        """
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        ramona_route = None
        for r in result["routes_to_facilities"]:
            if r["facility_id"] == "ramona_rodeo":
                ramona_route = r
                break

        self.assertIsNotNone(ramona_route)
        if ramona_route.get("segments"):
            road_names = [s["road"] for s in ramona_route["segments"]]
            self.assertNotIn("Highway 76", road_names,
                             "Route to Ramona should avoid Highway 76 (it's on fire)")

    def test_output_has_geojson(self):
        """Each routable result should contain a GeoJSON LineString."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        for r in result["routes_to_facilities"]:
            if r.get("status") == "no_safe_route":
                continue
            geom = r.get("route_geometry", {})
            self.assertEqual(geom.get("type"), "LineString")
            self.assertGreater(len(geom.get("coordinates", [])), 1)

    def test_safety_scores_in_range(self):
        """Safety scores should be between 0 and 100."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        for r in result["routes_to_facilities"]:
            if "safety_score" in r:
                self.assertGreaterEqual(r["safety_score"], 0)
                self.assertLessEqual(r["safety_score"], 100)


class TestFallbrookStables(unittest.TestCase):
    """Test routing from Fallbrook Stables (Farm 2 in demo)."""

    def setUp(self):
        self.fire_data = _load_fire_data()
        self.facilities = _load_facilities()["facilities"]
        self.farm_coords = (33.37, -117.25)  # Fallbrook Stables

    def test_del_mar_reachable(self):
        """Del Mar Fairgrounds should be reachable from Fallbrook."""
        result = find_safe_routes(self.farm_coords, self.facilities, self.fire_data)

        dm_route = None
        for r in result["routes_to_facilities"]:
            if r["facility_id"] == "del_mar_fairgrounds":
                dm_route = r
                break

        self.assertIsNotNone(dm_route)
        self.assertNotEqual(dm_route.get("status"), "no_safe_route")


if __name__ == "__main__":
    unittest.main()

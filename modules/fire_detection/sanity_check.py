#!/usr/bin/env python3
"""
Sanity checks for Person 1 fire detection & spread.

Usage (from repo root `wildfire-wizards/`):

  python modules/fire_detection/sanity_check.py

Exits 0 on success, 1 on failure.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from modules.fire_detection.fire_spread import (  # noqa: E402
    downwind_bearing_deg,
    get_fire_data,
    load_config,
    predict_spread_rate_m_per_hr,
    spread_footprint_polygon,
)


def _polygon_area_approx(coords: list) -> float:
    """Shoelace area in lon/lat plane (only for relative comparisons)."""
    if not coords or len(coords[0]) < 3:
        return 0.0
    ring = coords[0]
    s = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0


def _offset_km(lat: float, lon: float, bearing_deg: float, distance_km: float) -> tuple[float, float]:
    """Rough destination point for short offsets."""
    br = math.radians(bearing_deg)
    north_km = distance_km * math.cos(br)
    east_km = distance_km * math.sin(br)
    m_lat = 111.32
    m_lon = 111.32 * math.cos(math.radians(lat))
    return lat + north_km / m_lat, lon + east_km / m_lon


def _fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)


def _ok(msg: str) -> None:
    print(f"OK: {msg}")


def main() -> int:
    config = load_config(ROOT / "config.json")
    bbox = config["bounding_box"]
    origin = config["demo_scenario"]["fire_origin"]
    o_lat, o_lon = float(origin["lat"]), float(origin["lon"])
    wind_from = float(config["demo_scenario"]["wind_direction_deg"])

    down = downwind_bearing_deg(wind_from)
    risky_lat, risky_lon = _offset_km(o_lat, o_lon, down, 8.0)
    safe_lat, safe_lon = _offset_km(o_lat, o_lon, (down + 180.0) % 360.0, 40.0)

    farms = [
        {"farm_id": "downwind_test_farm", "lat": risky_lat, "lon": risky_lon},
        {"farm_id": "upwind_safe_farm", "lat": safe_lat, "lon": safe_lon},
    ]

    payload = get_fire_data(bbox, farms, config_path=ROOT / "config.json")

    required_top = [
        "timestamp",
        "fire_id",
        "active_hotspots",
        "current_perimeter",
        "projected_perimeters",
        "wind",
        "weather",
        "farms_at_risk",
        "danger_zone",
    ]
    for key in required_top:
        if key not in payload:
            _fail(f"missing top-level key {key!r}")
            return 1

    if not payload["active_hotspots"]:
        _fail("expected at least one hotspot (demo or FIRMS)")
        return 1

    for h in payload["active_hotspots"]:
        if not {"lat", "lon", "confidence", "brightness"} <= set(h):
            _fail(f"hotspot missing fields: {h!r}")
            return 1

    proj = payload["projected_perimeters"]
    steps = config.get("time_steps_hours", [1, 2, 4, 6])
    if len(proj) != len(steps):
        _fail(f"projected_perimeters length {len(proj)} != steps {steps}")
        return 1

    areas: list[float] = []
    for entry in proj:
        if entry.get("hours") not in steps:
            _fail(f"unexpected hours in projection: {entry!r}")
            return 1
        geom = entry.get("geometry") or {}
        if geom.get("type") != "Polygon":
            _fail(f"projection geometry not Polygon: {entry!r}")
            return 1
        coords = geom.get("coordinates") or []
        if not coords or not coords[0]:
            _fail(f"empty polygon at hour {entry.get('hours')}")
            return 1
        areas.append(_polygon_area_approx(coords))

    for i in range(1, len(areas)):
        if areas[i] < areas[i - 1] * 0.98:
            _fail(f"projection area shrank unexpectedly at step {i}: {areas}")
            return 1

    cp = payload["current_perimeter"]
    if cp.get("type") != "Polygon" or not cp.get("coordinates"):
        _fail(f"invalid current_perimeter: {cp!r}")
        return 1

    dz = payload["danger_zone"]
    if dz.get("type") != "Polygon":
        _fail(f"invalid danger_zone type: {dz!r}")
        return 1

    wind = payload["wind"]
    if not {"speed_mph", "direction_deg", "gusts_mph"} <= set(wind):
        _fail(f"wind missing keys: {wind!r}")
        return 1

    wx = payload["weather"]
    if not {"humidity_pct", "temp_f"} <= set(wx):
        _fail(f"weather missing keys: {wx!r}")
        return 1

    at_risk_ids = {f["farm_id"] for f in payload["farms_at_risk"]}
    if "downwind_test_farm" not in at_risk_ids:
        _fail("expected downwind farm to be classified at risk")
        return 1
    if "upwind_safe_farm" in at_risk_ids:
        _fail("did not expect far upwind farm to be at risk")
        return 1

    for farm in payload["farms_at_risk"]:
        eta = farm.get("estimated_time_to_fire_hours")
        if eta is None:
            _fail(f"null ETA for farm {farm.get('farm_id')}")
            return 1
        if eta < 0:
            _fail(f"negative ETA {eta}")
            return 1
        if farm.get("risk_level") not in {"critical", "high", "medium", "low"}:
            _fail(f"unexpected risk_level {farm.get('risk_level')}")
            return 1

    try:
        json.dumps(payload)
    except (TypeError, ValueError) as e:
        _fail(f"payload not JSON-serializable: {e}")
        return 1

    night = predict_spread_rate_m_per_hr("shrub", 20.0, 5.0, night_multiplier=0.4)
    day = predict_spread_rate_m_per_hr("shrub", 20.0, 5.0, night_multiplier=1.0)
    if night >= day:
        _fail("night spread multiplier should reduce rate")
        return 1

    poly = spread_footprint_polygon(o_lat, o_lon, 800.0, wind_from, 2.0)
    if poly.is_empty:
        _fail("spread polygon unexpectedly empty")
        return 1

    _ok("schema, monotonic spread growth, farm risk heuristics, JSON round-trip")
    print(json.dumps({"sample_fire_id": payload["fire_id"], "farms_at_risk": len(payload["farms_at_risk"])}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

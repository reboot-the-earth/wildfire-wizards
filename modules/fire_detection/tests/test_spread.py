"""
Validation tests for Person 1's fire spread model.

Covers:
- predict_spread_rate_m_per_hr: monotonic in wind and slope, scaled by night.
- spread_footprint_polygon: elongates downwind, contains origin region.
- get_fire_data: returns the README schema, applies the FIRMS confidence
  threshold, identifies farms in the projected path (Lilac scenario), and
  excludes farms outside the danger zone.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from shapely.geometry import Point, shape

# Repo root so `from modules.fire_detection import ...` works regardless of cwd.
REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from modules.fire_detection.fire_spread import (  # noqa: E402
    downwind_bearing_deg,
    get_fire_data,
    load_config,
    predict_spread_rate_m_per_hr,
    spread_footprint_polygon,
)


# ---------------------------------------------------------------------------
# predict_spread_rate_m_per_hr
# ---------------------------------------------------------------------------


def test_spread_rate_monotonic_in_wind_and_slope():
    base = predict_spread_rate_m_per_hr("shrub", wind_speed_mph=0, slope_pct=0)
    windier = predict_spread_rate_m_per_hr("shrub", wind_speed_mph=35, slope_pct=0)
    steeper = predict_spread_rate_m_per_hr("shrub", wind_speed_mph=0, slope_pct=20)

    assert windier > base, "Higher wind must increase spread rate"
    assert steeper > base, "Steeper slope must increase spread rate"


def test_spread_rate_night_multiplier_reduces_rate():
    day = predict_spread_rate_m_per_hr("shrub", wind_speed_mph=20, slope_pct=10)
    night = predict_spread_rate_m_per_hr(
        "shrub", wind_speed_mph=20, slope_pct=10, night_multiplier=0.4
    )
    assert night == pytest.approx(day * 0.4, rel=1e-6)


def test_spread_rate_grass_burns_faster_than_timber():
    """Fuel base rates from NWCG: grass (78) > shrub (35) > timber_litter (8)."""
    grass = predict_spread_rate_m_per_hr("grass", wind_speed_mph=15, slope_pct=5)
    timber = predict_spread_rate_m_per_hr("timber_litter", wind_speed_mph=15, slope_pct=5)
    assert grass > timber


# ---------------------------------------------------------------------------
# spread_footprint_polygon
# ---------------------------------------------------------------------------


def test_downwind_bearing_is_180_from_meteorological():
    # Wind FROM the NE (45°) blows toward the SW (225°)
    assert downwind_bearing_deg(45) == 225
    # Wind FROM the south (180°) blows toward the north (0°)
    assert downwind_bearing_deg(180) == 0


def test_footprint_elongates_downwind():
    """The Santa-Ana 1-hr footprint must reach further along the wind axis
    than perpendicular to it. The model uses elongated ellipses (semi-major
    aligned with wind), so downwind extent > crosswind extent."""
    import math

    fire_lat, fire_lon = 33.24, -117.18
    wind_from_deg = 55  # from NE, blowing SW
    rate_m_per_hr = predict_spread_rate_m_per_hr("shrub", 35, 5)

    poly = spread_footprint_polygon(fire_lat, fire_lon, rate_m_per_hr, wind_from_deg, hours=1.0)

    deg_per_km_lat = 1 / 111.0
    deg_per_km_lon = 1 / (111.0 * math.cos(math.radians(fire_lat)))

    downwind = math.radians(downwind_bearing_deg(wind_from_deg))  # bearing fire moves toward
    crosswind = downwind + math.pi / 2

    def probe(distance_km, bearing_rad):
        east = distance_km * math.sin(bearing_rad) * deg_per_km_lon
        north = distance_km * math.cos(bearing_rad) * deg_per_km_lat
        return Point(fire_lon + east, fire_lat + north)

    # 2 km downwind must be inside the 1-hr footprint; 4 km perpendicular to
    # wind must NOT be (the ellipse is much narrower across wind than along).
    assert poly.contains(probe(2.0, downwind)), (
        "Downwind probe (2 km) must lie inside the 1-hr Santa Ana footprint"
    )
    assert not poly.contains(probe(4.0, crosswind)), (
        "Crosswind probe (4 km) must NOT lie inside the 1-hr footprint — "
        "ellipse should be elongated, not circular"
    )


def test_footprint_grows_with_time():
    fire_lat, fire_lon = 33.24, -117.18
    rate = predict_spread_rate_m_per_hr("shrub", 35, 5)
    one_hr = spread_footprint_polygon(fire_lat, fire_lon, rate, 55, hours=1.0)
    six_hr = spread_footprint_polygon(fire_lat, fire_lon, rate, 55, hours=6.0)
    assert six_hr.area > one_hr.area, "6-hour footprint must be larger than 1-hour footprint"


# ---------------------------------------------------------------------------
# get_fire_data — full README schema + Lilac scenario
# ---------------------------------------------------------------------------


def _lilac_inputs():
    config = load_config()
    bbox = config["bounding_box"]
    farms = [
        # Valley Center Ranch — south-southwest of Bonsall ignition; in path.
        {"farm_id": "valley_center_ranch", "lat": 33.22, "lon": -117.03},
        # Fallbrook Stables — north-northwest, also threatened by Santa Anas.
        {"farm_id": "fallbrook_stables", "lat": 33.37, "lon": -117.25},
        # Far southern San Diego — outside the 6-hour danger cone.
        {"farm_id": "south_bay_far", "lat": 32.60, "lon": -117.10},
    ]
    return config, bbox, farms


def test_get_fire_data_returns_full_schema():
    config, bbox, farms = _lilac_inputs()
    # Pin to Lilac Fire ignition time (11:15 AM PST = 19:15 UTC) so behaviour
    # is deterministic regardless of when the test runs.
    when = datetime(2017, 12, 7, 19, 15, tzinfo=timezone.utc)

    out = get_fire_data(bbox, farms, timestamp_utc=when)

    expected_keys = {
        "timestamp",
        "fire_id",
        "active_hotspots",
        "current_perimeter",
        "projected_perimeters",
        "wind",
        "weather",
        "farms_at_risk",
        "danger_zone",
    }
    assert expected_keys.issubset(out.keys()), f"Missing keys: {expected_keys - set(out.keys())}"

    # README requires perimeters at the configured time steps (1, 2, 4, 6).
    hours_present = [int(p["hours"]) for p in out["projected_perimeters"]]
    assert hours_present == config["time_steps_hours"], (
        f"Expected projections at {config['time_steps_hours']}, got {hours_present}"
    )

    # All perimeters must be valid GeoJSON polygons.
    for p in out["projected_perimeters"]:
        assert p["geometry"]["type"] == "Polygon"
        assert isinstance(p["geometry"]["coordinates"], list)

    # Danger zone schema.
    assert out["danger_zone"]["type"] == "Polygon"


def test_get_fire_data_identifies_lilac_farms_at_risk():
    _, bbox, farms = _lilac_inputs()
    when = datetime(2017, 12, 7, 19, 15, tzinfo=timezone.utc)

    out = get_fire_data(bbox, farms, timestamp_utc=when)
    at_risk_ids = {f["farm_id"] for f in out["farms_at_risk"]}

    # Valley Center Ranch sits in the Santa Ana-blown spread path.
    assert "valley_center_ranch" in at_risk_ids, (
        "Valley Center Ranch must be flagged at-risk in the Lilac scenario"
    )

    # Far-south farm should NOT appear (outside the 6-hour danger cone).
    assert "south_bay_far" not in at_risk_ids, (
        "Farms well outside the projected spread cone must be excluded"
    )

    for farm in out["farms_at_risk"]:
        assert farm["risk_level"] in {"low", "medium", "high", "critical"}
        assert farm["estimated_time_to_fire_hours"] is None or farm["estimated_time_to_fire_hours"] >= 0
        assert farm["alert_message"], "Each at-risk farm needs a human-readable alert message"


def test_get_fire_data_filters_low_confidence_hotspots():
    """The README requires filtering FIRMS hotspots by confidence > 75%."""
    _, bbox, farms = _lilac_inputs()
    when = datetime(2017, 12, 7, 19, 15, tzinfo=timezone.utc)
    out = get_fire_data(bbox, farms, timestamp_utc=when)

    config = load_config()
    threshold = int(config.get("firms_confidence_threshold", 75))
    for h in out["active_hotspots"]:
        assert int(h.get("confidence", 0)) >= threshold, (
            f"Hotspot below confidence threshold leaked through: {h}"
        )


def test_danger_zone_contains_at_risk_farm():
    """A farm flagged at-risk should geometrically intersect the danger_zone."""
    _, bbox, farms = _lilac_inputs()
    when = datetime(2017, 12, 7, 19, 15, tzinfo=timezone.utc)
    out = get_fire_data(bbox, farms, timestamp_utc=when)

    if not out["farms_at_risk"]:
        pytest.skip("No farms at risk in this run; cannot verify danger zone containment.")

    danger = shape(out["danger_zone"])
    for farm in out["farms_at_risk"]:
        pt = Point(farm["lon"], farm["lat"])
        assert danger.intersects(pt) or danger.distance(pt) < 0.05, (
            f"At-risk farm {farm['farm_id']} should fall in or near the danger zone"
        )

"""
Fire spread prediction (simplified Rothermel-style rates + elliptical footprints)
and the exported integration API: get_fire_data.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from shapely.geometry import Point, Polygon, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union

from .fuel_lookup import base_rate_chains_per_hour
from .firms_client import demo_hotspots_from_config, fetch_firms_hotspots_csv
from .weather_client import fetch_noaa_latest, weather_from_config


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_config(config_path: str | Path | None = None) -> dict[str, Any]:
    path = Path(config_path) if config_path else _repo_root() / "config.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _meters_per_degree(lat: float) -> tuple[float, float]:
    m_lat = 111_320.0
    m_lon = 111_320.0 * math.cos(math.radians(lat))
    return m_lon, m_lat


def _ellipse_polygon_local(
    semi_major_m: float,
    semi_minor_m: float,
    bearing_deg_clockwise_from_north: float,
    resolution: int = 64,
) -> Polygon:
    """Ellipse centered at origin in local east/north meters; major axis along bearing."""
    if semi_major_m <= 0 or semi_minor_m <= 0:
        return Polygon([(0.0, 0.0)])
    verts: list[tuple[float, float]] = []
    bearing = math.radians(bearing_deg_clockwise_from_north)
    cos_b, sin_b = math.cos(bearing), math.sin(bearing)
    for i in range(resolution + 1):
        t = 2 * math.pi * i / resolution
        x = semi_major_m * math.cos(t)
        y = semi_minor_m * math.sin(t)
        east = x * sin_b + y * cos_b
        north = x * cos_b - y * sin_b
        verts.append((east, north))
    return Polygon(verts)


def _local_polygon_to_wgs84(poly: BaseGeometry, ref_lat: float, ref_lon: float) -> BaseGeometry:
    m_lon, m_lat = _meters_per_degree(ref_lat)

    def transform(x: float, y: float, z: float | None = None) -> tuple[float, float]:
        lat = ref_lat + y / m_lat
        lon = ref_lon + x / m_lon
        return lon, lat

    return shp_transform(transform, poly)


def downwind_bearing_deg(meteorological_wind_from_deg: float) -> float:
    """Wind-from direction (meteorological) -> bearing fire elongates toward (clockwise from north)."""
    return (float(meteorological_wind_from_deg) + 180.0) % 360.0


def predict_spread_rate_m_per_hr(
    fuel_type: str,
    wind_speed_mph: float,
    slope_pct: float,
    *,
    night_multiplier: float = 1.0,
) -> float:
    """Chains/hr -> m/hr via NWCG conversion; wind/slope factors per module README."""
    base = base_rate_chains_per_hour(fuel_type)
    wind_factor = 1.0 + (wind_speed_mph / 15.0) ** 1.5
    slope_factor = 1.0 + (slope_pct / 40.0) ** 2
    rate_m_per_hr = base * 20.1168 * wind_factor * slope_factor * night_multiplier
    return float(rate_m_per_hr)


def spread_footprint_polygon(
    fire_lat: float,
    fire_lon: float,
    rate_m_per_hr: float,
    wind_from_deg: float,
    hours: float,
    *,
    cone_half_width_deg: float = 15.0,
    elongation: float = 1.35,
) -> Polygon:
    """
    Elliptical footprint union over wind-centered cone (default +/- 15° = 30° total).
    Major axis length ~ rate * hours * elongation; minor ~ rate * hours / elongation.
    """
    downwind = downwind_bearing_deg(wind_from_deg)
    bearings = (
        downwind - cone_half_width_deg,
        downwind,
        downwind + cone_half_width_deg,
    )
    semi_major = max(rate_m_per_hr * hours * elongation, 1.0)
    semi_minor = max(rate_m_per_hr * hours / elongation, 1.0)

    polys: list[Polygon] = []
    for b in bearings:
        b_norm = b % 360.0
        local = _ellipse_polygon_local(semi_major, semi_minor, b_norm)
        geo = _local_polygon_to_wgs84(local, fire_lat, fire_lon)
        if isinstance(geo, Polygon):
            polys.append(geo)

    merged = unary_union(polys)
    if merged.geom_type == "Polygon":
        return merged
    return merged.convex_hull


def _is_night_utc(dt_utc: datetime, night: dict[str, int]) -> bool:
    start, end = int(night["start"]), int(night["end"])
    h = dt_utc.hour
    if start <= end:
        return start <= h < end
    return h >= start or h < end


def _night_multiplier(config: dict[str, Any], dt_utc: datetime) -> float:
    night = config.get("night_hours") or {"start": 20, "end": 6}
    mult = float(config.get("night_spread_multiplier", 0.4))
    return mult if _is_night_utc(dt_utc, night) else 1.0


def _clip_to_bbox(geom: BaseGeometry, bbox: dict[str, float]) -> BaseGeometry:
    b = box(bbox["west"], bbox["south"], bbox["east"], bbox["north"])
    return geom.intersection(b)


def _polygon_geojson(poly: BaseGeometry) -> dict[str, Any]:
    if poly.is_empty:
        return {"type": "Polygon", "coordinates": []}
    if poly.geom_type != "Polygon":
        poly = poly.convex_hull
    exterior = [[float(x), float(y)] for x, y in poly.exterior.coords]
    return {"type": "Polygon", "coordinates": [exterior]}


def _horizontal_meters(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    m_lon, m_lat = _meters_per_degree(lat1)
    dx = (lon2 - lon1) * m_lon
    dy = (lat2 - lat1) * m_lat
    return float(math.hypot(dx, dy))


def _estimate_hours_to_reach(
    farm_lon: float,
    farm_lat: float,
    origin_lat: float,
    origin_lon: float,
    wind_from_deg: float,
    rate_m_per_hr: float,
    *,
    max_hours: float = 24.0,
) -> float | None:
    """First-hit hour between 0 and max_hours via binary search on footprint containment."""
    if rate_m_per_hr <= 0:
        return None

    ignition_buffer_m = 600.0

    def inside(h: float) -> bool:
        if h <= 0.0:
            return _horizontal_meters(origin_lon, origin_lat, farm_lon, farm_lat) <= ignition_buffer_m
        poly = spread_footprint_polygon(origin_lat, origin_lon, rate_m_per_hr, wind_from_deg, max(h, 1e-6))
        return poly.intersects(Point(farm_lon, farm_lat))

    if inside(0.0):
        return 0.0
    if not inside(max_hours):
        return None

    lo, hi = 0.0, max_hours
    for _ in range(28):
        mid = (lo + hi) / 2.0
        if inside(mid):
            hi = mid
        else:
            lo = mid
    return hi


def _risk_level(hours_to_fire: float | None) -> str:
    if hours_to_fire is None:
        return "none"
    if hours_to_fire <= 0.05:
        return "critical"
    if hours_to_fire < 1.0:
        return "critical"
    if hours_to_fire < 2.0:
        return "high"
    if hours_to_fire < 4.0:
        return "high"
    if hours_to_fire < 6.0:
        return "medium"
    return "low"


def _alert_message(farm_id: str, hours_to_fire: float | None, risk: str) -> str:
    if risk == "none":
        return f"{farm_id}: No intersect with modeled spread in the forecast window."
    if hours_to_fire is None:
        return f"{farm_id}: Unable to estimate arrival time."
    if hours_to_fire < 1.0:
        return f"{farm_id}: Fire may reach your area in under 1 hour. Evacuate livestock immediately."
    return (
        f"{farm_id}: Fire projected to reach your area in ~{hours_to_fire:.1f} hours. "
        "Prepare evacuation now."
    )


def get_fire_data(
    bounding_box: dict[str, float],
    farm_locations: list[dict[str, Any]],
    *,
    config_path: str | Path | None = None,
    timestamp_utc: datetime | None = None,
    fuel_type: str = "shrub",
    slope_pct: float = 5.0,
    fire_id: str | None = None,
) -> dict[str, Any]:
    """
    JSON-in/JSON-out integration surface for Person 5 and downstream modules.

    When FIRMS_API_KEY is unset or NOAA is unreachable, uses demo hotspots and
    wind/weather from shared config.json (Lilac scenario).
    """
    config = load_config(config_path)
    bbox = bounding_box or config["bounding_box"]
    dt = timestamp_utc or datetime.now(timezone.utc)
    ts_iso = dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")

    threshold = int(config.get("firms_confidence_threshold", 75))
    firms_day = config["demo_scenario"]["date_range"][0]

    hotspots = fetch_firms_hotspots_csv(bbox, firms_day)
    if not hotspots:
        hotspots = demo_hotspots_from_config(config)
    hotspots = [h for h in hotspots if int(h.get("confidence", 0)) >= threshold]

    origin = config["demo_scenario"]["fire_origin"]
    fire_lat, fire_lon = float(origin["lat"]), float(origin["lon"])
    if hotspots:
        fire_lat = float(hotspots[0]["lat"])
        fire_lon = float(hotspots[0]["lon"])

    weather_cfg = weather_from_config(config)
    noaa = fetch_noaa_latest(fire_lat, fire_lon)
    wind = {
        "speed_mph": float(noaa.get("speed_mph", weather_cfg["speed_mph"]) if noaa else weather_cfg["speed_mph"]),
        "direction_deg": float(
            noaa.get("direction_deg", weather_cfg["direction_deg"]) if noaa else weather_cfg["direction_deg"]
        ),
        "gusts_mph": float(weather_cfg["gusts_mph"]),
    }
    weather = {
        "humidity_pct": float(
            noaa.get("humidity_pct", weather_cfg["humidity_pct"]) if noaa else weather_cfg["humidity_pct"]
        ),
        "temp_f": float(noaa.get("temp_f", weather_cfg["temp_f"]) if noaa else weather_cfg["temp_f"]),
    }

    night_mult = _night_multiplier(config, dt)
    rate = predict_spread_rate_m_per_hr(fuel_type, wind["speed_mph"], slope_pct, night_multiplier=night_mult)

    steps = [int(h) for h in config.get("time_steps_hours", [1, 2, 4, 6])]
    projected: list[dict[str, Any]] = []
    union_parts: list[BaseGeometry] = []
    for h in steps:
        poly = spread_footprint_polygon(fire_lat, fire_lon, rate, wind["direction_deg"], float(h))
        poly = _clip_to_bbox(poly, bbox)
        projected.append({"hours": h, "geometry": _polygon_geojson(poly)})
        union_parts.append(poly)

    current = spread_footprint_polygon(fire_lat, fire_lon, rate, wind["direction_deg"], 0.25)
    current = _clip_to_bbox(current, bbox)

    danger = unary_union(union_parts) if union_parts else Polygon()
    danger = _clip_to_bbox(danger, bbox)

    max_step = float(max(steps) if steps else 6.0)
    farms_out: list[dict[str, Any]] = []
    for farm in farm_locations:
        farm_id = str(farm["farm_id"])
        lat, lon = float(farm["lat"]), float(farm["lon"])
        hours_to_fire = _estimate_hours_to_reach(
            lon,
            lat,
            fire_lat,
            fire_lon,
            wind["direction_deg"],
            rate,
            max_hours=max(max_step, 12.0),
        )
        risk = _risk_level(hours_to_fire)
        if risk == "none":
            continue
        farms_out.append(
            {
                "farm_id": farm_id,
                "lat": lat,
                "lon": lon,
                "estimated_time_to_fire_hours": float(hours_to_fire) if hours_to_fire is not None else None,
                "risk_level": risk,
                "alert_message": _alert_message(farm_id, hours_to_fire, risk),
            }
        )

    farms_out.sort(key=lambda r: (r["estimated_time_to_fire_hours"] is None, r["estimated_time_to_fire_hours"]))

    fid = fire_id or "lilac_demo_2017"
    return {
        "timestamp": ts_iso,
        "fire_id": fid,
        "active_hotspots": hotspots,
        "current_perimeter": _polygon_geojson(current),
        "projected_perimeters": projected,
        "wind": wind,
        "weather": weather,
        "farms_at_risk": farms_out,
        "danger_zone": _polygon_geojson(danger),
    }

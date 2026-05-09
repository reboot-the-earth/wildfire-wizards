"""NOAA Weather API helper with demo fallback from shared config."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any


def weather_from_config(config: dict[str, Any]) -> dict[str, Any]:
    demo = config["demo_scenario"]
    return {
        "speed_mph": float(demo["wind_speed_mph"]),
        "direction_deg": float(demo["wind_direction_deg"]),
        "gusts_mph": float(demo["wind_gusts_mph"]),
        "humidity_pct": float(demo["humidity_pct"]),
        "temp_f": float(demo["temp_f"]),
    }


def fetch_noaa_latest(lat: float, lon: float, timeout_sec: float = 12.0) -> dict[str, Any] | None:
    """
    Resolve grid point and read latest observation from the first listed station.
    Returns None on any failure (caller should fall back to config).
    """
    points_url = f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}"
    req = urllib.request.Request(
        points_url,
        headers={"User-Agent": "(SafeHerd wildfire-wizards, contact@example.local)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            points = json.loads(resp.read().decode())
        stations_url = points["properties"]["observationStations"]
        req2 = urllib.request.Request(
            stations_url,
            headers={"User-Agent": "(SafeHerd wildfire-wizards, contact@example.local)"},
        )
        with urllib.request.urlopen(req2, timeout=timeout_sec) as resp2:
            stations = json.loads(resp2.read().decode())
        station_urls = stations["features"]
        if not station_urls:
            return None
        latest_url = station_urls[0]["id"] + "/observations/latest"
        req3 = urllib.request.Request(
            latest_url,
            headers={"User-Agent": "(SafeHerd wildfire-wizards, contact@example.local)"},
        )
        with urllib.request.urlopen(req3, timeout=timeout_sec) as resp3:
            obs = json.loads(resp3.read().decode())
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError, json.JSONDecodeError):
        return None

    props = obs.get("properties") or {}
    wind_speed = props.get("windSpeed") or {}
    wind_dir = props.get("windDirection") or {}
    humidity = props.get("relativeHumidity") or {}
    temp = props.get("temperature") or {}

    def _qty_value(q: dict) -> float | None:
        raw = q.get("value")
        if raw is None:
            return None
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None

    speed_mps = _qty_value(wind_speed)
    direction = _qty_value(wind_dir)
    humidity_pct = _qty_value(humidity)
    temp_c = _qty_value(temp)

    out: dict[str, Any] = {}
    if speed_mps is not None:
        out["speed_mph"] = speed_mps * 2.23694
    if direction is not None:
        out["direction_deg"] = direction
    if humidity_pct is not None:
        out["humidity_pct"] = humidity_pct
    if temp_c is not None:
        out["temp_f"] = temp_c * 9.0 / 5.0 + 32.0

    return out if out else None

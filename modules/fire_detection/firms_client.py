"""NASA FIRMS CSV client with offline demo hotspots."""

from __future__ import annotations

import csv
import io
import os
import urllib.error
import urllib.request
from typing import Any


def demo_hotspots_from_config(config: dict[str, Any]) -> list[dict[str, Any]]:
    origin = config["demo_scenario"]["fire_origin"]
    threshold = int(config.get("firms_confidence_threshold", 75))
    return [
        {
            "lat": float(origin["lat"]),
            "lon": float(origin["lon"]),
            "confidence": max(threshold + 10, 95),
            "brightness": 367,
        }
    ]


def fetch_firms_hotspots_csv(
    bbox: dict[str, float],
    day: str,
    *,
    source: str = "VIIRS_SNPP_NRT",
    timeout_sec: float = 25.0,
) -> list[dict[str, Any]]:
    """
    Fetch FIRMS CSV for one day if FIRMS_API_KEY is set.
    day: YYYY-MM-DD
    """
    key = os.environ.get("FIRMS_API_KEY", "").strip()
    if not key:
        return []

    west, south, east, north = bbox["west"], bbox["south"], bbox["east"], bbox["north"]
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/"
        f"{west},{south},{east},{north}/{day}"
    )
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            text = resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return []

    if not text.strip():
        return []

    reader = csv.DictReader(io.StringIO(text))
    rows: list[dict[str, Any]] = []
    for row in reader:
        try:
            lat = float(row.get("latitude") or row.get("lat") or row["LATITUDE"])
            lon = float(row.get("longitude") or row.get("lon") or row["LONGITUDE"])
        except (KeyError, TypeError, ValueError):
            continue
        conf_raw = row.get("confidence") or row.get("CONFIDENCE") or "0"
        bright_raw = row.get("bright_ti4") or row.get("brightness") or row.get("BRIGHTNESS") or "0"
        try:
            confidence = int(float(conf_raw))
        except (TypeError, ValueError):
            confidence = 0
        try:
            brightness = int(float(bright_raw))
        except (TypeError, ValueError):
            brightness = 0
        rows.append({"lat": lat, "lon": lon, "confidence": confidence, "brightness": brightness})
    return rows

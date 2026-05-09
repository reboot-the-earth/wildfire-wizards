from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import DATA_DIR


def _normalize_projected_perimeters(perimeters: Any) -> list[dict[str, Any]]:
    if isinstance(perimeters, list):
        return sorted(perimeters, key=lambda p: p.get("hours", 99))
    if isinstance(perimeters, dict):
        out = []
        for key, geom in perimeters.items():
            try:
                hours = int(str(key).replace("hr", ""))
            except ValueError:
                continue
            out.append({"hours": hours, "geometry": geom})
        return sorted(out, key=lambda p: p["hours"])
    return []


def get_danger_zones(_bounding_box: dict[str, float]) -> dict[str, Any]:
    """Load fire data and return normalized current/projected zones."""
    fire_path = Path(DATA_DIR) / "fire_data.json"
    with fire_path.open() as f:
        fire = json.load(f)

    return {
        "fire_id": fire.get("fire_id", "unknown_fire"),
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "origin": fire.get("origin", {}),
        "wind": fire.get("wind", {}),
        "weather": fire.get("weather", {}),
        "current_perimeter": fire.get("current_perimeter"),
        "projected_perimeters": _normalize_projected_perimeters(fire.get("projected_perimeters")),
        "danger_zone_6hr": (fire.get("projected_perimeters", {}) or {}).get("6hr"),
    }

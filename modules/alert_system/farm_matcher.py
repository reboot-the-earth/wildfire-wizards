from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any

from .config import DB_PATH, DEDUPE_HOURS


def _point_in_polygon(lat: float, lon: float, polygon: dict | None) -> bool:
    if not polygon:
        return False
    try:
        geom = polygon.get("geometry", polygon)
        coords = geom["coordinates"][0]
    except Exception:
        return False

    x, y = lon, lat
    inside = False
    j = len(coords) - 1
    for i in range(len(coords)):
        xi, yi = coords[i][0], coords[i][1]
        xj, yj = coords[j][0], coords[j][1]
        intersects = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def _hours_to_fire(farm: dict[str, Any], farms_at_risk: list[dict[str, Any]]) -> float | None:
    for r in farms_at_risk:
        if r.get("farm_id") == farm["farm_id"]:
            return r.get("estimated_time_to_fire_hours") or r.get("hours_to_fire")
    return None


def load_registered_farms() -> list[dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM farms WHERE unsubscribed = 0").fetchall()
    conn.close()

    out = []
    for row in rows:
        out.append(
            {
                "farm_id": row["farm_id"],
                "name": row["name"],
                "phone": row["phone"],
                "lat": row["lat"],
                "lon": row["lon"],
                "animals": json.loads(row["animals_json"]),
                "transport": json.loads(row["transport_json"]),
                "alert_radius_hours": row["alert_radius_hours"],
                "last_alerted": row["last_alerted"],
                "last_fire_id": row["last_fire_id"],
            }
        )
    return out


def _dedupe_ok(farm: dict[str, Any], fire_id: str) -> bool:
    last_alerted = farm.get("last_alerted")
    last_fire_id = farm.get("last_fire_id")
    if not last_alerted:
        return True

    try:
        last_dt = datetime.fromisoformat(last_alerted.replace("Z", "+00:00"))
    except ValueError:
        return True

    if last_fire_id and last_fire_id != fire_id:
        return True

    return datetime.now(tz=timezone.utc) - last_dt >= timedelta(hours=DEDUPE_HOURS)


def get_at_risk_farms(danger_zones: dict[str, Any], farms: list[dict[str, Any]], farms_at_risk_hint: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    fire_id = danger_zones.get("fire_id", "unknown_fire")
    danger_zone_6hr = danger_zones.get("danger_zone_6hr")
    farms_at_risk_hint = farms_at_risk_hint or []

    at_risk = []
    for farm in farms:
        if not _point_in_polygon(farm["lat"], farm["lon"], danger_zone_6hr):
            continue
        if not _dedupe_ok(farm, fire_id):
            continue

        eta = _hours_to_fire(farm, farms_at_risk_hint)
        at_risk.append({**farm, "hours_remaining": eta if eta is not None else 6.0, "fire_id": fire_id})

    return sorted(at_risk, key=lambda f: f["hours_remaining"])


def mark_alert_sent(farm_id: str, fire_id: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE farms SET last_alerted = ?, last_fire_id = ? WHERE farm_id = ?",
        (datetime.now(tz=timezone.utc).isoformat(), fire_id, farm_id),
    )
    conn.commit()
    conn.close()


def get_farm_by_phone(phone: str) -> dict[str, Any] | None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM farms WHERE phone = ?", (phone,)).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "farm_id": row["farm_id"],
        "name": row["name"],
        "phone": row["phone"],
        "lat": row["lat"],
        "lon": row["lon"],
        "animals": json.loads(row["animals_json"]),
        "transport": json.loads(row["transport_json"]),
    }


def unsubscribe(phone: str) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE farms SET unsubscribed = 1 WHERE phone = ?", (phone,))
    conn.commit()
    conn.close()

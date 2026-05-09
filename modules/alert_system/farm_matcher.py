from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .config import (
    COMMUNITY_FARMS_PATH,
    DB_PATH,
    DEDUPE_HOURS,
    NEIGHBOR_MAX_BULLETS,
    NEIGHBOR_RADIUS_KM,
)


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


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers (WGS84 sphere approximation)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(h)))


def load_community_farms(path: Path | None = None) -> list[dict[str, Any]]:
    """Farms we can name in alerts but who are not in ``farms.db`` (no SMS)."""
    target = path or COMMUNITY_FARMS_PATH
    if not target.exists():
        return []
    try:
        data = json.loads(target.read_text())
    except (json.JSONDecodeError, OSError):
        return []
    farms = data.get("farms") if isinstance(data, dict) else None
    if not isinstance(farms, list):
        return []
    out: list[dict[str, Any]] = []
    for row in farms:
        if not isinstance(row, dict):
            continue
        fid = row.get("farm_id")
        name = row.get("name")
        lat, lon = row.get("lat"), row.get("lon")
        if not fid or not name or lat is None or lon is None:
            continue
        out.append({"farm_id": str(fid), "name": str(name), "lat": float(lat), "lon": float(lon)})
    return out


def build_neighbor_awareness_text(
    recipient: dict[str, Any],
    registered_farms: list[dict[str, Any]],
    at_risk_ids: set[str],
    community_farms: list[dict[str, Any]],
    radius_km: float | None = None,
    max_bullets: int | None = None,
) -> str:
    """Short SMS block: unregistered neighbors to warn + other farms in-zone also alerted."""
    rid = recipient.get("farm_id")
    rlat, rlon = float(recipient["lat"]), float(recipient["lon"])
    radius = NEIGHBOR_RADIUS_KM if radius_km is None else float(radius_km)
    cap = NEIGHBOR_MAX_BULLETS if max_bullets is None else max(1, int(max_bullets))

    registered_ids = {f["farm_id"] for f in registered_farms}

    candidates: list[tuple[float, str, str]] = []
    # (distance_km, display_name, category) category: community | at_risk | registered_other

    for f in registered_farms:
        if f["farm_id"] == rid:
            continue
        d = haversine_km(rlat, rlon, float(f["lat"]), float(f["lon"]))
        if d > radius:
            continue
        if f["farm_id"] in at_risk_ids:
            candidates.append((d, f["name"], "at_risk"))
        else:
            candidates.append((d, f["name"], "registered_other"))

    for c in community_farms:
        if c["farm_id"] == rid or c["farm_id"] in registered_ids:
            continue
        d = haversine_km(rlat, rlon, float(c["lat"]), float(c["lon"]))
        if d > radius:
            continue
        candidates.append((d, c["name"], "community"))

    candidates.sort(key=lambda x: x[0])

    community_rows = [(d, n) for d, n, k in candidates if k == "community"][:cap]
    at_risk_rows = [(d, n) for d, n, k in candidates if k == "at_risk"][:cap]
    other_reg = [(d, n) for d, n, k in candidates if k == "registered_other"][: max(1, cap - len(community_rows) - len(at_risk_rows))]

    lines: list[str] = []
    if community_rows:
        lines.append("NEARBY — not on our SMS list (please warn them if safe):")
        for d, n in community_rows:
            lines.append(f"• {n} (~{d:.0f} km)")
    if at_risk_rows:
        lines.append("Neighbors also getting this alert:")
        for d, n in at_risk_rows:
            lines.append(f"• {n} (~{d:.0f} km)")
    if other_reg:
        names = ", ".join(f"{n} (~{d:.0f} km)" for d, n in other_reg[:2])
        lines.append(f"Other registered nearby: {names}")

    return "\n".join(lines) if lines else ""


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

"""Bootstrap the alert system's SQLite farm registry.

Creates ``farms.db`` next to this file (path is centralized in
``alert_system.config.DB_PATH``) with a small table of demo farms taken from
the same Lilac-Fire scenario the rest of the project uses. Idempotent: running
again only inserts rows whose ``farm_id`` is not already present, and never
clobbers ``last_alerted`` / ``unsubscribed`` flags.

Usage::

    python modules/alert_system/seed_farms.py            # seed demo farms
    python modules/alert_system/seed_farms.py --reset    # drop and recreate
    python modules/alert_system/seed_farms.py --list     # show current rows
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

# Allow running this file directly OR via ``python -m`` import.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "modules"))
    from alert_system.config import DB_PATH  # type: ignore
else:
    from .config import DB_PATH


SCHEMA = """
CREATE TABLE IF NOT EXISTS farms (
    farm_id              TEXT PRIMARY KEY,
    name                 TEXT NOT NULL,
    phone                TEXT NOT NULL,
    lat                  REAL NOT NULL,
    lon                  REAL NOT NULL,
    animals_json         TEXT NOT NULL,
    transport_json       TEXT NOT NULL,
    alert_radius_hours   INTEGER NOT NULL DEFAULT 6,
    last_alerted         TEXT,
    last_fire_id         TEXT,
    unsubscribed         INTEGER NOT NULL DEFAULT 0
);
"""


# Three Lilac-Fire-adjacent demo farms, matching the rest of the codebase.
# Phone numbers are intentionally fake (555 prefix) so the demo SMS provider
# writes them to the local outbox instead of attempting real delivery.
DEMO_FARMS = [
    {
        "farm_id": "valley_center_ranch",
        "name": "Valley Center Ranch",
        "phone": "+15555550101",
        "lat": 33.22,
        "lon": -117.03,
        "animals": [
            {"species": "cattle", "count": 150, "special_needs": ["12 calves with mothers", "2 bulls separate"]},
            {"species": "horses", "count": 8, "special_needs": ["2 pregnant mares", "1 foal"]},
        ],
        "transport": {"trailers": 1, "type": "stock_trailer", "capacity": {"cattle": 20, "horses": 4}},
        "alert_radius_hours": 6,
    },
    {
        "farm_id": "fallbrook_stables",
        "name": "Fallbrook Equestrian Center",
        "phone": "+15555550102",
        "lat": 33.37,
        "lon": -117.25,
        "animals": [
            {"species": "horses", "count": 24, "special_needs": ["3 senior > 25 yrs", "2 miniatures"]},
        ],
        "transport": {"trailers": 2, "type": "horse_trailer", "capacity": {"horses": 4}},
        "alert_radius_hours": 6,
    },
    {
        "farm_id": "ramona_goat_farm",
        "name": "Ramona Heritage Goat Farm",
        "phone": "+15555550103",
        "lat": 33.05,
        "lon": -116.87,
        "animals": [
            {"species": "goats", "count": 85, "special_needs": ["15 does with kids"]},
            {"species": "poultry", "count": 200, "special_needs": ["free-range"]},
        ],
        "transport": {"trailers": 1, "type": "livestock_trailer", "capacity": {"goats": 30, "poultry": 100}},
        "alert_radius_hours": 6,
    },
]


def _connect(db_path: Path | None = None) -> sqlite3.Connection:
    target = Path(db_path) if db_path else DB_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema(db_path: Path | None = None) -> None:
    with _connect(db_path) as conn:
        conn.executescript(SCHEMA)


def seed(db_path: Path | None = None, farms: list[dict] | None = None) -> int:
    """Insert any missing demo farms. Returns the count of newly inserted rows."""
    init_schema(db_path)
    rows = farms if farms is not None else DEMO_FARMS

    inserted = 0
    with _connect(db_path) as conn:
        existing = {r["farm_id"] for r in conn.execute("SELECT farm_id FROM farms").fetchall()}
        for farm in rows:
            if farm["farm_id"] in existing:
                continue
            conn.execute(
                """
                INSERT INTO farms (
                    farm_id, name, phone, lat, lon,
                    animals_json, transport_json, alert_radius_hours
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    farm["farm_id"],
                    farm["name"],
                    farm["phone"],
                    farm["lat"],
                    farm["lon"],
                    json.dumps(farm["animals"]),
                    json.dumps(farm["transport"]),
                    int(farm.get("alert_radius_hours", 6)),
                ),
            )
            inserted += 1
        conn.commit()
    return inserted


def reset(db_path: Path | None = None) -> None:
    """Drop the farms table entirely. Wipes alert state alongside data."""
    target = Path(db_path) if db_path else DB_PATH
    if target.exists():
        target.unlink()


def list_farms(db_path: Path | None = None) -> list[dict]:
    init_schema(db_path)
    with _connect(db_path) as conn:
        rows = conn.execute(
            "SELECT farm_id, name, phone, lat, lon, alert_radius_hours, last_alerted, unsubscribed FROM farms"
        ).fetchall()
    return [dict(r) for r in rows]


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed/reset WildfireWizards alert farm registry")
    parser.add_argument("--reset", action="store_true", help="Delete farms.db before seeding")
    parser.add_argument("--list", action="store_true", help="Print existing farms and exit")
    args = parser.parse_args()

    if args.reset:
        reset()
        print(f"reset: removed {DB_PATH}")

    if args.list:
        for row in list_farms():
            print(json.dumps(row, default=str))
        return 0

    inserted = seed()
    total = len(list_farms())
    print(f"seeded {inserted} new farm(s); {total} total in {DB_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

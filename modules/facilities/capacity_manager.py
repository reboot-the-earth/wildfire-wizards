"""
Capacity Manager — reservation tracking with 2-hour TTL.

Reservations are stored in data/reservations.json as a flat list.
Every read operation first expires stale entries so available capacity
is always current.
"""

import json
import time
import os
from datetime import datetime, timezone
from typing import Optional

RESERVATION_FILE = os.path.join(os.path.dirname(__file__), "data", "reservations.json")
RESERVATION_TTL_SECONDS = 7200  # 2 hours, from config.json
CAPACITY_BUFFER = 0.80          # treat listed capacity as 80% (20% buffer)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_raw() -> list[dict]:
    if not os.path.exists(RESERVATION_FILE):
        return []
    with open(RESERVATION_FILE, "r") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []


def _save(reservations: list[dict]) -> None:
    os.makedirs(os.path.dirname(RESERVATION_FILE), exist_ok=True)
    with open(RESERVATION_FILE, "w") as f:
        json.dump(reservations, f, indent=2)


def _expire(reservations: list[dict]) -> list[dict]:
    """Return only reservations that have not yet passed TTL."""
    now = time.time()
    return [r for r in reservations if now - r["timestamp"] < RESERVATION_TTL_SECONDS]


def _load_active() -> list[dict]:
    """Load reservations, drop expired ones, and persist the cleaned list."""
    reservations = _expire(_load_raw())
    _save(reservations)
    return reservations


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_active_reservations() -> list[dict]:
    """Return all non-expired reservations."""
    return _load_active()


def get_reserved_count(facility_id: str, species: str) -> int:
    """Return total animals of *species* currently reserved at *facility_id*."""
    return sum(
        r["count"]
        for r in _load_active()
        if r["facility_id"] == facility_id and r["species"] == species
    )


def get_available_capacity(facility: dict, species: str) -> int:
    """
    Return usable available capacity for *species* at *facility*, after applying
    the 20 % safety buffer and subtracting active reservations.
    """
    raw_cap = facility["capacity"].get(species, 0)
    buffered_cap = int(raw_cap * CAPACITY_BUFFER)
    reserved = get_reserved_count(facility["id"], species)
    return max(0, buffered_cap - reserved)


def reserve_capacity(
    farm_id: str,
    facility_id: str,
    species: str,
    count: int,
    facility: Optional[dict] = None,
) -> dict:
    """
    Create a reservation. Returns the reservation record, or raises ValueError
    if there is not enough available capacity.

    Pass the *facility* dict directly to avoid loading the full DB here
    (prevents a circular import with facility_matcher).
    """
    if facility is None:
        # Lazy-load only when called standalone (e.g. from tests)
        with open(RESERVATION_FILE.replace("reservations.json", "facilities.json")) as f:
            import json as _json
            all_facilities = {fac["id"]: fac for fac in _json.load(f)}
        facility = all_facilities.get(facility_id)

    if facility is None:
        raise ValueError(f"Unknown facility: {facility_id}")

    available = get_available_capacity(facility, species)
    if count > available:
        raise ValueError(
            f"Cannot reserve {count} {species} at {facility_id}: "
            f"only {available} slots available."
        )

    reservations = _load_active()
    now = time.time()
    expires_iso = datetime.fromtimestamp(now + RESERVATION_TTL_SECONDS, tz=timezone.utc).isoformat()

    record = {
        "reservation_id": f"{farm_id}_{facility_id}_{species}_{int(now)}",
        "farm_id": farm_id,
        "facility_id": facility_id,
        "species": species,
        "count": count,
        "timestamp": now,
        "expires": expires_iso,
    }
    reservations.append(record)
    _save(reservations)
    return record


def release_reservation(reservation_id: str) -> bool:
    """Remove a specific reservation by ID. Returns True if found and removed."""
    reservations = _load_active()
    before = len(reservations)
    reservations = [r for r in reservations if r.get("reservation_id") != reservation_id]
    _save(reservations)
    return len(reservations) < before


def cancel_farm_reservations(farm_id: str) -> int:
    """Cancel all reservations for a farm. Returns number of records removed."""
    reservations = _load_active()
    before = len(reservations)
    reservations = [r for r in reservations if r["farm_id"] != farm_id]
    _save(reservations)
    return before - len(reservations)


def get_capacity_snapshot(facility: dict) -> dict:
    """
    Return a per-species capacity snapshot for a facility:
      { species: { total, buffered, reserved, available, pct_full } }
    """
    snapshot = {}
    for species, raw_cap in facility["capacity"].items():
        buffered = int(raw_cap * CAPACITY_BUFFER)
        reserved = get_reserved_count(facility["id"], species)
        available = max(0, buffered - reserved)
        pct_full = round((reserved / buffered * 100) if buffered > 0 else 100, 1)
        snapshot[species] = {
            "total_listed": raw_cap,
            "buffered_total": buffered,
            "reserved": reserved,
            "available": available,
            "pct_full": pct_full,
        }
    return snapshot

"""
Trip Calculator — builds a multi-trip evacuation schedule.

Given an animal inventory, trailer capacities, and route time,
produces an ordered list of trips with departure times and
cumulative hours. Flags whether the total evacuation time fits
within the fire arrival window.
"""

from datetime import datetime, timedelta
from typing import Optional

# Priority order: most vulnerable / hardest-to-handle first
SPECIES_PRIORITY = [
    "horses",
    "miniature_horses",
    "mules",
    "donkeys",
    "cattle_calves",
    "cattle",
    "goats",
    "sheep",
    "pigs",
    "poultry",
]

# Default trailer capacity (animals per load) if not provided by farmer
DEFAULT_TRAILER_CAPACITY: dict[str, int] = {
    "horses": 4,
    "miniature_horses": 8,
    "mules": 4,
    "donkeys": 6,
    "cattle_calves": 10,
    "cattle": 8,
    "goats": 20,
    "sheep": 20,
    "pigs": 12,
    "poultry": 40,
}

LOAD_UNLOAD_MINUTES = 30  # fixed overhead per trip


def _sort_inventory(animal_inventory: list[dict]) -> list[dict]:
    """Sort animals by evacuation priority (highest priority first)."""
    def priority_key(a: dict) -> int:
        species = a["species"]
        try:
            return SPECIES_PRIORITY.index(species)
        except ValueError:
            return 99

    return sorted(animal_inventory, key=priority_key)


def calculate_trips(
    animal_inventory: list[dict],
    trailer_capacity: dict,
    route_time_minutes: int,
    destination_name: str = "Facility",
    start_time: Optional[datetime] = None,
    requires_isolation: Optional[list[str]] = None,
) -> list[dict]:
    """
    Build a trip-by-trip evacuation schedule.

    Args:
        animal_inventory:    [{"species": "cattle", "count": 150, ...}, ...]
        trailer_capacity:    {"cattle": 20, "horses": 4}  — animals per load
        route_time_minutes:  one-way drive time from Person 2's router
        destination_name:    display name for the facility
        start_time:          when loading begins (defaults to now)
        requires_isolation:  list of species that need a dedicated trip
                             (e.g. ["bulls", "stallions"])

    Returns:
        List of trip dicts, one per trailer run.
    """
    if start_time is None:
        start_time = datetime.now()

    requires_isolation = requires_isolation or []
    sorted_animals = _sort_inventory(animal_inventory)
    round_trip_minutes = route_time_minutes * 2 + LOAD_UNLOAD_MINUTES

    trips = []
    trip_number = 1
    current_departure = start_time

    for animal_group in sorted_animals:
        species = animal_group["species"]
        count = animal_group["count"]
        cap = trailer_capacity.get(species) or DEFAULT_TRAILER_CAPACITY.get(species, 10)
        isolation = species in requires_isolation

        remaining = count
        while remaining > 0:
            load = min(remaining, cap)
            departure_str = current_departure.strftime("%H:%M")
            arrive_str = (current_departure + timedelta(minutes=route_time_minutes)).strftime("%H:%M")
            return_str = (current_departure + timedelta(minutes=round_trip_minutes)).strftime("%H:%M")

            trips.append({
                "trip": trip_number,
                "species": species,
                "count": load,
                "animals": f"{load} {species}",
                "destination": destination_name,
                "isolated": isolation,
                "one_way_min": route_time_minutes,
                "round_trip_min": round_trip_minutes,
                "depart": departure_str,
                "arrive_at_facility": arrive_str,
                "return_to_farm": return_str,
                "cumulative_hours": round(
                    (current_departure - start_time + timedelta(minutes=round_trip_minutes)).total_seconds() / 3600,
                    2,
                ),
            })

            remaining -= load
            trip_number += 1
            current_departure += timedelta(minutes=round_trip_minutes)

    return trips


def summarize_trips(
    trips: list[dict],
    fire_arrival_hours: Optional[float] = None,
) -> dict:
    """
    Aggregate stats for a trip schedule and produce warnings.

    Args:
        trips:               output of calculate_trips()
        fire_arrival_hours:  how many hours until fire reaches the farm

    Returns:
        Summary dict with totals, timeline, and any warnings.
    """
    if not trips:
        return {
            "total_trips": 0,
            "total_hours": 0,
            "all_animals_evacuated": True,
            "warnings": [],
        }

    total_hours = trips[-1]["cumulative_hours"]
    warnings = []

    if fire_arrival_hours is not None and total_hours > fire_arrival_hours:
        overage = round(total_hours - fire_arrival_hours, 1)
        warnings.append(
            f"WARNING: Total evacuation takes {total_hours:.1f} h but fire arrives in "
            f"{fire_arrival_hours:.1f} h. You are {overage} h over. "
            "Consider splitting animals across multiple facilities."
        )

    if fire_arrival_hours is not None and total_hours > fire_arrival_hours * 0.80:
        warnings.append(
            "CAUTION: Evacuation will use more than 80 % of your available time window. "
            "Begin loading immediately."
        )

    isolated_trips = [t for t in trips if t["isolated"]]
    if isolated_trips:
        species_list = list({t["species"] for t in isolated_trips})
        warnings.append(
            f"ISOLATION REQUIRED: {', '.join(species_list)} must travel in dedicated trips — "
            "do not mix with other animals."
        )

    species_counts: dict[str, int] = {}
    for t in trips:
        species_counts[t["species"]] = species_counts.get(t["species"], 0) + t["count"]

    return {
        "total_trips": len(trips),
        "total_hours": round(total_hours, 2),
        "species_evacuated": species_counts,
        "first_departure": trips[0]["depart"] if trips else None,
        "last_return": trips[-1]["return_to_farm"] if trips else None,
        "warnings": warnings,
    }

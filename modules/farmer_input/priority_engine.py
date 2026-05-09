"""Farmer input priority engine.

This module exposes one integration function, ``get_evacuation_plan``. It does
not import sibling modules, keeping the JSON-in/JSON-out contract from the
project README.
"""

from __future__ import annotations

from math import ceil
from typing import Any

from checklist_generator import generate_checklist


PRIORITY_RULES = {
    "horses": {
        "rank": 1,
        "label": "horses",
        "load_time_min": 15,
        "default_capacity": 4,
        "sedation_needed": True,
        "reason": "Highest evacuation priority: high stress risk and slow loading.",
        "handling": "Load individually or in pairs. Keep calm loaders visible to nervous horses.",
    },
    "cattle_calves": {
        "rank": 2,
        "label": "cow-calf pairs",
        "load_time_min": 5,
        "default_capacity": 10,
        "sedation_needed": False,
        "reason": "Young animals are vulnerable. Keep calves with mothers.",
        "handling": "Load cow-calf pairs together. Do not separate calves from mothers.",
    },
    "cattle": {
        "rank": 3,
        "label": "cattle",
        "load_time_min": 3,
        "default_capacity": 20,
        "sedation_needed": False,
        "reason": "Bulk livestock evacuation after vulnerable animals are loaded.",
        "handling": "Load in groups using a chute. Move bulls separately if possible.",
    },
    "goats": {
        "rank": 4,
        "label": "goats",
        "load_time_min": 2,
        "default_capacity": 40,
        "sedation_needed": False,
        "reason": "Small ruminants load quickly once contained.",
        "handling": "Use a lead animal. Secure all trailer gaps before moving the herd.",
    },
    "sheep": {
        "rank": 4,
        "label": "sheep",
        "load_time_min": 2,
        "default_capacity": 40,
        "sedation_needed": False,
        "reason": "Small ruminants load quickly once contained.",
        "handling": "Use a lead animal. Keep flock together and count at unloading.",
    },
    "poultry": {
        "rank": 5,
        "label": "poultry",
        "load_time_min": 0.5,
        "default_capacity": 200,
        "sedation_needed": False,
        "reason": "Lowest transport priority unless breeding stock is at risk.",
        "handling": "Use ventilated crates. Prioritize breeding stock if time is short.",
    },
}

TRAILER_DEFAULTS = {
    "stock_trailer": {"horses": 4, "cattle_calves": 10, "cattle": 20, "goats": 30, "sheep": 30, "poultry": 100},
    "horse_trailer": {"horses": 4, "cattle_calves": 0, "cattle": 0, "goats": 12, "sheep": 12, "poultry": 60},
    "livestock_trailer": {"horses": 4, "cattle_calves": 10, "cattle": 20, "goats": 40, "sheep": 40, "poultry": 120},
    "flatbed": {"horses": 0, "cattle_calves": 0, "cattle": 0, "goats": 12, "sheep": 12, "poultry": 80},
}


def _rule_for(species: str) -> dict[str, Any]:
    return PRIORITY_RULES.get(species, PRIORITY_RULES["cattle"])


def _species_capacity(species: str, trailer_capacity: dict[str, Any] | None, trailer_count: int = 1) -> int:
    rule = _rule_for(species)
    capacity = None
    if trailer_capacity:
        capacity = trailer_capacity.get(species)
        if capacity is None and species == "cattle_calves":
            capacity = trailer_capacity.get("cattle")
    if capacity is None:
        capacity = rule["default_capacity"]
    return max(int(capacity or 0) * max(trailer_count, 1), 0)


def _expand_special_groups(animal_inventory: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Pull calves out as their own priority group when the inventory names them."""
    expanded = []
    for group in animal_inventory:
        species = group["species"]
        count = int(group.get("count", 0))
        special_needs = group.get("special_needs", [])

        calf_count = int(group.get("calves", 0) or 0)
        if species == "cattle" and calf_count == 0:
            for item in special_needs:
                text = str(item).lower()
                if "calf" in text or "calves" in text:
                    digits = "".join(char if char.isdigit() else " " for char in text).split()
                    calf_count = int(digits[0]) if digits else 0
                    break

        if species == "cattle" and calf_count > 0:
            expanded.append(
                {
                    "species": "cattle_calves",
                    "count": min(calf_count, count),
                    "special_needs": ["keep with mothers"],
                }
            )
            count = max(count - calf_count, 0)
            special_needs = [
                need for need in special_needs if "calf" not in str(need).lower() and "calves" not in str(need).lower()
            ]

        if count > 0:
            expanded.append({**group, "count": count, "special_needs": special_needs})

    return expanded


def _animals_label(species: str, count: int, special_needs: list[str]) -> str:
    rule = _rule_for(species)
    if special_needs:
        return f"{count} {rule['label']} ({'; '.join(special_needs)})"
    return f"{count} {rule['label']}"


def prioritize_evacuation(
    animals: list[dict[str, Any]],
    time_available_hours: float,
    trailer_capacity: dict[str, Any] | None,
    trailer_count: int = 1,
    smoke_within_5_miles: bool = False,
) -> list[dict[str, Any]]:
    """Return a trip-by-trip loading plan ordered by evacuation priority."""
    sorted_animals = sorted(_expand_special_groups(animals), key=lambda group: _rule_for(group["species"])["rank"])
    multiplier = 2 if smoke_within_5_miles else 1

    plan = []
    trip_num = 1
    for animal_group in sorted_animals:
        species = animal_group["species"]
        count = int(animal_group.get("count", 0))
        special_needs = animal_group.get("special_needs", [])
        rule = _rule_for(species)
        capacity = _species_capacity(species, trailer_capacity, trailer_count)

        if capacity <= 0:
            plan.append(
                {
                    "order": len(plan) + 1,
                    "trip": None,
                    "species": species,
                    "animals": _animals_label(species, count, special_needs),
                    "count": count,
                    "load_time_est_min": 0,
                    "reason": "No compatible trailer capacity. Use shelter-in-place unless outside help arrives.",
                    "handling": rule["handling"],
                    "sedation_needed": rule["sedation_needed"],
                    "can_transport": False,
                }
            )
            continue

        remaining = count
        while remaining > 0:
            load = min(remaining, capacity)
            load_time = ceil(load * rule["load_time_min"] * multiplier)
            plan.append(
                {
                    "order": len(plan) + 1,
                    "trip": trip_num,
                    "species": species,
                    "animals": _animals_label(species, load, special_needs if remaining == count else []),
                    "count": load,
                    "load_time_est_min": load_time,
                    "reason": rule["reason"],
                    "handling": rule["handling"],
                    "sedation_needed": rule["sedation_needed"],
                    "can_transport": True,
                }
            )
            remaining -= load
            trip_num += 1

    return plan


def _capacity_from_transport(transport: dict[str, Any]) -> dict[str, Any]:
    trailer_type = transport.get("type", "stock_trailer")
    defaults = TRAILER_DEFAULTS.get(trailer_type, TRAILER_DEFAULTS["stock_trailer"])
    return {**defaults, **transport.get("capacity", {})}


def _build_triage_warning(
    plan: list[dict[str, Any]],
    time_available_hours: float,
    loading_time_total_min: int,
) -> str | None:
    minutes_available = int(time_available_hours * 60)
    if loading_time_total_min <= minutes_available:
        return None

    saved = []
    left = []
    elapsed = 0
    for item in plan:
        load_time = item["load_time_est_min"]
        if item.get("can_transport") and elapsed + load_time <= minutes_available:
            saved.append(f"{item['count']} {item['species'].replace('_', ' ')}")
            elapsed += load_time
        else:
            left.append(f"{item['count']} {item['species'].replace('_', ' ')}")

    saved_text = ", ".join(saved) if saved else "the highest-priority animals already loaded"
    left_text = ", ".join(left) if left else "any animals not yet loaded"
    return (
        f"CRITICAL: You have {time_available_hours:g} hours. Loading alone takes "
        f"{round(loading_time_total_min / 60, 1)} hours. Save {saved_text}. "
        f"Remaining animals: {left_text}. Open gates, remove interior fences, fill water, "
        f"and move them toward the largest open pasture away from structures."
    )


def get_evacuation_plan(
    farm: dict[str, Any],
    animal_inventory: list[dict[str, Any]],
    transport: dict[str, Any],
    time_available_hours: float,
) -> dict[str, Any]:
    """Return a priority evacuation plan and species-specific checklist as JSON."""
    trailer_count = int(transport.get("trailers", 1) or 1)
    trailer_capacity = _capacity_from_transport(transport)
    smoke_within_5_miles = bool(farm.get("smoke_within_5_miles") or transport.get("smoke_within_5_miles"))

    priority_plan = prioritize_evacuation(
        animal_inventory,
        time_available_hours,
        trailer_capacity,
        trailer_count=trailer_count,
        smoke_within_5_miles=smoke_within_5_miles,
    )
    loading_time_total_min = sum(item["load_time_est_min"] for item in priority_plan if item.get("can_transport"))
    animal_types_present = {item["species"] for item in animal_inventory}

    warnings = []
    if smoke_within_5_miles:
        warnings.append("Smoke is within 5 miles: loading estimates doubled because animals may resist loading.")
    for item in animal_inventory:
        special = " ".join(str(value).lower() for value in item.get("special_needs", []))
        if "pregnant" in special:
            warnings.append("Pregnant animals: transport stress risk. Use the shortest safe route available.")
        if item.get("species") == "cattle":
            warnings.append("Cattle transport: carry California brand inspection documents if crossing county lines.")
            break

    return {
        "farm": {
            "id": farm.get("id"),
            "name": farm.get("name"),
            "location": {"lat": farm.get("lat"), "lon": farm.get("lon")},
        },
        "animals": animal_inventory,
        "transport": {**transport, "capacity": trailer_capacity},
        "priority_plan": priority_plan,
        "time_estimate": {
            "loading_time_total_min": loading_time_total_min,
            "loading_time_total_hours": round(loading_time_total_min / 60, 1),
            "time_available_min": int(time_available_hours * 60),
            "note": "Route time from the routing module adds to this loading estimate.",
        },
        "checklist": generate_checklist(animal_types_present),
        "triage_warning": _build_triage_warning(priority_plan, time_available_hours, loading_time_total_min),
        "warnings": warnings,
    }

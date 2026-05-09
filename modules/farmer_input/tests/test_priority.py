import sys
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_DIR))

from priority_engine import get_evacuation_plan, prioritize_evacuation


def test_priority_order_horses_calves_cattle_goats_poultry():
    animals = [
        {"species": "poultry", "count": 10},
        {"species": "goats", "count": 10},
        {"species": "cattle", "count": 20, "special_needs": ["4 calves with mothers"]},
        {"species": "horses", "count": 2},
    ]

    plan = prioritize_evacuation(
        animals,
        time_available_hours=10,
        trailer_capacity={"horses": 4, "cattle_calves": 10, "cattle": 20, "goats": 40, "poultry": 100},
    )

    assert [item["species"] for item in plan[:5]] == [
        "horses",
        "cattle_calves",
        "cattle",
        "goats",
        "poultry",
    ]


def test_triage_warning_when_time_is_short():
    result = get_evacuation_plan(
        farm={"id": "demo", "name": "Demo Farm", "lat": 33.2, "lon": -117.0},
        animal_inventory=[
            {"species": "horses", "count": 8},
            {"species": "cattle", "count": 150, "special_needs": ["12 calves with mothers"]},
        ],
        transport={"trailers": 1, "type": "stock_trailer"},
        time_available_hours=1,
    )

    assert result["triage_warning"].startswith("CRITICAL")
    assert result["priority_plan"][0]["species"] == "horses"
    assert result["time_estimate"]["loading_time_total_min"] > 60


def test_smoke_doubles_loading_time():
    normal = prioritize_evacuation(
        [{"species": "horses", "count": 2}],
        time_available_hours=2,
        trailer_capacity={"horses": 4},
    )
    smoky = prioritize_evacuation(
        [{"species": "horses", "count": 2}],
        time_available_hours=2,
        trailer_capacity={"horses": 4},
        smoke_within_5_miles=True,
    )

    assert smoky[0]["load_time_est_min"] == normal[0]["load_time_est_min"] * 2

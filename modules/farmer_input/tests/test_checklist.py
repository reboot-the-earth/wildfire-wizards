import sys
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_DIR))

from checklist_generator import generate_checklist


def test_generates_species_specific_sections():
    checklist = generate_checklist(["horses", "cattle", "goats", "poultry"])

    assert "horse_specific" in checklist
    assert "cattle_specific" in checklist
    assert "small_ruminant_specific" in checklist
    assert "poultry_specific" in checklist


def test_cattle_calves_include_cattle_checklist():
    checklist = generate_checklist(["cattle_calves"])

    assert "cattle_specific" in checklist
    assert any("calves" in item.lower() for item in checklist["cattle_specific"])

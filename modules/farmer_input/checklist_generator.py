"""Species-specific evacuation checklist generator."""

from __future__ import annotations


def generate_checklist(animal_types_present: set[str] | list[str]) -> dict[str, list[str]]:
    animal_types = set(animal_types_present)
    if "cattle_calves" in animal_types:
        animal_types.add("cattle")

    checklist = {
        "immediate": [
            "Grab brand inspection certificates and ownership papers.",
            "Grab animal health certificates if available.",
            "Charge phone and battery pack for navigation and contact.",
            "Fill water containers, minimum 5 gallons per large animal.",
            "Photograph every animal before loading for insurance documentation.",
            "Text your evacuation plan to a family member or neighbor.",
        ],
        "vehicle_prep": [
            "Inspect trailer hitch and safety chains.",
            "Check trailer tire pressure.",
            "Ensure trailer floor is dry and bedded.",
            "Test brake lights and turn signals.",
            "Fill truck gas tank completely.",
        ],
        "last_resort": [
            "If you cannot return, open all gates and interior fences.",
            "Remove halters and attached leads to prevent entanglement.",
            "Turn off all electric fences.",
            "Move animals to the largest open pasture away from structures.",
            "Spray-paint your phone number on large animals.",
            "Leave water troughs full and running.",
        ],
    }

    if "horses" in animal_types:
        checklist["horse_specific"] = [
            "Attach leather halter with ID tag, not nylon.",
            "Load horses that trailer well first to calm others.",
            "Have veterinarian-approved sedation ready for resistant loaders.",
            "Wrap legs if time permits.",
            "Bring 48 hours of each horse's regular feed to reduce colic risk.",
        ]

    if "cattle" in animal_types:
        checklist["cattle_specific"] = [
            "Set up loading chute before bringing cattle in.",
            "Sort calves with mothers and do not separate pairs.",
            "Move bulls separately if possible.",
            "Use electric prod only as a last resort.",
            "Carry brand inspection documents if crossing county lines.",
        ]

    if "goats" in animal_types or "sheep" in animal_types:
        checklist["small_ruminant_specific"] = [
            "Use a lead animal so the rest follow.",
            "Secure all trailer gaps before loading.",
            "Provide hay in trailer to keep animals calm.",
            "Count on loading and count again on unloading.",
        ]

    if "poultry" in animal_types:
        checklist["poultry_specific"] = [
            "Catch birds at night if possible.",
            "Use ventilated transport crates, not cardboard boxes.",
            "Do not stack crates more than 3 high.",
            "If flock is too large to catch, open the coop and leave feed and water.",
            "Prioritize breeding stock and roosters first.",
        ]

    return checklist

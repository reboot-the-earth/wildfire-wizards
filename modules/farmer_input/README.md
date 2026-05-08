# Person 4: Farmer Input, Priority Engine & Evacuation Checklist

**Role:** The user's voice. This module captures what the farmer has, what they need, and generates the prioritized loading plan and prep checklist. Everything else is data - this is the interface between data and a stressed person.

## Your Deliverable

A working input form that produces a priority-ordered evacuation plan + species-specific checklists. Three demo farm profiles load with one click. Priority engine correctly orders horses > calves > cattle > goats > poultry.

## Data Sources

| Data Point | Source | Notes |
|-----------|--------|-------|
| Farm location | User input (address or map pin) | Geocode with Nominatim (free, OSM-based) |
| Animal inventory | User input (species, count, special needs) | Structured form with dropdowns |
| Transport available | User input (trailer type, count, capacity) | Structured form |
| Evacuation priority rules | Pre-built knowledge base | From USDA APHIS, UC Davis Vet Emergency, CA CARES |
| Prep checklists | Pre-built templates | From AVMA disaster prep, SD Humane Society guides |
| Realistic farm profiles | USDA Census of Agriculture 2022 | `https://www.nass.usda.gov/Publications/AgCensus/2022/` - SD County livestock counts |

## Hour-by-Hour Plan

| Hour | Task |
|------|------|
| 0-2 | Build the input form. Farm location (address with Nominatim geocoding or map click). Animal inventory: species dropdown + count + special needs checkboxes. Transport: trailer count, type, capacity. Max 3 screens. |
| 2-4 | Build the priority engine. Given animal inventory + time window (from Person 1) + trailer capacity, determine optimal loading order. Factors: vulnerability, transport difficulty, value, time criticality. |
| 4-6 | Build the checklist generator. Auto-generate species-specific prep checklists based on animals present. |
| 6-8 | Build 3 pre-loaded demo farm profiles. Test full flow end to end. Polish mobile-friendly form. |

## The Priority Engine

```python
def prioritize_evacuation(animals, time_available_hours, trailer_capacity):
    priority_weights = {
        "horses": {
            "base_priority": 1,
            "load_time_min": 15,       # per animal - horses resist loading
            "sedation_needed": True,
            "special_handling": "Load individually or in pairs. Never rush.",
            "capacity_per_trailer": 4
        },
        "cattle_calves": {
            "base_priority": 2,
            "load_time_min": 5,
            "sedation_needed": False,
            "special_handling": "Keep calves with mothers. Load as pairs.",
            "capacity_per_trailer": 10
        },
        "cattle": {
            "base_priority": 3,
            "load_time_min": 3,
            "sedation_needed": False,
            "special_handling": "Load in groups. Use chute if available.",
            "capacity_per_trailer": 20
        },
        "goats": {
            "base_priority": 4,
            "load_time_min": 2,
            "sedation_needed": False,
            "special_handling": "Can load in large groups. Secure gates.",
            "capacity_per_trailer": 40
        },
        "sheep": {
            "base_priority": 4,
            "load_time_min": 2,
            "sedation_needed": False,
            "special_handling": "Follow leader. Load in groups.",
            "capacity_per_trailer": 40
        },
        "poultry": {
            "base_priority": 5,
            "load_time_min": 0.5,
            "sedation_needed": False,
            "special_handling": "Use crates. Very difficult to catch free-range.",
            "capacity_per_trailer": 200
        }
    }

    plan = []
    remaining_time = time_available_hours * 60
    sorted_animals = sorted(
        animals,
        key=lambda a: priority_weights.get(a['species'], {}).get('base_priority', 99)
    )

    trip_num = 1
    for animal_group in sorted_animals:
        species = animal_group['species']
        count = animal_group['count']
        info = priority_weights.get(species, priority_weights['cattle'])

        remaining = count
        while remaining > 0:
            load = min(remaining, info['capacity_per_trailer'])
            load_time = load * info['load_time_min']

            plan.append({
                "trip": trip_num,
                "species": species,
                "count": load,
                "load_time_min": load_time,
                "special_handling": info['special_handling'],
                "sedation_needed": info['sedation_needed']
            })
            remaining -= load
            trip_num += 1

    total_load_time = sum(p['load_time_min'] for p in plan)
    if total_load_time > remaining_time:
        plan.append({
            "WARNING": f"Loading alone takes {total_load_time} min. You have {remaining_time} min. "
                       f"Request additional trailers or leave low-priority animals with shelter-in-place plan."
        })

    return plan
```

## The Checklist Generator

```python
def generate_checklist(animal_types_present):
    checklist = {
        "immediate": [
            "Grab brand inspection certificates / ownership papers",
            "Grab animal health certificates if available",
            "Charge phone - you need it for navigation and contact",
            "Fill water containers (minimum 5 gallons per large animal)",
            "Photograph all animals before loading (insurance documentation)",
            "Text your evacuation plan to a family member or neighbor"
        ],
        "vehicle_prep": [
            "Inspect trailer hitch and safety chains",
            "Check trailer tire pressure",
            "Ensure trailer floor is dry and bedded",
            "Test brake lights and turn signals",
            "Fill truck gas tank completely"
        ],
        "last_resort": [
            "If you CANNOT return: open all gates and interior fences",
            "Remove halters and attached leads (entanglement risk)",
            "Turn off all electric fences",
            "Move animals to largest open pasture away from structures",
            "Spray-paint your phone number on large animals",
            "Leave water troughs full and running"
        ]
    }

    if "horses" in animal_types_present:
        checklist["horse_specific"] = [
            "Attach leather halter with ID tag (not nylon - melts)",
            "Load horses that trailer well first to calm others",
            "Have sedation on hand for resistant loaders",
            "Wrap legs if time permits",
            "Bring 48hr supply of each horse's regular feed (prevent colic)"
        ]

    if "cattle" in animal_types_present:
        checklist["cattle_specific"] = [
            "Set up loading chute before bringing cattle in",
            "Sort calves with mothers - do NOT separate",
            "Move bulls separately if possible",
            "Bring electric prod only as last resort",
            "Contact brand inspector if moving across county lines"
        ]

    if "goats" in animal_types_present or "sheep" in animal_types_present:
        checklist["small_ruminant_specific"] = [
            "Use a lead animal - the rest will follow",
            "Secure all trailer gaps (goats escape through small openings)",
            "Provide hay in trailer to keep them calm",
            "Count on loading, count on unloading"
        ]

    if "poultry" in animal_types_present:
        checklist["poultry_specific"] = [
            "Catch birds at night if possible (calmer in dark)",
            "Use transport crates - not cardboard boxes (ventilation)",
            "Do NOT stack crates more than 3 high",
            "If flock too large to catch: open coop, leave feed/water, accept losses",
            "Priority: breeding stock and roosters first (hardest to replace)"
        ]

    return checklist
```

## Pre-Loaded Demo Farm Profiles

Build these three profiles in `demo/farm_profiles.json`:

### Farm 1: Valley Center Ranch
- **Location:** 33.22, -117.03 (28500 Valley Center Rd)
- **Animals:** 150 cattle (12 calves under 3 months, 2 bulls), 8 horses (2 pregnant mares, 1 foal)
- **Transport:** 1 stock trailer (20 cattle or 4 horses)
- **Scenario:** Large mixed operation, limited transport. Must prioritize. ~15.9 hours total evacuation.

### Farm 2: Fallbrook Equestrian Center
- **Location:** 33.37, -117.25 (1200 S Mission Rd, Fallbrook)
- **Animals:** 24 horses (3 senior >25 yrs, 2 miniatures)
- **Transport:** 2 horse trailers (4 horses each)
- **Scenario:** Horse-only. Multiple trailers but many animals. Some need special handling.

### Farm 3: Ramona Heritage Goat Farm
- **Location:** 33.05, -116.87 (16800 Mussey Grade Rd, Ramona)
- **Animals:** 85 goats (15 does with kids), 200 free-range poultry
- **Transport:** 1 livestock trailer (30 goats or 100 poultry)
- **Scenario:** Small diversified farm. Goats manageable, poultry may require shelter-in-place.

## Edge Cases You Must Handle

| Condition | How to Handle |
|-----------|---------------|
| Farmer under extreme stress | Tell them what to do, don't give options to agonize over |
| Not enough time for all animals | Be honest: "You can save X. The rest need shelter-in-place: open gates, remove fences." |
| Pregnant animals in late term | Flag transport stress risk. Suggest shortest possible route. |
| Smoke within 5 miles | Apply 2x loading time multiplier (animals panic, resist loading) |
| Cross-county transport (cattle) | Warn about California brand inspection certificate requirement |

## UI Flow (4 Screens)

```
Screen 1: MAP
  Big map, tap to drop farm pin OR type address
  [Nominatim geocoding for address -> lat/lon]

Screen 2: ANIMALS
  Big icons for each species, tap to add
  +/- buttons for count
  Checkboxes: pregnant, young, senior, aggressive

Screen 3: TRANSPORT
  How many trailers? [1] [2] [3+]
  Type: [Stock] [Horse] [Livestock] [Flatbed]
  Capacity auto-fills based on type

Screen 4: THE PLAN
  Priority-ordered trip list
  Countdown timer
  Checklist (expandable sections by category)
  CRITICAL banner if time < total evacuation time
```

## File Structure

```
modules/farmer_input/
  README.md                  <- you are here
  priority_engine.py         <- prioritize_evacuation() function
  checklist_generator.py     <- generate_checklist() function
  input_form.html            <- the 4-screen mobile-friendly form
  input_form.js              <- form logic and geocoding
  input_form.css             <- styling (big buttons, high contrast)
  demo_profiles.json         <- 3 pre-loaded farm scenarios
  tests/
    test_priority.py         <- verify ordering: horses > calves > cattle > goats > poultry
    test_checklist.py        <- verify species-specific sections generate correctly
  requirements.txt
```

## Your Export Function

```python
def get_evacuation_plan(
    farm: dict,                      # {"id": ..., "lat": ..., "lon": ..., "name": ...}
    animal_inventory: list[dict],    # [{"species": "cattle", "count": 150, "special_needs": [...]}, ...]
    transport: dict,                 # {"trailers": 1, "type": "stock_trailer", "capacity": {"cattle": 20}}
    time_available_hours: float      # from Person 1's estimated_time_to_fire_hours
) -> dict:
    """Returns priority plan + checklist as JSON"""
```

## Output JSON Schema

```json
{
  "farm": {
    "id": "valley_center_ranch",
    "name": "Valley Center Ranch",
    "location": {"lat": 33.22, "lon": -117.03}
  },
  "animals": [
    {"species": "cattle", "count": 150, "special_needs": ["12 calves with mothers", "2 bulls separate"]},
    {"species": "horses", "count": 8, "special_needs": ["2 pregnant mares", "1 foal"]}
  ],
  "transport": {
    "trailers": 1,
    "type": "stock_trailer",
    "capacity": {"cattle": 20, "horses": 4}
  },
  "priority_plan": [
    {
      "order": 1,
      "trip": 1,
      "animals": "2 pregnant mares + foal + 1 horse",
      "count": 4,
      "reason": "Highest value, most vulnerable, need calm loading",
      "load_time_est_min": 45,
      "handling": "Load individually. Pregnant mares first. Foal will follow mother."
    },
    {
      "order": 2,
      "trip": 2,
      "animals": "4 remaining horses",
      "count": 4,
      "reason": "Complete horse evacuation",
      "load_time_est_min": 30,
      "handling": "Load in pairs."
    },
    {
      "order": 3,
      "trips": "3-9",
      "animals": "12 cow-calf pairs first, then remaining cattle",
      "count": 150,
      "reason": "Bulk evacuation - 7 trips at 20 head",
      "load_time_est_min": 15,
      "handling": "Use chute. Cow-calf pairs together. Bulls load last, separately."
    }
  ],
  "time_estimate": {
    "loading_time_total_min": 200,
    "note": "Route time from Person 2 adds to this"
  },
  "checklist": {
    "immediate": ["..."],
    "vehicle_prep": ["..."],
    "horse_specific": ["..."],
    "cattle_specific": ["..."],
    "last_resort": ["..."]
  },
  "triage_warning": null
}
```

When `time_available < total_evacuation_time`, set `triage_warning`:
```json
{
  "triage_warning": "CRITICAL: You have 3.7 hours. Full evacuation takes 15.9 hours. Save horses and 60 cattle. Remaining 90 cattle: open gates, remove fences, point toward river."
}
```

## How Your Output Is Used

- **Person 5 (Frontend)** renders the priority plan in the right sidebar with trip-by-trip cards, the checklist as expandable sections, and the triage warning as a red banner
- **Person 3 (Facilities)** receives your animal inventory to match against facility capacity

## What You Read from Other Modules

- **Person 1's output**: `farms_at_risk.estimated_time_to_fire_hours` for the available evacuation window
- **Person 2's output**: `total_time_min` for route duration per trip
- **Person 3's output**: matched facility name/location for trip destination labels

## Tech Stack

- **HTML/CSS/JS** for the input form (no framework needed)
- **Python** for the priority engine and checklist generator
- **Nominatim** for geocoding (free, no API key): `https://nominatim.openstreetmap.org/search?q=ADDRESS&format=json`

## Demo Assignment

**Judge question you own:** "What about areas without cell service?"

**Your answer:** "The evacuation plan can be generated and downloaded as an offline PDF or SMS before entering dead zones. The checklist is designed to work on paper. Future version: integrate with satellite messaging like Garmin inReach for two-way updates."

# Person 3: Facility Database, Capacity Manager & Destination Matcher

**Role:** The matchmaker. This module knows every place animals can go, tracks how full each one is, and matches farmers to the best available facility based on their specific animals.

## Your Deliverable

A function that takes an animal inventory + fire danger zone and returns matched facilities with live capacity tracking. Tested with 3 demo farms making sequential reservations and seeing capacity decrease.

## Data Sources

| Dataset | What It Gives You | Where to Get It |
|---------|-------------------|-----------------|
| SD County Animal Services | Official designated large animal evacuation locations | `https://www.sddac.com/content/sdc/das/` |
| SD Humane Society | Large animal disaster response coordination | `https://www.sdhumane.org/services/animal-rescue/large-animal-rescue.html` |
| CDFA licensed facilities | Feed lots, dairies, livestock dealers, auction yards | `https://www.cdfa.ca.gov/AHFSS/Animal_Health/` - searchable by county |
| Del Mar Fairgrounds | Major horse/livestock holding capacity | Public event hosting pages |
| Google Maps research | Equestrian centers, boarding stables, cattle ranches | Search: "equestrian center San Diego County", "boarding stable Fallbrook", "cattle ranch Ramona" |
| Neighboring county overflow | Riverside County Fairgrounds (Indio), Orange County Fairgrounds (Costa Mesa) | Public records |

## Hour-by-Hour Plan

| Hour | Task |
|------|------|
| 0-2 | **Research phase.** Build the facility database. Google Maps, county websites, CDFA. Aim for 15-20 entries with real coordinates, real capacity estimates, real contact info. This is grunt work but it's the foundation. |
| 2-4 | Build the matching algorithm. Filter by: accepts species, has capacity, not in fire zone. Score and rank. |
| 4-6 | Build the capacity reservation system. Track reservations in JSON/SQLite. 2-hour expiry. |
| 6-8 | Build multi-trip logic. Calculate trips needed based on trailer capacity + route time. |

## The Facility Database (Minimum 15 Entries)

Build a JSON file at `data/facilities.json`. Each entry must have:

```json
{
  "id": "del_mar_fairgrounds",
  "name": "Del Mar Fairgrounds",
  "lat": 32.974,
  "lon": -117.268,
  "accepts": ["horses", "miniature_horses", "mules"],
  "capacity": {"horses": 1500},
  "infrastructure": ["stalls", "pens", "water", "feed_available", "vet_on_call"],
  "access_road": "Via de la Valle / Jimmy Durante Blvd",
  "trailer_access": true,
  "hours": "24hr during emergencies",
  "contact": "858-755-1161",
  "notes": "Primary horse evacuation site for SD County. Hosted 1000+ horses during past fires.",
  "source": "SD County Emergency Animal Plan"
}
```

### Starter Entries (Build at least 12 more)

| Facility | Accepts | Capacity | Location |
|----------|---------|----------|----------|
| Del Mar Fairgrounds | horses, mules | 1500 horses | 32.974, -117.268 |
| Bonsall Community Grounds | cattle, goats, sheep, horses | 200 cattle, 50 horses, 100 goats | 33.289, -117.225 |
| Ramona Rodeo Grounds | cattle, horses, goats, sheep | 300 cattle, 100 horses, 150 goats | 33.042, -116.868 |

Include a mix of: horse-only facilities, cattle-specific yards, mixed-use grounds, and 2-3 neighboring county overflow sites.

## The Matching Algorithm

```python
def match_facilities(animal_inventory, facilities, fire_danger_zone, existing_reservations):
    matches = []

    for facility in facilities:
        # Skip if facility is in fire danger zone
        if point_in_polygon(facility['lat'], facility['lon'], fire_danger_zone):
            continue

        facility_score = {
            "facility": facility,
            "can_accept": [],
            "cannot_accept": [],
            "capacity_status": {}
        }

        for animal in animal_inventory:
            species = animal['species']
            count = animal['count']

            if species not in facility['accepts']:
                facility_score['cannot_accept'].append(species)
                continue

            # Available = total - active reservations
            total_cap = facility['capacity'].get(species, 0)
            reserved = sum(
                r['count'] for r in existing_reservations
                if r['facility_id'] == facility['id']
                and r['species'] == species
                and not r['expired']
            )
            available = total_cap - reserved

            facility_score['capacity_status'][species] = {
                "total": total_cap,
                "reserved": reserved,
                "available": available,
                "you_need": count,
                "fits": available >= count
            }

            if available >= count:
                facility_score['can_accept'].append(species)
            else:
                facility_score['cannot_accept'].append(
                    f"{species} (need {count}, only {available} available)"
                )

        # Score: full match > partial match > skip
        if len(facility_score['cannot_accept']) == 0:
            facility_score['match_type'] = "full_match"
            facility_score['priority'] = 1
        elif len(facility_score['can_accept']) > 0:
            facility_score['match_type'] = "partial_match"
            facility_score['priority'] = 2
        else:
            continue

        matches.append(facility_score)

    return sorted(matches, key=lambda m: m['priority'])
```

## Capacity Reservation System

Simple file-based reservation tracking with 2-hour TTL:

```python
RESERVATION_FILE = "data/reservations.json"
RESERVATION_TTL_SECONDS = 7200  # 2 hours

def reserve_capacity(farm_id, facility_id, species, count):
    reservations = load_reservations()
    now = time.time()

    # Expire old reservations
    reservations = [r for r in reservations if now - r['timestamp'] < RESERVATION_TTL_SECONDS]

    # Add new
    reservations.append({
        "farm_id": farm_id,
        "facility_id": facility_id,
        "species": species,
        "count": count,
        "timestamp": now,
        "expired": False
    })

    save_reservations(reservations)
    return True
```

**Important:** Apply a 20% capacity buffer. If a facility says 300 cattle, treat as 240 available.

## Multi-Trip Calculator

```python
def calculate_trips(animal_inventory, trailer_capacity, route_time_minutes):
    trips = []
    trip_number = 1

    priority_order = ["horses", "cattle_calves", "cattle", "goats", "sheep", "poultry"]
    sorted_animals = sorted(
        animal_inventory,
        key=lambda a: priority_order.index(a['species']) if a['species'] in priority_order else 99
    )

    for animal_group in sorted_animals:
        remaining = animal_group['count']
        cap = trailer_capacity.get(animal_group['species'], 20)

        while remaining > 0:
            load = min(remaining, cap)
            trips.append({
                "trip": trip_number,
                "animals": f"{load} {animal_group['species']}",
                "round_trip_minutes": route_time_minutes * 2 + 30,  # 30 min load/unload
                "cumulative_hours": trip_number * (route_time_minutes * 2 + 30) / 60
            })
            remaining -= load
            trip_number += 1

    return trips
```

## Edge Cases You Must Handle

| Condition | How to Handle |
|-----------|---------------|
| Volunteer-run facilities | Flag as "unverified availability" |
| Capacity estimates approximate | Apply 20% buffer (300 listed = 240 available) |
| Animals from different farms can't mix | Add `requires_isolation` flag for bulls, stallions, sick animals |
| Feed/water for stays > 24hr | Rank facilities with own feed supply higher |
| Neighboring county overflow | Include but rank lower than local facilities |

## File Structure

```
modules/facilities/
  README.md                <- you are here
  facility_matcher.py      <- main module with match_facilities()
  capacity_manager.py      <- reservation tracking with TTL
  trip_calculator.py       <- multi-trip scheduling
  data/
    facilities.json        <- the facility database (15-20 entries)
    reservations.json      <- live reservation state
  tests/
    test_matching.py       <- 3 demo farms making sequential reservations
  requirements.txt
```

## Your Export Function

```python
def get_evacuation_match(
    farm_id: str,
    animal_inventory: list[dict],    # [{"species": "cattle", "count": 150}, ...]
    trailer_capacity: dict,          # {"cattle": 20, "horses": 4}
    fire_danger_zone: dict,          # Person 1's danger_zone GeoJSON
    route_time_minutes: int          # From Person 2 (best route time)
) -> dict:
    """Returns matched facilities, trip schedule, and reservations"""
```

## Output JSON Schema

```json
{
  "farm_id": "valley_center_ranch",
  "animal_inventory": [
    {"species": "cattle", "count": 150},
    {"species": "horses", "count": 8}
  ],
  "matched_facilities": [
    {
      "facility_id": "ramona_rodeo",
      "name": "Ramona Rodeo Grounds",
      "lat": 33.042,
      "lon": -116.868,
      "match_type": "full_match",
      "capacity_status": {
        "cattle": {"total": 300, "reserved": 80, "available": 220, "you_need": 150, "fits": true},
        "horses": {"total": 100, "reserved": 12, "available": 88, "you_need": 8, "fits": true}
      },
      "infrastructure": ["arena", "pens", "water"],
      "contact": "760-789-1484",
      "in_fire_zone": false
    }
  ],
  "evacuation_trips": [
    {"trip": 1, "animals": "8 horses", "destination": "Ramona Rodeo", "round_trip_min": 106, "depart": "14:30"},
    {"trip": 2, "animals": "20 cattle", "destination": "Ramona Rodeo", "round_trip_min": 106, "depart": "16:16"}
  ],
  "total_evacuation_hours": 15.9,
  "warning": "Total evacuation exceeds estimated safe window. Consider splitting between facilities.",
  "reservations_made": [
    {"facility_id": "ramona_rodeo", "species": "cattle", "count": 150, "expires": "2026-05-08T16:30:00Z"}
  ]
}
```

## How Your Output Is Used

- **Person 2 (Routing)** receives your facility coordinates as routing destinations
- **Person 4 (Farmer Input)** uses your trip schedule to build the priority loading plan
- **Person 5 (Frontend)** renders your facilities as color-coded pins (green=open, yellow=filling, red=full) with capacity popups

## What You Read from Other Modules

- **Person 1's output** (`data/fire_data.json`): `danger_zone` polygon to exclude facilities in fire path
- **Person 2's output**: `total_time_min` per route to calculate round-trip times for trips

## Demo Key Moment

After Farm 1 (Valley Center Ranch) reserves 150 cattle spots at Ramona Rodeo, Farm 2 (Fallbrook Stables) should see **reduced capacity** at Ramona and get routed to Del Mar Fairgrounds instead.

**Demo point:** "During the actual Lilac Fire, Del Mar received 1,100+ horses while other facilities sat empty. If NoHerdLeft existed, animals would have been distributed across 8 facilities. San Luis Rey would have been evacuated 2 hours earlier."

## Tech Stack

```
pip install sqlite3  # (built into Python)
```

- **SQLite** or **JSON files** for reservation tracking
- **Basic math** for distance calculations (haversine formula)
- No heavy dependencies - this module is data + logic

## Demo Assignment

**Judge question you own:** "How does this scale beyond San Diego?"

**Your answer:** "The architecture is location-agnostic. Swap the facility database and road network for any county. FIRMS and NOAA are global. We'd partner with county animal services to build facility databases. The facility JSON schema is designed for community contribution."

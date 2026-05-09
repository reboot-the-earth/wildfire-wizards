# NoHerdLeft

**Wildfire livestock evacuation system for San Diego County**

During the 2017 Lilac Fire, 46 horses died at San Luis Rey Training Center because evacuation was uncoordinated. Farmers didn't know which facilities had capacity, which roads were safe, or how to prioritize loading. NoHerdLeft fixes that.

## What It Does

A farmer opens the app, drops a pin on their farm, enters their animals and trailer info, and gets back:
- A countdown showing when fire reaches them
- A priority-ordered loading plan (which animals first, how to handle them)
- The best facility matched to their specific animals with live capacity
- A safe driving route that avoids fire zones, closed roads, and smoke
- A species-specific prep checklist

## Architecture

Five independent modules communicate through JSON contracts. No module imports another directly. The frontend calls all four backend functions and stitches results together.

```
noherdeleft/
  data/               <- cached datasets (fire, roads, facilities, reservations)
  modules/
    fire_detection/    <- Person 1: fire spread prediction
    routing/           <- Person 2: safe route engine
    facilities/        <- Person 3: facility matching & capacity
    farmer_input/      <- Person 4: input form, priority engine, checklists
    alert_system/      <- Proactive SMS alert + offline text plan (Twilio/Textbelt/demo)
  frontend/            <- Person 5: map UI, integration, demo controller
  demo/                <- pre-loaded farm profiles and fire scenarios
  config.json          <- shared constants
```

## Shared Contract

All modules agree on these before splitting:

| Item | Value |
|------|-------|
| Coordinate system | WGS84 (lat/lon) |
| Bounding box | `north: 33.51, south: 32.53, east: -116.08, west: -117.60` (San Diego County) |
| Demo scenario | 2017 Lilac Fire, Bonsall area. Three pre-loaded farms. Fire from east, Santa Ana winds. |
| Communication | Every module exposes ONE function: JSON in, JSON out |
| Integration | Person 5 calls all four functions. No module imports another. |

## Module Overview

| Module | Owner | Role | Key Output |
|--------|-------|------|------------|
| Fire Detection & Spread | Person 1 | Where is fire now, where will it be in 1/2/4/6 hours | Fire perimeters as GeoJSON polygons + farms at risk |
| Safe Route Engine | Person 2 | Safest drivable route avoiding fire and closures | Ranked routes with safety scores as GeoJSON |
| Facility Matcher | Person 3 | Best available shelter matched to animal species | Facility list with live capacity + trip schedule |
| Farmer Input & Priority | Person 4 | Capture farm info, generate loading plan & checklist | Priority-ordered evacuation plan + checklists |
| Frontend & Integration | Person 5 | Map UI, ties all modules together, owns the demo | The final rendered application |

## Demo Flow (3 minutes)

1. **Set the scene** - Lilac Fire ignites near Bonsall. 35 mph Santa Ana winds.
2. **Show farms at risk** - 3 farms, 182 cattle, 32 horses, 85 goats in projected path.
3. **Farm 1: Valley Center Ranch** - 150 cattle, 8 horses, one trailer, 3.7 hours to fire. System generates full plan.
4. **Show capacity impact** - Ramona Rodeo capacity drops. Next farmer sees different options.
5. **Farm 2: Fallbrook Stables** - 24 horses. System routes to Del Mar instead.
6. **The stakes** - 46 horses died in the real Lilac Fire. This system makes that number zero.

## Tech Stack (All Open Source)

| Layer | Technology |
|-------|-----------|
| Fire data | NASA FIRMS API, NOAA Weather API, LANDFIRE, USGS DEM |
| Geospatial | GeoPandas, Shapely, rasterio, OSMnx |
| Routing | NetworkX (Dijkstra on weighted road graph) |
| Database | SQLite / JSON files |
| Maps | Leaflet + CartoDB DarkMatter tiles (or Mapbox free tier) |
| Frontend | HTML/CSS/JS (no build step) |
| Road data | OpenStreetMap via OSMnx |

## Setup

The backend is a Flask integration layer that wraps each module's export
function. The frontend is a Vite + React app that calls those endpoints (and
falls back to bundled mock data so the demo always renders).

```bash
git clone <repo-url>
cd wildfire-wizards

# Backend
pip install -r requirements.txt        # flask, flask-cors, shapely, requests, networkx, pytest
python api.py                          # serves http://localhost:5001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                            # serves http://localhost:3000
```

Pre-download the heavy GIS datasets once before the demo (optional — the
modules fall back to demo data from `config.json` when these are absent):

```bash
python modules/fire_detection/download_data.py
python modules/routing/download_roads.py
```

Run the test suite (57 tests across all modules):

```bash
python -m pytest modules/ -q
```

### Alert system (proactive SMS)

Background job that watches the fire spread, finds at-risk registered farms,
and texts each farmer their evacuation plan. Works offline once the SMS
arrives — no app, no login.

```bash
# 1. Bootstrap the SQLite farm registry (3 demo farms)
python modules/alert_system/seed_farms.py

# 2. Run a single alert cycle (also generates text-only plan segments)
python modules/alert_system/alert_runner.py --once --send-text-plan

# 3. Continuous mode (10-minute poll loop; Ctrl+C to stop)
python modules/alert_system/alert_runner.py --send-text-plan
```

By default no Twilio/Textbelt credentials are set, so SMS bodies are written
to `modules/alert_system/outbox/*.txt` and every send is appended to
`modules/alert_system/alerts.log` (JSONL). To enable real delivery set
`TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER`, or
`TEXTBELT_KEY`. See [`modules/alert_system/README.md`](modules/alert_system/README.md)
for the full env var list.

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | Reports which modules loaded |
| `GET`  | `/api/fire?live=true` | Person 1: fire perimeters + farms at risk |
| `GET`  | `/api/facilities` | Person 3: facility database with capacity |
| `POST` | `/api/routes` | Person 2: safe routes (`{farm_lat, farm_lon}`) |
| `POST` | `/api/plan` | Person 3: facility match + trip schedule |
| `GET`  | `/api/farmer-profiles` | Person 4: 3 demo farm profiles |
| `POST` | `/api/farmer-plan` | Person 4: priority loading plan + checklist |

## Integration Timeline

| Hour | Milestone |
|------|-----------|
| 0-8 | Each person builds their module independently against mock data |
| 8-9 | Push modules to shared repo. Person 5 swaps mock data for real. |
| 9-10 | Integration testing. Fix top 3 bugs only. |
| 10-11 | Full demo rehearsal. Time it. Cut if over 3 min. |
| 11-12 | Second rehearsal. Polish narration. Prep judge Q&A. |

## Judge Q&A

| Question | Short Answer |
|----------|-------------|
| AI/ML component? | Simplified Rothermel fire spread model + decision tree priority engine. Future: train on historical fire data. |
| Scales beyond SD? | Architecture is location-agnostic. Swap facility DB and road network for any county. FIRMS/NOAA are global. |
| No cell service? | Plan downloads as offline PDF/SMS before dead zones. Future: satellite messaging integration. |
| Open source? | MIT license. All open data: FIRMS, OSM, NOAA. Facility DB is community-contributed. |
| Can farmers use it? | 3 taps. Output is a step-by-step playbook, not a dashboard. Designed for a phone in a field. |

## License

MIT

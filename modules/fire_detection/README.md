# Person 1: Fire Detection, Heatmap & Spread Prediction

**Role:** The alarm clock. This module answers: where is fire now, where will it be in 1/2/4/6 hours, and which farms are in danger.

## Your Deliverable

A single function that takes a bounding box and returns:
- Active fire hotspots from NASA FIRMS
- Current fire perimeter as a GeoJSON polygon
- Projected fire perimeters at 1, 2, 4, and 6 hours as GeoJSON polygons
- Current wind and weather conditions
- List of farms at risk with estimated time-to-fire and risk level

## Data Sources

| Dataset | What It Gives You | Where to Get It |
|---------|-------------------|-----------------|
| NASA FIRMS | Active fire hotspots (lat, lon, confidence, brightness, timestamp) | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_API_KEY/VIIRS_SNPP_NRT/` - Free key, 2 min signup. Returns CSV by bounding box and date range. |
| NOAA Weather API | Wind speed, direction, humidity, temperature | `https://api.weather.gov/points/33.22,-117.18` -> nearest station -> `/observations/latest`. No key needed. |
| LANDFIRE | Vegetation type and density per 30m grid cell (fuel load) | `https://landfire.gov/viewer/` - Download "Fuel Vegetation Type" for SD County as GeoTIFF. ~50MB. **Pre-download before hackathon.** |
| USGS Elevation (DEM) | Slope data (fire moves faster uphill) | `https://apps.nationalmap.gov/downloader/` - 1/3 arc-second DEM for SD County. **Pre-download.** |

## Hour-by-Hour Plan

| Hour | Task |
|------|------|
| 0-1 | Get FIRMS API key. Pull historical Lilac Fire data (Dec 7-9 2017) to validate model. Pull current NOAA weather for San Diego. Cache everything locally in `data/`. |
| 1-3 | Build fire spread model using simplified Rothermel formula. Output: projected fire perimeter as GeoJSON polygon for each time step. |
| 3-5 | Build farm alerting logic. Check which farms fall within 6-hour projected spread zone. Calculate estimated time until fire reaches each farm. Sort by urgency. |
| 5-7 | Build heatmap output. Generate layered GeoJSON: current perimeter + 1hr + 2hr + 4hr + 6hr as concentric polygons. Add wind arrow overlay data. |
| 7-8 | Write the module's export function. Test with demo data. Push output JSON to shared `data/` folder. |

## The Fire Spread Model (Simplified Rothermel)

Do NOT implement the full Rothermel model (70+ parameters). Use this simplification:

```python
def predict_spread(fire_point, wind_speed, wind_dir, fuel_type, slope):
    # Base spread rates by fuel type (chains/hour, from NWCG tables)
    base_rates = {
        "grass": 78,
        "shrub": 35,
        "timber_litter": 8,
        "slash": 15
    }
    base = base_rates.get(fuel_type, 20)

    # Wind multiplier
    wind_factor = 1 + (wind_speed / 15) ** 1.5

    # Slope multiplier (fire moves faster uphill)
    slope_factor = 1 + (slope / 40) ** 2

    # Rate in meters per hour
    rate_m_per_hr = base * 20.1168 * wind_factor * slope_factor / 60

    # Project elliptical spread: longer in wind direction
    return generate_spread_polygon(fire_point, rate_m_per_hr, wind_dir, hours=[1, 2, 4, 6])
```

Key logic:
- Use LANDFIRE fuel type to look up base rate
- Wind factor uses power law (1.5 exponent)
- Slope factor uses quadratic scaling
- Output is an ellipse elongated in wind direction, not a circle
- Use Shapely to generate the polygon vertices

## Edge Cases You Must Handle

| Condition | How to Handle |
|-----------|---------------|
| FIRMS data lag (10-20 min) | Compensate by starting projection from "fire was HERE 15 min ago" |
| Low confidence hotspots | Filter FIRMS by confidence > 75%. Lower values are often factories/refineries. |
| Santa Ana wind shifts | Show projections as 30-degree spread cones, not lines |
| Night fires | Multiply spread rate by 0.4 between 8pm-6am |
| Multiple fire starts | Handle as separate fire objects that may merge |

## File Structure

```
modules/fire_detection/
  README.md              <- you are here
  fire_spread.py         <- main module with predict_spread() and generate_alert()
  firms_client.py        <- NASA FIRMS API wrapper
  weather_client.py      <- NOAA Weather API wrapper
  fuel_lookup.py         <- LANDFIRE fuel type -> base rate mapping
  download_data.py       <- script to pre-download LANDFIRE + DEM GeoTIFFs
  tests/
    test_spread.py       <- validate against Lilac Fire actual perimeter
  requirements.txt
```

## Your Export Function

```python
def get_fire_data(bounding_box: dict, farm_locations: list[dict]) -> dict:
    """
    Args:
        bounding_box: {"north": 33.51, "south": 32.53, "east": -116.08, "west": -117.60}
        farm_locations: [{"farm_id": "valley_center_ranch", "lat": 33.22, "lon": -117.03}, ...]

    Returns:
        dict matching the output JSON schema below
    """
```

## Output JSON Schema

```json
{
  "timestamp": "2026-05-08T14:30:00Z",
  "fire_id": "lilac_demo_2017",
  "active_hotspots": [
    {"lat": 33.24, "lon": -117.18, "confidence": 95, "brightness": 367}
  ],
  "current_perimeter": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  },
  "projected_perimeters": [
    {"hours": 1, "geometry": {"type": "Polygon", "coordinates": [...]}},
    {"hours": 2, "geometry": {"type": "Polygon", "coordinates": [...]}},
    {"hours": 4, "geometry": {"type": "Polygon", "coordinates": [...]}},
    {"hours": 6, "geometry": {"type": "Polygon", "coordinates": [...]}}
  ],
  "wind": {
    "speed_mph": 35,
    "direction_deg": 55,
    "gusts_mph": 50
  },
  "weather": {
    "humidity_pct": 12,
    "temp_f": 89
  },
  "farms_at_risk": [
    {
      "farm_id": "valley_center_ranch",
      "lat": 33.22,
      "lon": -117.03,
      "estimated_time_to_fire_hours": 3.7,
      "risk_level": "high",
      "alert_message": "Fire projected to reach your area in ~3.5 hours. Evacuate livestock now."
    }
  ],
  "danger_zone": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  }
}
```

## How Your Output Is Used

- **Person 2 (Routing)** reads your `projected_perimeters` and `danger_zone` to block roads that intersect fire zones
- **Person 3 (Facilities)** reads your `danger_zone` to exclude facilities inside the fire path
- **Person 4 (Farmer Input)** reads `farms_at_risk.estimated_time_to_fire_hours` to calculate available evacuation window
- **Person 5 (Frontend)** renders your perimeters as color-coded heatmap layers on the map

## Tech Stack

```
pip install geopandas shapely rasterio requests
```

- **GeoPandas** - geospatial data manipulation
- **Shapely** - polygon generation and intersection
- **rasterio** - reading LANDFIRE and DEM GeoTIFFs
- **requests** - FIRMS and NOAA API calls

## Validation (Lilac Fire)

Test your spread prediction against the actual Lilac Fire perimeter progression:
- Fire started ~11:15 AM Dec 7, 2017 near Lilac Rd and Old Highway 395
- By 2 PM it had crossed I-15
- By 6 PM it reached the coast side of Bonsall
- Total burn: ~4,100 acres in first 12 hours

Your model should produce perimeters that roughly match this progression. Exact match is not expected - directionally correct is good enough for a hackathon.

## Demo Assignment

**Judge question you own:** "What's the AI/ML component?"

**Your answer:** "The fire spread prediction uses a simplified Rothermel model enhanced with real-time vegetation density from LANDFIRE and wind data from NOAA. The priority engine uses a decision tree to optimize loading order. Future version: train on historical fire spread data from NIFC to improve prediction accuracy using ML."

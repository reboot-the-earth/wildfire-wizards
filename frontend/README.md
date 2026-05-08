# Person 5: Frontend Map, Integration Layer & Demo Controller

**Role:** The conductor. You build the single-page application that ties all four modules together and you own the demo - the scripted walkthrough that wins or loses the pitch.

## Your Deliverable

A working map with all four layers rendering. Demo controller steps through the Lilac Fire scenario smoothly. Left sidebar (farm input), right sidebar (evacuation plan), countdown timer, facility pins with live capacity.

## Data Sources

- All four module outputs: `data/fire_data.json`, route output, `data/facilities.json`, farm input
- Map tiles: Leaflet + CartoDB DarkMatter (zero signup) OR Mapbox free tier (dark-v11 style)
- SD County boundary: `https://data.sandiegocounty.gov/` or TIGER/Line shapefiles

## Hour-by-Hour Plan

| Hour | Task |
|------|------|
| 0-2 | Set up web app scaffold. Full-screen dark basemap. Left sidebar for farm input. Right sidebar for evacuation plan. Top bar for alert banner. Working layout with placeholder data. |
| 2-4 | Build layer system. Fire heatmap (Person 1 GeoJSON). Facility pins (Person 3). Route lines (Person 2). Each toggleable. Use MOCK data - don't wait for real data. |
| 4-6 | Build integration logic. "Generate Plan" button triggers all four modules and displays combined result. |
| 6-8 | **Build the demo controller.** Hidden "Demo Mode" button. Loads Lilac Fire, pre-populates farms, steps through with one click per step. **This is the most important thing you build.** |
| 8-10 | Swap mock data for real module outputs. Fix format mismatches. |
| 10-12 | Polish, rehearse, break things on purpose, rehearse again. |

## Page Layout

```
+--------------------------------------------------------------+
| [fire emoji] FIRE REACHES YOUR FARM IN: 3h 42m 18s          |  <- countdown banner
+----------+---------------------------+-----------------------+
|          |                           |                       |
| FARM     |                           | EVACUATION            |
| INPUT    |                           | PLAN                  |
|          |                           |                       |
| [Pin]    |         MAP               | Trip 1: horses        |
| [Animals]|     (dark basemap)        | Trip 2: horses        |
| [Trailer]|                           | Trip 3: cattle        |
|          |   fire heatmap            | Trip 4: cattle        |
| [GENERATE|   facility pins           | ...                   |
|  PLAN]   |   safe route              |                       |
|          |                           | CHECKLIST              |
|          |                           | [ ] Papers             |
|          |                           | [ ] Water              |
|          |                           | [ ] Gas tank           |
|          |                           |                       |
+----------+---------------------------+-----------------------+
| [< PREV]  Demo Step 3 of 6  [NEXT >]                        |  <- demo controller (hidden in prod)
+--------------------------------------------------------------+
```

## Map Layer System

```javascript
// Use Leaflet with CartoDB DarkMatter tiles (no signup needed)
const map = L.map('map').setView([33.24, -117.18], 11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: 'CartoDB'
}).addTo(map);

// Layer groups
const layers = {
    fire: {
        currentPerimeter: L.geoJSON(null, {style: {color: '#ff0000', weight: 3, fillOpacity: 0.4}}),
        projection1hr:    L.geoJSON(null, {style: {color: '#ff6600', weight: 2, fillOpacity: 0.2}}),
        projection2hr:    L.geoJSON(null, {style: {color: '#ff9900', weight: 2, fillOpacity: 0.15}}),
        projection4hr:    L.geoJSON(null, {style: {color: '#ffcc00', weight: 1, fillOpacity: 0.1}}),
        projection6hr:    L.geoJSON(null, {style: {color: '#ffee00', weight: 1, fillOpacity: 0.05}})
    },
    facilities: L.layerGroup(),
    routes: L.layerGroup(),
    farms: L.layerGroup(),
    wind: L.layerGroup()
};

// Toggle controls
L.control.layers(null, {
    "Fire - Current":        layers.fire.currentPerimeter,
    "Fire - 1hr Projection": layers.fire.projection1hr,
    "Fire - 2hr Projection": layers.fire.projection2hr,
    "Fire - 4hr Projection": layers.fire.projection4hr,
    "Fire - 6hr Projection": layers.fire.projection6hr,
    "Evacuation Facilities": layers.facilities,
    "Safe Routes":           layers.routes,
    "Registered Farms":      layers.farms,
    "Wind Direction":        layers.wind
}).addTo(map);
```

## Facility Pins with Live Capacity

```javascript
function renderFacilities(facilitiesData) {
    layers.facilities.clearLayers();

    facilitiesData.forEach(facility => {
        const availPct = facility.capacity_available / facility.capacity_total;
        let color, status;
        if (availPct > 0.5)      { color = '#22c55e'; status = 'Open'; }
        else if (availPct > 0.2) { color = '#eab308'; status = 'Filling Up'; }
        else if (availPct > 0)   { color = '#f97316'; status = 'Almost Full'; }
        else                     { color = '#ef4444'; status = 'Full'; }

        const marker = L.circleMarker([facility.lat, facility.lon], {
            radius: 12, color, fillColor: color, fillOpacity: 0.8
        });

        marker.bindPopup(`
            <h3>${facility.name}</h3>
            <div class="capacity-bar">
                <div class="capacity-fill" style="width:${availPct*100}%;background:${color}"></div>
            </div>
            <p>${facility.capacity_available}/${facility.capacity_total} - ${status}</p>
            <p>Accepts: ${facility.accepts.join(', ')}</p>
            <p>Contact: ${facility.contact}</p>
        `);

        layers.facilities.addLayer(marker);
    });
}
```

## Route Rendering with Safety Colors

```javascript
function renderRoutes(routesData) {
    layers.routes.clearLayers();

    routesData.forEach(route => {
        if (route.status === 'no_safe_route') return;

        route.segments.forEach(segment => {
            let color;
            if (segment.status === 'safe')            color = '#22c55e';
            else if (segment.status === 'at_risk_in_4hr') color = '#eab308';
            else if (segment.status === 'at_risk_in_2hr') color = '#ef4444';

            L.geoJSON(segment.geometry, {
                style: {
                    color,
                    weight: route.rank === 1 ? 6 : 3,
                    opacity: route.rank === 1 ? 1 : 0.5,
                    dashArray: segment.status === 'safe' ? null : '10 5'
                }
            }).addTo(layers.routes);
        });

        if (route.rank === 1) {
            const mid = route.route_geometry.coordinates[
                Math.floor(route.route_geometry.coordinates.length / 2)
            ];
            L.marker([mid[1], mid[0]], {
                icon: L.divIcon({
                    className: 'route-label',
                    html: `<div class="route-badge">RECOMMENDED - ${route.total_time_min} min</div>`
                })
            }).addTo(layers.routes);
        }
    });
}
```

## Countdown Timer

```javascript
function startCountdown(hoursRemaining) {
    const banner = document.getElementById('countdown-banner');
    let secondsLeft = hoursRemaining * 3600;

    const interval = setInterval(() => {
        secondsLeft--;
        const h = Math.floor(secondsLeft / 3600);
        const m = Math.floor((secondsLeft % 3600) / 60);
        const s = secondsLeft % 60;

        banner.textContent = `FIRE REACHES YOUR FARM IN: ${h}h ${m}m ${s}s`;

        if (h < 1)      banner.className = 'countdown critical';   // red, pulsing
        else if (h < 2) banner.className = 'countdown urgent';     // orange
        else            banner.className = 'countdown warning';    // yellow

        if (secondsLeft <= 0) {
            clearInterval(interval);
            banner.textContent = 'FIRE HAS REACHED YOUR AREA - EVACUATE IMMEDIATELY';
            banner.className = 'countdown critical pulsing';
        }
    }, 1000);
}
```

## The Demo Controller (Your Secret Weapon)

```javascript
const DEMO_STEPS = [
    {
        name: "Set the scene",
        action: () => {
            loadFireData('lilac_fire_2017');
            map.flyTo([33.24, -117.18], 11);
            showNarration("December 7, 2017. 11:15 AM. Fire ignites near Bonsall. Wind: 35 mph, Santa Ana.");
        }
    },
    {
        name: "Show farms at risk",
        action: () => {
            loadDemoFarms();
            highlightAtRiskFarms();
            showNarration("3 farms: 182 cattle, 32 horses, 85 goats in projected path. Auto-alerts sent.");
        }
    },
    {
        name: "Farm 1 - Valley Center Ranch",
        action: () => {
            selectFarm('valley_center_ranch');
            generatePlan();
            showNarration("Maria has 150 cattle, 8 horses, one trailer. She has 3.7 hours.");
        }
    },
    {
        name: "Show capacity impact",
        action: () => {
            updateFacilityCapacity();
            showNarration("Ramona Rodeo now shows 62/300 remaining. Next farmer gets different routing.");
        }
    },
    {
        name: "Farm 2 - different options",
        action: () => {
            selectFarm('fallbrook_stables');
            generatePlan();
            showNarration("Jake has 24 horses. Ramona filling up. System routes him to Del Mar.");
        }
    },
    {
        name: "The stakes",
        action: () => {
            showNarration("During the actual Lilac Fire, 46 horses died at San Luis Rey. Uncoordinated evacuation. This system makes that number zero.");
        }
    }
];

let currentStep = 0;
document.getElementById('demo-next').addEventListener('click', () => {
    if (currentStep < DEMO_STEPS.length) {
        DEMO_STEPS[currentStep].action();
        currentStep++;
        updateStepIndicator();
    }
});
```

## Integration Logic with Error Handling

```javascript
async function generatePlan() {
    try {
        const farmData = getFarmInput();  // Person 4

        let fireData, facilities, routes;

        try {
            fireData = await loadFireData();
        } catch (e) {
            showWarning("Fire data unavailable. Using last known data.");
            fireData = CACHED_FIRE_DATA;
        }

        try {
            facilities = await matchFacilities(farmData, fireData);
        } catch (e) {
            showWarning("Facility matching error. Showing all facilities.");
            facilities = ALL_FACILITIES;
        }

        try {
            routes = await findRoutes(farmData, facilities, fireData);
        } catch (e) {
            showWarning("Route error. Showing direct paths.");
            routes = directPaths(farmData, facilities);
        }

        renderPlan(farmData, fireData, facilities, routes);

    } catch (e) {
        showError("Plan generation failed. Please try again.");
        console.error(e);
    }
}
```

## Edge Cases You Must Handle

| Condition | How to Handle |
|-----------|---------------|
| Module fails to load | Show "Data unavailable" in that section. Don't crash the whole app. |
| Projector display | Large fonts, high-contrast colors. Test at low resolution. |
| Wifi unreliable | Pre-cache all map tiles for demo area. Don't rely on live tile loading during pitch. |
| Demo timing | Time the full demo. Must be under 3 minutes. Cut ruthlessly if over. |

## File Structure

```
frontend/
  README.md            <- you are here
  index.html           <- single-page app
  style.css            <- layout, countdown styles, responsive design
  app.js               <- main application logic
  map.js               <- Leaflet map initialization and layer management
  integration.js       <- calls to all four modules
  demo.js              <- demo controller and step definitions
  mock/
    fire_data.json     <- mock Person 1 output (use until real data ready)
    routes.json        <- mock Person 2 output
    facilities.json    <- mock Person 3 output
    farm_profiles.json <- mock Person 4 output (copy from demo/)
```

## What You Read from Other Modules

| Module | What You Read | How You Render It |
|--------|--------------|-------------------|
| Person 1 (Fire) | `projected_perimeters`, `active_hotspots`, `wind`, `farms_at_risk` | Color-coded heatmap polygons, hotspot markers, wind arrow, countdown timer |
| Person 2 (Routes) | `routes_to_facilities` with `segments` and `route_geometry` | Color-coded polylines (green/yellow/red), rank labels |
| Person 3 (Facilities) | `matched_facilities` with `capacity_status` | Circle markers colored by capacity (green/yellow/orange/red), popup with details |
| Person 4 (Farmer Input) | `priority_plan`, `checklist`, `triage_warning` | Right sidebar: trip cards, expandable checklist sections, red triage banner |

## Tech Stack

```html
<!-- In index.html - no build step, no npm, no framework -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

- **Leaflet** - map rendering (CDN, no install)
- **CartoDB DarkMatter tiles** - dark basemap (no signup)
- **Vanilla HTML/CSS/JS** - no build step, no framework. Safest choice for hackathon.

If the team is comfortable with React, use it - but only if everyone agrees. A broken build system at hour 10 is a disaster.

## Pre-Demo Checklist

- [ ] All map tiles cached for Bonsall/Valley Center/Ramona/Fallbrook area
- [ ] Demo controller tested 5 times end to end
- [ ] Timed: must be under 3 minutes
- [ ] Works on projector resolution
- [ ] Hotspot backup if wifi fails
- [ ] Person presenting knows the narration
- [ ] Mock data fallbacks work if any module is broken

## Demo Assignment

**Judge question you own:** "Can farmers actually use this in a real emergency?"

**Your answer:** "The form is 3 taps. The output is a step-by-step playbook, not a dashboard to interpret. We designed for a farmer in a field with a phone, not an analyst at a desk. The countdown timer creates urgency. The checklist is actionable. And if they lose service, the plan downloads as a PDF."

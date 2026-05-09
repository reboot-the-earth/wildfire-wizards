# NoHerdLeft — Alert System

## Overview

The NoHerdLeft alert system monitors active wildfire data in real time and automatically notifies registered farmers when a fire is projected to reach their land. Farmers receive an SMS with their pre-generated evacuation plan — no app, no login, no internet required after the first message.

Two-tier architecture:
- **Tier 1 — Proactive SMS**: Sent the moment fire is detected within a farm's projected danger zone
- **Tier 2 — Offline-ready plan**: The linked evacuation plan is cached on the farmer's phone after first load, so it works without signal

---

## How It Works

```
NASA FIRMS detects active fire hotspot
        ↓
System calculates 6-hour fire spread projection
(wind speed + direction + vegetation + slope)
        ↓
System checks all registered farms against danger zone
        ↓
At-risk farms identified with estimated time-to-arrival
        ↓
Twilio sends SMS to each at-risk farmer
        ↓
Farmer taps link → pre-generated evacuation plan loads
        ↓
Plan cached on device → works offline if signal is lost
```

---

## SMS Alert Format

### Initial Alert
```
NOHERDLEFT ALERT ⚠️
Fire detected 8 miles east of Valley Center Ranch.
Estimated time to your farm: ~3.5 hours.
Wind: 35 mph NE. Conditions: Extreme.

Your evacuation plan: https://noherdleft.io/plan/abc123

Reply PLAN for text-only version (no internet needed).
Reply STOP to unsubscribe.
```

### Text-Only Plan (reply PLAN)
Sent when farmer has no data signal and can only receive SMS:
```
NOHERDLEFT EVACUATION PLAN
Valley Center Ranch — May 8, 2026 2:30 PM

TIME REMAINING: ~3.5 hours

PRIORITY ORDER:
1. 2 pregnant mares + foal + 1 horse → Ramona Rodeo
   Load time: 45 min | Drive: 38 min
2. 4 remaining horses → Ramona Rodeo
   Load time: 30 min | Drive: 38 min
3. 150 cattle (7 trips) → Ramona Rodeo
   20 head per trip | Drive: 38 min each

DESTINATION:
Ramona Rodeo Grounds
Aqua Lane off Main St, Ramona CA
Contact: 760-789-1484
Capacity: 220/300 available ✅

ROUTE: Valley Center Rd → CA-78 West → Ramona St
Status: SAFE as of 2:30 PM

WARNING: Total evacuation time ~16 hrs.
You cannot move all animals before fire arrives.
TRIAGE: Save horses first. Open cattle gates
if you cannot return. Remove all halters.
Spray phone number on remaining animals.

CHECKLIST:
□ Grab brand certificates
□ Fill water containers
□ Check trailer hitch
□ Full gas tank
□ Open all interior gates before final trip

LAST RESORT: Open all fences. Move cattle
toward the river. Leave water running.

- NoHerdLeft | noherdleft.io
```

---

## Technical Implementation

### Stack
- **Alert trigger**: Python background job (runs every 10 minutes)
- **SMS delivery**: Twilio Programmable SMS API
- **Fire data**: NASA FIRMS API (VIIRS Near Real-Time)
- **Farmer database**: SQLite (farm location, phone number, animal inventory)
- **Offline caching**: Progressive Web App (PWA) with Service Worker

### File Structure
```
/alert_system
  alert_runner.py        ← main scheduler, runs every 10 min
  fire_checker.py        ← pulls FIRMS data, calculates danger zones
  farm_matcher.py        ← checks which farms are at risk
  sms_sender.py          ← Twilio integration
  plan_generator.py      ← generates text-only SMS plan
  /sw.js                 ← service worker for offline PWA caching
  config.py              ← API keys, thresholds, timing settings
```

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
FIRMS_API_KEY=your_nasa_firms_key
BASE_URL=https://noherdleft.io
```

### Installation
```bash
pip install twilio requests shapely geopandas apscheduler
```

### Running the Alert System
```bash
python alert_runner.py
```

Runs on a 10-minute loop. Logs all alerts sent to `alerts.log`.

---

## Core Modules

### 1. `fire_checker.py`
Pulls active fire hotspots from NASA FIRMS for San Diego County bounding box. Calculates projected fire spread polygons for 1, 2, 4, and 6-hour windows using simplified Rothermel model with NOAA wind data.

```python
def get_danger_zones(bounding_box):
    """
    Returns GeoJSON polygons for current fire perimeter
    and projected spread at 1hr, 2hr, 4hr, 6hr intervals.
    """
```

### 2. `farm_matcher.py`
Checks all registered farms against the danger zones. Returns a list of at-risk farms with estimated time-to-arrival.

```python
def get_at_risk_farms(danger_zones, farms):
    """
    Returns list of farms within 6hr danger zone,
    each with estimated hours until fire arrival.
    Only returns farms not yet alerted in last 4 hours
    to prevent duplicate messages.
    """
```

### 3. `sms_sender.py`
Sends the initial alert SMS via Twilio. Handles inbound PLAN reply by generating and sending the full text-only evacuation plan.

```python
def send_alert(farm, hours_remaining, plan_url):
    """
    Sends initial SMS alert to farm's registered phone number.
    """

def send_text_plan(farm):
    """
    Sends full text-only evacuation plan as SMS.
    Called when farmer replies PLAN.
    """
```

### 4. `plan_generator.py`
Generates the text-only version of the evacuation plan. Pulls from the same priority engine and facility matcher used by the main app. Output is formatted to fit within SMS character limits (multiple messages chained).

```python
def generate_text_plan(farm_id):
    """
    Returns evacuation plan as plain text string,
    chunked into 160-character SMS segments if needed.
    """
```

---

## Farmer Registration

Farmers register via the main NoHerdLeft web app. Registration captures:

| Field | Description |
|-------|-------------|
| Farm name | Display name |
| Location | Lat/lon (from map pin or address) |
| Phone number | SMS delivery target |
| Animal inventory | Species and count |
| Transport | Trailer type and capacity |
| Alert radius | Default: farm will be alerted if fire is within 6-hour spread zone |

Registered farmers are stored in `farms.db` (SQLite). Sample entry:

```json
{
  "farm_id": "valley_center_ranch",
  "name": "Valley Center Ranch",
  "phone": "+17605551234",
  "location": {"lat": 33.22, "lon": -117.03},
  "animals": [
    {"species": "cattle", "count": 150},
    {"species": "horses", "count": 8}
  ],
  "transport": {"trailers": 1, "type": "stock_trailer", "capacity": 20},
  "alert_radius_hours": 6,
  "last_alerted": null
}
```

---

## Alert Deduplication

Farmers are not alerted more than once every 4 hours for the same fire event. The `last_alerted` timestamp prevents spam during extended fire events. A new alert is sent if:

- A new separate fire is detected
- Wind shift significantly changes the projected danger zone
- More than 4 hours have passed since last alert and farm remains at risk

---

## Offline PWA Caching

When a farmer opens their plan link for the first time, a Service Worker caches the entire plan on their device. If they lose cell data mid-evacuation, the plan still loads from cache.

```javascript
// sw.js — Service Worker
const CACHE_NAME = 'noherdleft-v1';
const PLAN_ASSETS = [
    '/',
    '/plan.css',
    '/plan.js',
    '/offline.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PLAN_ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).catch(() => {
                return caches.match('/offline.html');
            });
        })
    );
});
```

The individual farm plan (trip list, route, facility details) is cached when the page first loads — not just the app shell.

---

## Alert Flow Diagram

```
[Every 10 minutes]
        │
        ▼
Pull NASA FIRMS data for San Diego County
        │
        ▼
Any active hotspots with confidence > 75%?
        │
       YES ──────────────────────────────► NO → Sleep 10 min
        │
        ▼
Calculate spread polygons (1hr, 2hr, 4hr, 6hr)
        │
        ▼
Cross-reference with registered farms database
        │
        ▼
Any farms inside 6hr danger zone?
        │
       YES ──────────────────────────────► NO → Sleep 10 min
        │
        ▼
For each at-risk farm:
  Was farm alerted in last 4 hours?
        │
       NO ───────────────────────────────► YES → Skip
        │
        ▼
Generate plan URL for this farm
        │
        ▼
Send SMS via Twilio
        │
        ▼
Log alert + update last_alerted timestamp
        │
        ▼
Sleep 10 min
```

---

## Twilio Setup (Hackathon)

1. Sign up at `https://www.twilio.com` — free trial gives $15 credit
2. Get a trial phone number (US number, SMS-capable)
3. Note: trial account can only send to verified phone numbers. Verify your demo phone number under Verified Caller IDs.
4. For the pitch demo, pre-verify 1-2 phones so the SMS arrives live during presentation.

```python
from twilio.rest import Client

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

message = client.messages.create(
    body="NOHERDLEFT ALERT: Fire 8 miles east. ~3.5 hrs. Plan: https://noherdleft.io/plan/abc123",
    from_=TWILIO_PHONE_NUMBER,
    to=farm['phone']
)
```

---

## Handling Inbound PLAN Reply

Twilio can forward inbound SMS to a webhook. When a farmer replies PLAN, your server generates and sends the text-only evacuation plan.

Set Twilio webhook URL to: `https://your-server.com/sms/inbound`

```python
from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse

app = Flask(__name__)

@app.route('/sms/inbound', methods=['POST'])
def inbound_sms():
    body = request.form.get('Body', '').strip().upper()
    from_number = request.form.get('From')
    
    response = MessagingResponse()
    
    if body == 'PLAN':
        farm = get_farm_by_phone(from_number)
        if farm:
            plan_text = generate_text_plan(farm['farm_id'])
            response.message(plan_text)
        else:
            response.message("No farm registered to this number. Visit noherdleft.io to register.")
    
    elif body == 'STOP':
        unsubscribe(from_number)
        response.message("You have been unsubscribed from NoHerdLeft alerts.")
    
    return str(response)
```

---

## Limitations (Hackathon Scope)

| Limitation | Production Solution |
|-----------|-------------------|
| Twilio trial only sends to verified numbers | Upgrade to paid account, register as emergency service |
| No true offline messaging | Integrate Garmin inReach satellite API for no-signal areas |
| 10-minute polling interval | Move to FIRMS real-time streaming when available |
| SQLite for farm database | PostgreSQL + PostGIS for production scale |
| Single SMS language (English) | Add Spanish — most CA farmworkers are Spanish-speaking |

---

## Demo Script for Pitch

1. Show map with fire detected near Valley Center Ranch
2. Point to terminal — alert runner is live
3. Say: "Watch this phone"
4. Fire enters the 6-hour danger zone on screen
5. Phone receives SMS in real time
6. Tap the link — evacuation plan loads instantly
7. Turn off wifi on phone — reload the page — plan still works
8. Say: "No app. No login. Just a text at the moment that matters."

---

## Built With

- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — real-time fire detection
- [NOAA Weather API](https://api.weather.gov) — wind and weather data
- [Twilio](https://www.twilio.com) — SMS delivery
- [APScheduler](https://apscheduler.readthedocs.io/) — Python job scheduler
- PWA Service Worker — offline caching

---

*NoHerdLeft — Built at Reboot the Earth 2026, UCSD*
*Challenge 1: Early Warning for Agricultural Wildfire Risk*
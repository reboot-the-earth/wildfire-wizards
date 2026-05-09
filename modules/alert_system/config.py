from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
LOG_PATH = Path(__file__).resolve().parent / "alerts.log"
OUTBOX_DIR = Path(__file__).resolve().parent / "outbox"
DB_PATH = Path(__file__).resolve().parent / "farms.db"

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
TEXTBELT_KEY = os.getenv("TEXTBELT_KEY", "")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "auto").lower()  # auto | twilio | textbelt
BASE_URL = os.getenv("BASE_URL", "https://noherdleft.io")

POLL_INTERVAL_SECONDS = int(os.getenv("ALERT_POLL_SECONDS", "600"))
DEDUPE_HOURS = int(os.getenv("ALERT_DEDUPE_HOURS", "4"))
FIRE_CONFIDENCE_THRESHOLD = int(os.getenv("FIRE_CONFIDENCE_THRESHOLD", "75"))

# Nearby operations named in SMS so recipients can warn neighbors not on the registry.
COMMUNITY_FARMS_PATH = DATA_DIR / "community_farms.json"
NEIGHBOR_RADIUS_KM = float(os.getenv("NEIGHBOR_RADIUS_KM", "25"))
NEIGHBOR_MAX_BULLETS = int(os.getenv("NEIGHBOR_MAX_BULLETS", "5"))

# Demo default for now; can come from config.json in future.
BOUNDING_BOX = {
    "north": 33.51,
    "south": 32.53,
    "east": -116.08,
    "west": -117.60,
}

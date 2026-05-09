from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any

import requests

from .config import (
    LOG_PATH,
    OUTBOX_DIR,
    SMS_PROVIDER,
    TEXTBELT_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
)

try:
    from twilio.rest import Client  # type: ignore
except Exception:
    Client = None


def _log_event(event: dict[str, Any]) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(event) + "\n")


def _twilio_client():
    if not (Client and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER):
        return None
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def _normalize_phone_for_textbelt(phone: str) -> str:
    """Textbelt accepts digits; strip +, spaces, dashes."""
    return re.sub(r"\D", "", phone)


def _send_via_textbelt(to: str, body: str) -> str:
    if not TEXTBELT_KEY:
        raise RuntimeError("TEXTBELT_KEY is not set")
    response = requests.post(
        "https://textbelt.com/text",
        data={
            "phone": _normalize_phone_for_textbelt(to),
            "message": body,
            "key": TEXTBELT_KEY,
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        error = payload.get("error", "unknown textbelt error")
        raise RuntimeError(f"Textbelt send failed: {error}")
    return payload.get("textId", "textbelt-ok")


def _demo_send(to: str, body: str) -> None:
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    out = OUTBOX_DIR / f"sms_{to.replace('+', '')}_{stamp}_{uuid.uuid4().hex[:6]}.txt"
    out.write_text(body)


def _resolve_provider() -> str:
    """Pick SMS provider based on env and available credentials."""
    if SMS_PROVIDER in {"twilio", "textbelt", "demo"}:
        return SMS_PROVIDER
    if _twilio_client():
        return "twilio"
    if TEXTBELT_KEY:
        return "textbelt"
    return "demo"


def _send_message(to: str, body: str) -> tuple[str, str]:
    provider = _resolve_provider()
    if provider == "twilio":
        client = _twilio_client()
        if not client:
            raise RuntimeError("Twilio selected but credentials are incomplete")
        msg = client.messages.create(body=body, from_=TWILIO_PHONE_NUMBER, to=to)
        return provider, msg.sid
    if provider == "textbelt":
        return provider, _send_via_textbelt(to, body)

    _demo_send(to, body)
    return "demo", "demo-outbox"


def send_alert(
    farm: dict[str, Any],
    hours_remaining: float,
    wind: dict[str, Any],
    fire_origin: dict[str, Any],
    plan_url: str,
    neighbor_block: str | None = None,
) -> None:
    body = (
        "NOHERDLEFT ALERT ⚠️\n"
        f"Fire detected near {farm['name']}.\n"
        f"Estimated time to your farm: ~{hours_remaining:.1f} hours.\n"
        f"Wind: {wind.get('speed_mph', '?')} mph dir {wind.get('direction_deg', '?')}°.\n\n"
        f"Your evacuation plan: {plan_url}\n\n"
        "Reply PLAN for text-only version.\n"
        "Reply STOP to unsubscribe."
    )
    if neighbor_block and neighbor_block.strip():
        body = f"{body}\n\n{neighbor_block.strip()}"

    provider, sid = _send_message(farm["phone"], body)

    _log_event(
        {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "type": "initial_alert",
            "farm_id": farm["farm_id"],
            "phone": farm["phone"],
            "hours_remaining": hours_remaining,
            "plan_url": plan_url,
            "provider": provider,
            "message_id": sid,
            "neighbor_block": bool(neighbor_block and neighbor_block.strip()),
        }
    )


def send_text_plan(farm: dict[str, Any], plan_segments: list[str]) -> None:
    provider = None
    ids = []
    for segment in plan_segments:
        seg_provider, seg_id = _send_message(farm["phone"], segment)
        provider = seg_provider
        ids.append(seg_id)

    _log_event(
        {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "type": "text_plan",
            "farm_id": farm["farm_id"],
            "phone": farm["phone"],
            "segments": len(plan_segments),
            "provider": provider or "demo",
            "message_ids": ids,
        }
    )

"""SMS provider resolution + demo-outbox + structured logging tests."""

from __future__ import annotations

import json

from alert_system import sms_sender


# ---- _resolve_provider ----

def test_resolve_provider_explicit_demo(monkeypatch):
    monkeypatch.setattr(sms_sender, "SMS_PROVIDER", "demo")
    assert sms_sender._resolve_provider() == "demo"


def test_resolve_provider_explicit_textbelt(monkeypatch):
    monkeypatch.setattr(sms_sender, "SMS_PROVIDER", "textbelt")
    assert sms_sender._resolve_provider() == "textbelt"


def test_resolve_provider_auto_falls_back_to_demo(monkeypatch):
    """No Twilio creds, no Textbelt key, ``auto`` → demo so dev never crashes."""
    monkeypatch.setattr(sms_sender, "SMS_PROVIDER", "auto")
    monkeypatch.setattr(sms_sender, "TWILIO_ACCOUNT_SID", "")
    monkeypatch.setattr(sms_sender, "TWILIO_AUTH_TOKEN", "")
    monkeypatch.setattr(sms_sender, "TWILIO_PHONE_NUMBER", "")
    monkeypatch.setattr(sms_sender, "TEXTBELT_KEY", "")
    monkeypatch.setattr(sms_sender, "Client", None)
    assert sms_sender._resolve_provider() == "demo"


def test_resolve_provider_auto_picks_textbelt_when_key_present(monkeypatch):
    monkeypatch.setattr(sms_sender, "SMS_PROVIDER", "auto")
    monkeypatch.setattr(sms_sender, "TWILIO_ACCOUNT_SID", "")
    monkeypatch.setattr(sms_sender, "TEXTBELT_KEY", "textbelt-test-key")
    monkeypatch.setattr(sms_sender, "Client", None)
    assert sms_sender._resolve_provider() == "textbelt"


# ---- _normalize_phone_for_textbelt ----

def test_normalize_phone_strips_punctuation():
    assert sms_sender._normalize_phone_for_textbelt("+1 (555) 123-4567") == "15551234567"


# ---- send_alert end-to-end via demo outbox ----

def _force_demo(monkeypatch):
    monkeypatch.setattr(sms_sender, "SMS_PROVIDER", "demo")


def test_send_alert_writes_outbox_file_and_logs(isolated_outbox, monkeypatch):
    outbox, log_path = isolated_outbox
    _force_demo(monkeypatch)

    farm = {
        "farm_id": "valley_center_ranch",
        "name": "Valley Center Ranch",
        "phone": "+15555550101",
    }
    sms_sender.send_alert(
        farm=farm,
        hours_remaining=3.5,
        wind={"speed_mph": 35, "direction_deg": 55},
        fire_origin={"lat": 33.24, "lon": -117.18},
        plan_url="https://noherdleft.io/plan/valley_center_ranch",
    )

    written = list(outbox.glob("sms_*.txt"))
    assert len(written) == 1
    body = written[0].read_text()
    assert "NOHERDLEFT ALERT" in body
    assert "Valley Center Ranch" in body
    assert "3.5 hours" in body
    assert "Reply STOP to unsubscribe" in body
    assert "NEARBY" not in body

    log_lines = log_path.read_text().splitlines()
    assert len(log_lines) == 1
    event = json.loads(log_lines[0])
    assert event["type"] == "initial_alert"
    assert event["farm_id"] == "valley_center_ranch"
    assert event["provider"] == "demo"
    assert event.get("neighbor_block") is False


def test_send_alert_includes_neighbor_block_when_provided(isolated_outbox, monkeypatch):
    outbox, log_path = isolated_outbox
    _force_demo(monkeypatch)

    farm = {"farm_id": "valley_center_ranch", "name": "Valley Center Ranch", "phone": "+15555550101"}
    extra = "NEARBY — not on our SMS list (please warn them if safe):\n• Test Ranch (~2 km)"
    sms_sender.send_alert(
        farm=farm,
        hours_remaining=3.5,
        wind={"speed_mph": 35, "direction_deg": 55},
        fire_origin={"lat": 33.24, "lon": -117.18},
        plan_url="https://noherdleft.io/plan/valley_center_ranch",
        neighbor_block=extra,
    )

    body = list(outbox.glob("sms_*.txt"))[0].read_text()
    assert "Test Ranch" in body
    assert "NEARBY" in body
    event = json.loads(log_path.read_text().splitlines()[0])
    assert event.get("neighbor_block") is True


def test_send_text_plan_writes_one_outbox_file_per_segment(isolated_outbox, monkeypatch):
    outbox, log_path = isolated_outbox
    _force_demo(monkeypatch)

    farm = {"farm_id": "valley_center_ranch", "phone": "+15555550101"}
    segments = ["segment one body", "segment two body", "segment three body"]
    sms_sender.send_text_plan(farm, segments)

    assert len(list(outbox.glob("sms_*.txt"))) == 3

    log_lines = log_path.read_text().splitlines()
    assert len(log_lines) == 1
    event = json.loads(log_lines[0])
    assert event["type"] == "text_plan"
    assert event["segments"] == 3
    assert len(event["message_ids"]) == 3

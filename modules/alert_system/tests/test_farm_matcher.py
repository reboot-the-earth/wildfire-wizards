"""Geometry, dedupe, and DB-backed query tests for farm_matcher.

These tests don't touch the network or any real Twilio/Textbelt account; the
``isolated_db`` fixture (see ``conftest.py``) keeps writes inside a tmp dir.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from alert_system import farm_matcher, seed_farms


# ---- _point_in_polygon ----

# A simple square covering the Lilac-fire bounding box used in demo data.
SQUARE = {
    "type": "Polygon",
    "coordinates": [[[-117.30, 33.10], [-117.00, 33.10], [-117.00, 33.30], [-117.30, 33.30], [-117.30, 33.10]]],
}


def test_point_in_polygon_inside():
    assert farm_matcher._point_in_polygon(33.20, -117.15, SQUARE) is True


def test_point_in_polygon_outside():
    assert farm_matcher._point_in_polygon(33.50, -117.15, SQUARE) is False
    assert farm_matcher._point_in_polygon(33.20, -116.50, SQUARE) is False


def test_point_in_polygon_handles_geojson_feature_wrapper():
    """The helper should accept either a raw geometry or {'geometry': geom}."""
    feature = {"type": "Feature", "geometry": SQUARE}
    assert farm_matcher._point_in_polygon(33.20, -117.15, feature) is True


def test_point_in_polygon_handles_none():
    assert farm_matcher._point_in_polygon(33.20, -117.15, None) is False


# ---- _dedupe_ok ----

def test_dedupe_ok_first_alert_always_passes():
    assert farm_matcher._dedupe_ok({"last_alerted": None}, "fire-x") is True


def test_dedupe_ok_blocks_recent_same_fire(monkeypatch):
    monkeypatch.setattr(farm_matcher, "DEDUPE_HOURS", 4)
    recent = (datetime.now(tz=timezone.utc) - timedelta(hours=1)).isoformat()
    farm = {"last_alerted": recent, "last_fire_id": "fire-x"}
    assert farm_matcher._dedupe_ok(farm, "fire-x") is False


def test_dedupe_ok_allows_after_window(monkeypatch):
    monkeypatch.setattr(farm_matcher, "DEDUPE_HOURS", 4)
    old = (datetime.now(tz=timezone.utc) - timedelta(hours=6)).isoformat()
    farm = {"last_alerted": old, "last_fire_id": "fire-x"}
    assert farm_matcher._dedupe_ok(farm, "fire-x") is True


def test_dedupe_ok_passes_for_new_fire_even_if_recent(monkeypatch):
    """A different fire should always re-alert, even within the dedupe window."""
    monkeypatch.setattr(farm_matcher, "DEDUPE_HOURS", 4)
    recent = (datetime.now(tz=timezone.utc) - timedelta(minutes=30)).isoformat()
    farm = {"last_alerted": recent, "last_fire_id": "fire-x"}
    assert farm_matcher._dedupe_ok(farm, "fire-y") is True


# ---- DB-backed flows ----

def test_seed_then_load_returns_demo_farms(isolated_db):
    inserted = seed_farms.seed()
    assert inserted == 3

    farms = farm_matcher.load_registered_farms()
    ids = {f["farm_id"] for f in farms}
    assert ids == {"valley_center_ranch", "fallbrook_stables", "ramona_goat_farm"}

    valley = next(f for f in farms if f["farm_id"] == "valley_center_ranch")
    assert valley["lat"] == pytest.approx(33.22)
    assert isinstance(valley["animals"], list) and valley["animals"]
    assert valley["transport"]["type"] == "stock_trailer"


def test_seed_is_idempotent(isolated_db):
    seed_farms.seed()
    second_run = seed_farms.seed()
    assert second_run == 0


def test_unsubscribe_removes_farm_from_load(isolated_db):
    seed_farms.seed()
    farm_matcher.unsubscribe("+15555550101")  # valley_center_ranch
    remaining = {f["farm_id"] for f in farm_matcher.load_registered_farms()}
    assert "valley_center_ranch" not in remaining
    assert "fallbrook_stables" in remaining


def test_get_farm_by_phone_lookup(isolated_db):
    seed_farms.seed()
    farm = farm_matcher.get_farm_by_phone("+15555550103")
    assert farm is not None
    assert farm["farm_id"] == "ramona_goat_farm"
    assert farm_matcher.get_farm_by_phone("+19999999999") is None


def test_mark_alert_sent_persists_dedupe_state(isolated_db):
    seed_farms.seed()
    farm_matcher.mark_alert_sent("valley_center_ranch", "lilac_demo_2017")

    valley = next(f for f in farm_matcher.load_registered_farms() if f["farm_id"] == "valley_center_ranch")
    assert valley["last_fire_id"] == "lilac_demo_2017"
    assert valley["last_alerted"] is not None


def test_get_at_risk_filters_to_polygon_only(isolated_db):
    seed_farms.seed()
    farms = farm_matcher.load_registered_farms()

    danger = {"fire_id": "lilac_demo_2017", "danger_zone_6hr": SQUARE}
    at_risk = farm_matcher.get_at_risk_farms(danger, farms)

    ids = {f["farm_id"] for f in at_risk}
    # SQUARE covers Valley Center but not Fallbrook (33.37) or Ramona (33.05)
    assert ids == {"valley_center_ranch"}

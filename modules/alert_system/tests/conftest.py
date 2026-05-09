"""Pytest fixtures for alert_system tests.

Centralizes the path tweak so test files don't have to add the modules dir to
``sys.path`` themselves, and provides an ``isolated_db`` fixture that points
``alert_system.config.DB_PATH`` at a per-test temp file. This keeps tests
hermetic — no shared state between runs, and the developer's real
``farms.db`` (if any) is never read or written.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "modules"))


@pytest.fixture()
def isolated_db(tmp_path, monkeypatch):
    """Re-point alert_system to a fresh SQLite file inside ``tmp_path``."""
    from alert_system import config, farm_matcher, seed_farms

    db_file = tmp_path / "farms_test.db"
    monkeypatch.setattr(config, "DB_PATH", db_file)
    monkeypatch.setattr(farm_matcher, "DB_PATH", db_file)
    monkeypatch.setattr(seed_farms, "DB_PATH", db_file)
    return db_file


@pytest.fixture()
def isolated_outbox(tmp_path, monkeypatch):
    """Re-point demo SMS outbox + JSONL log to ``tmp_path`` so writes are clean."""
    from alert_system import config, sms_sender

    outbox = tmp_path / "outbox"
    log_path = tmp_path / "alerts.log"
    monkeypatch.setattr(config, "OUTBOX_DIR", outbox)
    monkeypatch.setattr(config, "LOG_PATH", log_path)
    monkeypatch.setattr(sms_sender, "OUTBOX_DIR", outbox)
    monkeypatch.setattr(sms_sender, "LOG_PATH", log_path)
    return outbox, log_path

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "modules"))

from alert_system.farm_matcher import get_farm_by_phone, unsubscribe
from alert_system.plan_generator import generate_text_plan


def main() -> int:
    parser = argparse.ArgumentParser(description="Simulate inbound SMS (PLAN/STOP)")
    parser.add_argument("phone")
    parser.add_argument("body")
    args = parser.parse_args()

    body = args.body.strip().upper()
    farm = get_farm_by_phone(args.phone)
    if body == "STOP":
        unsubscribe(args.phone)
        print("Unsubscribed")
        return 0

    if body == "PLAN":
        if not farm:
            print("No farm registered for this phone.")
            return 1
        fire_data = json.loads((ROOT / "data" / "fire_data.json").read_text())
        facilities_data = json.loads((ROOT / "data" / "facilities.json").read_text())
        segments = generate_text_plan(farm, fire_data, facilities_data)
        for i, s in enumerate(segments, 1):
            print(f"--- Segment {i} ---")
            print(s)
        return 0

    print("Unknown command. Use PLAN or STOP.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

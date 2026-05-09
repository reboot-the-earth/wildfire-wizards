"""
NoHerdLeft API Server — Person 5 integration layer.

Wraps Person 1 (fire), Person 2 (routing), and Person 3 (facilities)
into a simple Flask API consumed by the React frontend.

Usage:
    pip install flask flask-cors
    python api.py
"""

import json
import os
import sys
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS

ROOT = os.path.dirname(os.path.abspath(__file__))
MODULES = os.path.join(ROOT, "modules")
DATA = os.path.join(ROOT, "data")

sys.path.insert(0, MODULES)
sys.path.insert(0, os.path.join(MODULES, "facilities"))

from fire_detection import get_fire_data
from routing import find_safe_routes

try:
    from facilities.facility_matcher import get_evacuation_match, load_facilities as load_p3_facilities
except ImportError:
    from facility_matcher import get_evacuation_match, load_facilities as load_p3_facilities

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://127.0.0.1:3000"])


def _load_config():
    with open(os.path.join(ROOT, "config.json")) as f:
        return json.load(f)


def _load_fire_data_file():
    with open(os.path.join(DATA, "fire_data.json")) as f:
        return json.load(f)


def _load_facilities_file():
    with open(os.path.join(DATA, "facilities.json")) as f:
        return json.load(f)


DEMO_FARMS = [
    {
        "farm_id": "valley_center_ranch",
        "name": "Valley Center Ranch",
        "lat": 33.22,
        "lon": -117.03,
        "animals": [
            {"species": "cattle", "count": 150},
            {"species": "horses", "count": 8},
        ],
        "trailer_capacity": {"cattle": 20, "horses": 4},
    },
    {
        "farm_id": "fallbrook_stables",
        "name": "Fallbrook Equestrian Center",
        "lat": 33.37,
        "lon": -117.25,
        "animals": [
            {"species": "horses", "count": 24},
        ],
        "trailer_capacity": {"horses": 4},
    },
    {
        "farm_id": "ramona_goat_farm",
        "name": "Ramona Heritage Goat Farm",
        "lat": 33.05,
        "lon": -116.87,
        "animals": [
            {"species": "goats", "count": 85},
            {"species": "poultry", "count": 200},
        ],
        "trailer_capacity": {"goats": 30, "poultry": 100},
    },
]


@app.route("/api/fire", methods=["GET"])
def fire_endpoint():
    """
    Get fire spread data from Person 1's module.

    Query params: ?live=true to call get_fire_data() directly,
    otherwise serves cached data/fire_data.json.
    """
    use_live = request.args.get("live", "false").lower() == "true"

    if use_live:
        try:
            config = _load_config()
            farm_locations = [
                {"farm_id": f["farm_id"], "lat": f["lat"], "lon": f["lon"]}
                for f in DEMO_FARMS
            ]
            result = get_fire_data(
                bounding_box=config["bounding_box"],
                farm_locations=farm_locations,
            )
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": str(e), "fallback": True, **_load_fire_data_file()}), 200

    return jsonify(_load_fire_data_file())


@app.route("/api/facilities", methods=["GET"])
def facilities_endpoint():
    """
    Get all facilities from Person 3's database.
    Returns both the data/ version and Person 3's detailed version.
    """
    try:
        p3_facilities = load_p3_facilities()
        return jsonify({"facilities": p3_facilities, "source": "person3"})
    except Exception:
        fac_data = _load_facilities_file()
        return jsonify({**fac_data, "source": "data_dir"})


@app.route("/api/routes", methods=["POST"])
def routes_endpoint():
    """
    Get safe routes from Person 2's module.

    POST body: {
        "farm_lat": 33.22,
        "farm_lon": -117.03
    }
    """
    body = request.get_json(force=True)
    farm_lat = body.get("farm_lat", 33.22)
    farm_lon = body.get("farm_lon", -117.03)

    fire_data = _load_fire_data_file()
    fac_data = _load_facilities_file()

    try:
        result = find_safe_routes(
            farm_coords=(farm_lat, farm_lon),
            facility_list=fac_data["facilities"],
            fire_polygons=fire_data,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "routes_to_facilities": []}), 200


@app.route("/api/plan", methods=["POST"])
def plan_endpoint():
    """
    Get evacuation plan from Person 3's facility matcher.

    POST body: {
        "farm_id": "valley_center_ranch",
        "animals": [{"species": "cattle", "count": 150}, ...],
        "trailer_capacity": {"cattle": 20, "horses": 4},
        "route_time_minutes": 38,
        "fire_arrival_hours": 3.7
    }
    """
    body = request.get_json(force=True)
    farm_id = body.get("farm_id", "unknown")
    animals = body.get("animals", [])
    trailer_cap = body.get("trailer_capacity", {"cattle": 20, "horses": 4})
    route_time = body.get("route_time_minutes", 38)
    fire_hours = body.get("fire_arrival_hours")

    fire_data = _load_fire_data_file()
    danger_zone = fire_data.get("projected_perimeters", {}).get("6hr")

    try:
        result = get_evacuation_match(
            farm_id=farm_id,
            animal_inventory=animals,
            trailer_capacity=trailer_cap,
            fire_danger_zone=danger_zone,
            route_time_minutes=route_time,
            fire_arrival_hours=fire_hours,
            make_reservations=False,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 200


@app.route("/api/health", methods=["GET"])
def health():
    """Health check showing which modules loaded."""
    modules = {
        "fire_detection": "get_fire_data" in dir(sys.modules.get("fire_detection", {})),
        "routing": "find_safe_routes" in dir(sys.modules.get("routing", {})),
        "facilities": True,
    }
    return jsonify({"status": "ok", "modules": modules})


if __name__ == "__main__":
    print("\n  NoHerdLeft API Server")
    print("  http://localhost:5001/api/health\n")
    app.run(host="0.0.0.0", port=5001, debug=True)

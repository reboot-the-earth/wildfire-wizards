const FIRE_ORIGIN = [-117.18, 33.24];

function generateEllipse(center, semiMajorKm, semiMinorKm, angleDeg, points = 48) {
  const coords = [];
  const [cx, cy] = center;
  const angleRad = (angleDeg * Math.PI) / 180;
  const kmPerDegLon = 111.32 * Math.cos((cy * Math.PI) / 180);
  const kmPerDegLat = 110.574;

  for (let i = 0; i <= points; i++) {
    const t = (2 * Math.PI * i) / points;
    const x = semiMajorKm * Math.cos(t);
    const y = semiMinorKm * Math.sin(t);

    const rx = x * Math.cos(angleRad) - y * Math.sin(angleRad);
    const ry = x * Math.sin(angleRad) + y * Math.cos(angleRad);

    coords.push([cx + rx / kmPerDegLon, cy + ry / kmPerDegLat]);
  }
  return coords;
}

export const mockFireData = {
  timestamp: new Date().toISOString(),
  fire_id: "lilac_demo_2017",
  active_hotspots: [
    { lat: 33.24, lon: -117.18, confidence: 95, brightness: 367 },
    { lat: 33.245, lon: -117.175, confidence: 88, brightness: 345 },
    { lat: 33.235, lon: -117.185, confidence: 92, brightness: 358 },
    { lat: 33.248, lon: -117.17, confidence: 79, brightness: 320 },
    { lat: 33.238, lon: -117.19, confidence: 85, brightness: 340 },
  ],
  current_perimeter: {
    type: "Polygon",
    coordinates: [generateEllipse(FIRE_ORIGIN, 1.8, 1.0, 235)]
  },
  projected_perimeters: [
    {
      hours: 1,
      geometry: {
        type: "Polygon",
        coordinates: [generateEllipse([-117.195, 33.232], 3.5, 1.8, 235)]
      }
    },
    {
      hours: 2,
      geometry: {
        type: "Polygon",
        coordinates: [generateEllipse([-117.21, 33.225], 5.5, 2.8, 235)]
      }
    },
    {
      hours: 4,
      geometry: {
        type: "Polygon",
        coordinates: [generateEllipse([-117.24, 33.21], 9.0, 4.5, 235)]
      }
    },
    {
      hours: 6,
      geometry: {
        type: "Polygon",
        coordinates: [generateEllipse([-117.27, 33.195], 13.0, 6.0, 235)]
      }
    }
  ],
  wind: {
    speed_mph: 35,
    direction_deg: 55,
    gusts_mph: 50
  },
  weather: {
    humidity_pct: 12,
    temp_f: 89
  },
  farms_at_risk: [
    {
      farm_id: "valley_center_ranch",
      name: "Valley Center Ranch",
      lat: 33.22,
      lon: -117.03,
      estimated_time_to_fire_hours: 3.7,
      risk_level: "high",
      alert_message: "Fire projected to reach your area in ~3.5 hours. Evacuate livestock now."
    },
    {
      farm_id: "fallbrook_stables",
      name: "Fallbrook Equestrian Center",
      lat: 33.37,
      lon: -117.25,
      estimated_time_to_fire_hours: 2.1,
      risk_level: "critical",
      alert_message: "Fire projected to reach your area in ~2 hours. Begin immediate evacuation."
    },
    {
      farm_id: "ramona_goat_farm",
      name: "Ramona Heritage Goat Farm",
      lat: 33.05,
      lon: -116.87,
      estimated_time_to_fire_hours: 5.8,
      risk_level: "moderate",
      alert_message: "Fire projected to reach your area in ~6 hours. Prepare for evacuation."
    }
  ],
  danger_zone: {
    type: "Polygon",
    coordinates: [generateEllipse([-117.24, 33.21], 15.0, 7.5, 235)]
  }
};

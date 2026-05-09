export const mockRoutes = {
  farm: { id: "valley_center_ranch", lat: 33.20, lon: -117.26 },
  routes_to_facilities: [
    {
      rank: 1,
      facility_id: "del_mar_fairgrounds",
      facility_name: "Del Mar Fairgrounds",
      total_time_min: 28,
      total_distance_km: 26,
      safety_score: 95,
      min_fire_distance_km: 12.4,
      trailer_friendly: true,
      status: "safe",
      route_geometry: {
        type: "LineString",
        coordinates: [
          [-117.26, 33.20],
          [-117.26, 33.17],
          [-117.265, 33.14],
          [-117.268, 33.11],
          [-117.27, 33.08],
          [-117.27, 33.05],
          [-117.268, 33.02],
          [-117.267, 33.00],
          [-117.268, 32.98],
          [-117.268, 32.974],
        ]
      },
      segments: [
        { road: "Mission Rd South", status: "safe", time_min: 8 },
        { road: "I-15 South", status: "safe", time_min: 12 },
        { road: "Via de la Valle", status: "safe", time_min: 5 },
        { road: "Jimmy Durante Blvd", status: "safe", time_min: 3 }
      ],
      warnings: []
    },
    {
      rank: 2,
      facility_id: "san_pasqual_academy",
      facility_name: "San Pasqual Valley Farm",
      total_time_min: 35,
      total_distance_km: 28,
      safety_score: 82,
      min_fire_distance_km: 5.2,
      trailer_friendly: true,
      status: "safe",
      route_geometry: {
        type: "LineString",
        coordinates: [
          [-117.26, 33.20],
          [-117.24, 33.18],
          [-117.22, 33.16],
          [-117.19, 33.14],
          [-117.16, 33.12],
          [-117.12, 33.11],
          [-117.08, 33.10],
          [-117.054, 33.098],
        ]
      },
      segments: [
        { road: "Old Highway 395 South", status: "safe", time_min: 12 },
        { road: "Bear Valley Pkwy", status: "at_risk_in_4hr", time_min: 23 }
      ],
      warnings: ["Passes within 5.2km of projected 4hr fire line"]
    },
    {
      rank: 3,
      facility_id: "ramona_rodeo",
      facility_name: "Ramona Rodeo Grounds",
      total_time_min: 48,
      total_distance_km: 42,
      safety_score: 74,
      min_fire_distance_km: 4.1,
      trailer_friendly: true,
      status: "safe",
      route_geometry: {
        type: "LineString",
        coordinates: [
          [-117.26, 33.20],
          [-117.24, 33.18],
          [-117.21, 33.16],
          [-117.18, 33.14],
          [-117.14, 33.12],
          [-117.10, 33.10],
          [-117.05, 33.08],
          [-117.00, 33.06],
          [-116.95, 33.05],
          [-116.90, 33.045],
          [-116.868, 33.042],
        ]
      },
      segments: [
        { road: "Old Highway 395 South", status: "safe", time_min: 12 },
        { road: "CA-78 East", status: "at_risk_in_4hr", time_min: 22 },
        { road: "Ramona St", status: "safe", time_min: 14 }
      ],
      warnings: ["Route passes near 4hr fire projection — leave early"]
    },
    {
      rank: null,
      facility_id: "bonsall_community",
      facility_name: "Bonsall Community Grounds",
      status: "no_safe_route",
      reason: "Access roads intersect projected 2hr fire perimeter — too close to fire"
    }
  ],
  timestamp: new Date().toISOString(),
};

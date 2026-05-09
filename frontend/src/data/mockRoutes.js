export const mockRoutes = {
  farm: { id: "valley_center_ranch", lat: 33.22, lon: -117.03 },
  routes_to_facilities: [
    {
      rank: 1,
      facility_id: "ramona_rodeo",
      facility_name: "Ramona Rodeo Grounds",
      total_time_min: 38,
      total_distance_km: 24,
      safety_score: 92,
      min_fire_distance_km: 6.1,
      trailer_friendly: true,
      status: "safe",
      route_geometry: {
        type: "LineString",
        coordinates: [
          [-117.03, 33.22],
          [-117.025, 33.215],
          [-117.015, 33.195],
          [-117.005, 33.175],
          [-116.985, 33.145],
          [-116.965, 33.115],
          [-116.945, 33.095],
          [-116.925, 33.075],
          [-116.905, 33.06],
          [-116.885, 33.05],
          [-116.868, 33.042],
        ]
      },
      segments: [
        { road: "Valley Center Rd", status: "safe", time_min: 12 },
        { road: "CA-78 East", status: "safe", time_min: 15 },
        { road: "Ramona St", status: "safe", time_min: 11 }
      ],
      warnings: []
    },
    {
      rank: 2,
      facility_id: "del_mar_fairgrounds",
      facility_name: "Del Mar Fairgrounds",
      total_time_min: 52,
      total_distance_km: 42,
      safety_score: 78,
      min_fire_distance_km: 3.8,
      trailer_friendly: true,
      status: "safe",
      route_geometry: {
        type: "LineString",
        coordinates: [
          [-117.03, 33.22],
          [-117.045, 33.21],
          [-117.06, 33.195],
          [-117.08, 33.175],
          [-117.10, 33.155],
          [-117.12, 33.135],
          [-117.14, 33.11],
          [-117.16, 33.085],
          [-117.18, 33.06],
          [-117.20, 33.04],
          [-117.22, 33.015],
          [-117.24, 32.995],
          [-117.258, 32.98],
          [-117.268, 32.974],
        ]
      },
      segments: [
        { road: "Valley Center Rd South", status: "safe", time_min: 8 },
        { road: "I-15 South", status: "at_risk_in_4hr", time_min: 22 },
        { road: "Via de la Valle", status: "safe", time_min: 12 },
        { road: "Jimmy Durante Blvd", status: "safe", time_min: 10 }
      ],
      warnings: ["Passes within 3.8km of projected 4hr fire line on I-15"]
    },
    {
      rank: null,
      facility_id: "bonsall_community",
      facility_name: "Bonsall Community Grounds",
      status: "no_safe_route",
      reason: "Access roads intersect projected 2hr fire perimeter"
    }
  ],
  timestamp: new Date().toISOString(),
};

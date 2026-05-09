const API_BASE = 'http://localhost:5001/api';

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: await res.json(), ok: true };
  } catch (err) {
    console.warn(`[API] ${url} failed:`, err.message);
    return { data: null, ok: false, error: err.message };
  }
}

/**
 * Normalize fire data from either data/fire_data.json (dict-keyed perimeters)
 * or Person 1's get_fire_data() (array-based perimeters) into the UI format.
 */
function normalizeFireData(raw) {
  const perimeters = raw.projected_perimeters;
  let normalizedPerimeters;

  if (Array.isArray(perimeters)) {
    normalizedPerimeters = perimeters;
  } else if (perimeters && typeof perimeters === 'object') {
    normalizedPerimeters = Object.entries(perimeters).map(([key, geometry]) => ({
      hours: parseInt(key),
      geometry,
    })).sort((a, b) => a.hours - b.hours);
  } else {
    normalizedPerimeters = [];
  }

  const farms = (raw.farms_at_risk || []).map((f) => ({
    farm_id: f.farm_id,
    name: f.name || f.farm_id,
    lat: f.lat,
    lon: f.lon,
    estimated_time_to_fire_hours: f.estimated_time_to_fire_hours ?? f.hours_to_fire ?? null,
    risk_level: f.risk_level || 'moderate',
    alert_message: f.alert_message ||
      `Fire projected to reach your area in ~${f.hours_to_fire || f.estimated_time_to_fire_hours || '?'} hours.`,
  }));

  return {
    timestamp: raw.timestamp || raw.detected_at || new Date().toISOString(),
    fire_id: raw.fire_id || 'unknown',
    active_hotspots: raw.active_hotspots || [],
    current_perimeter: raw.current_perimeter,
    projected_perimeters: normalizedPerimeters,
    wind: raw.wind || {},
    weather: raw.weather || {},
    farms_at_risk: farms,
    danger_zone: raw.danger_zone || null,
  };
}

/**
 * Normalize facilities from either data/facilities.json (facility_id + capacity/occupancy)
 * or Person 3's database (id + accepts + capacity) into the UI format.
 */
function normalizeFacilities(raw) {
  const list = raw.facilities || raw;
  if (!Array.isArray(list)) return [];

  return list.map((f) => {
    const id = f.id || f.facility_id;

    let capacityTotal, capacityAvailable, accepts;

    if (f.accepts) {
      accepts = f.accepts;
      capacityTotal = Object.values(f.capacity || {}).reduce((a, b) => a + b, 0);
      const buffered = Math.floor(capacityTotal * 0.8);
      capacityAvailable = buffered;
    } else if (f.capacity && f.current_occupancy) {
      const capVals = Object.values(f.capacity);
      const occVals = Object.values(f.current_occupancy);
      capacityTotal = capVals.reduce((a, b) => a + b, 0);
      const totalOccupancy = occVals.reduce((a, b) => a + b, 0);
      capacityAvailable = capacityTotal - totalOccupancy;
      accepts = Object.keys(f.capacity).filter((k) => f.capacity[k] > 0);
    } else {
      capacityTotal = 0;
      capacityAvailable = 0;
      accepts = [];
    }

    return {
      id,
      name: f.name,
      lat: f.lat,
      lon: f.lon,
      accepts,
      capacity_total: capacityTotal,
      capacity_available: capacityAvailable,
      capacity_detail: f.capacity || {},
      infrastructure: f.infrastructure || f.amenities || [],
      access_road: f.access_road || (f.access_roads || []).join(' / '),
      trailer_access: f.trailer_access !== false,
      contact: f.contact || '',
      notes: f.notes || '',
      has_own_feed: f.has_own_feed || false,
      volunteer_run: f.volunteer_run || false,
      verified: f.verified !== false,
      county: f.county || 'San Diego',
    };
  });
}

/**
 * Normalize route output from Person 2. Routes already match our format closely.
 */
function normalizeRoutes(raw) {
  if (!raw || !raw.routes_to_facilities) return null;
  return raw;
}

/**
 * Normalize evacuation plan from Person 3's get_evacuation_match() into UI format.
 */
function normalizeEvacPlan(raw) {
  if (!raw) return null;

  const trips = (raw.evacuation_trips || []).map((t, i) => ({
    order: i + 1,
    trip: t.trip || i + 1,
    animals: t.animals || `${t.count || ''} ${t.species || ''}`,
    count: t.count || 0,
    species: t.species || 'cattle',
    reason: t.reason || '',
    load_time_est_min: t.load_time_min || t.round_trip_minutes || 30,
    handling: t.handling || t.special_handling || '',
    status: 'pending',
  }));

  const summary = raw.trip_summary || {};

  return {
    priority_plan: trips,
    time_estimate: {
      loading_time_total_min: summary.total_loading_min || 0,
      drive_time_per_trip_min: summary.avg_round_trip_min || 38,
      total_trips: trips.length,
      total_evacuation_hours: raw.total_evacuation_hours || summary.total_hours || 0,
    },
    triage_warning: (raw.warnings || []).find((w) =>
      w.includes('CRITICAL') || w.includes('exceeds') || w.includes('not enough')
    ) || null,
    matched_facilities: raw.matched_facilities || [],
    warnings: raw.warnings || [],
  };
}


export async function fetchFireData(live = false) {
  const { data, ok } = await fetchJSON(`${API_BASE}/fire?live=${live}`);
  if (ok && data) return normalizeFireData(data);
  return null;
}

export async function fetchFacilities() {
  const { data, ok } = await fetchJSON(`${API_BASE}/facilities`);
  if (ok && data) return normalizeFacilities(data);
  return null;
}

export async function fetchRoutes(farmLat, farmLon) {
  const { data, ok } = await fetchJSON(`${API_BASE}/routes`, {
    method: 'POST',
    body: JSON.stringify({ farm_lat: farmLat, farm_lon: farmLon }),
  });
  if (ok && data) return normalizeRoutes(data);
  return null;
}

export async function fetchEvacuationPlan({
  farmId,
  animals,
  trailerCapacity,
  routeTimeMinutes = 38,
  fireArrivalHours = null,
}) {
  const { data, ok } = await fetchJSON(`${API_BASE}/plan`, {
    method: 'POST',
    body: JSON.stringify({
      farm_id: farmId,
      animals,
      trailer_capacity: trailerCapacity,
      route_time_minutes: routeTimeMinutes,
      fire_arrival_hours: fireArrivalHours,
    }),
  });
  if (ok && data) return normalizeEvacPlan(data);
  return null;
}

export async function checkHealth() {
  const { data, ok } = await fetchJSON(`${API_BASE}/health`);
  return ok && data?.status === 'ok';
}

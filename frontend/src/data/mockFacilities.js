export const mockFacilities = [
  {
    id: "del_mar_fairgrounds",
    name: "Del Mar Fairgrounds",
    lat: 32.974,
    lon: -117.268,
    accepts: ["horses", "mules"],
    capacity_total: 1500,
    capacity_available: 1380,
    infrastructure: ["stalls", "pens", "water", "feed_available", "vet_on_call"],
    access_road: "Via de la Valle / Jimmy Durante Blvd",
    trailer_access: true,
    contact: "858-755-1161",
    notes: "Primary horse evacuation site for SD County",
  },
  {
    id: "ramona_rodeo",
    name: "Ramona Rodeo Grounds",
    lat: 33.042,
    lon: -116.868,
    accepts: ["cattle", "horses", "goats", "sheep"],
    capacity_total: 300,
    capacity_available: 220,
    infrastructure: ["arena", "pens", "water"],
    access_road: "Ramona St / Main St",
    trailer_access: true,
    contact: "760-789-1484",
    notes: "Multi-species capable",
  },
  {
    id: "bonsall_community",
    name: "Bonsall Community Grounds",
    lat: 33.289,
    lon: -117.225,
    accepts: ["cattle", "goats", "sheep", "horses"],
    capacity_total: 200,
    capacity_available: 45,
    infrastructure: ["pens", "water"],
    access_road: "Mission Rd",
    trailer_access: true,
    contact: "760-631-5200",
    notes: "Limited large animal infrastructure",
  },
  {
    id: "el_capitan_stables",
    name: "El Capitan Equestrian",
    lat: 32.879,
    lon: -116.820,
    accepts: ["horses"],
    capacity_total: 80,
    capacity_available: 62,
    infrastructure: ["stalls", "paddocks", "water", "feed_available"],
    access_road: "Wildcat Canyon Rd",
    trailer_access: true,
    contact: "619-445-3334",
    notes: "Horse-only facility with vet access",
  },
  {
    id: "lakeside_rodeo",
    name: "Lakeside Rodeo Grounds",
    lat: 32.856,
    lon: -116.916,
    accepts: ["cattle", "horses", "goats", "sheep"],
    capacity_total: 400,
    capacity_available: 340,
    infrastructure: ["arena", "pens", "chutes", "water"],
    access_road: "Mapleview St",
    trailer_access: true,
    contact: "619-561-4331",
    notes: "Full rodeo infrastructure",
  },
  {
    id: "san_pasqual_academy",
    name: "San Pasqual Valley Farm",
    lat: 33.098,
    lon: -117.054,
    accepts: ["cattle", "goats", "sheep", "poultry"],
    capacity_total: 250,
    capacity_available: 185,
    infrastructure: ["barns", "pens", "water", "feed_available"],
    access_road: "Bear Valley Pkwy",
    trailer_access: true,
    contact: "760-735-3500",
    notes: "Working farm with good infrastructure",
  },
  {
    id: "riverside_fairgrounds",
    name: "Riverside County Fairgrounds",
    lat: 33.716,
    lon: -116.217,
    accepts: ["horses", "cattle", "goats", "sheep"],
    capacity_total: 800,
    capacity_available: 780,
    infrastructure: ["stalls", "barns", "pens", "water", "feed_available", "vet_on_call"],
    access_road: "Arabia St, Indio",
    trailer_access: true,
    contact: "760-863-8247",
    notes: "Overflow facility - neighboring county",
  },
];

export function getFacilityStatus(facility) {
  if (facility.capacity_available === 0) return { color: '#ef4444', label: 'Full', level: 'full' };
  const pct = facility.capacity_available / facility.capacity_total;
  if (pct <= 0.2) return { color: '#f97316', label: 'Almost Full', level: 'critical' };
  if (pct <= 0.5) return { color: '#eab308', label: 'Filling Up', level: 'filling' };
  return { color: '#22c55e', label: 'Available', level: 'open' };
}

/**
 * Fire-proximity risk for a destination.
 * Based on approximate distance from fire origin at (33.24, -117.18).
 */
const FIRE_ORIGIN = { lat: 33.24, lon: -117.18 };

function distKm(lat1, lon1, lat2, lon2) {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180, dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function getDestinationRisk(facility) {
  const d = distKm(facility.lat, facility.lon, FIRE_ORIGIN.lat, FIRE_ORIGIN.lon);
  if (d < 12) return { risk: 'high', color: '#dc2626', label: 'High Risk Zone', icon: '⚠' };
  if (d < 25) return { risk: 'moderate', color: '#ea580c', label: 'Moderate Risk', icon: '◉' };
  return { risk: 'safe', color: '#16a34a', label: 'Safe Zone', icon: '✓' };
}

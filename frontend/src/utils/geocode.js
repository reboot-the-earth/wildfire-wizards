/**
 * Lightweight geocoding helpers. Two-tier strategy:
 *
 *   1. Local lookup of San Diego County ZIPs that the demo cares about
 *      (Lilac Fire 2017 evacuation footprint + adjacent zones). Lat/lon are
 *      ZIP centroids and are good enough to drop a farm pin on the map.
 *
 *   2. Nominatim (OpenStreetMap) fallback for anything outside the table.
 *      Free, no API key. We respect their fair-use policy by sending a
 *      descriptive User-Agent header and limiting to a single result.
 *
 * Everything runs client-side — no backend changes needed.
 */

// San Diego County agricultural / wildfire-prone ZIPs.
// Source: USPS ZIP centroids (rounded to 4 decimals = ~10m precision).
const SD_ZIP_LOOKUP = {
  // North County coastal
  '92007': { lat: 33.0241, lon: -117.2731, place: 'Cardiff by the Sea' },
  '92008': { lat: 33.1559, lon: -117.3506, place: 'Carlsbad' },
  '92009': { lat: 33.0987, lon: -117.2625, place: 'Carlsbad' },
  '92010': { lat: 33.1581, lon: -117.2938, place: 'Carlsbad' },
  '92011': { lat: 33.1166, lon: -117.3115, place: 'Carlsbad' },
  '92024': { lat: 33.0444, lon: -117.2657, place: 'Encinitas' },
  '92054': { lat: 33.2076, lon: -117.3597, place: 'Oceanside' },
  '92056': { lat: 33.2044, lon: -117.2925, place: 'Oceanside' },
  '92057': { lat: 33.2625, lon: -117.3025, place: 'Oceanside' },
  '92058': { lat: 33.2667, lon: -117.3781, place: 'Oceanside' },
  '92067': { lat: 33.0231, lon: -117.2068, place: 'Rancho Santa Fe' },
  '92075': { lat: 32.9967, lon: -117.2640, place: 'Solana Beach' },
  '92078': { lat: 33.1331, lon: -117.1947, place: 'San Marcos' },
  '92083': { lat: 33.1959, lon: -117.2425, place: 'Vista' },
  '92084': { lat: 33.2200, lon: -117.2200, place: 'Vista' },
  // Lilac Fire core evacuation zone
  '92003': { lat: 33.2941, lon: -117.2306, place: 'Bonsall' },
  '92028': { lat: 33.3878, lon: -117.2511, place: 'Fallbrook' },
  '92059': { lat: 33.4231, lon: -117.0617, place: 'Pala' },
  '92060': { lat: 33.3506, lon: -116.9089, place: 'Palomar Mountain' },
  '92061': { lat: 33.3094, lon: -116.9706, place: 'Pauma Valley' },
  '92082': { lat: 33.2381, lon: -117.0117, place: 'Valley Center' },
  '92086': { lat: 33.2933, lon: -116.7394, place: 'Warner Springs' },
  // Inland / east county ranching corridor
  '92004': { lat: 33.2625, lon: -116.3756, place: 'Borrego Springs' },
  '92019': { lat: 32.7906, lon: -116.9239, place: 'El Cajon' },
  '92020': { lat: 32.7945, lon: -116.9931, place: 'El Cajon' },
  '92021': { lat: 32.8467, lon: -116.9264, place: 'El Cajon' },
  '92025': { lat: 33.1192, lon: -117.0697, place: 'Escondido' },
  '92026': { lat: 33.1900, lon: -117.0792, place: 'Escondido' },
  '92027': { lat: 33.1411, lon: -117.0128, place: 'Escondido' },
  '92029': { lat: 33.0922, lon: -117.1097, place: 'Escondido' },
  '92036': { lat: 33.0758, lon: -116.5950, place: 'Julian' },
  '92040': { lat: 32.8606, lon: -116.8911, place: 'Lakeside' },
  '92065': { lat: 33.0428, lon: -116.8642, place: 'Ramona' },
  '92066': { lat: 33.1583, lon: -116.6342, place: 'Ranchita' },
  '92070': { lat: 33.1175, lon: -116.5283, place: 'Santa Ysabel' },
  '92071': { lat: 32.8400, lon: -117.0306, place: 'Santee' },
  // Coastal / metro
  '92014': { lat: 32.9444, lon: -117.2453, place: 'Del Mar' },
  '92064': { lat: 32.9628, lon: -117.0353, place: 'Poway' },
  '92127': { lat: 33.0214, lon: -117.0853, place: 'Rancho Bernardo' },
  '92128': { lat: 33.0083, lon: -117.0378, place: 'Rancho Bernardo' },
  '92129': { lat: 32.9711, lon: -117.1208, place: 'Rancho Peñasquitos' },
  '92130': { lat: 32.9614, lon: -117.2125, place: 'Carmel Valley' },
  '92131': { lat: 32.9197, lon: -117.0908, place: 'Scripps Ranch' },
};

/**
 * Look up a ZIP locally. Returns null if it's not in the table — caller can
 * decide to fall back to the network geocoder.
 */
export function lookupZipLocal(zip) {
  if (!zip) return null;
  const normalized = String(zip).trim().slice(0, 5);
  const hit = SD_ZIP_LOOKUP[normalized];
  if (!hit) return null;
  return { ...hit, zip: normalized, source: 'local' };
}

/**
 * Free-form geocode via Nominatim. Used as a last-ditch fallback for ZIPs or
 * full addresses outside our local table. Network call — caller should handle
 * AbortError and timeouts gracefully.
 *
 * Honors Nominatim's fair-use policy: descriptive UA + max 1 request per call.
 */
export async function geocodeNominatim(query, { signal, countryCode = 'us' } = {}) {
  if (!query) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', countryCode);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    signal,
  });
  if (!res.ok) throw new Error(`geocode HTTP ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const first = arr[0];
  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    place: first.display_name,
    source: 'nominatim',
  };
}

/**
 * Resolve a ZIP code to coordinates. Tries local table first, then falls back
 * to Nominatim. Returns null if both miss or the ZIP isn't well-formed.
 */
export async function resolveZip(zip, opts) {
  const local = lookupZipLocal(zip);
  if (local) return local;

  const trimmed = String(zip || '').trim();
  if (!/^\d{5}$/.test(trimmed)) return null;
  try {
    const remote = await geocodeNominatim(trimmed, opts);
    return remote ? { ...remote, zip: trimmed } : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a free-form address to coordinates via Nominatim. No local fallback.
 */
export async function resolveAddress(address, opts) {
  if (!address || !address.trim()) return null;
  try {
    return await geocodeNominatim(address, opts);
  } catch {
    return null;
  }
}

/**
 * Parse `lat, lon` text input. Accepts a few common formats:
 *   "33.22, -117.03", "33.22 -117.03", "33.22N 117.03W"
 * Returns null if not parseable.
 */
export function parseCoords(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[NSEW]/gi, ' ').trim();
  const parts = cleaned.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon, source: 'manual' };
}

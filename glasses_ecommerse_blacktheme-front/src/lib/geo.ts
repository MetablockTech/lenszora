// Store location helpers. Stores keep GeoJSON coordinates as [lng, lat]; a store saved without a
// location ends up as [0, 0], which must never be treated as a real place.

export type LatLng = { lat: number; lng: number };

// [lng, lat] from the API → a usable point, or null when missing / [0, 0] / out of range
export function toLatLng(coordinates?: number[] | null): LatLng | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// Straight-line distance in km (haversine)
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// "26.95, 75.75", or a Google Maps link (…/@26.95,75.75,17z, ?q=26.95,75.75, …!3d26.95!4d75.75)
export function parseLatLng(text: string): LatLng | null {
  const t = text.trim();
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // exact place pin in a Google Maps URL
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // map centre in a Google Maps URL
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const point = toLatLng([Number(m[2]), Number(m[1])]);
      if (point) return point;
    }
  }
  return null;
}

// Address → coordinates. Google first (needs billing on the key); falls back to OpenStreetMap, which needs no key.
export async function geocodeAddress(parts: { addressLine?: string; city?: string; state?: string; pincode?: string }): Promise<(LatLng & { source: string }) | null> {
  const full = [parts.addressLine, parts.city, parts.state, parts.pincode].filter(Boolean).join(', ');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(full)}&key=${apiKey}`);
      const data = await res.json();
      if (data.status === 'OK') {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng, source: 'Google' };
      }
    } catch {
      // fall through to OpenStreetMap
    }
  }
  // OpenStreetMap: try the full address, then just the area (city + pincode)
  const queries = [full, [parts.city, parts.state, parts.pincode].filter(Boolean).join(', ')];
  for (const q of queries) {
    if (!q) continue;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return { lat: Number(data[0].lat), lng: Number(data[0].lon), source: q === full ? 'OpenStreetMap' : 'OpenStreetMap (area only, please check)' };
      }
    } catch {
      // try the next query
    }
  }
  return null;
}

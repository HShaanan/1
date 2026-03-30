/**
 * Geocodes an address to lat/lng using Google Maps Geocoding API.
 * Previously a Base44 serverless function — now calls the API directly.
 * Requires VITE_GOOGLE_MAPS_KEY in your .env.local file.
 */
export async function geocodeAddress({ address }) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) {
    console.warn('[geocodeAddress] Missing VITE_GOOGLE_MAPS_KEY');
    return { data: { lat: null, lng: null } };
  }

  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${key}`
    );
    const json = await res.json();
    if (json.status === 'OK' && json.results?.[0]) {
      const { lat, lng } = json.results[0].geometry.location;
      return { data: { lat, lng, formatted_address: json.results[0].formatted_address } };
    }
    return { data: { lat: null, lng: null } };
  } catch (err) {
    console.error('[geocodeAddress] Error:', err);
    return { data: { lat: null, lng: null } };
  }
}

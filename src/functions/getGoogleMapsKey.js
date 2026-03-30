/**
 * Returns the Google Maps API key.
 * Previously a Base44 serverless function — now reads from env variable.
 * Add VITE_GOOGLE_MAPS_KEY to your .env.local file.
 */
export async function getGoogleMapsKey(_params) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  return { data: key };
}

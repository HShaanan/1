const API_KEY = Deno.env.get("GOOGLE_MAPS_APIKEY");

Deno.serve(async (req) => {
    // This function can be public as it's protected by API key restrictions.
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!API_KEY) {
        console.error("geocodeAddress Error: GOOGLE_MAPS_APIKEY is not set on the server.");
        return new Response(JSON.stringify({ success: false, error: "Server configuration error." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { address } = await req.json();

        if (!address || typeof address !== 'string' || address.trim() === '') {
            return new Response(JSON.stringify({ success: false, error: "Address parameter is required." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const params = new URLSearchParams({
            address: address,
            key: API_KEY,
            language: 'he'
        });

        const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
             throw new Error(`Google Maps API responded with status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: `Geocoding failed for address. Status: ${data.status}. Google's error: ${data.error_message || 'No results found'}`
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;

        return new Response(JSON.stringify({
            success: true,
            lat: location.lat,
            lng: location.lng,
            formatted_address: formattedAddress,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Internal geocodeAddress function error:", error);
        return new Response(JSON.stringify({ success: false, error: `Internal server error: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
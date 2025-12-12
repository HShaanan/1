function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=600", // מאפשר שמירה במטמון ציבורי
      ...extraHeaders,
    },
  });
}

Deno.serve(async (req) => {
  try {
    // אין צורך באימות כי המפתח מוגבל באמצעות HTTP Referrer ב-Google Cloud
    
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
    }

    const key = Deno.env.get("GOOGLE_MAPS_APIKEY");
    const mapId = Deno.env.get("GOOGLE_MAPS_MAP_ID") || null;

    if (!key) {
      return jsonResponse({
        ok: false,
        apiKey: null,
        mapId: null,
        error: "Google Maps browser API key not configured (GOOGLE_MAPS_APIKEY).",
      });
    }

    return jsonResponse({
      ok: true,
      apiKey: key,
      mapId: mapId || null,
    });
  } catch (error) {
    return jsonResponse({ ok: false, apiKey: null, mapId: null, error: "Internal error" }, 500);
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // בדיקת הרשאות אדמין
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    const API_KEY = Deno.env.get("GOOGLE_MAPS_APIKEY");
    if (!API_KEY) {
      return Response.json({ 
        success: false, 
        error: 'Google Maps API key not configured' 
      }, { status: 500 });
    }

    const { city, topic, radius = 5000 } = await req.json();

    if (!city || !topic) {
      return Response.json({ 
        success: false, 
        error: 'City and topic are required' 
      }, { status: 400 });
    }

    console.log(`🔍 Searching for "${topic}" in ${city}`);

    // שלב 1: קבלת קואורדינטות של העיר
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ", Israel")}&key=${API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return Response.json({ 
        success: false, 
        error: `Could not find location: ${city}` 
      }, { status: 400 });
    }

    const locationCoords = geocodeData.results[0].geometry.location;
    console.log(`📍 Location coordinates:`, locationCoords);

    // שלב 2: חיפוש עסקים לפי נושא
    const searchQuery = `${topic} in ${city}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${locationCoords.lat},${locationCoords.lng}&radius=${radius}&language=he&key=${API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return Response.json({ 
        success: false, 
        error: `Places API error: ${searchData.status}`,
        details: searchData.error_message 
      }, { status: 500 });
    }

    let businesses = searchData.results || [];
    let allBusinesses = [...businesses];
    let nextPageToken = searchData.next_page_token;

    // שלב 3: איסוף כל העמודים (עד 200 תוצאות)
    while (nextPageToken && allBusinesses.length < 200) {
      console.log(`📄 Fetching next page... (current: ${allBusinesses.length})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Google דורש המתנה

      const nextUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${API_KEY}`;
      const nextResponse = await fetch(nextUrl);
      const nextData = await nextResponse.json();

      if (nextData.status === 'OK') {
        allBusinesses = [...allBusinesses, ...(nextData.results || [])];
        nextPageToken = nextData.next_page_token;
      } else {
        break;
      }
    }

    console.log(`✅ Total found: ${allBusinesses.length} businesses`);

    // שלב 4: עיבוד התוצאות
    const results = [];

    for (const business of allBusinesses.slice(0, 200)) {
      try {
        // קבלת פרטים מלאים - רק השדות הנדרשים ללא תמונות
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=name,formatted_address,international_phone_number,website,types,geometry&key=${API_KEY}&language=he`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status !== 'OK') {
          console.warn(`⚠️ Could not fetch details for ${business.name}`);
          continue;
        }

        const details = detailsData.result;

        // יצירת URL slug
        const urlSlug = details.name
          .toLowerCase()
          .replace(/[^a-z0-9\u0590-\u05FF]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        results.push({
          place_id: business.place_id,
          name: details.name,
          address: details.formatted_address,
          phone: details.international_phone_number || '',
          website: details.website || '',
          types: details.types || [],
          lat: details.geometry?.location?.lat || business.geometry?.location?.lat,
          lng: details.geometry?.location?.lng || business.geometry?.location?.lng,
          url_slug: urlSlug
        });

        // המתנה מינימלית
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing ${business.name}:`, error);
      }
    }

    return Response.json({
      success: true,
      count: results.length,
      businesses: results
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});
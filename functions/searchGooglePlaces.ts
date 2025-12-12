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

    const businesses = searchData.results || [];
    console.log(`✅ Found ${businesses.length} businesses`);

    // שלב 3: עיבוד התוצאות
    const results = [];

    for (const business of businesses) {
      try {
        // קבלת פרטים מלאים
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,types,rating,user_ratings_total&key=${API_KEY}&language=he`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status !== 'OK') {
          console.warn(`⚠️ Could not fetch details for ${business.name}`);
          continue;
        }

        const details = detailsData.result;

        // המרת תמונות
        const images = (details.photos || []).slice(0, 5).map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photo.photo_reference}&key=${API_KEY}`
        );

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
          phone: details.formatted_phone_number || '',
          website: details.website || '',
          rating: details.rating || 0,
          reviews_count: details.user_ratings_total || 0,
          images: images,
          opening_hours: details.opening_hours?.weekday_text || [],
          types: details.types || [],
          lat: business.geometry?.location?.lat,
          lng: business.geometry?.location?.lng,
          url_slug: urlSlug
        });

        // המתנה קצרה כדי לא לעבור על Rate Limit
        await new Promise(resolve => setTimeout(resolve, 200));

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
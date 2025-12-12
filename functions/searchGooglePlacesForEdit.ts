import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // בדיקת הרשאות
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 403 });
    }

    const { query } = await req.json();

    if (!query) {
      return Response.json({ 
        success: false, 
        error: 'Query is required' 
      }, { status: 400 });
    }

    const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_APIKEY");
    if (!GOOGLE_MAPS_KEY) {
      return Response.json({ 
        success: false, 
        error: 'Google Maps API key not configured' 
      }, { status: 500 });
    }

    console.log('🔍 Searching Google Places for:', query);

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=iw&key=${GOOGLE_MAPS_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK') {
      console.log('⚠️ Google Places API status:', searchData.status);
      return Response.json({ 
        success: false, 
        error: 'לא נמצאו תוצאות',
        status: searchData.status
      });
    }

    console.log('✅ Found', searchData.results.length, 'results');

    // החזרת התוצאות
    const results = searchData.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types
    }));

    return Response.json({
      success: true,
      results: results
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
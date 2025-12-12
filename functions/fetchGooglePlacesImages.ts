import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        ok: false, 
        error: 'Unauthorized - User not authenticated' 
      }, { status: 401 });
    }

    if (req.method !== 'POST') {
      return Response.json({ 
        ok: false, 
        error: 'Method Not Allowed' 
      }, { status: 405 });
    }

    const API_KEY = Deno.env.get("GOOGLE_MAPS_APIKEY");
    if (!API_KEY) {
      return Response.json({ 
        ok: false, 
        error: 'Google Maps API key not configured' 
      }, { status: 500 });
    }

    const { businessName, address } = await req.json();

    if (!businessName && !address) {
      return Response.json({ 
        ok: false, 
        error: 'Business name or address is required' 
      }, { status: 400 });
    }

    // שלב 1: חיפוש העסק ב-Google Places
    const searchQuery = businessName + (address ? ` ${address}` : '');
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.candidates || searchData.candidates.length === 0) {
      return Response.json({ 
        ok: false, 
        error: 'Business not found in Google Places',
        details: searchData.status 
      }, { status: 404 });
    }

    const placeId = searchData.candidates[0].place_id;

    // שלב 2: קבלת פרטי המקום כולל תמונות
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result || !detailsData.result.photos) {
      return Response.json({ 
        ok: false, 
        error: 'No photos found for this business' 
      }, { status: 404 });
    }

    // שלב 3: יצירת URLs לתמונות
    const photos = detailsData.result.photos.slice(0, 15); // מגביל ל-15 תמונות
    const photoUrls = photos.map(photo => {
      // יצירת URL לתמונה באיכות גבוהה (מקסימום רוחב)
      const maxWidth = 1600;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photo.photo_reference}&key=${API_KEY}`;
    });

    return Response.json({ 
      ok: true, 
      photos: photoUrls,
      count: photoUrls.length,
      businessName: searchData.candidates[0].name
    });

  } catch (error) {
    console.error('Error fetching Google Places images:', error);
    return Response.json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});
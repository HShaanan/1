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

    const { location = "Beitar Illit, Israel", radius = 5000, types = [] } = await req.json().catch(() => ({}));

    console.log(`🔍 Starting import from ${location}`);

    // שלב 1: קבלת קואורדינטות של המיקום
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return Response.json({ 
        success: false, 
        error: `Could not geocode location: ${location}` 
      }, { status: 400 });
    }

    const locationCoords = geocodeData.results[0].geometry.location;
    console.log(`📍 Location coordinates:`, locationCoords);

    // שלב 2: חיפוש עסקים באזור
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationCoords.lat},${locationCoords.lng}&radius=${radius}&key=${API_KEY}`;
    
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

    // שלב 3: עיבוד כל עסק
    const imported = [];
    const errors = [];

    for (const business of businesses.slice(0, 50)) { // הגבלה ל-50 עסקים ראשונים
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

        // המרת שעות פעילות
        const openingHours = details.opening_hours?.weekday_text?.join('\n') || '';

        // קביעת קטגוריה (ניתן לשפר לאחר מכן)
        const categoryName = mapGoogleTypeToCategory(details.types);

        // יצירת URL slug
        const urlSlug = details.name
          .toLowerCase()
          .replace(/[^a-z0-9\u0590-\u05FF]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        // בדיקה אם העסק כבר קיים
        const existing = await base44.asServiceRole.entities.BusinessPage.filter({ 
          url_slug: urlSlug 
        });

        if (existing && existing.length > 0) {
          console.log(`⏭️ Skipping existing: ${details.name}`);
          continue;
        }

        // יצירת עמוד עסק חדש
        const newBusinessPage = await base44.asServiceRole.entities.BusinessPage.create({
          business_name: details.name,
          display_title: details.name,
          description: `${details.name} - ${details.formatted_address}`,
          url_slug: urlSlug,
          business_owner_email: user.email, // האדמין שמייבא
          contact_phone: details.formatted_phone_number || '',
          website_url: details.website || '',
          address: details.formatted_address,
          lat: business.geometry?.location?.lat,
          lng: business.geometry?.location?.lng,
          images: images,
          hours: openingHours,
          is_active: false, // יחכה לאישור
          approval_status: 'pending',
          metadata: {
            google_place_id: business.place_id,
            imported_from: 'google_places',
            imported_at: new Date().toISOString()
          },
          smart_rating: details.rating || 0,
          reviews_count: details.user_ratings_total || 0
        });

        imported.push({
          name: details.name,
          id: newBusinessPage.id
        });

        console.log(`✅ Imported: ${details.name}`);

        // המתנה קצרה כדי לא לעבור על Rate Limit
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Error importing ${business.name}:`, error);
        errors.push({
          name: business.name,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Successfully imported ${imported.length} businesses`,
      imported: imported,
      errors: errors,
      total_found: businesses.length
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});

// עזר: מיפוי סוגי Google לקטגוריות
function mapGoogleTypeToCategory(types = []) {
  const typeMap = {
    'restaurant': 'מסעדות',
    'cafe': 'בתי קפה',
    'food': 'אוכל',
    'store': 'חנויות',
    'clothing_store': 'אופנה',
    'electronics_store': 'אלקטרוניקה',
    'supermarket': 'סופרמרקט',
    'bakery': 'מאפייה',
    'health': 'בריאות',
    'doctor': 'רופאים',
    'dentist': 'רופאי שיניים',
    'pharmacy': 'בית מרקחת',
    'gym': 'כושר',
    'hair_care': 'טיפוח',
    'beauty_salon': 'יופי',
    'spa': 'ספא',
    'school': 'חינוך',
    'lawyer': 'משפטים',
    'accounting': 'הנהלת חשבונות',
    'real_estate_agency': 'נדל"ן',
    'lodging': 'לינה',
    'car_repair': 'רכב',
    'electrician': 'חשמלאי',
    'plumber': 'אינסטלטור'
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return 'שונות';
}
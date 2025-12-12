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

    const { business_name, address, place_id } = await req.json();

    if (!business_name && !place_id) {
      return Response.json({ 
        success: false, 
        error: 'Business name or place_id required' 
      }, { status: 400 });
    }

    const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_APIKEY");
    if (!GOOGLE_MAPS_KEY) {
      return Response.json({ 
        success: false, 
        error: 'Google Maps API key not configured' 
      }, { status: 500 });
    }

    console.log('🔍 Fetching business data from Google Places...');
    console.log('   Business name:', business_name);
    console.log('   Address:', address);
    console.log('   Place ID:', place_id);

    let placeId = place_id;

    // אם אין place_id, נחפש אותו
    if (!placeId) {
      const searchQuery = address ? `${business_name}, ${address}` : business_name;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&language=iw&key=${GOOGLE_MAPS_KEY}`;
      
      console.log('🔍 Searching for place...');
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'העסק לא נמצא ב-Google Places' 
        });
      }

      placeId = searchData.results[0].place_id;
      console.log('✅ Found place_id:', placeId);
    }

    // קבלת פרטי העסק המלאים
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,current_opening_hours,rating,user_ratings_total,photos,geometry,types&language=iw&key=${GOOGLE_MAPS_KEY}`;
    
    console.log('📥 Fetching place details...');
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return Response.json({ 
        success: false, 
        error: 'לא ניתן לקבל נתונים מ-Google Places' 
      });
    }

    const place = detailsData.result;
    console.log('✅ Fetched place details:', place.name);
    console.log('📅 Opening hours data:', place.opening_hours);

    // המרת שעות פעילות - גרסה משופרת
    let hoursData = null;
    const openingHoursData = place.current_opening_hours || place.opening_hours;
    
    if (openingHoursData && openingHoursData.weekday_text) {
      console.log('📅 Raw weekday_text:', openingHoursData.weekday_text);
      
      const daysMap = {
        'יום ראשון': 'sunday',
        'יום שני': 'monday',
        'יום שלישי': 'tuesday',
        'יום רביעי': 'wednesday',
        'יום חמישי': 'thursday',
        'יום שישי': 'friday',
        'יום שבת': 'saturday',
        'Sunday': 'sunday',
        'Monday': 'monday',
        'Tuesday': 'tuesday',
        'Wednesday': 'wednesday',
        'Thursday': 'thursday',
        'Friday': 'friday',
        'Saturday': 'saturday'
      };

      const schedule = {};
      
      openingHoursData.weekday_text.forEach(dayText => {
        console.log('🔍 Processing:', dayText);
        
        let dayKey = null;
        let hoursText = null;
        
        // מציאת היום
        for (const [dayName, key] of Object.entries(daysMap)) {
          if (dayText.includes(dayName)) {
            dayKey = key;
            hoursText = dayText.split(':').slice(1).join(':').trim();
            break;
          }
        }

        if (!dayKey) {
          console.log('⚠️ Could not parse day from:', dayText);
          return;
        }

        console.log(`   Day: ${dayKey}, Hours: ${hoursText}`);

        // בדיקת מצבים מיוחדים
        if (!hoursText || hoursText.includes('סגור') || hoursText.toLowerCase().includes('closed')) {
          schedule[dayKey] = {
            isOpen: false,
            is24Hours: false,
            timeRanges: []
          };
          console.log(`   ❌ Closed`);
        } else if (hoursText.includes('24 שעות') || hoursText.toLowerCase().includes('open 24 hours')) {
          schedule[dayKey] = {
            isOpen: true,
            is24Hours: true,
            timeRanges: []
          };
          console.log(`   🕐 Open 24 hours`);
        } else {
          // ניתוח טווחי שעות
          const ranges = [];
          
          // תבניות אפשריות: "09:00–17:00", "9:00 AM – 5:00 PM", וכו'
          const timePattern = /(\d{1,2}):(\d{2})\s*([AP]M)?\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)?/gi;
          let match;
          
          while ((match = timePattern.exec(hoursText)) !== null) {
            let openHour = parseInt(match[1]);
            const openMin = match[2];
            const openPeriod = match[3];
            
            let closeHour = parseInt(match[4]);
            const closeMin = match[5];
            const closePeriod = match[6];
            
            // המרה מ-AM/PM ל-24 שעות
            if (openPeriod) {
              if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
              if (openPeriod === 'AM' && openHour === 12) openHour = 0;
            }
            if (closePeriod) {
              if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
              if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
            }
            
            const openTime = `${String(openHour).padStart(2, '0')}:${openMin}`;
            const closeTime = `${String(closeHour).padStart(2, '0')}:${closeMin}`;
            
            ranges.push({ open: openTime, close: closeTime });
            console.log(`   ⏰ Range: ${openTime} - ${closeTime}`);
          }

          schedule[dayKey] = {
            isOpen: ranges.length > 0,
            is24Hours: false,
            timeRanges: ranges
          };
          
          if (ranges.length === 0) {
            console.log(`   ⚠️ Could not parse hours from: ${hoursText}`);
          }
        }
      });

      hoursData = { schedule };
      console.log('✅ Final hours data:', JSON.stringify(hoursData, null, 2));
    } else {
      console.log('⚠️ No opening hours data found');
    }

    // המרת תמונות
    let photos = [];
    if (place.photos && Array.isArray(place.photos)) {
      photos = place.photos.slice(0, 10).map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_KEY}`
      );
      console.log(`✅ Fetched ${photos.length} photos`);
    }

    // הכנת התוצאה
    const result = {
      place_id: placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number || null,
      website: place.website || null,
      hours: hoursData,
      rating: place.rating || null,
      reviews_count: place.user_ratings_total || 0,
      lat: place.geometry?.location?.lat || null,
      lng: place.geometry?.location?.lng || null,
      photos: photos,
      types: place.types || []
    };

    console.log('✅ Final result prepared');
    console.log('   Hours included:', !!result.hours);

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
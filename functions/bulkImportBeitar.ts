import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check admin permission
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_APIKEY');
    if (!GOOGLE_MAPS_API_KEY) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Multiple search queries to cover more businesses
    const queries = [
      'עסקים ביתר עילית',
      'מסעדות ביתר עילית',
      'חנויות ביתר עילית',
      'שירותים ביתר עילית',
      'קפה ביתר עילית',
      'מזון ביתר עילית',
      'ביגוד ביתר עילית',
      'אלקטרוניקה ביתר עילית',
      'בריאות ביתר עילית',
      'חינוך ביתר עילית',
      'בניה ביתר עילית',
      'רהיטים ביתר עילית',
      'קוסמטיקה ביתר עילית',
      'ספרים ביתר עילית',
      'נעליים ביתר עילית'
    ];
    
    const results = [];
    const errors = [];
    const processedNames = new Set(); // To avoid duplicates

    console.log(`Starting bulk import with ${queries.length} search queries`);

    for (const query of queries) {
      console.log(`Searching: ${query}`);
      let nextPageToken = null;
      let pageCount = 0;

      do {
        // Build search URL with pagination
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=he`;
        if (nextPageToken) {
          searchUrl += `&pagetoken=${nextPageToken}`;
          // Google requires a short delay before using next_page_token
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
          console.log(`API error for ${query}: ${searchData.status}`);
          break;
        }

        if (!searchData.results || searchData.results.length === 0) {
          console.log(`No results for ${query}`);
          break;
        }

        console.log(`Found ${searchData.results.length} businesses (page ${pageCount + 1})`);
        
        // Process results from this page
        const places = searchData.results;
        nextPageToken = searchData.next_page_token || null;
        pageCount++;

        // Get all categories for mapping (once, outside loops)
        const categories = await base44.asServiceRole.entities.Category.list();

        // Process each business from this page
        for (const place of places) {
          // Skip if already processed
          if (processedNames.has(place.name)) {
            console.log(`Skipping duplicate: ${place.name}`);
            continue;
          }
          processedNames.add(place.name);
      try {
        // Get detailed info
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,photos,types,geometry&key=${GOOGLE_MAPS_API_KEY}&language=he`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status !== 'OK' || !detailsData.result) {
          errors.push({ name: place.name, error: 'Failed to fetch details' });
          continue;
        }

        const business = detailsData.result;

        // Check if already exists
        const existing = await base44.asServiceRole.entities.BusinessPage.filter({
          business_name: business.name
        });

        if (existing && existing.length > 0) {
          console.log(`Skipping ${business.name} - already exists`);
          continue;
        }

        // Map Google types to our categories
        let categoryId = null;
        let categoryName = 'אחר';
        
        if (business.types) {
          const googleTypes = business.types.map(t => t.toLowerCase());
          
          if (googleTypes.some(t => ['restaurant', 'food', 'cafe', 'bakery'].includes(t))) {
            const foodCat = categories.find(c => c.name.includes('אוכל') || c.name.includes('מסעד'));
            if (foodCat) {
              categoryId = foodCat.id;
              categoryName = foodCat.name;
            }
          } else if (googleTypes.some(t => ['store', 'shopping', 'clothing_store', 'electronics_store'].includes(t))) {
            const shopCat = categories.find(c => c.name.includes('קניות') || c.name.includes('חנות'));
            if (shopCat) {
              categoryId = shopCat.id;
              categoryName = shopCat.name;
            }
          }
        }

        // Use first category as fallback
        if (!categoryId && categories.length > 0) {
          categoryId = categories[0].id;
          categoryName = categories[0].name;
        }

        // Get photos
        const images = [];
        if (business.photos && business.photos.length > 0) {
          for (let i = 0; i < Math.min(5, business.photos.length); i++) {
            const photoRef = business.photos[i].photo_reference;
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`;
            images.push(photoUrl);
          }
        }

        // Format opening hours
        let hoursText = '';
        if (business.opening_hours && business.opening_hours.weekday_text) {
          hoursText = business.opening_hours.weekday_text.join('\n');
        }

        // Generate URL slug
        const urlSlug = business.name
          .toLowerCase()
          .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        // Create business page
        const newBusiness = {
          business_name: business.name,
          display_title: business.name,
          description: `${business.name} בביתר עילית. ${business.user_ratings_total ? `מדורג ${business.rating} כוכבים (${business.user_ratings_total} ביקורות)` : ''}`,
          category_id: categoryId,
          category_name: categoryName,
          contact_phone: business.formatted_phone_number || 'לא זמין',
          address: business.formatted_address || 'ביתר עילית',
          city: 'ביתר-עילית',
          lat: business.geometry?.location?.lat || null,
          lng: business.geometry?.location?.lng || null,
          website_url: business.website || null,
          hours: hoursText || null,
          images: images.length > 0 ? images : null,
          url_slug: urlSlug,
          smart_rating: business.rating || 0,
          reviews_count: business.user_ratings_total || 0,
          is_active: false,
          approval_status: 'pending',
          business_owner_email: user.email,
          metadata: {
            google_place_id: place.place_id,
            imported_from_google: true,
            imported_at: new Date().toISOString()
          }
        };

        const created = await base44.asServiceRole.entities.BusinessPage.create(newBusiness);
        results.push({ name: business.name, id: created.id, status: 'created' });
        
        console.log(`Created: ${business.name}`);

        } catch (error) {
          console.error(`Error processing ${place.name}:`, error);
          errors.push({ name: place.name, error: error.message });
        }
      }

      } while (nextPageToken && pageCount < 3); // Google allows max 3 pages (60 results) per query
      
      console.log(`Completed search for: ${query}`);
    }

    return Response.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
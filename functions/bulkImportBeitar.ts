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

    const query = 'עסקים ביתר עילית';
    const results = [];
    const errors = [];

    console.log(`Starting bulk import for: ${query}`);

    // Search Google Places
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=he`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK') {
      return Response.json({ 
        error: 'Google Places API error', 
        details: searchData.status 
      }, { status: 500 });
    }

    console.log(`Found ${searchData.results.length} businesses`);

    // Get all categories for mapping
    const categories = await base44.asServiceRole.entities.Category.list();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat;
    });

    // Process each business
    for (const place of searchData.results) {
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
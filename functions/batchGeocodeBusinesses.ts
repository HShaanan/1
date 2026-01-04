import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Only admin can run this
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { mode = 'preview', limit = 10 } = await req.json().catch(() => ({}));

        // Find all active businesses (will override existing coordinates too)
        const allBusinesses = await base44.asServiceRole.entities.BusinessPage.filter({
            is_active: true,
            approval_status: 'approved'
        });

        const businessesNeedingGeocode = allBusinesses.filter(b => 
            b.address || b.city
        );

        console.log(`Found ${businessesNeedingGeocode.length} businesses needing geocoding`);

        if (mode === 'preview') {
            return Response.json({
                success: true,
                preview: true,
                total_needing_geocode: businessesNeedingGeocode.length,
                will_process: Math.min(limit, businessesNeedingGeocode.length),
                sample: businessesNeedingGeocode.slice(0, 5).map(b => ({
                    id: b.id,
                    business_name: b.business_name,
                    address: b.address,
                    city: b.city,
                    has_coords: !!(b.lat && b.lng)
                }))
            });
        }

        // Process batch
        const toProcess = businessesNeedingGeocode.slice(0, limit);
        const results = [];
        const errors = [];

        for (const business of toProcess) {
            try {
                const fullAddress = `${business.address || ''}, ${business.city || 'ביתר עילית'}, Israel`;
                
                // Call OpenStreetMap Nominatim API (free, no API key needed)
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
                const response = await fetch(geocodeUrl, {
                    headers: {
                        'User-Agent': 'Meshelanu/1.0 (contact@meshelanu.co.il)' // Required by Nominatim
                    }
                });
                const data = await response.json();

                if (data && data.length > 0) {
                    const location = data[0];
                    
                    // Update business
                    await base44.asServiceRole.entities.BusinessPage.update(business.id, {
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lon)
                    });

                    results.push({
                        id: business.id,
                        business_name: business.business_name,
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lon),
                        formatted_address: location.display_name
                    });

                    console.log(`✅ Geocoded: ${business.business_name}`);
                } else {
                    errors.push({
                        id: business.id,
                        business_name: business.business_name,
                        error: 'No results found'
                    });
                    console.log(`❌ Failed: ${business.business_name} - No results`);
                }

                // Rate limiting - Nominatim requires 1 second between requests
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                errors.push({
                    id: business.id,
                    business_name: business.business_name,
                    error: error.message
                });
                console.error(`Error geocoding ${business.business_name}:`, error);
            }
        }

        return Response.json({
            success: true,
            message: `עודכנו ${results.length} עסקים`,
            stats: {
                total_needing: businessesNeedingGeocode.length,
                processed: toProcess.length,
                successful: results.length,
                failed: errors.length
            },
            results,
            errors: errors.slice(0, 10)
        });

    } catch (error) {
        console.error('Batch geocode error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});
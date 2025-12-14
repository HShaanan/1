import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    const { businesses, category_id } = await req.json();

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'No businesses provided' 
      }, { status: 400 });
    }

    if (!category_id) {
      return Response.json({ 
        success: false, 
        error: 'Category ID is required' 
      }, { status: 400 });
    }

    console.log('📥 ===== STARTING IMPORT =====');
    console.log(`📊 Total businesses: ${businesses.length}`);
    console.log(`👤 User: ${user.email}`);
    console.log(`📁 Category ID: ${category_id}`);

    const imported = [];
    const errors = [];

    for (const business of businesses) {
      try {
        console.log(`\n🔄 Processing: ${business.name}`);

        // בדיקה אם העסק כבר קיים לפי place_id
        const allPages = await base44.asServiceRole.entities.BusinessPage.list();
        const existingByPlaceId = allPages.find(p => p.metadata?.google_place_id === business.place_id);
        
        if (existingByPlaceId) {
          console.log(`⏭️ Skipping: ${business.name} - place_id exists`);
          errors.push({
            name: business.name,
            error: 'העסק כבר קיים במערכת (לפי place_id)',
            existing_id: existingByPlaceId.id
          });
          continue;
        }

        // הכנת שעות פעילות אם יש
        let hoursData = null;
        if (business.opening_hours) {
          const daysMap = {
            'Sunday': 'sunday',
            'Monday': 'monday',
            'Tuesday': 'tuesday',
            'Wednesday': 'wednesday',
            'Thursday': 'thursday',
            'Friday': 'friday',
            'Saturday': 'saturday'
          };
          
          const schedule = {};
          Object.keys(daysMap).forEach(day => {
            schedule[daysMap[day]] = { isOpen: false };
          });
          
          if (business.opening_hours.periods) {
            business.opening_hours.periods.forEach(period => {
              const day = Object.keys(daysMap).find(d => d.startsWith(period.open?.day || ''));
              if (day && period.open && period.close) {
                schedule[daysMap[day]] = {
                  isOpen: true,
                  is24Hours: false,
                  timeRanges: [{
                    open: period.open.time,
                    close: period.close.time
                  }]
                };
              }
            });
          }
          
          hoursData = JSON.stringify({ schedule });
        }

        const businessPageData = {
          business_name: business.name,
          display_title: business.name,
          description: business.address || `${business.name}`,
          url_slug: business.url_slug,
          category_id: category_id,
          business_owner_email: user.email,
          contact_phone: business.phone || '',
          website_url: business.website || '',
          address: business.address || '',
          lat: business.lat || null,
          lng: business.lng || null,
          hours: hoursData,
          images: [],
          is_active: false,
          approval_status: 'pending',
          metadata: {
            google_place_id: business.place_id,
            google_types: business.types || [],
            imported_from: 'google_places',
            imported_at: new Date().toISOString()
          }
        };

        console.log('📝 Creating:', businessPageData.business_name);
        console.log('📋 Data:', JSON.stringify(businessPageData, null, 2));

        const newPage = await base44.asServiceRole.entities.BusinessPage.create(businessPageData);

        console.log(`✅ Created successfully: ${newPage.id}`);

        imported.push({
          name: business.name,
          id: newPage.id,
          url_slug: newPage.url_slug,
          approval_status: newPage.approval_status
        });

      } catch (error) {
        console.error(`❌ Error: ${business.name}:`, error.message);
        errors.push({
          name: business.name,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Imported: ${imported.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    return Response.json({
      success: true,
      message: `Imported ${imported.length} businesses`,
      imported: imported,
      errors: errors
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
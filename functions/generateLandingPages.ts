import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all active businesses and categories
    const [businesses, categories] = await Promise.all([
      base44.asServiceRole.entities.BusinessPage.filter({
        is_active: true,
        approval_status: 'approved',
        is_frozen: false
      }),
      base44.asServiceRole.entities.Category.list()
    ]);

    // Extract unique cities
    const cities = [...new Set(businesses.map(b => b.city))].filter(Boolean);
    
    // Filter relevant categories (food and shopping only)
    const foodRegex = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|קפה|סושי)/i;
    const shopRegex = /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר)/i;
    
    const relevantCategories = categories.filter(c => 
      !c.parent_id && 
      c.is_active && 
      (foodRegex.test(c.name) || shopRegex.test(c.name))
    );

    const allSubcategories = categories.filter(c => c.parent_id);

    const landingPages = [];
    const existingSlugs = new Set();

    // Generate landing pages for each city × category × subcategory
    for (const city of cities) {
      for (const category of relevantCategories) {
        // Skip categories without slug
        if (!category.slug) continue;
        
        // Main category page
        const mainSlug = `${city.replace(/\s+/g, '-').toLowerCase()}-${category.slug}`;
        
        if (!existingSlugs.has(mainSlug)) {
          existingSlugs.add(mainSlug);
          
          const businessCount = businesses.filter(b => 
            b.city === city && b.category_id === category.id
          ).length;

          landingPages.push({
            city,
            category_slug: category.slug,
            category_name: category.name,
            url_slug: mainSlug,
            title: `${category.name} ב${city} | משלנו`,
            description: `מחפשים ${category.name} ב${city}? גלו עסקים מובילים, כשרות למהדרין, עם משלוחים מהירים. השוו מחירים, צפו בתפריטים ובחרו את המקום המושלם עבורכם.`,
            meta_description: `${category.name} ב${city} - השוואת מחירים, תפריטים, משלוחים. כשרות למהדרין. מצא את ${category.name} הכי טוב ב${city}!`,
            business_count: businessCount,
            is_active: true,
            priority: businessCount > 0 ? 0.8 : 0.5
          });
        }

        // Subcategory pages
        const subcats = allSubcategories.filter(s => s.parent_id === category.id && s.is_active);
        for (const subcat of subcats) {
          // Skip subcategories without slug
          if (!subcat.slug) continue;
          
          const subSlug = `${city.replace(/\s+/g, '-').toLowerCase()}-${category.slug}-${subcat.slug}`;
          
          if (!existingSlugs.has(subSlug)) {
            existingSlugs.add(subSlug);
            
            const subcatBusinessCount = businesses.filter(b => 
              b.city === city && 
              (b.subcategory_ids?.includes(subcat.id) || b.subcategory_id === subcat.id)
            ).length;

            landingPages.push({
              city,
              category_slug: category.slug,
              category_name: category.name,
              subcategory_slug: subcat.slug,
              subcategory_name: subcat.name,
              url_slug: subSlug,
              title: `${subcat.name} ב${city} | משלנו`,
              description: `מחפשים ${subcat.name} ב${city}? גלו ${subcat.name} כשר למהדרין, עם משלוחים מהירים. צפו בתפריטים, השוו מחירים והזמינו בקלות.`,
              meta_description: `${subcat.name} ב${city} - כשרות למהדרין, משלוחים מהירים, מחירים משתלמים. הזמן ${subcat.name} עכשיו!`,
              business_count: subcatBusinessCount,
              is_active: true,
              priority: subcatBusinessCount > 0 ? 0.7 : 0.4
            });
          }
        }
      }
    }

    // Clear existing landing pages
    const existing = await base44.asServiceRole.entities.LandingPage.list();
    for (const page of existing) {
      await base44.asServiceRole.entities.LandingPage.delete(page.id);
    }

    // Bulk insert new landing pages in batches
    const batchSize = 50;
    for (let i = 0; i < landingPages.length; i += batchSize) {
      const batch = landingPages.slice(i, i + batchSize);
      await Promise.all(
        batch.map(page => base44.asServiceRole.entities.LandingPage.create(page))
      );
    }

    return Response.json({
      success: true,
      created: landingPages.length,
      cities: cities.length,
      categories: relevantCategories.length,
      pages: landingPages.map(p => ({
        url_slug: p.url_slug,
        business_count: p.business_count,
        priority: p.priority
      }))
    });

  } catch (error) {
    console.error('Error generating landing pages:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// פונקציה ליצירת slug ייחודי מתוך שם עסק
function createSlugFromName(businessName, city = '', existingSlugs = new Set()) {
  if (!businessName) return null;
  
  // המרה לאותיות קטנות והחלפת רווחים במקפים
  let baseSlug = businessName
    .trim()
    .toLowerCase()
    .replace(/['"״״]/g, '') // הסרת גרשיים
    .replace(/\s+/g, '-') // רווחים למקפים
    .replace(/[^\u0590-\u05FFa-z0-9-]/g, '') // רק עברית, אנגלית, מספרים ומקפים
    .replace(/-+/g, '-') // מניעת מקפים כפולים
    .replace(/^-|-$/g, ''); // הסרת מקפים בהתחלה או בסוף
  
  // הוספת עיר אם זמינה
  if (city) {
    const citySlug = city.trim().toLowerCase().replace(/\s+/g, '-');
    baseSlug = `${baseSlug}-${citySlug}`;
  }
  
  // בדיקת ייחודיות והוספת מספר סידורי אם נדרש
  let finalSlug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    console.log('🔧 Starting URL slug generation process...');

    // טעינת כל עמודי העסק
    const allPages = await base44.asServiceRole.entities.BusinessPage.list();
    console.log(`📊 Total business pages: ${allPages.length}`);

    // איסוף כל ה-slugs הקיימים
    const existingSlugs = new Set(
      allPages
        .map(p => p.url_slug)
        .filter(Boolean)
    );
    
    console.log(`📋 Existing slugs: ${existingSlugs.size}`);

    const results = {
      total: allPages.length,
      already_had_slug: 0,
      generated: 0,
      failed: [],
      slugs_created: []
    };

    // עבור על כל עסק
    for (const page of allPages) {
      try {
        // אם יש כבר slug תקין, דלג
        if (page.url_slug && page.url_slug.length > 5 && page.url_slug.includes('-')) {
          results.already_had_slug++;
          continue;
        }

        // יצירת slug חדש
        const newSlug = createSlugFromName(
          page.business_name,
          page.city,
          existingSlugs
        );

        if (!newSlug) {
          results.failed.push({
            id: page.id,
            name: page.business_name,
            error: 'Failed to generate slug'
          });
          continue;
        }

        // עדכון העסק
        await base44.asServiceRole.entities.BusinessPage.update(page.id, {
          url_slug: newSlug
        });

        existingSlugs.add(newSlug);
        results.generated++;
        results.slugs_created.push({
          business_name: page.business_name,
          old_slug: page.url_slug || 'none',
          new_slug: newSlug
        });

        console.log(`✅ Generated slug for "${page.business_name}": ${newSlug}`);

      } catch (error) {
        console.error(`❌ Error processing ${page.business_name}:`, error);
        results.failed.push({
          id: page.id,
          name: page.business_name,
          error: error.message
        });
      }
    }

    console.log('✅ Slug generation complete!');
    console.log(`📊 Results: ${results.generated} generated, ${results.already_had_slug} already had slugs, ${results.failed.length} failed`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return Response.json({
      error: 'Slug generation failed',
      details: error.message
    }, { status: 500 });
  }
});
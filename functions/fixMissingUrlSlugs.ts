import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * פונקציה לתיקון url_slug חסרים או לא תקינים
 * רק אדמין יכול להריץ
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // טען את כל עמודי העסק
    const allPages = await base44.asServiceRole.entities.BusinessPage.list();
    
    const results = {
      total: allPages.length,
      fixed: 0,
      alreadyOk: 0,
      errors: [],
      duplicates: []
    };

    // בדוק כפילויות
    const slugCounts = new Map();
    
    for (const page of allPages) {
      // בדיקה אם url_slug חסר או נראה כמו ID
      const needsFix = !page.url_slug || 
                       page.url_slug.length > 20 || 
                       page.url_slug === page.id;

      if (needsFix) {
        try {
          // יצירת slug חדש מ-business_name
          let baseName = page.business_name
            .trim()
            .toLowerCase()
            .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '') // שמור רק עברית, אנגלית, מספרים, רווחים ומקפים
            .replace(/\s+/g, '-') // המר רווחים למקפים
            .replace(/-+/g, '-') // מקף יחיד
            .slice(0, 50); // הגבל אורך

          // וודא ייחודיות
          let newSlug = baseName;
          let counter = 1;
          
          while (allPages.some(p => p.url_slug === newSlug && p.id !== page.id)) {
            newSlug = `${baseName}-${counter}`;
            counter++;
          }

          // עדכן
          await base44.asServiceRole.entities.BusinessPage.update(page.id, {
            url_slug: newSlug
          });

          results.fixed++;
          console.log(`✅ Fixed slug for ${page.business_name}: ${newSlug}`);
        } catch (error) {
          results.errors.push({
            business: page.business_name,
            error: error.message
          });
        }
      } else {
        results.alreadyOk++;
        
        // ספור את ה-slug לבדיקת כפילויות
        slugCounts.set(page.url_slug, (slugCounts.get(page.url_slug) || 0) + 1);
      }
    }

    // זהה כפילויות
    for (const [slug, count] of slugCounts.entries()) {
      if (count > 1) {
        results.duplicates.push({ slug, count });
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Fix URL slugs error:', error);
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});
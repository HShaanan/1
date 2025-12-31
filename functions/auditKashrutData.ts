import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * פונקציה לביקורת וניקוי נתוני כשרות
 * מזהה חוסר עקביות ומציע תיקונים
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { autoFix } = await req.json().catch(() => ({ autoFix: false }));

    // טען נתונים
    const [allPages, kashrutList] = await Promise.all([
      base44.asServiceRole.entities.BusinessPage.list(),
      base44.asServiceRole.entities.Kashrut.list()
    ]);

    const kashrutNames = new Set(kashrutList.map(k => k.name?.trim()));
    
    const results = {
      total: allPages.length,
      withKashrut: 0,
      consistent: 0,
      inconsistent: 0,
      fixed: 0,
      issues: []
    };

    for (const page of allPages) {
      if (!page.kashrut_authority_name) continue;
      
      results.withKashrut++;
      const currentName = page.kashrut_authority_name.trim();

      // בדוק אם שם הכשרות קיים ברשימה הרשמית
      if (kashrutNames.has(currentName)) {
        results.consistent++;
      } else {
        results.inconsistent++;
        
        // נסה למצוא התאמה קרובה (case-insensitive)
        const match = kashrutList.find(k => 
          k.name?.toLowerCase().trim() === currentName.toLowerCase()
        );

        if (match) {
          results.issues.push({
            business: page.business_name,
            current: currentName,
            suggested: match.name,
            issue: 'רווחים או אותיות גדולות/קטנות שונות'
          });

          if (autoFix) {
            await base44.asServiceRole.entities.BusinessPage.update(page.id, {
              kashrut_authority_name: match.name
            });
            results.fixed++;
          }
        } else {
          results.issues.push({
            business: page.business_name,
            current: currentName,
            suggested: null,
            issue: 'כשרות לא קיימת ברשימה הרשמית'
          });
        }
      }
    }

    return Response.json({
      success: true,
      results,
      available_kashrut: Array.from(kashrutNames)
    });

  } catch (error) {
    console.error('Kashrut audit error:', error);
    return Response.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});
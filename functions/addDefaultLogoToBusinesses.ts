import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    const defaultLogoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/3f9cfac9b_Gemini_Generated_Image_xr0kiexr0kiexr0k.png";

    // טעינת כל עמודי העסק הפעילים
    const pages = await base44.asServiceRole.entities.BusinessPage.filter({
      is_active: true,
      approval_status: 'approved'
    });

    console.log(`📊 Found ${pages.length} active business pages`);

    const results = {
      total: pages.length,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const page of pages) {
      try {
        // בדיקה אם כבר יש לוגו (images[1])
        const hasLogo = Array.isArray(page.images) && page.images.length > 1 && page.images[1];
        
        if (hasLogo) {
          results.skipped++;
          continue;
        }

        // הכנת מערך תמונות חדש
        const images = Array.isArray(page.images) ? [...page.images] : [];
        
        // אם אין תמונה ראשית, נוסיף את הלוגו גם כתמונה ראשית
        if (images.length === 0) {
          images.push(defaultLogoUrl);
        }
        
        // הוספת הלוגו במיקום [1]
        if (images.length === 1) {
          images.push(defaultLogoUrl);
        } else {
          images[1] = defaultLogoUrl;
        }

        // הגדרת zoom קטן יותר ללוגו
        const metadata = page.metadata || {};
        metadata.logo_position = {
          zoom: 0.85,
          x: 50,
          y: 50,
          rotation: 0
        };

        // עדכון העסק
        await base44.asServiceRole.entities.BusinessPage.update(page.id, {
          images,
          metadata
        });

        console.log(`✅ Updated logo for: ${page.business_name}`);
        results.updated++;

      } catch (pageErr) {
        console.error(`Error processing ${page.business_name}:`, pageErr);
        results.errors.push({
          business_name: page.business_name,
          error: pageErr.message
        });
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Add logo error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
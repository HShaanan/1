import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    // חישוב תאריך לפני שבוע
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    console.log(`🗑️ Searching for business pages created after: ${oneWeekAgoISO}`);

    // טעינת כל עמודי העסק
    const allPages = await base44.asServiceRole.entities.BusinessPage.list('-created_date', 500);

    // סינון עמודים שנוצרו בשבוע האחרון
    const recentPages = allPages.filter(page => {
      if (!page.created_date) return false;
      const createdDate = new Date(page.created_date);
      return createdDate >= oneWeekAgo;
    });

    console.log(`📊 Found ${recentPages.length} business pages created in the last week`);

    const results = {
      total_scanned: allPages.length,
      found_recent: recentPages.length,
      deleted: 0,
      errors: [],
      deleted_pages: []
    };

    // מחיקת העמודים
    for (const page of recentPages) {
      try {
        await base44.asServiceRole.entities.BusinessPage.delete(page.id);
        
        results.deleted_pages.push({
          id: page.id,
          name: page.business_name,
          created_date: page.created_date
        });
        results.deleted++;
        
        console.log(`✅ Deleted: ${page.business_name} (${page.created_date})`);
      } catch (deleteErr) {
        console.error(`Error deleting ${page.business_name}:`, deleteErr);
        results.errors.push({
          business_name: page.business_name,
          error: deleteErr.message
        });
      }
    }

    // ניקוי cache של Browse
    console.log('🧹 Clearing Browse page cache...');

    return Response.json({
      success: true,
      results,
      cache_cleared: true
    });

  } catch (error) {
    console.error('Delete recent pages error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
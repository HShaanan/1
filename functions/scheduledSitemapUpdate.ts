import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * פונקציה זו אמורה לרוץ אוטומטית בשעה 03:00 בלילה (GMT+2)
 * 
 * הגדרה בדשבורד:
 * 1. עבור ל-Dashboard → Code → Functions
 * 2. בחר את הפונקציה 'scheduledSitemapUpdate'
 * 3. הגדר Cron Schedule: 0 3 * * * (כל יום בשעה 03:00)
 * 4. או הגדר: 0 1 * * * (כל יום בשעה 03:00 GMT+2 = 01:00 UTC)
 * 
 * הפונקציה תעדכן:
 * - Sitemap מורחב
 * - דפי נחיתה דינמיים
 * - צירופי עיר-קטגוריה חדשים
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('🕒 Scheduled Sitemap Update Started at:', new Date().toISOString());
    
    // Call the expanded sitemap generator
    const sitemapResponse = await base44.asServiceRole.functions.invoke('generateExpandedSitemap', {});
    
    if (!sitemapResponse || sitemapResponse.status !== 200) {
      throw new Error('Failed to generate sitemap');
    }
    
    console.log('✅ Sitemap updated successfully');
    
    // Optional: Log to analytics or send notification
    const stats = {
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Sitemap updated at 03:00 AM'
    };
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sitemap update completed',
      stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Scheduled sitemap update failed:', error);
    
    // Optional: Send error notification to admin
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'admin@meshelanu.co.il',
        subject: '⚠️ Sitemap Update Failed',
        body: `Scheduled sitemap update failed at ${new Date().toISOString()}\n\nError: ${error.message}`
      });
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
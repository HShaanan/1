import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { business_page_id, event_type, session_id, metadata } = await req.json();

    if (!business_page_id || !event_type || !session_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // קבלת שעון ישראל מדויק
    const now = new Date();
    const israelTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(now);

    const israelDateString = `${israelTime.find(p => p.type === 'year').value}-${israelTime.find(p => p.type === 'month').value}-${israelTime.find(p => p.type === 'day').value}T${israelTime.find(p => p.type === 'hour').value}:${israelTime.find(p => p.type === 'minute').value}:${israelTime.find(p => p.type === 'second').value}`;

    // בדיקה אם המשתמש מחובר
    const user = await base44.auth.me().catch(() => null);

    // שמירת האירוע
    await base44.asServiceRole.entities.BusinessPageAnalytics.create({
      business_page_id,
      event_type,
      session_id,
      user_email: user?.email || null,
      user_agent: req.headers.get('user-agent') || '',
      referrer: req.headers.get('referer') || '',
      israel_timestamp: israelDateString,
      metadata: metadata || {}
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error recording analytics:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { session_id, current_page } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Check if user is authenticated
    let userData = null;
    let isAuthenticated = false;
    try {
      userData = await base44.auth.me();
      isAuthenticated = true;
    } catch (e) {
      // Not authenticated
    }

    // Get or create session
    const existingSessions = await base44.asServiceRole.entities.ActiveSession.filter({ 
      session_id 
    });

    const sessionData = {
      session_id,
      user_email: userData?.email || null,
      user_name: userData?.full_name || null,
      is_authenticated: isAuthenticated,
      last_heartbeat: new Date().toISOString(),
      current_page: current_page || '/',
      user_agent: req.headers.get('user-agent') || 'Unknown'
    };

    if (existingSessions.length > 0) {
      await base44.asServiceRole.entities.ActiveSession.update(
        existingSessions[0].id,
        sessionData
      );
    } else {
      await base44.asServiceRole.entities.ActiveSession.create(sessionData);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
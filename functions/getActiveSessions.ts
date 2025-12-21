import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions updated in the last 2 minutes
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    const allSessions = await base44.asServiceRole.entities.ActiveSession.list('-last_heartbeat');
    
    // Filter sessions that are active (heartbeat within last 2 minutes)
    const activeSessions = allSessions.filter(session => {
      const lastHeartbeat = new Date(session.last_heartbeat);
      return lastHeartbeat >= twoMinutesAgo;
    });

    return Response.json({ 
      success: true,
      sessions: activeSessions 
    });

  } catch (error) {
    console.error('Error getting active sessions:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
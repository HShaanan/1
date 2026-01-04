import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ref_id, session_duration = 0 } = await req.json();

    if (!ref_id) {
      return Response.json({ error: 'ref_id is required' }, { status: 400 });
    }

    // Extract visitor info
    const visitorIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    
    // Create device fingerprint
    const fingerprintData = `${visitorIp}-${userAgent}`;
    const fingerprint = createHash("sha256").update(fingerprintData).toString();

    // Check if current user is the referrer (self-click detection - LAYER A)
    const currentUser = await base44.auth.me().catch(() => null);
    if (currentUser) {
      const referrerStats = await base44.asServiceRole.entities.ReferralStats.filter({
        ref_id: ref_id,
        user_email: currentUser.email
      });
      
      if (referrerStats.length > 0) {
        console.log('🚫 Self-click detected');
        return Response.json({ 
          success: false, 
          message: 'Self-referral not allowed',
          points: 0 
        });
      }
    }

    // Check for existing visit from this IP for this ref_id (LAYER B)
    const existingVisit = await base44.asServiceRole.entities.ReferralLog.filter({
      ref_id: ref_id,
      visitor_ip: visitorIp
    });

    if (existingVisit.length > 0) {
      console.log('⚠️ Duplicate IP for this ref_id');
      return Response.json({ 
        success: false, 
        message: 'Visit already tracked',
        points: 0 
      });
    }

    // Check shared device scenario (LAYER C)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentVisitsFromIp = await base44.asServiceRole.entities.ReferralLog.filter({
      visitor_ip: visitorIp,
      created_date: { $gte: last24h.toISOString() }
    });

    let qualityFlag = 'high';
    if (recentVisitsFromIp.length > 0 && recentVisitsFromIp[0].ref_id !== ref_id) {
      qualityFlag = 'low';
      console.log('⚠️ Shared device detected - marking as low quality');
    }

    // Calculate points
    let pointsAwarded = 0;
    
    // ENTRY_TYPE_A: Soft Click (1 point per 5 unique IPs)
    const stats = await base44.asServiceRole.entities.ReferralStats.filter({ ref_id });
    if (stats.length > 0) {
      const currentStats = stats[0];
      if ((currentStats.unique_visitors + 1) % 5 === 0) {
        pointsAwarded += 1;
      }
    }

    // ENTRY_TYPE_B: Engagement (2 points if session > 30s)
    if (session_duration >= 30) {
      pointsAwarded += 2;
    }

    // Check rate limit (max 50 points per day)
    if (stats.length > 0) {
      const currentStats = stats[0];
      const today = new Date().toISOString().split('T')[0];
      
      if (currentStats.last_reset_date !== today) {
        // Reset daily counter
        await base44.asServiceRole.entities.ReferralStats.update(currentStats.id, {
          points_today: pointsAwarded,
          last_reset_date: today
        });
      } else if (currentStats.points_today + pointsAwarded > 50) {
        // Exceeded daily limit
        pointsAwarded = Math.max(0, 50 - currentStats.points_today);
        console.log('⚠️ Daily rate limit reached');
      }
    }

    // Create referral log
    const logEntry = await base44.asServiceRole.entities.ReferralLog.create({
      ref_id,
      visitor_ip: visitorIp,
      visitor_fingerprint: fingerprint,
      session_duration,
      quality_flag: qualityFlag,
      points_awarded: pointsAwarded,
      conversion_completed: false
    });

    // Update stats
    if (stats.length > 0) {
      const currentStats = stats[0];
      await base44.asServiceRole.entities.ReferralStats.update(currentStats.id, {
        total_points: (currentStats.total_points || 0) + pointsAwarded,
        points_today: (currentStats.points_today || 0) + pointsAwarded,
        total_clicks: (currentStats.total_clicks || 0) + 1,
        unique_visitors: (currentStats.unique_visitors || 0) + 1,
        engaged_visitors: session_duration >= 30 ? 
          (currentStats.engaged_visitors || 0) + 1 : 
          (currentStats.engaged_visitors || 0)
      });
    }

    return Response.json({
      success: true,
      points_awarded: pointsAwarded,
      quality_flag: qualityFlag,
      log_id: logEntry.id
    });

  } catch (error) {
    console.error('Error tracking referral visit:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a ref_id
    const existingStats = await base44.entities.ReferralStats.filter({
      user_email: user.email
    });

    if (existingStats.length > 0) {
      return Response.json({
        success: true,
        ref_id: existingStats[0].ref_id,
        stats: existingStats[0]
      });
    }

    // Generate unique ref_id (8 chars, alphanumeric)
    const hashInput = `${user.email}-${Date.now()}`;
    const hash = createHash("sha256").update(hashInput).toString();
    const ref_id = hash.substring(0, 8).toUpperCase();

    // Create initial stats
    const stats = await base44.entities.ReferralStats.create({
      user_email: user.email,
      ref_id,
      total_points: 0,
      points_today: 0,
      total_clicks: 0,
      unique_visitors: 0,
      engaged_visitors: 0,
      conversions: 0,
      fraud_attempts: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    });

    return Response.json({
      success: true,
      ref_id,
      stats
    });

  } catch (error) {
    console.error('Error initializing referral user:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
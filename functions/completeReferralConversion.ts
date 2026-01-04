import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ref_id, new_user_id, new_user_email } = await req.json();

    if (!ref_id || !new_user_id) {
      return Response.json({ error: 'ref_id and new_user_id are required' }, { status: 400 });
    }

    // Get visitor's IP
    const visitorIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Find the original log entry for this visitor and ref_id
    const logs = await base44.asServiceRole.entities.ReferralLog.filter({
      ref_id,
      visitor_ip: visitorIp,
      conversion_completed: false
    }, '-created_date', 1);

    if (logs.length === 0) {
      console.log('⚠️ No matching referral log found');
      return Response.json({ 
        success: false, 
        message: 'No pending referral found' 
      });
    }

    const logEntry = logs[0];

    // ENTRY_TYPE_C: Conversion (5 points)
    const conversionPoints = 5;

    // Update log entry
    await base44.asServiceRole.entities.ReferralLog.update(logEntry.id, {
      conversion_completed: true,
      converted_user_id: new_user_id,
      points_awarded: (logEntry.points_awarded || 0) + conversionPoints
    });

    // Update referrer stats
    const stats = await base44.asServiceRole.entities.ReferralStats.filter({ ref_id });
    
    if (stats.length > 0) {
      const currentStats = stats[0];
      
      // Check daily limit
      const today = new Date().toISOString().split('T')[0];
      let pointsToAdd = conversionPoints;
      
      if (currentStats.last_reset_date === today) {
        if (currentStats.points_today + conversionPoints > 50) {
          pointsToAdd = Math.max(0, 50 - currentStats.points_today);
        }
      }

      await base44.asServiceRole.entities.ReferralStats.update(currentStats.id, {
        total_points: (currentStats.total_points || 0) + pointsToAdd,
        points_today: currentStats.last_reset_date === today ? 
          (currentStats.points_today || 0) + pointsToAdd : 
          pointsToAdd,
        conversions: (currentStats.conversions || 0) + 1,
        last_reset_date: today
      });

      // Send notification to referrer (optional)
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: currentStats.user_email,
          subject: '🎉 הרווחת נקודות בונוס!',
          body: `מזל טוב! מישהו נרשם דרך הקישור שלך וזכית ב-${pointsToAdd} נקודות! סך הנקודות שלך: ${(currentStats.total_points || 0) + pointsToAdd}`
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      return Response.json({
        success: true,
        points_awarded: pointsToAdd,
        total_points: (currentStats.total_points || 0) + pointsToAdd
      });
    }

    return Response.json({ 
      success: false, 
      message: 'Referrer stats not found' 
    });

  } catch (error) {
    console.error('Error completing conversion:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
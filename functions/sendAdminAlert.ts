import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse payload
        const payload = await req.json().catch(() => ({}));
        const { title, message, type = 'info', force_telegram_token, force_telegram_chat_id } = payload;
        
        // Fetch Admin Settings for Alert Preferences
        const settings = await base44.asServiceRole.entities.AppSettings.list();
        
        // 1. Telegram Settings (Prioritize payload for testing, otherwise fallback to DB)
        const telegramToken = force_telegram_token || settings.find(s => s.setting_key === 'telegram_bot_token')?.setting_value;
        const telegramChatId = force_telegram_chat_id || settings.find(s => s.setting_key === 'telegram_chat_id')?.setting_value;

        // 2. Email Settings
        let adminEmail = null;
        const emailSetting = settings.find(s => s.setting_key === 'admin_notification_email');
        if (emailSetting) {
            adminEmail = emailSetting.setting_value;
        } else {
             // Fallback: get first admin user
             const users = await base44.asServiceRole.entities.User.list({ role: 'admin' }, 1);
             if (users && users.length > 0) {
                 adminEmail = users[0].email;
             }
        }

        const results = { };

        // --- Channel 1: Telegram (The "Digital Asset" Approach) ---
        if (telegramToken && telegramChatId) {
            try {
                // Determine icon based on type
                const icon = type === 'urgent' ? '🚨' : type === 'success' ? '✅' : 'ℹ️';
                const formattedTitle = title ? `<b>${title}</b>` : '';
                
                // Construct message (HTML format) - ensure no undefined
                const messageText = message || 'הודעה חדשה מהמערכת';
                const text = formattedTitle ? `${icon} ${formattedTitle}\n\n${messageText}` : `${icon} ${messageText}`;

                const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: telegramChatId,
                        text: text,
                        parse_mode: 'HTML'
                    })
                });
                
                const tgData = await tgResponse.json();
                if (!tgData.ok) throw new Error(tgData.description);
                
                results.telegram = 'sent';
            } catch (err) {
                console.error("Telegram Send Error:", err);
                results.telegram = `failed: ${err.message}`;
            }
        }

        // --- Channel 2: Email (Native System Tool) ---
        // This is the primary robust channel for "System Alerts" without external paid providers.
        if (adminEmail) {
            try {
                const emailSubject = title || 'התראת מערכת חדשה';
                const emailMessage = message || 'הודעה חדשה מהמערכת';
                
                await base44.integrations.Core.SendEmail({
                    to: adminEmail,
                    subject: `[התראת מערכת] ${emailSubject}`,
                    body: `
                        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #d32f2f;">התראת מערכת</h2>
                            <p><strong>סוג:</strong> ${type === 'urgent' ? '🚨 דחוף' : type === 'success' ? '✅ הצלחה' : 'ℹ️ מידע'}</p>
                            ${title ? `<p><strong>כותרת:</strong> ${title}</p>` : ''}
                            <hr/>
                            <p style="font-size: 16px;">${emailMessage}</p>
                            <br/>
                            <small>נשלח ממערכת משלנו</small>
                        </div>
                    `
                });
                results.email = 'sent';
            } catch (err) {
                console.error("Email Send Error:", err);
                results.email = `failed: ${err.message}`;
            }
        }

        // Note: Direct SMS/WhatsApp without an external provider (like Twilio) is not currently supported natively by the platform 
        // as a free built-in tool. The previous Twilio integration was removed as requested.
        // If "Elite" features include native SMS in the future, it would be injected here.
        
        return Response.json({ success: true, results });

    } catch (error) {
        console.error("Alert System Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
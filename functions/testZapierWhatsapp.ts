import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        const webhookUrl = Deno.env.get('WEBHOOK_URL');
        
        if (!webhookUrl) {
            return Response.json({ 
                success: false, 
                error: 'Webhook URL לא מוגדר בסודות המערכת' 
            }, { status: 400 });
        }

        const zapierPayload = {
            recipient: '+972501234567',
            message_text: '🎉 הזמנה חדשה! #12345 - יוחנן כהן\n📦 פרטים: 2x מוקה, 1x עוגה\n💰 סכום: 89 ש״ח'
        };

        console.log(`📤 Sending test to Zapier: ${webhookUrl}`);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(zapierPayload)
        });
        
        const responseText = await response.text();
        console.log('📥 Zapier Response:', response.status, responseText);

        if (response.ok) {
            return Response.json({ 
                success: true, 
                message: '✅ הזמנת דמה מלאה נשלחה! בדוק WhatsApp 0505196963',
                details: { status: response.status, response: responseText }
            });
        } else {
            return Response.json({ 
                success: false, 
                error: `Zapier error: ${responseText}`,
                details: { status: response.status, response: responseText }
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Test Zapier error:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
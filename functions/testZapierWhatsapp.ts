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

        const { webhookUrl } = await req.json();
        
        if (!webhookUrl) {
            return Response.json({ 
                success: false, 
                error: 'Missing webhook URL' 
            }, { status: 400 });
        }

        const testMessage = `🧪 בדיקת מערכת WhatsApp\n\n✅ זוהי הודעת בדיקה מהמערכת.\nאם קיבלת הודעה זו - החיבור תקין!\n\n🕐 ${new Date().toLocaleString('he-IL')}`;

        const zapierPayload = {
            recipient: '972505196963',
            message_text: testMessage,
            order_number: 'TEST',
            business_name: 'בדיקת מערכת'
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
                message: 'הודעת בדיקה נשלחה בהצלחה!',
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
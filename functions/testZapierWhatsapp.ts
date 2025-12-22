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

        const fullOrderMessage = `
🚚 הזמנה #99001

🏪 איסוף: שפע ברכת השם
📍 בית"ר עילית, 38 כף החיים

🏠 משלוח ללקוח:
👤 ישראל ישראלי
📞 0505196963
📍 רחוב הרצל 12, דירה 5, ביתר עילית

🛒 פירוט ההזמנה:
• 2x פיצה משפחתית XL - 45₪
  תוספות:
    - פטריות (+5₪)
    - זיתים (+5₪)
  בצק:
    - בצק דק
  📝 בלי זיתים שחורים, רק ירוקים

• 1x קולה גדול 1.5L - 12₪

• 1x סלט ירקות - 18₪
  רוטב:
    - טחינה (+3₪)
  📝 טרי בבקשה

💰 סה"כ: 132₪

💬 הערות כלליות: להגיע בין 19:00-19:30, להשאיר ליד הדלת אם אין מענה

🚗 ניווט:
לעסק: https://waze.com/ul?q=בית"ר עילית, 38 כף החיים&navigate=yes
ללקוח: https://waze.com/ul?q=רחוב הרצל 12, ביתר עילית&navigate=yes
        `.trim();

        const zapierPayload = {
            recipient: '972505196963',
            message_text: fullOrderMessage,
            order_number: '99001',
            business_name: 'שפע ברכת השם'
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
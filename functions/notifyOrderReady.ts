import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json().catch(() => ({}));
        const { orderId } = body;

        if (!orderId) {
            return Response.json({ success: false, error: "Missing orderId" }, { status: 400 });
        }

        // Get order details
        const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
        if (!orders || orders.length === 0) {
            return Response.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const order = orders[0];
        const customerPhone = order.customer_phone;
        const customerName = order.customer_name;
        const orderNumber = order.order_number;
        const deliveryType = order.delivery_type;

        if (!customerPhone) {
            return Response.json({ success: false, error: "No customer phone number" }, { status: 400 });
        }

        // Get business details for the message
        let businessName = "העסק";
        if (order.business_page_id) {
            try {
                const businesses = await base44.asServiceRole.entities.BusinessPage.filter({ id: order.business_page_id });
                if (businesses && businesses.length > 0) {
                    businessName = businesses[0].title || businesses[0].name || "העסק";
                }
            } catch (e) {
                console.warn("Could not fetch business name:", e);
            }
        }

        // Format phone number for WhatsApp (Israeli format)
        let formattedPhone = customerPhone.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '972' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('972')) {
            formattedPhone = '972' + formattedPhone;
        }

        // Build message based on delivery type
        let message;
        if (deliveryType === 'delivery') {
            message = `שלום ${customerName}! 🚚\n\nההזמנה שלך (#${orderNumber}) מ-${businessName} יצאה למשלוח!\nהשליח בדרך אליך.\n\nתודה שבחרת בנו! 💚`;
        } else {
            message = `שלום ${customerName}! 🎉\n\nההזמנה שלך (#${orderNumber}) מ-${businessName} מוכנה לאיסוף!\nאפשר להגיע לאסוף.\n\nתודה שבחרת בנו! 💚`;
        }

        // Send WhatsApp message via Twilio
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

        if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
            console.warn("Twilio credentials not configured, falling back to SMS simulation");
            
            // Log the notification for tracking
            console.log(`[NOTIFICATION] Would send to ${customerPhone}: ${message}`);
            
            return Response.json({ 
                success: true, 
                message: "Notification logged (Twilio not configured)",
                notificationType: "log",
                customerPhone,
                orderNumber
            });
        }

        // Send via Twilio WhatsApp
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append('From', `whatsapp:${twilioWhatsAppNumber}`);
        formData.append('To', `whatsapp:+${formattedPhone}`);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        const twilioResult = await twilioResponse.json();

        if (twilioResponse.ok) {
            console.log(`WhatsApp sent successfully to ${formattedPhone}`);
            return Response.json({ 
                success: true, 
                message: "WhatsApp notification sent",
                notificationType: "whatsapp",
                messageSid: twilioResult.sid
            });
        } else {
            console.error("Twilio error:", twilioResult);
            
            // Try SMS as fallback
            const smsFormData = new URLSearchParams();
            smsFormData.append('From', twilioWhatsAppNumber.replace('whatsapp:', ''));
            smsFormData.append('To', `+${formattedPhone}`);
            smsFormData.append('Body', message);

            const smsResponse = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: smsFormData.toString()
            });

            if (smsResponse.ok) {
                const smsResult = await smsResponse.json();
                return Response.json({ 
                    success: true, 
                    message: "SMS notification sent (WhatsApp failed)",
                    notificationType: "sms",
                    messageSid: smsResult.sid
                });
            }

            return Response.json({ 
                success: false, 
                error: "Failed to send notification",
                details: twilioResult
            }, { status: 500 });
        }

    } catch (error) {
        console.error("NotifyOrderReady error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
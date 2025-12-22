import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { orderId } = await req.json();
    
    if (!orderId) {
      return Response.json({ 
        success: false, 
        error: 'Missing orderId' 
      }, { status: 400 });
    }

    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    const order = orders[0];
    
    if (!order) {
      return Response.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }

    const businessPages = await base44.asServiceRole.entities.BusinessPage.filter({ 
      id: order.business_page_id 
    });
    const businessPage = businessPages[0];
    
    if (!businessPage) {
      return Response.json({ 
        success: false, 
        error: 'Business page not found' 
      }, { status: 404 });
    }

    const businessAddress = businessPage.address || 'כתובת לא צוינה';
    const customerAddress = order.customer_address || 'לא צוינה';
    const customerNotes = order.notes || 'אין הערות';
    
    // טעינת איזור הזמן מההגדרות
    let timezoneOffset = 2; // ברירת מחדל UTC+2
    try {
      const timezoneSettings = await base44.asServiceRole.entities.AppSettings.filter({ 
        setting_key: 'timezone_offset' 
      });
      if (timezoneSettings && timezoneSettings.length > 0) {
        timezoneOffset = parseFloat(timezoneSettings[0].setting_value);
      }
    } catch (e) {
      console.log('Using default timezone offset:', timezoneOffset);
    }
    
    // המרה לאיזור הזמן שנבחר
    const orderDate = new Date(order.created_date || Date.now());
    orderDate.setHours(orderDate.getHours() + timezoneOffset);
    
    const dateTimeStr = orderDate.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const businessAddressEncoded = encodeURIComponent(businessAddress);
    const customerAddressEncoded = encodeURIComponent(customerAddress);
    
    const wazeToStore = `https://waze.com/ul?q=${businessAddressEncoded}&navigate=yes`;
    const wazeToCustomer = `https://waze.com/ul?q=${customerAddressEncoded}&navigate=yes`;

    // פירוט מלא של פריטי ההזמנה עם הרכבות ותוספות
    const itemsDetail = order.items && Array.isArray(order.items) 
      ? order.items.map(item => {
          let itemText = `• ${item.quantity}x ${item.menu_item_name} - ${item.price}₪`;
          
          // הוספת הרכבות ותוספות אם קיימות
          if (item.selected_modifications && Array.isArray(item.selected_modifications) && item.selected_modifications.length > 0) {
            const modsText = item.selected_modifications
              .map(mod => {
                const optionsText = mod.selected_options
                  .map(opt => `    - ${opt.name}${opt.extra_price ? ` (+${opt.extra_price}₪)` : ''}`)
                  .join('\n');
                return `  ${mod.group_name}:\n${optionsText}`;
              })
              .join('\n');
            itemText += `\n${modsText}`;
          }
          
          // הערות לפריט אם קיימות
          if (item.notes) {
            itemText += `\n  📝 ${item.notes}`;
          }
          
          return itemText;
        }).join('\n\n')
      : 'פירוט לא זמין';

    // הודעת WhatsApp מוכנה
    const whatsappMessage = `
🚚 הזמנה #${order.order_number}

🏪 איסוף: ${businessPage.business_name}
📍 ${businessAddress}

🏠 משלוח ללקוח:
👤 ${order.customer_name}
📞 ${order.customer_phone}
📍 ${customerAddress}

🛒 פירוט ההזמנה:
${itemsDetail}

💰 סה"כ: ${order.total_amount}₪

💬 הערות כלליות: ${customerNotes}

🚗 ניווט:
לעסק: ${wazeToStore}
ללקוח: ${wazeToCustomer}
    `.trim();

    const whatsappUrl = `https://wa.me/972505196963?text=${encodeURIComponent(whatsappMessage)}`;

    // פירוט מפורט לטלגרם (עם HTML)
    const itemsDetailTelegram = order.items && Array.isArray(order.items)
      ? order.items.map(item => {
          let itemHtml = `• <b>${item.quantity}x ${item.menu_item_name}</b> - ${item.price}₪`;
          
          if (item.selected_modifications && Array.isArray(item.selected_modifications) && item.selected_modifications.length > 0) {
            const modsHtml = item.selected_modifications
              .map(mod => {
                const optsHtml = mod.selected_options
                  .map(opt => `    ◦ ${opt.name}${opt.extra_price ? ` (+${opt.extra_price}₪)` : ''}`)
                  .join('\n');
                return `  <i>${mod.group_name}:</i>\n${optsHtml}`;
              })
              .join('\n');
            itemHtml += `\n${modsHtml}`;
          }
          
          if (item.notes) {
            itemHtml += `\n  📝 <i>${item.notes}</i>`;
          }
          
          return itemHtml;
        }).join('\n\n')
      : 'פירוט לא זמין';

    // הכנת הודעת התראה מפורטת לטלגרם
    const telegramMessage = `
🏪 <b>הזמנה חדשה מעסק: ${businessPage.business_name}</b>
מספר הזמנה: #${order.order_number}

👤 <b>פרטי לקוח:</b>
שם: ${order.customer_name}
טלפון: ${order.customer_phone}
כתובת: ${customerAddress}

🛒 <b>פירוט מלא של ההזמנה:</b>
${itemsDetailTelegram}

💰 <b>סה"כ לתשלום: ${order.total_amount} ₪</b>

📝 <b>הערות כלליות:</b> ${customerNotes}

<a href="${wazeToCustomer}">🚗 נווט ללקוח</a>
    `.trim();

    // שליחת התראה מרכזית למנהל (טלגרם + מייל)
    try {
        await base44.functions.invoke('sendAdminAlert', {
            title: `הזמנה חדשה #${order.order_number}`,
            message: telegramMessage,
            type: 'success'
        });
    } catch (alertError) {
        console.error("Failed to send admin alert:", alertError);
    }

    // מייל עם לינק WhatsApp (נשאר כגיבוי ישיר למייל הספציפי שהוגדר קודם, או שאפשר להסתמך רק על sendAdminAlert)
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; padding: 20px;">
        <h2 style="color: #25D366; text-align: center;">🚚 הזמנה מספר ${order.order_number}</h2>
        
        <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #25D366;">
          
          <h3 style="color: #333; margin-top: 0;">🏪 איסוף מעסק:</h3>
          <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">
            <strong style="font-size: 18px;">${businessPage.business_name}</strong><br>
            📍 ${businessAddress}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <h3 style="color: #333;">🏠 משלוח ללקוח:</h3>
          <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">
            <strong style="font-size: 18px;">${order.customer_name}</strong><br>
            📞 ${order.customer_phone}<br>
            📍 ${customerAddress}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <h3 style="color: #333;">💬 הערות:</h3>
          <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">
            ${customerNotes}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #666; font-size: 14px; margin: 10px 0;">
            🕐 <strong>תאריך ושעת קליטה:</strong> ${dateTimeStr}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${whatsappUrl}" style="display: inline-block; background: #25D366; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            📱 פתח ב-WhatsApp
          </a>
        </div>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>🚗 ניווט מהיר:</strong></p>
          <p style="margin: 5px 0;"><a href="${wazeToStore}" style="color: #1976d2; text-decoration: none;">1️⃣ Waze לעסק (איסוף)</a></p>
          <p style="margin: 5px 0;"><a href="${wazeToCustomer}" style="color: #1976d2; text-decoration: none;">2️⃣ Waze ללקוח (משלוח)</a></p>
        </div>
      </div>
    `;

    // שליחת אימייל (למייל המקורי שהוגדר בקוד - נשאיר ליתר ביטחון בנוסף להתראה הכללית)
    try {
        await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'מערכת ההזמנות - משלנו',
        to: 'orders@meshelanu.co.il',
        subject: `🚚 הזמנה #${order.order_number} - ${businessPage.business_name}`,
        body: emailBody
        });
    } catch (e) { console.error("Email legacy send failed", e); }

    // 🟢 שליחת הודעת WhatsApp לבית העסק דרך Zapier → WhatsApp Business API
    let whatsappStatus = { attempted: false, success: false, error: null };
    try {
        const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/24997727/uawcfm4/";
        
        // עדיפות למספר ווטסאפ ייעודי, אחרת טלפון רגיל
        let targetPhone = businessPage.whatsapp_phone || businessPage.contact_phone;
        
        if (zapierWebhookUrl && targetPhone) {
            whatsappStatus.attempted = true;
            
            // ניקוי המספר ופירמוט לפורמט בינלאומי (למשל 97250...)
            targetPhone = targetPhone.replace(/\D/g, '');
            if (targetPhone.startsWith('0')) targetPhone = '972' + targetPhone.substring(1);

            const zapierPayload = {
                business_phone: targetPhone,
                whatsapp_message: whatsappMessage,
                order_number: order.order_number,
                business_name: businessPage.business_name,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address || 'לא צוינה',
                total_amount: order.total_amount,
                order_id: order.id
            };

            console.log(`📤 Sending WhatsApp via Zapier to ${targetPhone}...`);
            
            const waResponse = await fetch(zapierWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zapierPayload)
            });
            
            const responseText = await waResponse.text();
            console.log('📥 Zapier Response:', responseText);

            whatsappStatus.success = waResponse.ok;
            if (!waResponse.ok) whatsappStatus.error = responseText;
            
            // Log to database
            try {
                await base44.asServiceRole.entities.NotificationLog.create({
                    notification_type: 'new_order',
                    channel: 'whatsapp',
                    recipient: targetPhone,
                    status: waResponse.ok ? 'success' : 'failed',
                    content: whatsappMessage,
                    provider: 'Zapier-WhatsApp',
                    provider_response: { status: waResponse.status, response: responseText },
                    related_entity_id: order.id,
                    related_entity_type: 'Order',
                    error_message: waResponse.ok ? null : responseText
                });
            } catch (logError) {
                console.error("Failed to log WhatsApp notification:", logError);
            }

            if (!waResponse.ok) {
                console.error('❌ Zapier Failed:', responseText);
            }
        } else {
            console.warn('⚠️ Skipping WhatsApp: Missing webhook URL or phone number');
            whatsappStatus.error = "Missing configuration";
        }
    } catch (waError) {
        console.error("❌ Failed to send WhatsApp via Zapier:", waError);
        whatsappStatus.success = false;
        whatsappStatus.error = waError.message;
        try {
            await base44.asServiceRole.entities.NotificationLog.create({
                notification_type: 'new_order',
                channel: 'whatsapp',
                recipient: businessPage.whatsapp_phone || businessPage.contact_phone || 'unknown',
                status: 'failed',
                content: whatsappMessage,
                provider: 'Zapier-WhatsApp',
                related_entity_id: order.id,
                related_entity_type: 'Order',
                error_message: waError.message
            });
        } catch (logError) {
            console.error("Failed to log WhatsApp error:", logError);
        }
    }

    // שליחה למערכת המשלוחים החיצונית
    const deliverySystemUrl = "https://691d8016fad6996bb1341f7a.edge.sitebase.co/functions/createOrderFromWebhook";
    let deliveryApiResponse = null;

    if (deliverySystemUrl && order.delivery_type === 'delivery') {
      try {
        // פורמט תאריך YYYY-MM-DD (מותאם לאזור זמן)
        const now = new Date();
        now.setHours(now.getHours() + timezoneOffset);
        const scheduledDate = now.toISOString().split('T')[0];

        // פירוט תכולת ההזמנה
        const orderContent = order.items && Array.isArray(order.items) 
          ? order.items.map(item => `${item.quantity}x ${item.menu_item_name}`).join(', ')
          : 'פירוט לא זמין';

        const deliveryPayload = {
          business_name: businessPage.business_name,
          business_type: "restaurant",
          pickup_address: businessAddress,
          customer_name: order.customer_name,
          dropoff_address: customerAddress,
          dropoff_city: "ביתר עילית",
          customer_phone: order.customer_phone,
          order_content: orderContent,
          order_total: Number(order.total_amount) || 0,
          courier_earnings: Number(order.delivery_fee) || 0,
          priority: "normal",
          notes: customerNotes,
          scheduled_date: scheduledDate
        };

        console.log("Sending to Delivery System:", JSON.stringify(deliveryPayload));

        const response = await fetch(deliverySystemUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(deliveryPayload)
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          console.log("Delivery System Response Success:", responseData);
          deliveryApiResponse = { success: true, data: responseData };

          // Log to database
          try {
             await base44.asServiceRole.entities.NotificationLog.create({
                 notification_type: 'new_order_delivery',
                 channel: 'webhook',
                 recipient: deliverySystemUrl,
                 status: 'success',
                 content: JSON.stringify(deliveryPayload),
                 provider: 'ExternalDeliverySystem',
                 provider_response: responseData,
                 related_entity_id: order.id,
                 related_entity_type: 'Order'
             });
          } catch (logError) { console.error("Failed to log delivery webhook success:", logError); }

          // עדכון ההזמנה בהצלחה
          await base44.asServiceRole.entities.Order.update(order.id, {
            delivery_integration_status: 'success',
            external_delivery_id: responseData.id || responseData.order_id || String(responseData.success) || null,
            integration_error: null
          });

        } else {
          const errorText = await response.text();
          console.error("Delivery System Error:", response.status, errorText);
          deliveryApiResponse = { success: false, error: errorText, status: response.status };

          // Log to database
          try {
             await base44.asServiceRole.entities.NotificationLog.create({
                 notification_type: 'new_order_delivery',
                 channel: 'webhook',
                 recipient: deliverySystemUrl,
                 status: 'failed',
                 content: JSON.stringify(deliveryPayload),
                 provider: 'ExternalDeliverySystem',
                 provider_response: { status: response.status, text: errorText },
                 related_entity_id: order.id,
                 related_entity_type: 'Order',
                 error_message: `HTTP ${response.status}: ${errorText}`
             });
          } catch (logError) { console.error("Failed to log delivery webhook failure:", logError); }

          // עדכון ההזמנה בכישלון
          await base44.asServiceRole.entities.Order.update(order.id, {
            delivery_integration_status: 'failed',
            integration_error: `HTTP ${response.status}: ${errorText}`.slice(0, 200) // הגבלת אורך
          });
        }
      } catch (deliveryError) {
        console.error("Failed to send to Delivery System:", deliveryError);
        deliveryApiResponse = { success: false, error: deliveryError.message };

        // Log to database
        try {
            await base44.asServiceRole.entities.NotificationLog.create({
                notification_type: 'new_order_delivery',
                channel: 'webhook',
                recipient: deliverySystemUrl,
                status: 'failed',
                content: typeof deliveryPayload !== 'undefined' ? JSON.stringify(deliveryPayload) : 'Payload not created',
                provider: 'ExternalDeliverySystem',
                related_entity_id: order?.id,
                related_entity_type: 'Order',
                error_message: deliveryError.message
            });
        } catch (logError) { console.error("Failed to log delivery webhook error:", logError); }

        // עדכון ההזמנה בשגיאת רשת/אחרת
        await base44.asServiceRole.entities.Order.update(order.id, {
          delivery_integration_status: 'failed',
          integration_error: `Network Error: ${deliveryError.message}`.slice(0, 200)
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Notifications processed',
      whatsapp: whatsappStatus,
      delivery_system: deliveryApiResponse
    });

  } catch (error) {
    console.error('Error in notifyNewOrder:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
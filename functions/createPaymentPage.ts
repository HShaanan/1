import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json().catch(() => ({}));
        const { 
            items, 
            customerName, 
            customerPhone, 
            customerEmail,
            deliveryType,
            deliveryFee,
            deliveryAddress,
            businessPageId,
            businessName,
            orderId,
            successUrl,
            cancelUrl
        } = body;

        if (!items || items.length === 0) {
            return Response.json({ success: false, error: "Missing items" }, { status: 400 });
        }

        const apiKey = Deno.env.get("SUMIT_SECRET_KEY");
        const companyId = 1171824853;

        if (!apiKey) {
            console.error("CRITICAL: SUMIT_SECRET_KEY not found");
            return Response.json({ success: false, error: "Payment configuration error" }, { status: 500 });
        }

        // Build items array for Sumit - with business name prefix
        const businessDisplayName = businessName || 'העסק';
        console.log("Building items with businessName:", businessDisplayName);
        
        const sumitItems = items.map(item => {
            const itemName = `${businessDisplayName} - ${item.name || 'פריט'}`;
            const qty = item.quantity || 1;
            const unitPrice = item.price || 0;
            console.log("Item:", itemName, "Qty:", qty, "Price:", unitPrice);
            return {
                Item: {
                    Name: itemName,
                    Description: item.description || ''
                },
                Quantity: qty,
                UnitPrice: unitPrice,
                TotalPrice: unitPrice * qty
            };
        });

        // Add delivery fee as separate item if applicable
        if (deliveryType === 'delivery' && deliveryFee > 0) {
            sumitItems.push({
                Item: {
                    Name: `${businessDisplayName} - דמי משלוח`,
                    Description: deliveryAddress || ''
                },
                Quantity: 1,
                UnitPrice: deliveryFee,
                TotalPrice: deliveryFee
            });
        }

        // Calculate total
        const totalAmount = sumitItems.reduce((sum, item) => sum + item.TotalPrice, 0);
        console.log("Total amount:", totalAmount);

        // Build the redirect request payload according to Sumit API
        const payload = {
            Credentials: {
                CompanyID: companyId,
                APIKey: apiKey
            },
            Items: sumitItems,
            VATIncluded: true,
            Customer: {
                Name: customerName || 'לקוח',
                Phone: customerPhone || '',
                EmailAddress: customerEmail || ''
            },
            RedirectURL: successUrl || `${req.headers.get('origin')}/OrderSuccess`,
            CancelURL: cancelUrl || `${req.headers.get('origin')}/OrderCheckout`,
            CustomFields: {
                Field1: orderId || '',
                Field2: businessPageId || '',
                Field3: deliveryType || 'pickup'
            },
            MaxPayments: 1,
            SendDocumentByEmail: true,
            DocumentDescription: businessName ? `הזמנה מ-${businessName}` : 'הזמנה מהאתר'
        };

        console.log("Sending BeginRedirect request to Sumit...");
        console.log("Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch('https://api.sumit.co.il/billing/payments/beginredirect/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Sumit BeginRedirect response:", JSON.stringify(result));

        // Check for success - Status 0 means success
        const isSuccess = result.Status === 0 || 
                          result.Status === "0" || 
                          (typeof result.Status === 'string' && result.Status.toLowerCase().includes("success"));

        if (isSuccess && result.Data?.RedirectURL) {
            return Response.json({
                success: true,
                redirectUrl: result.Data.RedirectURL,
                transactionId: result.Data.TransactionID || result.Data.ID,
                raw: result
            });
        } else {
            return Response.json({
                success: false,
                error: result.UserErrorMessage || result.TechnicalErrorDetails || "Failed to create payment page",
                raw: result
            });
        }

    } catch (error) {
        console.error("CreatePaymentPage error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
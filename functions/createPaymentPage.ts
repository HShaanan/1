import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export const config = {
  path: "/createPaymentPage",
};

export default async function handler(req: Request) {
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

        const businessDisplayName = businessName || 'העסק';
        
        const sumitItems = items.map((item: any) => {
            const itemName = `${businessDisplayName} - ${item.name || 'פריט'}`;
            const qty = item.quantity || 1;
            const unitPrice = item.price || 0;
            return {
                Item: { Name: itemName, Description: item.description || '' },
                Quantity: qty,
                UnitPrice: unitPrice,
                TotalPrice: unitPrice * qty
            };
        });

        if (deliveryType === 'delivery' && deliveryFee > 0) {
            sumitItems.push({
                Item: { Name: `${businessDisplayName} - דמי משלוח`, Description: deliveryAddress || '' },
                Quantity: 1,
                UnitPrice: deliveryFee,
                TotalPrice: deliveryFee
            });
        }

        const payload = {
            Credentials: { CompanyID: companyId, APIKey: apiKey },
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

        // timeout של 10 שניות לסומיט
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        let response: Response;
        try {
            response = await fetch('https://api.sumit.co.il/billing/payments/beginredirect/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        const result = await response.json();
        console.log("Sumit BeginRedirect response status:", result.Status);

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

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("Sumit API timeout after 10s");
            return Response.json({ success: false, error: "שירות התשלום לא הגיב בזמן, נסה שוב" }, { status: 504 });
        }
        console.error("CreatePaymentPage error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

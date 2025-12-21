import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json().catch(() => ({}));
        const { token, amount, description, customer } = body;

        if (!token) {
            return Response.json({ success: false, error: "Missing payment token" }, { status: 400 });
        }

        // Use the "Payments" secret as the API Key
        const apiKey = Deno.env.get("SUMIT_SECRET_KEY");
        const companyId = 1171824853;

        if (!apiKey) {
             console.error("CRITICAL: 'Payments' secret not found in environment.");
             return Response.json({ success: false, error: "Payment configuration error: API key is missing." }, { status: 500 });
        }

        console.log(`[Debug] Using CompanyID: ${companyId}`);
        console.log(`[Debug] Using APIKey from secret: ${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`);

        // Construct the payload for Sumit API
        const payload = {
            Credentials: {
                CompanyID: companyId,
                APIKey: apiKey
            },
            SingleUseToken: token,
            Items: [
                {
                    Item: {
                        Name: description || "Order Payment",
                        Price: amount, // Some APIs use Price, some UnitPrice. Sumit often uses UnitPrice in Items structure
                    },
                    Quantity: 1,
                    UnitPrice: amount,
                    Total: amount
                }
            ],
            VATIncluded: true, // Assuming prices include VAT
            CreateDocument: true, // Ensure a document (Receipt/Invoice) is created upon charge
            SendDocumentByEmail: true // Send receipt to customer
        };

        // Customer is REQUIRED by Sumit
        payload.Customer = {
            Name: customer?.name || "לקוח",
            Phone: customer?.phone || "0500000000",
            EmailAddress: customer?.email // Required for SendDocumentByEmail to work
        };

        console.log("Sending charge request to Sumit...");

        const response = await fetch('https://api.sumit.co.il/billing/payments/charge/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Sumit response:", JSON.stringify(result));

        // Check for success
        // Status can be numeric 0 or string "Success (0)"
        const isSuccess = result.Status === 0 || 
                          result.Status === "0" || 
                          (typeof result.Status === 'string' && result.Status.includes("Success"));

        if (isSuccess) {
            return Response.json({
                success: true,
                transactionId: result.Data?.PaymentID || result.Data?.ID || `sumit_${Date.now()}`,
                raw: result
            });
        } else {
            return Response.json({
                success: false,
                error: result.UserErrorMessage || result.TechnicalErrorDetails || "Payment failed",
                raw: result
            });
        }

    } catch (error) {
        console.error("Payment processing error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
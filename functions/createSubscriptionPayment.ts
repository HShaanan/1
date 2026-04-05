export const config = {
  path: "/createSubscriptionPayment",
};

export default async function handler(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      businessName,
      customerName,
      customerEmail,
      customerPhone,
      listingType,
      registrationId,
      successUrl,
      cancelUrl,
    } = body;

    const apiKey = Deno.env.get("SUMIT_SECRET_KEY");
    const companyId = 1171824853;

    if (!apiKey) {
      console.error("CRITICAL: SUMIT_SECRET_KEY not found");
      return Response.json(
        { success: false, error: "Payment configuration error" },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || "";

    const payload = {
      Credentials: { CompanyID: companyId, APIKey: apiKey },
      Items: [
        {
          Item: {
            Name: "מנוי חודשי - משלנו",
            Description: "",
          },
          Quantity: 1,
          UnitPrice: 49,
          TotalPrice: 49,
        },
      ],
      VAT: { IsIncluded: true },
      Customer: {
        Name: customerName || "לקוח",
        Phone: customerPhone || "",
        EmailAddress: customerEmail || "",
      },
      ExpirationDate: "",
      RedirectURL: successUrl || `${origin}/RegistrationSuccess`,
      CancelURL: cancelUrl || `${origin}/RegisterBusiness`,
      CustomFields: {
        Field1: registrationId || "",
        Field2: listingType || "",
        Field3: businessName || "",
      },
      MaxPayments: 1,
      SendDocumentByEmail: true,
      DocumentDescription: `מנוי חודשי - ${businessName || "משלנו"}`,
    };

    console.log("Creating subscription payment for:", {
      businessName,
      customerName,
      listingType,
      registrationId,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(
        "https://api.sumit.co.il/billing/payments/beginredirect/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();
    console.log("Sumit BeginRedirect response status:", data.Status);

    const isSuccess =
      data.Status === 0 ||
      data.Status === "0" ||
      (typeof data.Status === "string" &&
        data.Status.toLowerCase().includes("success"));

    if (isSuccess && data.Data?.RedirectURL) {
      return Response.json({
        success: true,
        paymentUrl: data.Data.RedirectURL,
      });
    } else {
      console.error("Sumit API error:", {
        status: data.Status,
        userError: data.UserErrorMessage,
        technicalError: data.TechnicalErrorDetails,
      });
      return Response.json({
        success: false,
        error:
          data.UserErrorMessage ||
          data.TechnicalErrorDetails ||
          "Failed to create payment page",
      });
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("Sumit API timeout after 10s");
      return Response.json(
        { success: false, error: "שירות התשלום לא הגיב בזמן, נסה שוב" },
        { status: 504 }
      );
    }
    console.error("CreateSubscriptionPayment error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

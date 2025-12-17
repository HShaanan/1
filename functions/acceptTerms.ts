import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Authenticate
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json().catch(() => ({}));
        const { version, text, userAgent } = body;

        if (!version) {
            return Response.json({ error: 'Version is required' }, { status: 400 });
        }

        // 3. Get IP
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("client-ip") || "unknown";

        // 4. Check if already signed (optional, but good for cleanup)
        // We allow re-signing if needed, or just create a new log entry. 
        // The entity allows multiple records per user.

        // 5. Create Record
        const record = await base44.asServiceRole.entities.UserAgreement.create({
            user_email: user.email,
            agreement_type: 'terms_of_use',
            agreement_text: text || "Standard Terms v" + version,
            agreement_version: version,
            ip_address: ip,
            user_agent: userAgent || "unknown",
            signed_at: new Date().toISOString(),
            is_valid: true,
            signature_method: "click_agreement"
        });

        return Response.json({ success: true, id: record.id });

    } catch (error) {
        console.error("Error signing terms:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
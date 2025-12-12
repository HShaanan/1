import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Optional: Ensure client is initialized (and satisfy linter for async)
        await Promise.resolve();

        const paymentKey = Deno.env.get("Payments");

        if (!paymentKey) {
            return Response.json({ error: 'Payment configuration missing' }, { status: 500 });
        }

        return Response.json({ 
            publicKey: paymentKey,
            companyId: 1171824853
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
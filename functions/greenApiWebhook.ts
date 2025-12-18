import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // Respond to GET requests (for browser checks)
        if (req.method === "GET") {
            return new Response("GreenAPI Webhook is active 🟢", { status: 200 });
        }

        // Parse incoming webhook data
        const body = await req.json().catch(() => ({}));
        
        // Log the event for debugging
        console.log("📩 GreenAPI Webhook Event:", JSON.stringify(body));

        const typeWebhook = body.typeWebhook;
        const sender = body.senderData?.sender;
        const messageData = body.messageData;

        // Future logic can be added here (e.g., auto-reply, order status update)
        // For example:
        // if (typeWebhook === 'incomingMessageReceived') {
        //     // Handle incoming message
        // }

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response("Error", { status: 500 });
    }
});
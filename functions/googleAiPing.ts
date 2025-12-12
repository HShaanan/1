
// Redeploy trigger: 2024-08-15 11:00
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
    });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        console.log("🚀 Starting googleAiPing function");
        const base44 = createClientFromRequest(req);

        // Optional: Check if user is admin if you want to restrict this test
        // if (!(await base44.auth.me())?.role === 'admin') {
        //     return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        // }

        const apiKey = Deno.env.get("GOOGLE_MAPS_APIKEY");

        if (!apiKey) {
            console.error("❌ Missing GOOGLE_MAPS_APIKEY secret");
            return jsonResponse({ success: false, status: "Configuration Error", message: "GOOGLE_MAPS_APIKEY is not set." }, 500);
        }
        
        console.log("🔑 API key found. Pinging Google Gemini API...");

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "שלום עולם" }] }]
            })
        });

        const responseStatus = response.status;
        const responseText = await response.text();
        
        console.log(`📡 Gemini API Response Status: ${responseStatus}`);
        console.log(`📝 Gemini API Response Body: ${responseText}`);

        if (response.ok) {
            return jsonResponse({ 
                success: true, 
                status: "OK", 
                message: "Successfully connected to Google Gemini API.",
                response: JSON.parse(responseText)
            });
        } else {
            return jsonResponse({
                success: false,
                status: `API Error ${responseStatus}`,
                message: "Failed to connect to Google Gemini API.",
                details: responseText
            }, responseStatus);
        }

    } catch (error) {
        console.error("❌ An unexpected error occurred in googleAiPing:", error);
        return jsonResponse({
            success: false,
            status: "Internal Server Error",
            message: error.message
        }, 500);
    }
});

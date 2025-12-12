import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
}

// Helper function to get access token from Service Account
async function getAccessToken(serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const { client_email, private_key } = serviceAccount;

    if (!client_email || !private_key) {
      throw new Error('Invalid service account JSON: missing client_email or private_key');
    }

    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: 'RS256', typ: 'JWT' };
    const jwtClaim = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/generative-language.retriever',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const base64url = (str) => {
      return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(str))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const header = base64url(jwtHeader);
    const claim = base64url(jwtClaim);
    const unsignedToken = `${header}.${claim}`;

    const pemContents = private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${unsignedToken}.${signatureBase64}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        const isAdmin = user && (user.role === 'admin' || user.user_type === 'admin');
        if (!isAdmin) {
            return jsonResponse({ ok: false, error: "Unauthorized. Admin role required." }, 403);
        }

        const body = await req.json();
        const { prompt, aspect_ratio = "1:1", number_of_images = 1, mime_type = "image/png" } = body || {};

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return jsonResponse({ ok: false, error: "prompt is required (string)" }, 400);
        }

        // Get Service Account JSON from VertexID secret
        const serviceAccountKey = Deno.env.get('VertexID');
        if (!serviceAccountKey) {
            return jsonResponse({ ok: false, error: "Service Account not configured (VertexID)" }, 500);
        }

        const accessToken = await getAccessToken(serviceAccountKey);
        const modelFromEnv = Deno.env.get("Google_Model") || "imagegeneration@006";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelFromEnv}:generateImage`;

        const payload = {
            prompt: { text: prompt },
            image_generation_config: {
                number_of_images: Math.max(1, Math.min(4, number_of_images)),
                aspect_ratio,
                mime_type
            }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Vertex AI Image Gen Error:", errorData);
            return jsonResponse({
                ok: false,
                error: errorData?.error?.message || response.statusText || 'Vertex AI error'
            }, response.status);
        }

        const data = await response.json();
        const first = data?.images?.[0];
        const b64 = first?.image_b64;

        if (!b64) {
            return jsonResponse({ ok: false, error: "No image data returned from Vertex AI" }, 502);
        }

        return jsonResponse({
            ok: true,
            data_url: `data:${mime_type};base64,${b64}`,
            model_used: modelFromEnv
        });

    } catch (error) {
        console.error("Image generation function error:", error);
        return jsonResponse({ ok: false, error: error.message || "Internal server error" }, 500);
    }
});
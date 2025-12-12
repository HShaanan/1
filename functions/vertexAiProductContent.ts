import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Helper function to get access token from Service Account
async function getAccessToken(serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const { client_email, private_key, project_id } = serviceAccount;

    if (!client_email || !private_key) {
      throw new Error('Invalid service account JSON: missing client_email or private_key');
    }

    console.log('🔐 Service Account:', client_email);
    console.log('📦 Project ID:', project_id);

    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: 'RS256', typ: 'JWT' };
    const jwtClaim = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
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

    console.log('🔄 Exchanging JWT for access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Token exchange failed:', error);
      throw new Error(`Failed to get access token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token obtained successfully');
    return { access_token: tokenData.access_token, project_id };
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw error;
  }
}

// Helper function to convert base64 to uploaded file URL
async function uploadBase64Image(base44Client, base64Data, filename = 'ai-generated.png') {
  try {
    console.log('📤 Uploading base64 image to storage...');
    
    // Remove data URL prefix if exists
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to blob
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });
    
    // Create file from blob
    const file = new File([blob], filename, { type: 'image/png' });
    
    // Upload using Base44 integration
    const uploadRes = await base44Client.integrations.Core.UploadFile({ file });
    const fileUrl = uploadRes?.data?.file_url || uploadRes?.file_url;
    
    if (!fileUrl) {
      throw new Error('Failed to get file URL from upload response');
    }
    
    console.log('✅ Image uploaded successfully:', fileUrl);
    return fileUrl;
    
  } catch (error) {
    console.error('❌ Failed to upload base64 image:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  console.log('=== 🎨 Gemini 2.5 + Imagen 3 Product Generator ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    let user;
    try {
      user = await base44.auth.me();
      console.log('👤 User authenticated:', { email: user?.email, role: user?.role });
    } catch (authError) {
      return json({ ok: false, error: 'Authentication failed' }, 401);
    }
    
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return json({ ok: false, error: 'Unauthorized. Admin only.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const productName = (body?.product_name || '').toString().trim();
    
    if (!productName) {
      return json({ ok: false, error: 'product_name is required' }, 400);
    }

    console.log('🍽️ Product name:', productName);

    // Get API Key for Gemini
    const apiKey = Deno.env.get('GOOGLE_MAPS_APIKEY');
    if (!apiKey) {
      return json({ ok: false, error: 'GOOGLE_MAPS_APIKEY not configured' }, 500);
    }

    // Get Service Account for Imagen
    const serviceAccountKey = Deno.env.get('VertexID');
    if (!serviceAccountKey) {
      return json({ 
        ok: false, 
        error: 'VertexID secret not configured',
        suggestion: 'Please set the Service Account JSON in VertexID secret' 
      }, 500);
    }

    // ===== STEP 1: Generate Text Content with Gemini 2.5 Flash Preview =====
    console.log('\n📝 Step 1: Generating marketing content with Gemini 2.5...');
    
    const textModel = 'gemini-2.0-flash-exp';
    const textEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${apiKey}`;

    const prompt = `
תפקיד: מומחה תוכן שיווקי לתפריטי מזון בעברית.

שם הפריט: "${productName}"

החזר JSON בלבד עם השדות הבאים:
{
  "product_name": "שם הפריט כפי שקיבלת",
  "marketing_description": "תיאור קצר בעברית, עד 12 מילים, מגרה ואטרקטיבי שמדגיש את הייחודיות והטעמים",
  "image_prompt": "פרומפט באנגלית ליצירת תמונה מקצועית ואיכותית של המאכל, עם פרטים על תאורה, רקע וסגנון (לדוגמה: professional food photography of fresh hummus with olive oil, garnished with chickpeas and paprika, natural lighting, white background, appetizing, high quality)"
}

דוגמה:
{
  "product_name": "חומוס",
  "marketing_description": "חומוס טרי וקרמי עם טחינה גולמית ושמן זית",
  "image_prompt": "professional food photography of creamy hummus in a white bowl, drizzled with olive oil, garnished with chickpeas and paprika, natural daylight, clean white background, appetizing presentation, high quality, 8k"
}

חשוב:
- התיאור בעברית בלבד
- הפרומפט באנגלית בלבד ומפורט מאוד
- הדגש על איכות צילום מקצועית
`.trim();

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.95
      }
    };

    console.log('📞 Calling Gemini API...');
    
    const textResp = await fetch(textEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('📨 Gemini response status:', textResp.status);

    if (!textResp.ok) {
      const errorText = await textResp.text();
      console.error('❌ Gemini error:', errorText);
      return json({
        ok: false,
        error: `Gemini API failed with status ${textResp.status}`,
        details: errorText
      }, textResp.status);
    }

    const textData = await textResp.json();
    const textContent = textData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!textContent) {
      return json({ ok: false, error: 'Empty response from Gemini' }, 502);
    }

    console.log('📄 Raw Gemini response:', textContent);

    // Parse JSON from response
    let parsed = null;
    try {
      const cleaned = textContent.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          return json({ ok: false, error: 'Failed to parse JSON', raw: textContent }, 502);
        }
      } else {
        return json({ ok: false, error: 'No JSON found', raw: textContent }, 502);
      }
    }

    if (!parsed?.product_name || !parsed?.marketing_description || !parsed?.image_prompt) {
      return json({ ok: false, error: 'Incomplete response from Gemini', parsed }, 502);
    }

    // Trim description to 12 words
    const words = String(parsed.marketing_description).trim().split(/\s+/);
    if (words.length > 12) {
      parsed.marketing_description = words.slice(0, 12).join(' ');
    }

    console.log('✅ Content generated:', {
      description: parsed.marketing_description,
      prompt: parsed.image_prompt
    });

    // ===== STEP 2: Generate Image with Imagen 3 =====
    console.log('\n🖼️ Step 2: Generating image with Imagen 3...');
    
    const { access_token, project_id } = await getAccessToken(serviceAccountKey);
    
    const imageModel = 'imagen-3.0-generate-001';
    const location = 'us-central1';
    const imageEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project_id}/locations/${location}/publishers/google/models/${imageModel}:predict`;
    
    const imagePayload = {
      instances: [{
        prompt: parsed.image_prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "dont_allow"
      }
    };

    console.log('📞 Calling Imagen API...');
    console.log('🎯 Image prompt:', parsed.image_prompt);
    
    const imageResp = await fetch(imageEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imagePayload)
    });

    console.log('📨 Imagen response status:', imageResp.status);

    if (!imageResp.ok) {
      const errorText = await imageResp.text();
      console.error('❌ Imagen error:', errorText);
      
      // Return text content even if image generation fails
      return json({
        ok: true,
        result: {
          product_name: parsed.product_name,
          marketing_description: parsed.marketing_description,
          image_url: null
        },
        warning: 'Image generation failed but text content is available',
        image_error: errorText
      });
    }

    const imageData = await imageResp.json();
    console.log('📦 Imagen response received');
    
    const base64Image = imageData?.predictions?.[0]?.bytesBase64Encoded;
    
    if (!base64Image) {
      console.warn('⚠️ No image data in Imagen response');
      return json({
        ok: true,
        result: {
          product_name: parsed.product_name,
          marketing_description: parsed.marketing_description,
          image_url: null
        },
        warning: 'No image data received from Imagen'
      });
    }

    // ===== STEP 3: Upload base64 image to storage =====
    console.log('\n📤 Step 3: Uploading generated image to storage...');
    
    let imageUrl = null;
    try {
      imageUrl = await uploadBase64Image(
        base44, 
        base64Image, 
        `ai-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.png`
      );
    } catch (uploadError) {
      console.error('❌ Failed to upload image:', uploadError);
      return json({
        ok: true,
        result: {
          product_name: parsed.product_name,
          marketing_description: parsed.marketing_description,
          image_url: null
        },
        warning: 'Image generated but upload failed',
        upload_error: uploadError.message
      });
    }

    // ===== SUCCESS =====
    console.log('\n✅ All steps completed successfully!');
    
    return json({
      ok: true,
      result: {
        product_name: parsed.product_name,
        marketing_description: parsed.marketing_description,
        image_url: imageUrl
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return json({
      ok: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }, 500);
  }
});
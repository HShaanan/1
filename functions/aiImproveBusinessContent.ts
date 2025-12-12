
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title = "",
      description = "",
      business_name = "",
      address = "",
      category_name = "",
      subcategory_name = "",
      tags = []
    } = body || {};

    // Read secrets
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_APIKEY') || '';
    const modelName = Deno.env.get('Google_Model') || '';

    // Try to enrich location context from Google Geocoding (if address + key exist)
    let locationContext = {};
    if (googleApiKey && address) {
      try {
        const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        geocodeUrl.searchParams.set('address', address);
        geocodeUrl.searchParams.set('key', googleApiKey);

        const geoRes = await fetch(geocodeUrl.toString());
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          const first = geoJson?.results?.[0];
          if (first) {
            const components = first.address_components || [];
            const byType = (t) => components.find(c => (c.types || []).includes(t))?.long_name || "";
            const city = byType('locality') || byType('postal_town') || byType('administrative_area_level_2') || "";
            const neighborhood = byType('neighborhood') || byType('sublocality') || "";
            locationContext = {
              formatted_address: first.formatted_address || "",
              city,
              neighborhood
            };
          }
        }
      } catch (_e) {
        // ignore geocoding errors to keep function robust
      }
    }

    // Prompt engineering in Hebrew per request
    const prompt = `
הנחיות תפקיד:
אתה:
1) מומחה שיווק דיגיטלי לציבור החרדי.
2) פרופסור לפסיכולוגיה עם התמחות בכאבים של צרכנים והנעה לפעולה.
3) איש/אישה חרדי/ת שמבין/ה רגישויות, צניעות, ושפה מותאמת.
הקפדה: שפה נקייה, מכבדת, צנועה, ברורה וממוקדת תועלות. הדגשת אמינות, שירות, זמינות, והתאמה למשפחה/קהילה. הימנע מהבטחות מוגזמות.

מטרה:
שפר את טקסטי המודעה כך שיניעו לפעולה: להתקשר / להזמין / להגיע.

מודל מועדף (סוד האפליקציה): ${modelName || 'ברירת מחדל'}

הקשר:
- שם העסק: ${business_name}
- כותרת קיימת: ${title}
- תיאור קיים: ${description}
- קטגוריה: ${category_name} | תת-קטגוריה: ${subcategory_name}
- כתובת: ${address}
- הקשר ממפות (אם קיים): ${JSON.stringify(locationContext)}
- תגיות קיימות: ${Array.isArray(tags) ? tags.join(', ') : ''}

הנחיות סגנון:
- קצר ומדויק, אלא אם נדרש לפרט תועלות.
- הדגשת פתרון כאבים רלוונטיים לקהילה החרדית.
- לשון פנייה חמה ונעימה, אך מקצועית.
- הוסף קריאות לפעולה ברורות ומגוונות (טלפון/הודעת וואטסאפ/הגעה).
- הימנע מתיאורים שאינם צנועים ומכלליות ריקה.

מבנה פלט JSON בלבד, לפי הסכמה:
{
  "improved_title": "כותרת משודרגת עד 70 תווים",
  "improved_description": "תיאור 220–600 תווים, עם תועלות ברורות ו-CTA",
  "whatsapp_button_text": "טקסט קצר לכפתור וואטסאפ",
  "whatsapp_message": "הודעה מנומסת לפתיחת שיחה",
  "tags_suggestions": ["תגית1", "תגית2", "..."],
  "cta_lines": ["קריאה לפעולה 1", "קריאה לפעולה 2"]
}
אם שדה לא רלוונטי, השאר ריק או רשימה ריקה.
`;

    // Define response schema
    const responseSchema = {
      type: "object",
      properties: {
        improved_title: { type: "string" },
        improved_description: { type: "string" },
        whatsapp_button_text: { type: "string" },
        whatsapp_message: { type: "string" },
        tags_suggestions: { type: "array", items: { type: "string" } },
        cta_lines: { type: "array", items: { type: "string" } }
      },
      required: []
    };

    // Call LLM via Base44 Core integration (fixed to use Core namespace)
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema
    });

    const improved = llmRes || {};
    return Response.json({ success: true, improved, locationContext });
  } catch (error) {
    return Response.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
});

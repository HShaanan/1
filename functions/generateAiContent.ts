import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

export const config = {
  path: "/generateAiContent",
};

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Security check: Only admins or business owners can generate content
    if (!user || (user.role !== 'admin' && user.user_type !== 'business')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { type, data } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OpenAI_Key"); // Fallback check

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    let prompt = "";
    let systemPrompt = "אתה מומחה קופירייטינג ושיווק דיגיטלי (CRO) הדובר עברית רהוטה. המטרה שלך היא לייצר תוכן שממיר גולשים ללקוחות, תוך שימוש בשפה טבעית, משכנעת ואותנטית.";

    // --- Scenario 1: Generate Rich SEO Description for Store Page ---
    if (type === 'store_seo') {
      const { title, filters } = data;
      const filterDesc = `
        קטגוריה: ${filters.category_id !== 'all' ? filters.category_id : 'כל הקטגוריות'}
        כשרות: ${filters.kashrut?.join(', ') || 'ללא סינון כשרות'}
        משלוחים: ${filters.delivery ? 'כן' : 'לא רלוונטי'}
        סוג: ${filters.active_tab === 'food' ? 'אוכל ומסעדות' : (filters.active_tab === 'shopping' ? 'קניות' : 'כללי')}
      `;

      prompt = `
        כתוב תיאור עשיר ומזמין (HTML format) עבור דף נחיתה באתר "משלנו" (אינדקס עסקים מקומי).
        כותרת הדף: "${title}"
        סינונים פעילים:
        ${filterDesc}

        הנחיות:
        1. התחל בפסקה משכנעת שמסבירה למה כדאי לחפש דווקא כאן (Pain point & Solution).
        2. הוסף רשימת בולטים (<ul><li>) עם יתרונות או סוגי עסקים שאפשר למצוא בקטגוריה זו.
        3. סכם במשפט הנעה לפעולה (CTA) עדין.
        4. השתמש בתגיות HTML סמנטיות (p, ul, li, strong). אל תכלול h1.
        5. הטון צריך להיות מקומי, חם ומקצועי.
      `;
    } 
    
    // --- Scenario 2: Optimize Meta Tags for Store Page ---
    else if (type === 'optimize_store_meta') {
      const { title, current_description } = data;
      prompt = `
        נתח את דף הנחיתה הבא והצע תגיות מטא אופטימליות ל-SEO בגוגל.
        כותרת נוכחית: "${title}"
        תוכן/תיאור: "${current_description?.substring(0, 500)}..."

        החזר אובייקט JSON בלבד בפורמט הבא:
        {
          "h1": "כותרת ראשית משופרת (עד 60 תווים)",
          "meta_title": "כותרת SEO (עד 60 תווים, כולל מילות מפתח)",
          "meta_description": "תיאור SEO (עד 155 תווים, משכנע ומניע להקלקה)"
        }
        
        הקפד על עברית תקנית ושיווקית.
      `;
    }

    // --- Scenario 3: Business Executive Summary ("Why Us") ---
    else if (type === 'business_summary') {
      const { business_name, description, reviews, category } = data;
      const reviewsText = reviews ? reviews.map(r => r.review_text).join("\n").substring(0, 1000) : "";
      
      prompt = `
        צור "תקציר מנהלים" או "למה אנחנו?" עבור העסק: "${business_name}".
        קטגוריה: ${category}
        תיאור קיים: "${description}"
        ביקורות גולשים:
        ${reviewsText}

        המטרה: לייצר פסקה קצרה + 3 בולטים שמדגישים את הייחודיות של העסק ואת הערך ללקוח.
        השתמש בפורמט HTML נקי (div, p, ul, li, strong).
        הדגש את הנקודות החזקות ביותר (למשל: שירות מהיר, טריות, מחיר, יחס אישי).
        אל תמציא עובדות, התבסס על הטקסטים שקיבלת. אם חסר מידע, היה כללי אך משכנע.
      `;
    }

    else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Or gpt-4o-mini for speed/cost
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: type === 'optimize_store_meta' ? { type: "json_object" } : { type: "text" }
    });

    const content = response.choices[0].message.content;
    const result = type === 'optimize_store_meta' ? JSON.parse(content) : { content };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
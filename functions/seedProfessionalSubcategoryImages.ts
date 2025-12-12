
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

// בניית פרומפט שמרני ומותאם לקהל היעד
function buildPrompt(subName) {
  return [
    "צור/י תמונה שיווקית נקייה ואיכותית עבור כרטיס קטגוריה באתר.",
    `קטגוריה: אנשי מקצוע | תת־קטגוריה: ${subName}`,
    "סגנון: נקי, מודרני, צבעים מרוככים, ללא טקסט, ללא לוגואים.",
    "רגישות תרבותית: ללא נשים; אם מופיעים אנשים – רק גברים בלבוש ייצוגי וצנוע; ללא חשיפה.",
    "קומפוזיציה אלגנטית מתאימה לתצוגת ריבוע (1:1).",
  ].join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // בדיקות הרשאות — מנהל בלבד
  const authed = await base44.auth.isAuthenticated().catch(() => false);
  if (!authed) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  const me = await base44.auth.me().catch(() => null);
  if (!me || me.role !== "admin") {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" }
    });
  }

  let body = {};
  try { body = await req.json(); } catch {}
  const {
    force = false,     // true = מייצר גם למי שכבר יש תמונה
    limit = 24         // הגבלה מספרית ליצירה
  } = body || {};

  try {
    // מציאת קטגוריית העל "אנשי מקצוע"
    const allCats = await base44.entities.Category.list();
    const professionals = (allCats || []).find(c => !c.parent_id && /אנשי\s*מקצוע/.test(c.name || ""));
    if (!professionals) {
      return new Response(JSON.stringify({ ok: false, error: "לא נמצאה קטגוריית 'אנשי מקצוע'" }), {
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }

    // שליפת התתי־קטגוריות תחת "אנשי מקצוע"
    const subs = (allCats || []).filter(c => c.parent_id === professionals.id && (c.is_active ?? true));
    const targets = subs
      .filter(c => force || !c.image)
      .slice(0, Math.max(1, Math.min(100, Number(limit) || 24)));

    const results = [];
    for (const [idx, sub] of targets.entries()) {
      try {
        const prompt = buildPrompt(sub.name || "אנשי מקצוע");

        // נסיון יחיד: Gemini דרך פונקציית ה-backend
        let imageUrl = null;
        try {
          const gemRes = await base44.functions.invoke('googleAiImageGenerate', {
            prompt, aspect_ratio: "1:1", number_of_images: 1, mime_type: "image/png"
          });
          const gemData = gemRes?.data || gemRes;
          if (gemData?.ok && gemData?.data_url) {
            imageUrl = gemData.data_url; // data URL
          }
        } catch (_) {
          // Error caught here means Gemini call failed, imageUrl remains null.
          // The check below will mark it as "gemini_failed".
        }

        if (!imageUrl) {
          results.push({ id: sub.id, name: sub.name, status: "failed", reason: "gemini_failed" });
        } else {
          // עדכון התמונה בשירות תפקיד (Service Role) כדי לעקוף RLS כתיבה
          await base44.asServiceRole.entities.Category.update(sub.id, { image: imageUrl });
          results.push({ id: sub.id, name: sub.name, status: "ok", url: imageUrl });
        }
      } catch (e) {
        const msg = String(e?.message || e);
        results.push({ id: sub.id, name: sub.name, status: "failed", reason: msg });
      }
      // דיליי כללי בין קריאות כדי להימנע מרייט-לימיט
      await sleep(1200);
    }

    // Provide richer diagnostics
    const ok = results.some(r => r.status === "ok");
    return new Response(JSON.stringify({
      ok,
      parent: { id: professionals.id, name: professionals.name },
      processed: results.length,
      ok_count: results.filter(r => r.status === "ok").length,
      fail_count: results.filter(r => r.status !== "ok").length,
      results
    }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function clamp(v, min=0, max=1) { return Math.max(min, Math.min(max, v)); }

function normRating(r) {
  // 1..5 -> 0..1, כך ש-3 ~ 0.5
  return clamp((Number(r || 0) - 1) / 4, 0, 1);
}

function normSentiment(s) {
  // -1..1 -> 0..1
  if (typeof s !== 'number' || Number.isNaN(s)) return 0.5;
  return clamp((s + 1) / 2, 0, 1);
}

function recencyWeight(created) {
  // דעיכה אקספוננציאלית לפי ימים (חציון ~180 ימים)
  const dt = created ? new Date(created).getTime() : Date.now();
  const days = Math.max(0, (Date.now() - dt) / (1000 * 60 * 60 * 24));
  const w = Math.exp(-days / 180); // 0..1
  return clamp(w, 0, 1);
}

function textQuality(len) {
  // איכות טקסט לפי אורך, תקרת תרומה ב-600 תווים
  const L = clamp((Number(len || 0)) / 600, 0, 1);
  return L;
}

function helpfulnessRatio(likeCount, dislikeCount) {
  const a = Number(likeCount || 0);
  const b = Number(dislikeCount || 0);
  const denom = a + b;
  if (denom <= 0) return 0.5;
  return clamp(a / denom, 0, 1);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  if (!(await base44.auth.isAuthenticated())) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { business_page_id } = await req.json().catch(() => ({}));
    const me = await base44.auth.me();
    const isAdmin = me?.role === 'admin';

    // אם לא הועבר מזהה עמוד — נאפשר רק לאדמין לעדכן את כולם
    if (!business_page_id && !isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const pageIds = [];

    if (business_page_id) {
      pageIds.push(business_page_id);
    } else {
      // עדכון לכל עמודי העסק הפעילים/מאושרים
      const allPages = await base44.asServiceRole.entities.BusinessPage.filter({ approval_status: 'approved', is_active: true });
      for (const page of allPages) pageIds.push(page.id);
    }

    const updated = [];

    for (const pageId of pageIds) {
      const reviews = await base44.entities.Review.filter({ business_page_id: pageId, is_active: true }, '-created_date', 500);

      if (!Array.isArray(reviews) || reviews.length === 0) {
        // אין ביקורות — אפס/נאל
        await base44.asServiceRole.entities.BusinessPage.update(pageId, {
          smart_rating: null,
          reviews_count: 0
        });
        updated.push({ business_page_id: pageId, smart_rating: null, reviews_count: 0 });
        continue;
      }

      // משקלים — ניתן לכייל בשלב מאוחר יותר
      const W = {
        rating: 0.55,
        sentiment: 0.15,
        helpful: 0.10,
        recency: 0.15,
        textq: 0.05
      };

      let sumWeighted = 0;
      let sumWeights = 0;

      for (const r of reviews) {
        const rRating = normRating(r.rating);
        const rSent = normSentiment(r.sentiment_score);
        const rHelp = helpfulnessRatio(r.like_count, r.dislike_count);
        const rRec = recencyWeight(r.created_date);
        const rTxt = textQuality(r.text_length);

        // ניקוד בסיסי 0..1
        let score = (
          W.rating * rRating +
          W.sentiment * rSent +
          W.helpful * rHelp +
          W.recency * rRec +
          W.textq * rTxt
        );

        // הורדת משקל לביקורות מסומנות/רעילות
        const penalty =
          (r.is_flagged_ai ? 0.75 : 1) *
          ((typeof r.toxicity_score === 'number' && r.toxicity_score >= 0.7) ? 0.8 : 1);

        score = clamp(score * penalty, 0, 1);

        // מקדם ביטחון לאגרגציה (נותן עדיפות לעדכניות + אינטראקציה)
        const conf = clamp(0.3 + 0.5 * rRec + 0.2 * rHelp, 0.2, 1.0);

        sumWeighted += (score * 5) * conf; // החזרה לסקאלה 0..5
        sumWeights += conf;
      }

      const smart = sumWeights > 0 ? (sumWeighted / sumWeights) : null;
      const rounded = smart != null ? Math.round(smart * 10) / 10 : null;

      await base44.asServiceRole.entities.BusinessPage.update(pageId, {
        smart_rating: rounded,
        reviews_count: reviews.length
      });

      updated.push({
        business_page_id: pageId,
        smart_rating: rounded,
        reviews_count: reviews.length
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      updated_count: updated.length,
      updated
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
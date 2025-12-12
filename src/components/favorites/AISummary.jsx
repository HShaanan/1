import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";

function pickTop(arr, n = 8) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

export default function AISummary({ listings = [], categoriesMap = {} }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    // נבנה קלט תמציתי ל-AI (כותרת, קטגוריה, תיאור קצר)
    const items = listings.slice(0, 12).map((l) => {
      const cat = categoriesMap[l.category_id]?.name || "";
      const sub = categoriesMap[l.subcategory_id]?.name || "";
      return {
        title: (l.title || "").slice(0, 80),
        category: cat,
        subcategory: sub,
        description: (l.description || "").slice(0, 220)
      };
    });

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        top_categories: { type: "array", items: { type: "string" } },
        suggestions: { type: "array", items: { type: "string" } },
        search_keywords: { type: "array", items: { type: "string" } }
      },
      required: ["summary"]
    };

    const prompt = `
את/ה מסייע/ת בעברית (RTL) לקהל דתי/חרדי.
קיבלת רשימת מודעות מועדפות של משתמש. ספק/י סיכום חכם, קטגוריות מובילות, הצעות פעולה עדינות, ומילות חיפוש מוצעות.
אין הבטחות יתר, בלי סלנג או אימוג'י. תן/י טון מקצועי, מכבד וברור.

נתונים (עד 12 פריטים):
${JSON.stringify(items, null, 2)}

מבנה JSON בלבד:
{
  "summary": "סקירה תמציתית בעברית",
  "top_categories": ["קטגוריה א", "קטגוריה ב"],
  "suggestions": ["הצעה 1...", "הצעה 2..."],
  "search_keywords": ["מילת מפתח 1", "מילת מפתח 2"]
}
`.trim();

    try {
      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: schema
      });
      setResult(res || {});
    } catch (e) {
      setError(e?.message || "שגיאה בהפקת הסיכום");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          סיכום חכם של המועדפים
        </CardTitle>
        <Button onClick={handleSummarize} disabled={loading} className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
          {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> יוצר סיכום…</> : <>צור סיכום</>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !error && (
          <p className="text-sm text-slate-600">
            קבלו ניתוח AI קצר של המועדפים: קטגוריות מובילות, רעיונות למה לחפש הלאה והצעות עדינות.
          </p>
        )}

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {result?.summary && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
              <p className="text-slate-800 leading-relaxed">{result.summary}</p>
            </div>
            {Array.isArray(result.top_categories) && result.top_categories.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">קטגוריות מובילות:</div>
                <div className="flex flex-wrap gap-2">
                  {pickTop(result.top_categories).map((c, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(result.search_keywords) && result.search_keywords.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">מילות חיפוש מוצעות:</div>
                <div className="flex flex-wrap gap-2">
                  {pickTop(result.search_keywords).map((kw, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">#{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">הצעות:</div>
                <ul className="list-disc pr-5 text-sm text-slate-700 space-y-1">
                  {pickTop(result.suggestions, 6).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
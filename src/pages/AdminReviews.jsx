import React, { useEffect, useMemo, useState } from "react";
import { Review } from "@/entities/Review";
import { Listing } from "@/entities/Listing";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter, AlertTriangle, Wand2, Eye, EyeOff, RefreshCcw, Search
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { analyzeReview } from "@/functions/analyzeReview";
import { aggregateSmartRatings } from "@/functions/aggregateSmartRatings";
import { createPageUrl } from "@/utils";

export default function AdminReviews() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");

  // Filters
  const [q, setQ] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [toxicityMin, setToxicityMin] = useState(0);
  const [listingId, setListingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await User.me().catch(() => null);
      if (!user || user.role !== "admin") {
        setError("אין הרשאות גישה לעמוד זה");
        setLoading(false);
        return;
      }
      setMe(user);

      const [rv, ls] = await Promise.all([
        Review.filter({}, "-created_date", 500),
        Listing.filter({}, "title", 1000)
      ]);
      setReviews(rv || []);
      setListings(ls || []);
    } catch (e) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const listingMap = useMemo(() => {
    const m = {};
    listings.forEach(l => { m[l.id] = l; });
    return m;
  }, [listings]);

  const filtered = useMemo(() => {
    let arr = Array.isArray(reviews) ? [...reviews] : [];

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      arr = arr.filter(r =>
        String(r.reviewer_name || "").toLowerCase().includes(qq) ||
        String(r.reviewer_email || "").toLowerCase().includes(qq) ||
        String(r.review_text || "").toLowerCase().includes(qq)
      );
    }
    if (onlyFlagged) {
      arr = arr.filter(r => r.is_flagged_ai || r.consistency_flag || (typeof r.toxicity_score === "number" && r.toxicity_score >= 0.7));
    }
    if (typeof toxicityMin === "number" && toxicityMin > 0) {
      arr = arr.filter(r => (typeof r.toxicity_score === "number" ? r.toxicity_score : 0) >= toxicityMin);
    }
    if (listingId) {
      arr = arr.filter(r => r.listing_id === listingId);
    }
    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      arr = arr.filter(r => new Date(r.created_date).getTime() >= fromTs);
    }
    if (dateTo) {
      const toTs = new Date(dateTo).getTime();
      arr = arr.filter(r => new Date(r.created_date).getTime() <= toTs + 24*60*60*1000 - 1);
    }
    return arr;
  }, [reviews, q, onlyFlagged, toxicityMin, listingId, dateFrom, dateTo]);

  const toggleActive = async (review) => {
    await Review.update(review.id, { is_active: !review.is_active });
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_active: !r.is_active } : r));
  };

  const reAnalyze = async (review) => {
    const { data } = await analyzeReview({ review_id: review.id });
    // עדכון חכם של השורה אם התקבל ניתוח
    if (data?.success) {
      const analysis = data.analysis || {};
      setReviews(prev => prev.map(r => r.id === review.id ? {
        ...r,
        sentiment_score: analysis.sentiment_score,
        toxicity_score: analysis.toxicity_score,
        topics: analysis.topics,
        ai_summary: analysis.ai_summary,
        consistency_flag: analysis.consistency_flag,
        is_flagged_ai: analysis.is_flagged_ai,
        detected_language: analysis.detected_language,
        text_length: analysis.text_length ?? r.text_length
      } : r));
      // ריענון דירוג חכם של המודעה
      await aggregateSmartRatings({ listing_id: review.listing_id });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">שגיאה</CardTitle>
          </CardHeader>
          <CardContent className="text-red-700">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl" lang="he">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ניהול ביקורות</h1>
          <Button variant="outline" size="sm" onClick={init} className="ms-auto">
            <RefreshCcw className="w-4 h-4 ml-2" /> רענן
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="חיפוש לפי שם/אימייל/טקסט"
                  className="pr-9"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">סינון לפי מודעה</label>
                <select
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  className="w-full border rounded-md h-9 px-2"
                >
                  <option value="">כל המודעות</option>
                  {listings.map(l => (
                    <option value={l.id} key={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">רעילות מינימלית</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={toxicityMin}
                  onChange={(e) => setToxicityMin(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-slate-600">מעל {toxicityMin.toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="flagged"
                  type="checkbox"
                  checked={onlyFlagged}
                  onChange={(e) => setOnlyFlagged(e.target.checked)}
                />
                <label htmlFor="flagged" className="text-sm text-slate-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> רק ביקורות מסומנות/בעייתיות
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">מתאריך</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">עד תאריך</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-right">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-sm">תאריך</th>
                <th className="px-3 py-2 text-sm">מודעה</th>
                <th className="px-3 py-2 text-sm">מבקר</th>
                <th className="px-3 py-2 text-sm">דירוג</th>
                <th className="px-3 py-2 text-sm">אהבתי</th>
                <th className="px-3 py-2 text-sm">לא אהבתי</th>
                <th className="px-3 py-2 text-sm">רעילות</th>
                <th className="px-3 py-2 text-sm">דגל</th>
                <th className="px-3 py-2 text-sm">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => {
                const l = listingMap[r.listing_id];
                const dateStr = r.created_date ? format(new Date(r.created_date), "d.M.yyyy HH:mm", { locale: he }) : "";
                const tox = typeof r.toxicity_score === "number" ? r.toxicity_score.toFixed(2) : "-";
                const flagged = r.is_flagged_ai || r.consistency_flag || (typeof r.toxicity_score === "number" && r.toxicity_score >= 0.7);

                return (
                  <tr key={r.id} className={r.is_active ? "" : "opacity-60"}>
                    <td className="px-3 py-2 text-sm text-slate-600">{dateStr}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-slate-900">{l?.title || "—"}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[260px]">{(r.review_text || "").slice(0, 80)}</div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium">{r.reviewer_name || r.reviewer_email}</div>
                      <div className="text-xs text-slate-500">{r.reviewer_email}</div>
                    </td>
                    <td className="px-3 py-2 text-sm">{r.rating}</td>
                    <td className="px-3 py-2 text-sm">{r.like_count || 0}</td>
                    <td className="px-3 py-2 text-sm">{r.dislike_count || 0}</td>
                    <td className={`px-3 py-2 text-sm ${Number(r.toxicity_score) >= 0.7 ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                      {tox}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {flagged ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> מסומן
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => reAnalyze(r)} title="ניתוח מחדש" className="rounded-lg">
                          <Wand2 className="w-4 h-4 ml-1" /> ניתוח
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = createPageUrl("Listing") + `?id=${r.listing_id}`} className="rounded-lg">
                          פתיחת מודעה
                        </Button>
                        <Button size="sm" onClick={() => toggleActive(r)} className={`rounded-lg ${r.is_active ? "bg-slate-700 hover:bg-slate-800" : ""}`}>
                          {r.is_active ? (<><EyeOff className="w-4 h-4 ml-1" /> הסתר</>) : (<><Eye className="w-4 h-4 ml-1" /> הצג</>)}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    לא נמצאו ביקורות התואמות לסינון
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
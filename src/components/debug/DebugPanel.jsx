
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, RefreshCcw, ShieldAlert, Bug, X } from "lucide-react";

export default function DebugPanel({
  isAdmin,
  authKey,
  counts,
  selectionState,
  samples,
  onRunServerCheck,
  serverCheckResult,
  onClearCache,
  show = true,
  onClose
}) {
  if (!isAdmin) return null;
  if (!show) return null;

  return (
    <div dir="rtl" className="fixed bottom-4 right-4 z-[120] max-w-[90vw] md:max-w-[32rem]">
      <Card className="border-2 border-amber-300 shadow-xl bg-white/95 backdrop-blur relative">
        {/* כפתור סגירה */}
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-slate-400 hover:text-slate-600"
          aria-label="סגור לוח דיבוג"
          title="סגור לוח דיבוג"
        >
          <X className="w-4 h-4" />
        </button>

        <CardHeader className="pb-2 pr-10">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bug className="w-4 h-4 text-amber-600" />
            לוח דיבוג — עמוד Browse (אדמין בלבד)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          <div className="flex flex-wrap gap-2">
            <div className="px-2 py-1 rounded bg-slate-100">authKey: {authKey}</div>
            <div className="px-2 py-1 rounded bg-slate-100">allListings: {counts.all}</div>
            <div className="px-2 py-1 rounded bg-slate-100">baseFiltered: {counts.base}</div>
            <div className="px-2 py-1 rounded bg-slate-100">groupFiltered: {counts.group}</div>
            <div className="px-2 py-1 rounded bg-slate-100">promoted: {counts.promoted}</div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">מצב בחירה:</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="px-2 py-1 rounded bg-slate-100">קטגוריה: {selectionState.categoryId ?? "—"}</div>
              <div className="px-2 py-1 rounded bg-slate-100">תת־קטגוריה: {selectionState.subcategoryId ?? "—"}</div>
              <div className="px-2 py-1 rounded bg-slate-100">קבוצת מקצוע: {selectionState.profGroupId ?? "—"}</div>
              <div className="px-2 py-1 rounded bg-slate-100">חיפוש: {selectionState.searchTerm || "—"}</div>
            </div>
          </div>

          {samples?.length ? (
            <div>
              <div className="font-semibold mb-1">דגימה (עד 5 פריטים) מסדר התצוגה:</div>
              <ol className="list-decimal pr-5 space-y-1">
                {samples.slice(0, 5).map((x, i) => (
                  <li key={i} className="truncate">
                    #{x.id} · תגובות: {x.reviews_count ?? 0} · {x.title || "ללא כותרת"}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onRunServerCheck} className="rounded-lg">
              <ShieldAlert className="w-4 h-4 ml-1" />
              בדיקת שרת (RLS)
            </Button>
            <Button size="sm" variant="outline" onClick={onClearCache} className="rounded-lg">
              <RefreshCcw className="w-4 h-4 ml-1" />
              נקה קאש מקומי
            </Button>
          </div>

          {serverCheckResult && (
            <div className="mt-2 border rounded p-2 bg-slate-50">
              <div className="font-semibold mb-1">תוצאת שרת:</div>
              {serverCheckResult.success ? (
                <div className="space-y-1">
                  <div>משתמש: {serverCheckResult.me?.email} · תפקיד: {serverCheckResult.me?.role}</div>
                  <div>סקופ משתמש — כמות: {serverCheckResult.user_scope?.count}</div>
                  {serverCheckResult.service_scope ? (
                    <div>Service Role — כמות: {serverCheckResult.service_scope?.count}</div>
                  ) : (
                    <div className="text-slate-500">Service Role — זמין רק לאדמין</div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">שגיאה: {serverCheckResult.error || "לא ידועה"}</div>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            טיפ: ניתן להציג/להסתיר פאנל זה ע״י הוספת ?debug=1 לכתובת העמוד.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

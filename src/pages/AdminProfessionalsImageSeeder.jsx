import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { seedProfessionalSubcategoryImages } from "@/functions/seedProfessionalSubcategoryImages";

export default function AdminProfessionalsImageSeeder() {
  const [me, setMe] = useState(null);
  const [authErr, setAuthErr] = useState("");
  const [parent, setParent] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [force, setForce] = useState(false);
  const [limit, setLimit] = useState(24);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        if (u.role !== "admin") {
          setAuthErr("אין לך הרשאה לעמוד זה");
          return;
        }
        setMe(u);

        const all = await Category.list();
        const parentCat = all.find(c => !c.parent_id && /אנשי\s*מקצוע/.test(c.name || ""));
        setParent(parentCat || null);
        setSubs(all.filter(c => parentCat && c.parent_id === parentCat.id));
      } catch (e) {
        setAuthErr("שגיאת הרשאה או רשת");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authErr) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{authErr}</AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!me || loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        טוען...
      </div>
    );
  }

  const missing = subs.filter(s => !s.image);
  const targetsCount = force ? subs.length : missing.length;

  const run = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const { data } = await seedProfessionalSubcategoryImages({
        force,
        limit: Number(limit) || 24
      });
      setResult(data || null);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-50" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
              יצירת תמונות לתתי־קטגוריות – אנשי מקצוע
            </h1>
            <p className="text-sm text-slate-600">
              יצירת תמונות AI נקיות ומכבדות לכל התתי־קטגוריות תחת "{parent?.name || "אנשי מקצוע"}".
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">הגדרות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold">יצירה בכפייה (כולל מי שכבר יש תמונה)</div>
                <div className="text-slate-500 text-xs">סימון יגרום להחליף תמונות קיימות.</div>
              </div>
              <Switch checked={force} onCheckedChange={setForce} />
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">כמות מקסימלית</div>
              <Input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-36"
              />
            </div>

            <div className="text-xs text-slate-600">
              מיועדים לעדכון: {targetsCount} / {subs.length} תתי־קטגוריות
              {!force && missing.length > 0 ? ` (חסרות תמונה: ${missing.length})` : ""}
            </div>

            <Button onClick={run} disabled={running || targetsCount === 0} className="rounded-xl">
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  יוצר תמונות...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  הפעל יצירה
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">תתי־קטגוריות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subs.map((s) => (
                <div key={s.id} className="rounded-xl border bg-white overflow-hidden">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center">
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="px-2 py-2 text-sm font-semibold text-slate-800 truncate">{s.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">תוצאות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-slate-700">
                עודכנו: {Array.isArray(result.results) ? result.results.filter(r => r.status === "ok").length : 0}/
                {result.processed}
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border bg-white">
                <table className="w-full text-left text-xs" dir="rtl">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2">שם</th>
                      <th className="p-2">סטטוס</th>
                      <th className="p-2">תמונה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results?.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">
                          {r.status === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> עודכן
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-3.5 h-3.5" /> כשל
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">פתיחה</a> : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
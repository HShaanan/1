import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, CheckCircle, AlertTriangle, Calendar } from "lucide-react";

export default function AdminDeleteRecentPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    const confirmed = window.confirm(
      "⚠️ האם אתה בטוח שברצונך למחוק את כל עמודי העסק שנוצרו בשבוע האחרון?\n\n" +
      "פעולה זו בלתי הפיכה!"
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "אישור שני: פעולה זו תמחק לצמיתות את כל העסקים החדשים.\n\n" +
      "האם אתה בטוח לחלוטין?"
    );

    if (!doubleConfirm) return;

    setIsRunning(true);
    setError("");
    setResults(null);

    try {
      const response = await base44.functions.invoke('deleteRecentBusinessPages', {});
      const data = response?.data;

      if (data?.success) {
        setResults(data.results);
      } else {
        setError(data?.error || "שגיאה לא ידועה");
      }
    } catch (err) {
      setError("שגיאה בהרצת התהליך: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-600 to-rose-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Trash2 className="w-6 h-6" />
              מחיקת עסקים שנוספו בשבוע האחרון
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Alert variant="destructive" className="bg-red-50 border-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-bold">
                ⚠️ אזהרה: פעולה זו בלתי הפיכה ותמחק לצמיתות את כל עמודי העסק שנוצרו ב-7 הימים האחרונים!
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                מה יימחק:
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                  <span>כל עמודי העסק שנוצרו מ-{new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')} ועד היום</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>עסקים ישנים יותר לא יושפעו</span>
                </li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {results && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="space-y-3">
                    <p className="font-bold text-lg">✅ המחיקה הושלמה!</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>סה"כ נסרקו: {results.total_scanned}</p>
                      <p>נמצאו חדשים: {results.found_recent}</p>
                      <p className="font-bold text-red-700">נמחקו: {results.deleted}</p>
                      {results.errors.length > 0 && (
                        <p className="text-red-600">שגיאות: {results.errors.length}</p>
                      )}
                    </div>
                    
                    {results.deleted_pages.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-medium hover:text-green-700">
                          הצג רשימת עסקים שנמחקו ({results.deleted_pages.length})
                        </summary>
                        <div className="mt-2 max-h-64 overflow-y-auto bg-white rounded border p-3 space-y-1">
                          {results.deleted_pages.map((page, idx) => (
                            <div key={idx} className="text-xs text-slate-700">
                              • {page.name} - נוצר ב-{new Date(page.created_date).toLocaleDateString('he-IL')}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-6 text-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מוחק עסקים...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 ml-2" />
                  מחק עסקים מהשבוע האחרון
                </>
              )}
            </Button>

            {results?.errors?.length > 0 && (
              <div className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-bold text-red-900 mb-2">שגיאות במחיקה:</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-800">
                      {err.business_name}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, Loader2, CheckCircle, AlertTriangle, Zap } from "lucide-react";

export default function AdminBulkImprovePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleRunBulkImprove = async () => {
    const confirmed = window.confirm(
      "האם אתה בטוח שברצונך להריץ שיפור אוטומטי על כל עמודי העסק?\n\n" +
      "התהליך יכול לקחת מספר דקות."
    );

    if (!confirmed) return;

    setIsRunning(true);
    setError("");
    setResults(null);

    try {
      const response = await base44.functions.invoke('bulkImproveBusinessPages', {});
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
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Zap className="w-6 h-6" />
              שיפור אוטומטי לכל עמודי העסק
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">מה התהליך יעשה:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>תיקון אוטומטי של פורמט שעות פעילות (המרה מטקסט ל-JSON)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>שיפור תוכן עם AI לעסקים עם תיאור חסר או קצר</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>הוספת כותרות, הודעות ווטסאפ ותגיות מותאמות</span>
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
                  <div className="space-y-2">
                    <p className="font-bold">✅ התהליך הושלם בהצלחה!</p>
                    <p>סה"כ עסקים: {results.total}</p>
                    <p>שופרו עם AI: {results.improved}</p>
                    <p>תוקנו שעות: {results.fixed_hours}</p>
                    {results.errors.length > 0 && (
                      <p className="text-red-600">שגיאות: {results.errors.length}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRunBulkImprove}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מריץ שיפור אוטומטי...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 ml-2" />
                  הרץ שיפור אוטומטי
                </>
              )}
            </Button>

            {results?.errors?.length > 0 && (
              <div className="border rounded-lg p-4 bg-red-50">
                <h4 className="font-bold text-red-900 mb-2">שגיאות:</h4>
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
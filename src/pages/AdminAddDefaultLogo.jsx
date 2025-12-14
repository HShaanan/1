import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageIcon, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminAddDefaultLogoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    const confirmed = window.confirm(
      "האם אתה בטוח שברצונך להוסיף לוגו ברירת מחדל לכל העסקים שאין להם לוגו?\n\n" +
      "התהליך יעדכן רק עסקים ללא לוגו קיים."
    );

    if (!confirmed) return;

    setIsRunning(true);
    setError("");
    setResults(null);

    try {
      const response = await base44.functions.invoke('addDefaultLogoToBusinesses', {});
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
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <ImageIcon className="w-6 h-6" />
              הוספת לוגו ברירת מחדל לעסקים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">מה התהליך יעשה:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>הוספת לוגו ברירת מחדל לכל העסקים שאין להם לוגו</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>הגדרת zoom קטן (0.85) למיקום אופטימלי של הלוגו</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>דילוג על עסקים שכבר יש להם לוגו</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3 font-medium">תצוגה מקדימה של הלוגו:</p>
              <div className="flex justify-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/3f9cfac9b_Gemini_Generated_Image_xr0kiexr0kiexr0k.png"
                  alt="לוגו ברירת מחדל"
                  className="w-32 h-32 object-contain rounded-xl border shadow-md"
                />
              </div>
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
                    <p>עודכנו: {results.updated}</p>
                    <p>דולגו (יש כבר לוגו): {results.skipped}</p>
                    {results.errors.length > 0 && (
                      <p className="text-red-600">שגיאות: {results.errors.length}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מעדכן לוגואים...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 ml-2" />
                  הוסף לוגו ברירת מחדל
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
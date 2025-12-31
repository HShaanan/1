import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, Wand2, Database, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminDataQuality() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleGenerateSlugs = async () => {
    const confirmed = confirm(
      "⚠️ פעולה זו תיצור url_slug ייחודי לכל עסק שאין לו.\n\n" +
      "זה יכול לקחת כמה דקות.\n\n" +
      "להמשיך?"
    );
    
    if (!confirmed) return;

    setIsProcessing(true);
    setError("");
    setResults(null);

    try {
      console.log('🚀 Starting slug generation...');
      
      const { data } = await base44.functions.invoke('generateMissingUrlSlugs', {});
      
      console.log('📊 Results:', data);

      if (data.success) {
        setResults(data.results);
        
        const msg = `✅ הושלם בהצלחה!\n\n` +
          `📊 סיכום:\n` +
          `• סה"כ עסקים: ${data.results.total}\n` +
          `• היו להם slug: ${data.results.already_had_slug}\n` +
          `• נוצרו חדשים: ${data.results.generated}\n` +
          `• כשלונות: ${data.results.failed.length}\n\n` +
          `בדוק את הקונסול (F12) לפרטים מלאים.`;
        
        alert(msg);
      } else {
        setError(data.error || 'שגיאה לא ידועה');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError('שגיאה ביצירת slugs: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">איכות נתונים ותחזוקה</h1>
            <p className="text-slate-600">כלים לתיקון ושיפור נתוני המערכת</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* URL Slugs Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              יצירת URL Slugs אוטומטית
            </CardTitle>
            <CardDescription>
              יוצר url_slug ייחודי וידידותי לכל עסק שחסר לו. זה חיוני ל-SEO ולשיתוף קישורים.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">מה זה עושה?</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>עובר על כל עמודי העסק במערכת</li>
                <li>מזהה עסקים בלי url_slug או עם ID כ-slug</li>
                <li>יוצר slug ייחודי מתוך: שם-עסק-עיר-מזהה</li>
                <li>מוודא שאין כפילויות</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerateSlugs}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מעבד... (זה יכול לקחת כמה דקות)
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 ml-2" />
                  הפעל יצירת Slugs
                </>
              )}
            </Button>

            {results && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-900">תוצאות</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-slate-600">סה"כ עסקים</div>
                    <div className="text-2xl font-bold text-slate-900">{results.total}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-slate-600">היו להם slug</div>
                    <div className="text-2xl font-bold text-blue-600">{results.already_had_slug}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-slate-600">נוצרו חדשים</div>
                    <div className="text-2xl font-bold text-green-600">{results.generated}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-slate-600">כשלונות</div>
                    <div className="text-2xl font-bold text-red-600">{results.failed.length}</div>
                  </div>
                </div>

                {results.slugs_created.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-green-900 mb-2">דוגמאות ל-slugs שנוצרו:</h4>
                    <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto space-y-1">
                      {results.slugs_created.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">{item.business_name}</span>
                          <span className="text-slate-500"> → </span>
                          <span className="text-green-700 font-mono">{item.new_slug}</span>
                        </div>
                      ))}
                      {results.slugs_created.length > 10 && (
                        <div className="text-xs text-slate-500 italic">
                          ועוד {results.slugs_created.length - 10}...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* הוראות שימוש */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              הוראות שימוש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>לחץ על "הפעל יצירת Slugs" למעלה</li>
              <li>המתן עד שהתהליך יסתיים (יכול לקחת 2-3 דקות)</li>
              <li>בדוק את התוצאות בטבלה</li>
              <li>עבור לעמוד ניהול עסקים ורענן - כל העסקים אמורים להיות נגישים כעת</li>
              <li>נסה לגשת לכמה עסקים שיובאו מ-Excel/Google Places</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
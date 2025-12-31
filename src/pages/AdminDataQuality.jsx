import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Database, AlertTriangle, CheckCircle2, Link as LinkIcon, 
  Shield, Loader2, RefreshCw, Zap 
} from "lucide-react";

export default function AdminDataQuality() {
  const [slugResults, setSlugResults] = useState(null);
  const [kashrutResults, setKashrutResults] = useState(null);
  const [isFixingSlugs, setIsFixingSlugs] = useState(false);
  const [isAuditingKashrut, setIsAuditingKashrut] = useState(false);
  const [isFixingKashrut, setIsFixingKashrut] = useState(false);
  const [error, setError] = useState("");

  const handleFixSlugs = async () => {
    setIsFixingSlugs(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke('fixMissingUrlSlugs', {});
      
      if (data.success) {
        setSlugResults(data.results);
        alert(`✅ תוקנו ${data.results.fixed} עסקים!\n\n` +
              `• סה"כ עסקים: ${data.results.total}\n` +
              `• תוקנו: ${data.results.fixed}\n` +
              `• תקינים: ${data.results.alreadyOk}\n` +
              `• שגיאות: ${data.results.errors.length}`);
      } else {
        setError(data.error || "שגיאה בתיקון");
      }
    } catch (err) {
      setError("שגיאה: " + err.message);
    } finally {
      setIsFixingSlugs(false);
    }
  };

  const handleAuditKashrut = async (autoFix = false) => {
    if (autoFix) {
      setIsFixingKashrut(true);
    } else {
      setIsAuditingKashrut(true);
    }
    setError("");

    try {
      const { data } = await base44.functions.invoke('auditKashrutData', { autoFix });
      
      if (data.success) {
        setKashrutResults(data.results);
        
        let msg = `📊 דוח כשרות:\n\n` +
                  `• סה"כ עסקים: ${data.results.total}\n` +
                  `• עם כשרות: ${data.results.withKashrut}\n` +
                  `• עקבי: ${data.results.consistent}\n` +
                  `• לא עקבי: ${data.results.inconsistent}`;
        
        if (autoFix) {
          msg += `\n\n✅ תוקנו: ${data.results.fixed} עסקים`;
        }
        
        alert(msg);
      } else {
        setError(data.error || "שגיאה בביקורת");
      }
    } catch (err) {
      setError("שגיאה: " + err.message);
    } finally {
      setIsAuditingKashrut(false);
      setIsFixingKashrut(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">ניהול איכות נתונים</h1>
        </div>
        <p className="text-gray-600">
          כלים לבדיקה ותיקון עקביות הנתונים במערכת
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* קלף תיקון URL Slugs */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">תיקון כתובות URL</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            מזהה ומתקן עסקים ללא url_slug תקין. יוצר slugs ייחודיים וקריאים מ-business_name.
          </p>

          <Button
            onClick={handleFixSlugs}
            disabled={isFixingSlugs}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isFixingSlugs ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מתקן...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 ml-2" />
                תקן URL Slugs
              </>
            )}
          </Button>

          {slugResults && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">סה"כ עסקים:</span>
                <Badge variant="outline">{slugResults.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">תוקנו:</span>
                <Badge className="bg-green-100 text-green-800">{slugResults.fixed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">תקינים:</span>
                <Badge>{slugResults.alreadyOk}</Badge>
              </div>
              {slugResults.errors.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">שגיאות:</span>
                  <Badge variant="destructive">{slugResults.errors.length}</Badge>
                </div>
              )}
              {slugResults.duplicates.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ כפילויות שנמצאו:</p>
                  {slugResults.duplicates.map((dup, idx) => (
                    <p key={idx} className="text-xs text-yellow-700">
                      • {dup.slug} ({dup.count} עסקים)
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* קלף ביקורת כשרות */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">ביקורת נתוני כשרות</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            בודק עקביות בין נתוני כשרות בעסקים לבין הרשימה הרשמית. מזהה שגיאות כתיב ושמות לא תקינים.
          </p>

          <div className="space-y-2">
            <Button
              onClick={() => handleAuditKashrut(false)}
              disabled={isAuditingKashrut || isFixingKashrut}
              variant="outline"
              className="w-full"
            >
              {isAuditingKashrut ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  בודק...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  בדוק עקביות
                </>
              )}
            </Button>

            <Button
              onClick={() => handleAuditKashrut(true)}
              disabled={isAuditingKashrut || isFixingKashrut}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isFixingKashrut ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מתקן...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 ml-2" />
                  בדוק ותקן אוטומטית
                </>
              )}
            </Button>
          </div>

          {kashrutResults && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">סה"כ עסקים:</span>
                <Badge variant="outline">{kashrutResults.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">עם כשרות:</span>
                <Badge>{kashrutResults.withKashrut}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">עקבי:</span>
                <Badge className="bg-green-100 text-green-800">{kashrutResults.consistent}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">לא עקבי:</span>
                <Badge className="bg-orange-100 text-orange-800">{kashrutResults.inconsistent}</Badge>
              </div>
              {kashrutResults.fixed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">תוקנו:</span>
                  <Badge className="bg-blue-100 text-blue-800">{kashrutResults.fixed}</Badge>
                </div>
              )}
              
              {kashrutResults.issues.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-2">בעיות שנמצאו:</p>
                  {kashrutResults.issues.slice(0, 10).map((issue, idx) => (
                    <div key={idx} className="text-xs text-gray-600 mb-1 p-2 bg-white rounded border">
                      <p className="font-semibold">{issue.business}</p>
                      <p className="text-red-600">נוכחי: {issue.current}</p>
                      {issue.suggested && (
                        <p className="text-green-600">מוצע: {issue.suggested}</p>
                      )}
                      <p className="text-gray-500 italic">{issue.issue}</p>
                    </div>
                  ))}
                  {kashrutResults.issues.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ועוד {kashrutResults.issues.length - 10} בעיות...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* הוראות שימוש */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          מדריך שימוש
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>תיקון URL Slugs:</strong> לחץ על "תקן URL Slugs" כדי לזהות ולתקן עסקים עם url_slug חסר או לא תקין. המערכת תיצור slugs ייחודיים וקריאים.
          </li>
          <li>
            <strong>ביקורת כשרות:</strong> לחץ על "בדוק עקביות" כדי לראות דוח מפורט על חוסר עקביות בנתוני כשרות.
          </li>
          <li>
            <strong>תיקון אוטומטי כשרות:</strong> לחץ על "בדוק ותקן אוטומטית" כדי לתקן באופן אוטומטי שגיאות כתיב קלות (אותיות גדולות/קטנות, רווחים).
          </li>
        </ul>
      </div>
    </div>
  );
}
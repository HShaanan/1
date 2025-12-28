import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, Loader2, CheckCircle, AlertTriangle, 
  Search, FileText, Link as LinkIcon 
} from "lucide-react";

export default function AdminIndexingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmitToGoogle = async () => {
    if (!window.confirm('זה ישלח את כל כתובות ה-URL של האתר ל-Google Indexing API. להמשיך?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const response = await base44.functions.invoke('submitUrlsToGoogleIndexing', {});
      
      if (response.data?.success) {
        setResults(response.data);
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Indexing error:', err);
      setError(err.response?.data?.error || err.message || 'שגיאה לא ידועה');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Globe className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Google Indexing API
            </h1>
            <p className="text-gray-600">שליחת כתובות URL לאינדוקס של Google</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="font-bold mb-2">✅ תהליך הושלם בהצלחה!</div>
              <div className="text-sm space-y-1">
                <div>סך הכל URLs: {results.summary?.total || 0}</div>
                <div className="text-green-700">✓ נשלחו בהצלחה: {results.summary?.success || 0}</div>
                {results.summary?.failed > 0 && (
                  <div className="text-red-700">✗ נכשלו: {results.summary?.failed || 0}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Search className="w-5 h-5" />
                מה זה עושה?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>⚡ אוסף את כל ה-URLs של האתר:</p>
              <ul className="mr-4 space-y-1">
                <li>• דף הבית ודפים סטטיים</li>
                <li>• כל עמודי העסקים הפעילים</li>
                <li>• דפי קטגוריות דינמיים</li>
                <li>• דפי נחיתה (Landing Pages)</li>
              </ul>
              <p className="mt-4">📤 שולח אותם ל-Google Indexing API לאינדוקס מהיר</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <FileText className="w-5 h-5" />
                דרישות טכניות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>✅ Service Account credentials מוגדרים ב-GOOGLE_INDEXING_CREDENTIALS</p>
              <p>✅ Web Search Indexing API מופעל ב-Google Cloud</p>
              <p>✅ Service Account email נוסף כ-Owner ב-Search Console</p>
              <p className="text-xs text-slate-500 mt-4">
                * התהליך עשוי לקחת מספר דקות תלוי בכמות ה-URLs
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              שליחה לאינדוקס
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSubmitToGoogle}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  שולח ל-Google Indexing API...
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 ml-2" />
                  שלח את כל כתובות האתר ל-Google
                </>
              )}
            </Button>

            {results && results.results && (
              <div className="mt-6 max-h-96 overflow-y-auto border rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold mb-3 text-slate-800">פירוט מלא:</h3>
                <div className="space-y-2 text-xs">
                  {results.results.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2 rounded ${
                        item.status === 'success' 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <div className="font-mono break-all">{item.url}</div>
                      {item.status === 'error' && (
                        <div className="text-xs mt-1 text-red-600">שגיאה: {item.error}</div>
                      )}
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
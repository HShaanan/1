import React, { useState } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importBusinessesFromPlaces } from "@/functions/importBusinessesFromPlaces";
import { MapPin, Loader2, CheckCircle, AlertTriangle, Download } from "lucide-react";

export default function AdminImportPlacesPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [location, setLocation] = useState("Beitar Illit, Israel");
  const [radius, setRadius] = useState(5000);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  React.useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await User.me();
      if (!userData || userData.role !== 'admin') {
        setError("אין לך הרשאות גישה לעמוד זה");
        return;
      }
      setUser(userData);
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError("");
    setResult(null);

    try {
      const { data } = await importBusinessesFromPlaces({
        location,
        radius: parseInt(radius)
      });

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "שגיאה בייבוא העסקים");
      }
    } catch (err) {
      setError("שגיאה בתקשורת עם השרת: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Download className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ייבוא עסקים מ-Google Places</h1>
            <p className="text-gray-600">ייבוא אוטומטי של עסקים מאזור גיאוגרפי מסוים</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>הגדרות ייבוא</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">מיקום</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="לדוגמה: Beitar Illit, Israel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">רדיוס (מטרים)</label>
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 mt-1">
                המרחק המקסימלי מהמיקום המרכזי (עד 50,000 מטר)
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={isImporting || !location}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייבא עסקים...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 ml-2" />
                  התחל ייבוא
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                הייבוא הושלם בהצלחה!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">סך הכל נמצאו</div>
                  <div className="text-2xl font-bold text-gray-900">{result.total_found}</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">יובאו בהצלחה</div>
                  <div className="text-2xl font-bold text-green-600">{result.imported.length}</div>
                </div>
              </div>

              {result.imported.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">עסקים שיובאו:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {result.imported.map((item, i) => (
                      <div key={i} className="text-sm bg-white p-2 rounded flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">שגיאות:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((item, i) => (
                      <div key={i} className="text-sm bg-orange-50 p-2 rounded flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span>{item.name}: {item.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                  💡 העסקים שיובאו נמצאים בסטטוס "ממתין לאישור". 
                  עבור לעמוד ניהול עסקים כדי לאשר אותם.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
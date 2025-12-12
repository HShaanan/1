import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { debugBusinessOwnership } from "@/functions/debugBusinessOwnership";
import { fixBusinessOwnership } from "@/functions/fixBusinessOwnership";

export default function AdminBusinessOwnershipPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [businessPageId, setBusinessPageId] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [debugData, setDebugData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleDebug = async () => {
    if (!businessPageId.trim()) {
      setError("נא להזין מזהה עמוד עסק");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");
    setDebugData(null);

    try {
      const { data } = await debugBusinessOwnership({ business_page_id: businessPageId.trim() });
      
      if (data.success) {
        setDebugData(data.data);
        setNewOwnerEmail(data.data.business_owner_email || "");
      } else {
        setError(data.error || "שגיאה בטעינת נתונים");
      }
    } catch (err) {
      setError(err.message || "שגיאה בביצוע הבדיקה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFix = async () => {
    if (!businessPageId.trim() || !newOwnerEmail.trim()) {
      setError("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } = await fixBusinessOwnership({ 
        business_page_id: businessPageId.trim(),
        new_owner_email: newOwnerEmail.trim()
      });
      
      if (data.success) {
        setMessage(data.message);
        // רענן את הנתונים
        await handleDebug();
      } else {
        setError(data.error || "שגיאה בעדכון הבעלות");
      }
    } catch (err) {
      setError(err.message || "שגיאה בעדכון הבעלות");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">ניהול בעלות עסקים</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>שלב 1: בדיקת עמוד עסק</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>מזהה עמוד עסק (ID)</Label>
              <Input
                value={businessPageId}
                onChange={(e) => setBusinessPageId(e.target.value)}
                placeholder="לדוגמה: 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>
            <Button onClick={handleDebug} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Search className="w-4 h-4 ml-2" />}
              בדוק עמוד עסק
            </Button>
          </CardContent>
        </Card>

        {debugData && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>פרטי עמוד העסק</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-semibold">שם העסק:</div>
                    <div>{debugData.business_name}</div>

                    <div className="font-semibold">מספר סידורי:</div>
                    <div>{debugData.serial_number}</div>

                    <div className="font-semibold">בעלים נוכחי:</div>
                    <div className="font-mono text-xs bg-slate-100 p-2 rounded">
                      {debugData.business_owner_email || "(לא מוגדר)"}
                    </div>

                    <div className="font-semibold">בעלים (lowercase):</div>
                    <div className="font-mono text-xs bg-slate-100 p-2 rounded">
                      {debugData.business_owner_email_lowercase || "(לא מוגדר)"}
                    </div>

                    <div className="font-semibold">אורך אימייל:</div>
                    <div>{debugData.business_owner_email_length} תווים</div>

                    <div className="font-semibold">נוצר על ידי:</div>
                    <div className="font-mono text-xs">{debugData.created_by || "(לא מוגדר)"}</div>

                    <div className="font-semibold">תאריך יצירה:</div>
                    <div>{new Date(debugData.created_date).toLocaleString('he-IL')}</div>

                    <div className="font-semibold">סטטוס אישור:</div>
                    <div>{debugData.approval_status}</div>

                    <div className="font-semibold">פעיל:</div>
                    <div>{debugData.is_active ? "כן" : "לא"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>שלב 2: עדכון בעלות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>אימייל בעלים חדש</Label>
                  <Input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    dir="ltr"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    הזן את כתובת האימייל המלאה של הבעלים החדש
                  </p>
                </div>
                <Button onClick={handleFix} disabled={isLoading} variant="default">
                  {isLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                  עדכן בעלות
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
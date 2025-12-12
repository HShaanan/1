import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Save, AlertTriangle, Loader2, MapPin, ChevronLeft
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function EditBusinessBasicsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    business_name: "",
    display_title: "",
    description: "",
    contact_phone: "",
    whatsapp_phone: "",
    website_url: "",
    address: "",
    whatsapp_message: "",
    whatsapp_button_text: "",
  });

  useEffect(() => {
    const loadData = async () => {
      let currentUser;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (!pageId) {
        setError("לא נמצא מזהה עמוד עסק");
        setIsLoading(false);
        return;
      }

      try {
        const pageData = await base44.entities.BusinessPage.filter({ id: pageId });
        const page = Array.isArray(pageData) ? pageData[0] : pageData;

        if (!page) {
          setError("עמוד העסק לא נמצא");
          setIsLoading(false);
          return;
        }

        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          setError("אין לך הרשאה לערוך עמוד עסק זה");
          setIsLoading(false);
          return;
        }

        setBusinessPage(page);
        setForm({
          business_name: page.business_name || "",
          display_title: page.display_title || "",
          description: page.description || "",
          contact_phone: page.contact_phone || "",
          whatsapp_phone: page.whatsapp_phone || "",
          website_url: page.website_url || "",
          address: page.address || "",
          whatsapp_message: page.whatsapp_message || "",
          whatsapp_button_text: page.whatsapp_button_text || "",
        });

      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updateData = {
        business_name: form.business_name.trim(),
        display_title: form.display_title.trim(),
        description: form.description.trim(),
        contact_phone: form.contact_phone.trim(),
        whatsapp_phone: form.whatsapp_phone?.trim() || null,
        website_url: form.website_url.trim() || null,
        address: form.address.trim() || null,
        whatsapp_message: form.whatsapp_message?.trim() || null,
        whatsapp_button_text: form.whatsapp_button_text?.trim() || null,
      };

      await base44.entities.BusinessPage.update(pageId, updateData);
      setSuccessMessage("הפרטים נשמרו בהצלחה!");

      setTimeout(() => {
        window.location.href = createPageUrl(`BusinessManage?id=${pageId}`);
      }, 1500);

    } catch (err) {
      setError("שגיאה בשמירה: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !businessPage) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = createPageUrl(`BusinessManage?id=${pageId}`)}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
                חזרה
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  פרטים בסיסיים
                </h1>
                <p className="text-gray-500 mt-1">
                  {businessPage?.business_name || "טוען..."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>

          {successMessage && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-900">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>פרטים בסיסיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם העסק *</label>
                <Input
                  value={form.business_name}
                  onChange={(e) => setForm(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="שם העסק"
                  dir="rtl"
                  className="text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">כותרת תצוגה *</label>
                <Input
                  value={form.display_title}
                  onChange={(e) => setForm(prev => ({ ...prev, display_title: e.target.value }))}
                  placeholder="כותרת לתצוגה"
                  dir="rtl"
                  className="text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תיאור העסק *</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תאר את העסק שלך..."
                rows={4}
                dir="rtl"
                className="text-right"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4" />
                כתובת
              </Label>
              <Input
                value={form.address}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="כתובת העסק"
                dir="rtl"
                className="text-right"
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-bold">פרטי התקשרות</h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  טלפון להתקשרות *
                </label>
                <Input
                  type="tel"
                  value={form.contact_phone || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="050-1234567"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  טלפון לווטסאפ (אופציונלי)
                </label>
                <Input
                  type="tel"
                  value={form.whatsapp_phone || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
                  placeholder="050-7654321 (אם שונה מטלפון ההתקשרות)"
                  className="text-right"
                  dir="rtl"
                />
                <p className="text-xs text-slate-500 mt-1">
                  אם לא תמלא, ישתמש במספר ההתקשרות
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  הודעת ברירת מחדל (ווטסאפ)
                </label>
                <Textarea
                  value={form.whatsapp_message || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, whatsapp_message: e.target.value }))}
                  placeholder="שלום, אני מעוניין לקבל מידע נוסף..."
                  className="text-right min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  טקסט כפתור ווטסאפ
                </label>
                <Input
                  type="text"
                  value={form.whatsapp_button_text || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, whatsapp_button_text: e.target.value }))}
                  placeholder="שלח הודעה בווטסאפ"
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold mb-4">אתר אינטרנט</h3>
              <Input
                type="url"
                value={form.website_url || ""}
                onChange={(e) => setForm(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://www.example.com"
                className="text-right"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
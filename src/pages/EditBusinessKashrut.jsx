import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save, AlertTriangle, Loader2, Shield, ChevronLeft
} from "lucide-react";
import { createPageUrl } from "@/utils";
import KashrutBox from "@/components/kashrut/KashrutBox";

export default function EditBusinessKashrutPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    kashrut_authority_type: "",
    kashrut_authority_name: "",
    kashrut_rabbinate_city: "",
    kashrut_logo_url: "",
    kashrut_certificate_urls: []
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
          kashrut_authority_type: page.kashrut_authority_type || "",
          kashrut_authority_name: page.kashrut_authority_name || "",
          kashrut_rabbinate_city: page.kashrut_rabbinate_city || "",
          kashrut_logo_url: page.kashrut_logo_url || "",
          kashrut_certificate_urls: Array.isArray(page.kashrut_certificate_urls) ? page.kashrut_certificate_urls : []
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
      await base44.entities.BusinessPage.update(pageId, {
        kashrut_authority_type: form.kashrut_authority_type || null,
        kashrut_authority_name: form.kashrut_authority_name || null,
        kashrut_rabbinate_city: form.kashrut_rabbinate_city || null,
        kashrut_logo_url: form.kashrut_logo_url || null,
        kashrut_certificate_urls: Array.isArray(form.kashrut_certificate_urls) ? form.kashrut_certificate_urls : []
      });
      
      setSuccessMessage("פרטי הכשרות נשמרו בהצלחה!");

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
                  ניהול כשרות
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
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              הכשר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KashrutBox
              businessPage={form}
              canEdit={true}
              mode="local"
              onUpdated={(patch) => setForm(prev => ({ ...prev, ...patch }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
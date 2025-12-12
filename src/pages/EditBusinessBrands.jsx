import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save, AlertTriangle, Loader2, Sparkles, ChevronLeft, Plus, X
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function EditBusinessBrandsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [brandsLogos, setBrandsLogos] = useState([]);

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
        setBrandsLogos(Array.isArray(page.brands_logos) ? page.brands_logos : []);

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
        brands_logos: Array.isArray(brandsLogos) ? brandsLogos : []
      });
      
      setSuccessMessage("סרגל המותגים נשמר בהצלחה!");

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
                  סרגל מותגים
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

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">סרגל מותגים (אופציונלי)</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            הוסף לוגואים של מותגים/ספקים איתם אתה עובד. הלוגואים יוצגו בקרוסלה מתגלגלת בעמוד העסק.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {(brandsLogos || []).map((logo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-white">
                  <img
                    src={logo}
                    alt={`לוגו מותג ${index + 1}`}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newLogos = [...brandsLogos];
                    newLogos.splice(index, 1);
                    setBrandsLogos(newLogos);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;

                  try {
                    const uploadPromises = files.map(async (file) => {
                      const res = await base44.integrations.Core.UploadFile({ file });
                      const url = res?.data?.file_url || res?.file_url || null;
                      if (!url) {
                        console.error('No file_url in response:', res);
                        throw new Error('לא התקבל URL לקובץ שהועלה');
                      }
                      return url;
                    });

                    const uploadedUrls = await Promise.all(uploadPromises);
                    setBrandsLogos(prev => [...prev, ...uploadedUrls]);
                  } catch (error) {
                    console.error("Error uploading logos:", error);
                    setError("שגיאה בהעלאת לוגואים: " + (error.message || ""));
                  }
                }}
              />
              <Plus className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-xs text-slate-600">הוסף לוגו</span>
            </label>
          </div>

          {(brandsLogos || []).length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-800 font-medium">
                💡 הלוגואים יוצגו בקרוסלה מתגלגלת בעמוד העסק
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
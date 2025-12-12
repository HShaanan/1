import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save, AlertTriangle, Loader2, UtensilsCrossed, ChevronLeft, Plus, Sparkles
} from "lucide-react";
import { createPageUrl } from "@/utils";
import MenuBuilder from "@/components/wizard/fields/MenuBuilder";

export default function EditBusinessMenuPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [menu, setMenu] = useState(null);

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
        setMenu(page.special_fields?.menu || null);

      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const cleanMenuImages = async (menu) => {
    if (!menu || !Array.isArray(menu)) return menu;

    const cleanedMenu = [];

    for (const category of menu) {
      const cleanedCategory = { ...category, items: [] };

      for (const item of category.items || []) {
        const cleanedItem = { ...item };

        if (cleanedItem.image && typeof cleanedItem.image === 'string' && cleanedItem.image.startsWith('data:')) {
          try {
            const mimeMatch = cleanedItem.image.match(/^data:(.*?);base64,/);
            const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/png';
            const fileExtension = mimeType.split('/')[1] || 'png';

            const blob = await fetch(cleanedItem.image).then(r => r.blob());
            const file = new File([blob], `${cleanedItem.name || 'item'}.${fileExtension}`, { type: mimeType });

            const res = await base44.integrations.Core.UploadFile({ file });
            const url = res?.data?.file_url || res?.file_url;

            if (url) {
              cleanedItem.image = url;
            } else {
              cleanedItem.image = '';
            }
          } catch (error) {
            console.error('Error converting image for item:', cleanedItem.name, error);
            cleanedItem.image = '';
          }
        }

        cleanedCategory.items.push(cleanedItem);
      }

      cleanedMenu.push(cleanedCategory);
    }

    return cleanedMenu;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const cleanedMenu = await cleanMenuImages(menu);

      await base44.entities.BusinessPage.update(pageId, {
        special_fields: {
          ...(businessPage.special_fields || {}),
          menu: cleanedMenu
        }
      });
      
      setSuccessMessage("התפריט נשמר בהצלחה!");

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
                  מחירון / תפריט
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

          <Alert className="bg-indigo-50 border-indigo-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-indigo-900 text-sm">חדש! מחולל תמונות ב-AI</h4>
                <AlertDescription className="text-indigo-700 text-xs mt-1">
                  אין לכם תמונה למנה? לחצו על כפתור "צור ב-AI" ליד תמונת הפריט, והמערכת תיצור עבורכם תמונה מקצועית ומגרה באופן אוטומטי!
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {menu && Array.isArray(menu) ? (
          <Card>
            <CardHeader>
              <CardTitle>מחירון / תפריט</CardTitle>
            </CardHeader>
            <CardContent>
              <MenuBuilder
                value={menu}
                onChange={(newMenu) => setMenu(newMenu)}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                מחירון / תפריט
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                טרם נוצר מחירון לעסק. ניתן להתחיל לבנות קטגוריות ופריטים בלחיצה על הכפתור.
              </p>
              <Button
                variant="outline"
                onClick={() => setMenu([])}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                התחל לבנות מחירון
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
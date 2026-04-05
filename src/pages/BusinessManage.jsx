import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowRight, Settings, Image, Clock, Shield, Tag,
  UtensilsCrossed, Sparkles, Palette, ChevronLeft, AlertTriangle, Edit, BarChart3,
  TrendingUp, Truck, ShoppingBag, Loader2, Check, Crown
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function BusinessManagePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [promotionSettings, setPromotionSettings] = useState({
    is_promoted: false,
    has_delivery: false,
    has_pickup: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
        const [pageData] = await Promise.all([
          base44.entities.BusinessPage.filter({ id: pageId })
        ]);

        const page = Array.isArray(pageData) ? pageData[0] : pageData;

        if (!page) {
          setError("עמוד העסק לא נמצא");
          setIsLoading(false);
          return;
        }

        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          setError("אין לך הרשאה לנהל עמוד עסק זה");
          setIsLoading(false);
          return;
        }

        setBusinessPage(page);
        setPromotionSettings({
          is_promoted: page.is_promoted || false,
          has_delivery: page.has_delivery || false,
          has_pickup: page.has_pickup || false
        });
      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const handleSavePromotionSettings = async () => {
    setIsSavingSettings(true);
    try {
      await base44.entities.BusinessPage.update(pageId, promotionSettings);
      alert('✅ הגדרות עודכנו בהצלחה');
      window.location.reload();
    } catch (err) {
      alert('שגיאה בעדכון הגדרות: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const managementSections = [
    {
      title: "פרטים בסיסיים",
      description: "שם העסק, תיאור, קטגוריות ופרטי יצירת קשר",
      icon: Settings,
      color: "from-blue-500 to-indigo-600",
      page: `EditBusinessBasics?id=${pageId}`
    },
    {
      title: "תמונות",
      description: "ניהול תמונות העסק, לוגו וגלריה",
      icon: Image,
      color: "from-purple-500 to-pink-600",
      page: `EditBusinessImages?id=${pageId}`
    },
    {
      title: "שעות פעילות",
      description: "הגדרת שעות פתיחה וסגירה",
      icon: Clock,
      color: "from-orange-500 to-red-600",
      page: `EditBusinessHours?id=${pageId}`
    },
    {
      title: "כשרות",
      description: "גוף כשרות, תעודות והסמכות",
      icon: Shield,
      color: "from-green-500 to-emerald-600",
      page: `EditBusinessKashrut?id=${pageId}`
    },
    {
      title: "תגיות",
      description: "תגיות לשיפור החיפוש והמיון",
      icon: Tag,
      color: "from-cyan-500 to-blue-600",
      page: `EditBusinessTags?id=${pageId}`
    },
    {
      title: "ניהול מוצרים וקטגוריות",
      description: "עריכת המוצרים, הקטגוריות והתוספות",
      icon: UtensilsCrossed,
      color: "from-amber-500 to-orange-600",
      page: `EditBusinessMenu?id=${pageId}`
    },
    {
      title: "סרגל מותגים",
      description: "לוגואים של מותגים וספקים",
      icon: Sparkles,
      color: "from-pink-500 to-rose-600",
      page: `EditBusinessBrands?id=${pageId}`
    },
    {
      title: "ערכת נושא",
      description: "צבעים, עיצוב ומראה העמוד",
      icon: Palette,
      color: "from-indigo-500 to-purple-600",
      page: `EditBusinessTheme?id=${pageId}`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = createPageUrl(`BusinessPage?id=${pageId}`)}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
              חזרה לעמוד העסק
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              מרכז ניהול עסק
            </h1>
            <p className="text-gray-500 mt-1">
              {businessPage?.business_name || "טוען..."}
            </p>
          </div>
        </div>

        {/* Promotion & Delivery Settings */}
        <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <TrendingUp className="w-6 h-6" />
              הגדרות קידום ומשלוחים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <div>
                  <Label className="font-semibold text-slate-900 cursor-pointer">קידום לשורה ראשונה</Label>
                  <p className="text-sm text-slate-600">העסק יופיע ראשון ברשימות עם סימון מיוחד</p>
                </div>
              </div>
              <Switch
                checked={promotionSettings.is_promoted}
                onCheckedChange={(checked) => setPromotionSettings(prev => ({ ...prev, is_promoted: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="font-semibold text-slate-900 cursor-pointer">שירות משלוחים</Label>
                  <p className="text-sm text-slate-600">סמן שהעסק מספק משלוחים עד הבית</p>
                </div>
              </div>
              <Switch
                checked={promotionSettings.has_delivery}
                onCheckedChange={(checked) => setPromotionSettings(prev => ({ ...prev, has_delivery: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-semibold text-slate-900 cursor-pointer">איסוף עצמי</Label>
                  <p className="text-sm text-slate-600">סמן שהעסק מאפשר טייק אווי/איסוף עצמי</p>
                </div>
              </div>
              <Switch
                checked={promotionSettings.has_pickup}
                onCheckedChange={(checked) => setPromotionSettings(prev => ({ ...prev, has_pickup: checked }))}
              />
            </div>

            <Button
              onClick={handleSavePromotionSettings}
              disabled={isSavingSettings}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  שמור הגדרות
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Management Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-300"
                onClick={() => window.location.href = createPageUrl(section.page)}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-4">{section.description}</p>
                  <Button variant="outline" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-300">
                    ערוך
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              פעולות מהירות
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.location.href = createPageUrl(`BusinessPage?id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              צפה בעמוד
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl(`BusinessAnalytics?id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              סטטיסטיקה
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl(`EditBusinessPage?id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              עריכה מהירה
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl(`OrdersManagement?business_page_id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              ניהול הזמנות
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl(`SubscriptionManagement?business_id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <Crown className="w-4 h-4" />
              ניהול מנוי
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
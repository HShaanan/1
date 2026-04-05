import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User, Heart, Settings, Loader2, Trash2,
  Mail, Shield, Calendar, CheckCircle, AlertCircle,
  Phone, Clock, Search, Eye, Star, MessageSquare,
  ShoppingBag, Share2, MapPin, Bell, TrendingUp
} from "lucide-react";
import { createPageUrl } from "@/utils";
import ListingPreviewCard from "@/components/explore/ListingPreviewCard";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [businessPages, setBusinessPages] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("favorites");

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const currentUser = await base44.auth.me();
      if (!currentUser) {
        window.location.href = createPageUrl("Browse");
        return;
      }

      setUser(currentUser);
      setFullName(currentUser.full_name || "");
      setPhone(currentUser.phone || "");

      // Load data in parallel
      const [userFavorites, activity, prefs] = await Promise.all([
        base44.entities.Favorite.filter({ user_email: currentUser.email }),
        base44.entities.UserActivity.filter(
          { user_id: currentUser.id },
          "-created_date",
          50
        ).catch(() => []),
        base44.entities.UserPreference.filter(
          { user_id: currentUser.id }
        ).catch(() => []),
      ]);

      setFavorites(userFavorites || []);
      setActivityHistory(activity || []);
      setPreferences(prefs?.[0] || null);

      // Load favorite business details
      if (userFavorites?.length > 0) {
        const businessIds = userFavorites.map(f => f.business_page_id);
        const businesses = await base44.entities.BusinessPage.filter({
          id: { $in: businessIds },
          is_active: true
        });
        setBusinessPages(businesses || []);
      }

    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: "error", text: "שגיאה בטעינת נתוני המשתמש" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await base44.auth.updateMe({ full_name: fullName, phone });
      setMessage({ type: "success", text: "הפרטים עודכנו בהצלחה" });

      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "שגיאה בעדכון הפרטים" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePreferences = async (updates) => {
    try {
      if (preferences?.id) {
        await base44.entities.UserPreference.update(preferences.id, updates);
        setPreferences(prev => ({ ...prev, ...updates }));
      }
      setMessage({ type: "success", text: "ההעדפות עודכנו" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      setMessage({ type: "error", text: "שגיאה בעדכון ההעדפות" });
    }
  };

  const handleRemoveFavorite = async (favoriteId, businessName) => {
    if (!confirm(`האם להסיר את "${businessName}" מהמועדפים?`)) return;

    try {
      await base44.entities.Favorite.delete(favoriteId);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      setBusinessPages(businessPages.filter(b =>
        favorites.find(f => f.id === favoriteId)?.business_page_id !== b.id
      ));
      setMessage({ type: "success", text: "העסק הוסר מהמועדפים" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      setMessage({ type: "error", text: "שגיאה בהסרת המועדף" });
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      page_view: Eye,
      search: Search,
      category_browse: TrendingUp,
      favorite_add: Heart,
      favorite_remove: Heart,
      review_submit: Star,
      order_place: ShoppingBag,
      phone_click: Phone,
      whatsapp_click: MessageSquare,
      website_click: MapPin,
      share_click: Share2,
      navigation_click: MapPin,
      login: User,
      signup: User,
    };
    return icons[type] || Clock;
  };

  const getActivityLabel = (type) => {
    const labels = {
      page_view: "צפייה בעמוד עסק",
      search: "חיפוש",
      category_browse: "עיון בקטגוריה",
      favorite_add: "הוספה למועדפים",
      favorite_remove: "הסרה ממועדפים",
      review_submit: "כתיבת ביקורת",
      order_place: "ביצוע הזמנה",
      phone_click: "לחיצה על טלפון",
      whatsapp_click: "לחיצה על וואטסאפ",
      website_click: "לחיצה על אתר",
      share_click: "שיתוף עסק",
      navigation_click: "ניווט לעסק",
      login: "התחברות",
      signup: "הרשמה",
    };
    return labels[type] || type;
  };

  // Compute activity stats
  const activityStats = {
    totalViews: activityHistory.filter(a => a.activity_type === 'page_view').length,
    totalSearches: activityHistory.filter(a => a.activity_type === 'search').length,
    totalInteractions: activityHistory.filter(a =>
      ['phone_click', 'whatsapp_click', 'website_click', 'navigation_click'].includes(a.activity_type)
    ).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-700 text-lg">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: "favorites", label: "מועדפים", icon: Heart, count: favorites.length },
    { key: "activity", label: "היסטוריה", icon: Clock },
    { key: "preferences", label: "העדפות", icon: Bell },
    { key: "settings", label: "הגדרות", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.full_name ? user.full_name.charAt(0) : 'מ'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                שלום, {user.full_name || 'משתמש'}
              </h1>
              <p className="text-slate-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-slate-500 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          {user.role === 'admin' && (
            <Badge className="mt-2 bg-purple-100 text-purple-800 border-purple-300">
              <Shield className="w-3 h-3 ml-1" />
              מנהל מערכת
            </Badge>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{activityStats.totalViews}</p>
              <p className="text-xs text-slate-500">צפיות בעסקים</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">{activityStats.totalSearches}</p>
              <p className="text-xs text-slate-500">חיפושים</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{activityStats.totalInteractions}</p>
              <p className="text-xs text-slate-500">אינטראקציות</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-6"
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="space-y-6">
          <div className="grid w-full grid-cols-4 bg-white shadow-md rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs sm:text-sm ${activeTab === tab.key ? "bg-blue-600 text-white" : ""}`}
                >
                  <Icon className="w-4 h-4 ml-1" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="mr-1 text-xs">({tab.count})</span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* ──── Favorites Tab ──── */}
          {activeTab === "favorites" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  העסקים המועדפים שלי
                </CardTitle>
              </CardHeader>
              <CardContent>
                {businessPages.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg mb-2">אין לך עסקים מועדפים עדיין</p>
                    <p className="text-slate-500 text-sm mb-4">לחץ על הלב בעמודי העסקים כדי להוסיף למועדפים</p>
                    <Button
                      onClick={() => window.location.href = createPageUrl("Browse")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      עבור לדף העסקים
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businessPages.map((business) => {
                      const favorite = favorites.find(f => f.business_page_id === business.id);
                      return (
                        <div key={business.id} className="relative group">
                          <ListingPreviewCard businessPage={business} />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => handleRemoveFavorite(favorite?.id, business.business_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ──── Activity History Tab ──── */}
          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  היסטוריית פעילות
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg mb-2">אין היסטוריית פעילות עדיין</p>
                    <p className="text-slate-500 text-sm">ההיסטוריה תתעדכן אוטומטית כשתשתמש באתר</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {activityHistory.map((activity) => {
                      const Icon = getActivityIcon(activity.activity_type);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {getActivityLabel(activity.activity_type)}
                            </p>
                            {activity.search_query && (
                              <p className="text-xs text-slate-500 truncate">
                                חיפוש: "{activity.search_query}"
                              </p>
                            )}
                            {activity.metadata?.business_name && (
                              <p className="text-xs text-slate-500 truncate">
                                {activity.metadata.business_name}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex-shrink-0">
                            {new Date(activity.created_date).toLocaleDateString('he-IL', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ──── Preferences Tab ──── */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  העדפות והתראות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">התראות</h3>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label className="font-medium">התראות במייל</Label>
                      <p className="text-xs text-slate-500">קבל עדכונים על עסקים חדשים, מבצעים ועוד</p>
                    </div>
                    <Switch
                      checked={preferences?.notification_email ?? true}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({ notification_email: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label className="font-medium">התראות SMS</Label>
                      <p className="text-xs text-slate-500">קבל הודעות טקסט על הזמנות ועדכונים דחופים</p>
                    </div>
                    <Switch
                      checked={preferences?.notification_sms ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({ notification_sms: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">העדפות אזור</h3>
                  <div className="space-y-2">
                    <Label htmlFor="preferredCity">עיר מועדפת</Label>
                    <Input
                      id="preferredCity"
                      type="text"
                      value={preferences?.preferred_city || ""}
                      onChange={(e) =>
                        setPreferences(prev => ({ ...prev, preferred_city: e.target.value }))
                      }
                      onBlur={(e) =>
                        handleUpdatePreferences({ preferred_city: e.target.value })
                      }
                      placeholder="למשל: ביתר עילית, ירושלים..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ──── Settings Tab ──── */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    פרטים אישיים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">שם מלא</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="הכנס שם מלא"
                        required
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל (שם משתמש)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-slate-100 text-slate-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500">
                        האימייל משמש כשם המשתמש שלך ולא ניתן לשינוי
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="050-1234567"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>תאריך הצטרפות</Label>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {user.created_date
                          ? new Date(user.created_date).toLocaleDateString('he-IL')
                          : 'לא ידוע'}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          שומר...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          שמור שינויים
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    מידע על החשבון
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">סטטוס חשבון</span>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      פעיל
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">סוג משתמש</span>
                    <span className="font-medium">
                      {user.user_type === 'business' ? 'בעל עסק' : user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">מנוי</span>
                    <span className="font-medium">
                      {user.subscription_type === 'premium' ? 'פרימיום' :
                       user.subscription_type === 'enterprise' ? 'עסקי פלוס' : 'בסיסי'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">עסקים מועדפים</span>
                    <span className="font-medium">{favorites.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Terms Reset (for testing) */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-5 h-5" />
                    בדיקות מערכת
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-700 mb-4">
                    כפתור זה יאפס את הסכמתך לתנאי השימוש ויגרום למערכת לדרוש אישור מחדש (לצורך בדיקה).
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-800 hover:bg-orange-100"
                    onClick={async () => {
                      if (!confirm("האם לאפס את סטטוס אישור התקנון?")) return;
                      try {
                        setIsLoading(true);
                        const agreements = await base44.entities.UserAgreement.filter({
                          user_email: user.email,
                          agreement_type: 'terms_of_use'
                        });
                        await Promise.all(agreements.map(a => base44.entities.UserAgreement.delete(a.id)));
                        Object.keys(sessionStorage).forEach(key => {
                          if (key.startsWith('terms_accepted_')) sessionStorage.removeItem(key);
                        });
                        window.location.href = createPageUrl('Browse');
                      } catch (e) {
                        console.error(e);
                        setMessage({ type: "error", text: "שגיאה באיפוס התנאים" });
                        setIsLoading(false);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    אפס הסכמה לתקנון ובדוק מחדש
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

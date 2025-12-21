import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  User, Heart, Settings, Loader2, Trash2, 
  Mail, Shield, Calendar, CheckCircle, AlertCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";
import ListingPreviewCard from "@/components/explore/ListingPreviewCard";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [businessPages, setBusinessPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("favorites");

  // Form state
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // טוען נתוני משתמש
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        window.location.href = createPageUrl("Browse");
        return;
      }
      
      setUser(currentUser);
      setFullName(currentUser.full_name || "");

      // טוען מועדפים
      const userFavorites = await base44.entities.Favorite.filter({ 
        user_email: currentUser.email 
      });
      setFavorites(userFavorites || []);

      // טוען נתוני עסקים מועדפים
      if (userFavorites && userFavorites.length > 0) {
        const businessIds = userFavorites.map(f => f.business_page_id);
        const businesses = await base44.entities.BusinessPage.filter({
          id: { $in: businessIds },
          is_active: true
        });
        setBusinessPages(businesses || []);
      }

    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ 
        type: "error", 
        text: "שגיאה בטעינת נתוני המשתמש" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await base44.auth.updateMe({ full_name: fullName });
      setMessage({ 
        type: "success", 
        text: "הפרטים עודכנו בהצלחה" 
      });
      
      // רענון נתוני משתמש
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ 
        type: "error", 
        text: "שגיאה בעדכון הפרטים" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId, businessName) => {
    if (!confirm(`האם להסיר את "${businessName}" מהמועדפים?`)) {
      return;
    }

    try {
      await base44.entities.Favorite.delete(favoriteId);
      
      // עדכון מצב מקומי
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      setBusinessPages(businessPages.filter(b => 
        favorites.find(f => f.id === favoriteId)?.business_page_id !== b.id
      ));
      
      setMessage({ 
        type: "success", 
        text: "העסק הוסר מהמועדפים" 
      });
      
    } catch (error) {
      console.error("Error removing favorite:", error);
      setMessage({ 
        type: "error", 
        text: "שגיאה בהסרת המועדף" 
      });
    }
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

  if (!user) {
    return null;
  }

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
            </div>
          </div>
          
          {user.role === 'admin' && (
            <Badge className="mt-2 bg-purple-100 text-purple-800 border-purple-300">
              <Shield className="w-3 h-3 ml-1" />
              מנהל מערכת
            </Badge>
          )}
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
          <div className="grid w-full grid-cols-2 lg:grid-cols-2 bg-white shadow-md rounded-lg p-1">
            <Button
              variant={activeTab === "favorites" ? "default" : "ghost"}
              onClick={() => setActiveTab("favorites")}
              className={activeTab === "favorites" ? "bg-blue-600 text-white" : ""}
            >
              <Heart className="w-4 h-4 ml-2" />
              מועדפים ({favorites.length})
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className={activeTab === "settings" ? "bg-blue-600 text-white" : ""}
            >
              <Settings className="w-4 h-4 ml-2" />
              הגדרות
            </Button>
          </div>

          {/* Favorites Tab */}
          {activeTab === "favorites" && <div className="space-y-4">
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
                    <p className="text-slate-600 text-lg mb-2">
                      אין לך עסקים מועדפים עדיין
                    </p>
                    <p className="text-slate-500 text-sm mb-4">
                      לחץ על הלב בעמודי העסקים כדי להוסיף למועדפים
                    </p>
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
                      const favorite = favorites.find(
                        f => f.business_page_id === business.id
                      );
                      
                      return (
                        <div key={business.id} className="relative group">
                          <ListingPreviewCard businessPage={business} />
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => handleRemoveFavorite(
                              favorite?.id, 
                              business.business_name
                            )}
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
          </div>}

          {/* Settings Tab */}
          {activeTab === "settings" && <div className="space-y-4">
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
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-slate-100 text-slate-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">
                      לא ניתן לשנות את כתובת האימייל
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>תאריך הצטרפות</Label>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.created_date).toLocaleDateString('he-IL')}
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

            {/* Debug / Testing Card */}
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
                    if (!confirm("האם לאפס את סטטוס אישור התקנון? המערכת תבצע רענון ותדרוש אישור מחדש.")) return;
                    try {
                        setIsLoading(true);
                        // 1. Delete agreements
                        const agreements = await base44.entities.UserAgreement.filter({
                            user_email: user.email,
                            agreement_type: 'terms_of_use'
                        });
                        
                        // Delete one by one
                        await Promise.all(agreements.map(a => base44.entities.UserAgreement.delete(a.id)));
                        
                        // 2. Clear session cache
                        Object.keys(sessionStorage).forEach(key => {
                            if (key.startsWith('terms_accepted_')) sessionStorage.removeItem(key);
                        });
                        
                        // 3. Reload to trigger check
                        window.location.href = createPageUrl('Browse');
                    } catch (e) {
                        console.error(e);
                        setMessage({ type: "error", text: "שגיאה באיפוס התנאים" });
                        setIsLoading(false);
                    }
                  }}
                >
                  <FileText className="w-4 h-4 ml-2" />
                  אפס הסכמה לתקנון ובדוק מחדש
                </Button>
              </CardContent>
            </Card>

            {/* Debug / Testing Card */}
            <Card className="border-orange-200 bg-orange-50 mb-4">
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
                    if (!confirm("האם לאפס את סטטוס אישור התקנון? המערכת תבצע רענון ותדרוש אישור מחדש.")) return;
                    try {
                        setIsLoading(true);
                        const user = await base44.auth.me();
                        // 1. Delete agreements
                        const agreements = await base44.entities.UserAgreement.filter({
                            user_email: user.email,
                            agreement_type: 'terms_of_use'
                        });
                        
                        // Delete one by one
                        await Promise.all(agreements.map(a => base44.entities.UserAgreement.delete(a.id)));
                        
                        // 2. Clear session cache
                        Object.keys(sessionStorage).forEach(key => {
                            if (key.startsWith('terms_accepted_')) sessionStorage.removeItem(key);
                        });
                        
                        // 3. Reload to trigger check
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
                    {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">עסקים מועדפים</span>
                  <span className="font-medium">{favorites.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>}
        </div>
      </div>
    </div>
  );
}
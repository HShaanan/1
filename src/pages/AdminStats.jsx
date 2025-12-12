
import React, { useState, useEffect } from "react";
import { Listing } from "@/entities/Listing";
import { Category } from "@/entities/Category";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Users, FileText, TrendingUp, 
  Eye, MessageSquare, Calendar, AlertTriangle, 
  CheckCircle, Loader2, MapPin
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getListingsNeedingCoordinates } from "@/functions/getListingsNeedingCoordinates";
import { batchGeocodeFromClient } from "@/functions/batchGeocodeFromClient";
import { getGoogleMapsKey } from "@/functions/getGoogleMapsKey";

export default function AdminStatsPage() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [operationSuccess, setOperationSuccess] = useState("");
  const [isFixingCoordinates, setIsFixingCoordinates] = useState(false);
  const [coordinateFixResult, setCoordinateFixResult] = useState(null);
  const [totalFixed, setTotalFixed] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);

  // NEW: Google Maps key state
  const [googleMapsKey, setGoogleMapsKey] = useState(null);
  const [googleMapsKeyMasked, setGoogleMapsKeyMasked] = useState(null);

  // Helper: load Google Maps JS once and resolve when available
  const ensureMapsJsLoaded = async (apiKey) => {
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.Geocoder) {
      return true;
    }
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("No window"));
      // auth failure handler
      window.gm_authFailure = () => {
        setOperationError("Google Maps auth failed. בדוק את ההרשאות של המפתח והדומיין.");
        reject(new Error("gm_authFailure"));
      };
      // already appended?
      const existing = document.getElementById("gmaps-js-adminstats");
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => reject(new Error("Script load error")));
        return;
      }
      // install callback
      window.__mapsInitAdminStats = () => resolve(true);

      const script = document.createElement("script");
      script.id = "gmaps-js-adminstats";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=he&region=IL&v=weekly&callback=__mapsInitAdminStats`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Script load error"));
      document.head.appendChild(script);
    });
  };

  // Promise wrapper around google.maps.Geocoder
  const geocodeAddressClient = (geocoder, address) => {
    return new Promise((resolve, reject) => {
      if (!geocoder || !address) return reject(new Error("Missing geocoder/address"));
      geocoder.geocode(
        {
          address: address,
          region: "IL",
          componentRestrictions: { country: "IL" },
        },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error(status || "GEOCODE_ERROR"));
          }
        }
      );
    });
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await User.me().catch(() => null);
      if (!userData) {
        await User.loginWithRedirect(window.location.href);
        return;
      }
      
      if (userData.role !== 'admin') {
        setInitialLoadError("אין לך הרשאות גישה לעמוד זה");
        return;
      }

      setUser(userData);
      // Load data + Google key in parallel
      await Promise.all([loadData(), loadGoogleKey()]);
    } catch (err) {
      setInitialLoadError("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [listingsData, categoriesData, usersData] = await Promise.all([
        Listing.list(),
        Category.list(),
        User.list()
      ]);
      
      setListings(listingsData);
      setCategories(categoriesData);
      setUsers(usersData);
    } catch (err) {
      setInitialLoadError("שגיאה בטעינת הנתונים");
    }
  };

  // NEW: Load Google Maps key once
  const loadGoogleKey = async () => {
    try {
      const { data } = await getGoogleMapsKey({});
      if (data && data.apiKey) {
        setGoogleMapsKey(String(data.apiKey));
        // Prefer masked from diagnostics if exists
        const masked = data?.diagnostics?.masked || (String(data.apiKey).length > 8
          ? `${String(data.apiKey).slice(0, 6)}…${String(data.apiKey).slice(-4)}`
          : "********");
        setGoogleMapsKeyMasked(masked);
      } else {
        setGoogleMapsKey(null);
        setGoogleMapsKeyMasked(null);
      }
    } catch (_) {
      setGoogleMapsKey(null);
      setGoogleMapsKeyMasked(null);
    }
  };

  const handleFixCoordinates = async () => {
    // Only ask confirmation for the first run, or if it was explicitly cancelled/failed completely
    if (totalFixed === 0 && totalErrors === 0 && !coordinateFixResult) {
        if (!window.confirm('זה יעבור על מודעות במערכת ויתקן את הקואורדינטות שלהן. זה עלול לקחת מספר דקות ולהתבצע במנות. להמשיך?')) {
            return;
        }
    }

    // Reset accumulated totals if this is considered a fresh start, or keep accumulating.
    // The outline implies accumulating, so we won't reset totalFixed/totalErrors to 0 here directly,
    // but the inner logic will update them from the current run.
    
    setIsFixingCoordinates(true);
    setOperationError("");
    setOperationSuccess("");
    
    try {
        console.log('Starting coordinate fix batch...');
        
        // שלב 1: קבלת רשימת המודעות שצריכות עדכון
        const { data: listingsData } = await getListingsNeedingCoordinates();
        
        if (!listingsData.success || !listingsData.listings || listingsData.listings.length === 0) {
            setOperationSuccess("כל המודעות כבר מעודכנות עם קואורדינטות!");
            setIsFixingCoordinates(false);
            return;
        }

        console.log(`Found ${listingsData.listings.length} listings to process`);

        // שלב 2: שימוש במפתח Google Maps מה-state, ואם חסר - הבאה מהשרת
        let apiKeyToUse = googleMapsKey;
        if (!apiKeyToUse) {
          const { data: keyData } = await getGoogleMapsKey();
          if (!keyData || !keyData.apiKey) {
              throw new Error('לא ניתן לקבל מפתח Google Maps API');
          }
          apiKeyToUse = String(keyData.apiKey);
          setGoogleMapsKey(apiKeyToUse);
          const masked = keyData?.diagnostics?.masked || (apiKeyToUse.length > 8 ? `${apiKeyToUse.slice(0,6)}…${apiKeyToUse.slice(-4)}` : "********");
          setGoogleMapsKeyMasked(masked);
        }

        // NEW: Load Maps JS and prepare client-side Geocoder (works with referrer-restricted keys)
        await ensureMapsJsLoaded(apiKeyToUse);
        const geocoder = new window.google.maps.Geocoder();

        // שלב 3: עיבוד הקואורדינטות בצד הקדמי (עם google.maps.Geocoder)
        const listingsToUpdate = [];
        let processedCount = 0;
        let errorCount = 0;

        setOperationSuccess(`מעבד ${listingsData.listings.length} מודעות...`);

        for (const listing of listingsData.listings) {
            try {
                const result = await geocodeAddressClient(geocoder, listing.address);
                const location = result.geometry?.location;
                const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
                const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;

                if (typeof lat === "number" && typeof lng === "number") {
                  listingsToUpdate.push({
                      id: listing.id,
                      lat,
                      lng,
                      address: result.formatted_address || listing.address,
                      original_address: listing.address
                  });
                  processedCount++;
                } else {
                  errorCount++;
                }

                // עדכון הודעת התקדמות
                setOperationSuccess(`מעבד ${processedCount + errorCount}/${listingsData.listings.length} מודעות...`);

                // המתנה קצרה כדי לא להעמיס על הקליינט
                await new Promise(resolve => setTimeout(resolve, 120));
            } catch (error) {
                console.error(`Error geocoding ${listing.title} (${listing.id}):`, error);
                errorCount++;
            }
        }

        // שלב 4: שליחה לשרת לעדכון
        if (listingsToUpdate.length > 0) {
            setOperationSuccess(`שולח עדכונים לשרת...`);
            
            const { data: updateResult } = await batchGeocodeFromClient({
                listingUpdates: listingsToUpdate
            });

            if (updateResult && updateResult.success) {
                const newTotalFixed = totalFixed + updateResult.updated;
                const newTotalErrors = totalErrors + updateResult.errors;
                
                setTotalFixed(newTotalFixed);
                setTotalErrors(newTotalErrors);
                
                setCoordinateFixResult({
                    updated: updateResult.updated,
                    errors: updateResult.errors,
                    remaining: 0 // In this client-side batch, all are processed, so remaining is 0
                });
                
                setOperationSuccess(`הושלם! עודכנו ${updateResult.updated} מודעות. סה"כ עד כה: ${newTotalFixed} מודעות.`);
            } else {
                throw new Error('שגיאה בשמירה לשרת: ' + (updateResult?.message || 'לא ידועה'));
            }
        } else {
            setOperationError("לא נמצאו מודעות לעדכון או כולן נכשלו בגיאוקודד");
            setCoordinateFixResult({
                updated: 0,
                errors: errorCount,
                remaining: 0
            });
            setTotalErrors(totalErrors + errorCount); // Accumulate errors from client-side geocode attempts
        }

    } catch (error) {
        console.error('Coordinate fix error:', error);
        setOperationError("שגיאה בתיקון קואורדינטות: " + (error.response?.data?.details || error.message || 'שגיאה לא ידועה'));
    } finally {
        setIsFixingCoordinates(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (initialLoadError) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{initialLoadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // חישוב סטטיסטיקות
  const activeListings = listings.filter(l => l.is_active).length;
  const paidListings = listings.filter(l => l.is_paid).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  
  // נתונים לגרפים
  const categoryData = categories.map(category => ({
    name: category.name,
    count: listings.filter(l => l.category_id === category.id).length,
    icon: category.icon
  }));

  const COLORS = ['#22d3ee', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

  const statsCards = [
    {
      title: "סך המודעות",
      value: listings.length,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      change: "+12%"
    },
    {
      title: "מודעות פעילות",
      value: activeListings,
      icon: Eye,
      color: "from-green-500 to-green-600",
      change: "+8%"
    },
    {
      title: "מודעות מודגשות",
      value: paidListings,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      change: "+25%"
    },
    {
      title: "משתמשים רשומים",
      value: users.length,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      change: "+15%"
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-purple-600 to-pink-500 bg-clip-text text-transparent">
              דוחות וסטטיסטיקות
            </h1>
            <p className="text-gray-600">נתוני השימוש והפעילות באפליקציה</p>
          </div>
        </div>

        {/* Error/Success Messages for operations */}
        {operationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{operationError}</AlertDescription>
          </Alert>
        )}
        {operationSuccess && (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{operationSuccess}</AlertDescription>
          </Alert>
        )}

        {coordinateFixResult && (
            <Alert className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                    <div className="font-medium">תוצאות ריצה אחרונה:</div>
                    <div className="text-sm mt-1">
                        • {coordinateFixResult.updated} מודעות עודכנו בריצה זו.<br/>
                        • {coordinateFixResult.errors} שגיאות בריצה זו.<br/>
                        • סה"כ עודכנו עד כה: <strong>{totalFixed}</strong> | סה"כ שגיאות: <strong>{totalErrors}</strong><br/>
                        • <strong>{coordinateFixResult.remaining > 0 ? `${coordinateFixResult.remaining} מודעות נותרו לתיקון.` : 'כל המודעות תוקנו!'}</strong>
                    </div>
                </AlertDescription>
            </Alert>
        )}

        {/* כרטיסי סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-r ${stat.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                    </div>
                    <stat.icon className="w-8 h-8 text-white/80" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 font-medium">{stat.change}</span>
                    <span className="text-gray-500">מהחודש הקודם</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* כרטיסי פעולות מתקדמות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* כרטיס תיקון קואורדינטות */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                        <MapPin className="w-5 h-5" />
                        תיקון קואורדינטות מפה (גישה חדשה)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-purple-600 mb-3">
                        מתקן קואורדינטות של מודעות עם כתובת ללא מיקום במפה. העיבוד מתבצע בדפדפן לפתרון בעיית הדומיין.
                    </p>

                    {/* NEW: Google Maps key status */}
                    <div className="mb-4 rounded-lg bg-white/70 border border-purple-200 p-3">
                      {googleMapsKey ? (
                        <div className="text-sm text-purple-800">
                          מפתח Google Maps נטען: <span className="font-mono text-purple-700">{googleMapsKeyMasked}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-red-700">
                          לא נמצא מפתח Google Maps בדפדפן. ודא שהגדרת GOOGLE_MAPS_APIKEY בהגדרות הסביבה.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                          onClick={handleFixCoordinates}
                          disabled={isFixingCoordinates || !googleMapsKey}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                          {isFixingCoordinates ? (
                              <>
                                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                  מתקן קואורדינטות...
                              </>
                          ) : (
                              <>
                                  <MapPin className="w-4 h-4 ml-2" />
                                  תקן קואורדינטות (גישה מתקדמת)
                              </>
                          )}
                      </Button>
                      <Button
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={loadGoogleKey}
                      >
                        רענן מפתח
                      </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* גרף עמודות - מודעות לפי קטגוריה */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                מודעות לפי קטגוריה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* גרף עוגה - התפלגות סוגי מודעות */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                התפלגות סוגי מודעות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'רגילות', value: listings.length - paidListings },
                      { name: 'מודגשות', value: paidListings }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {[
                      { name: 'רגילות', value: listings.length - paidListings },
                      { name: 'מודגשות', value: paidListings }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* מידע נוסף */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                סיכום מהיר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-orange-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">אחוז מודעות פעילות</h3>
                  <p className="text-3xl font-bold text-cyan-600">
                    {listings.length > 0 ? Math.round((activeListings / listings.length) * 100) : 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">מנהלים במערכת</h3>
                  <p className="text-3xl font-bold text-purple-600">{adminUsers}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">אחוז מודעות מודגשות</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {listings.length > 0 ? Math.round((paidListings / listings.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

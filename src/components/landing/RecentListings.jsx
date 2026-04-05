
import React from "react";
import { Category } from "@/entities/Category";
import { Badge } from "@/components/ui/badge";
import { createPageUrl, createBusinessUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Building } from "lucide-react"; // Added Building icon
import { getRecentBusinessPages } from "@/functions/getRecentBusinessPages";

export default function RecentListings() {
  const [items, setItems] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // קאש מקומי פשוט (LS) - שמירה ל-10 דק'
  const LS_KEY_LISTINGS = "meshlanoo_cache_recent_business_pages";
  const LS_KEY_CATS = "meshlanoo_cache_categories_for_recent";
  const readCache = (key, maxAgeMs) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > maxAgeMs) return null;
      return parsed.data ?? null;
    } catch { return null; }
  };
  const writeCache = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  React.useEffect(() => {
    // הידרציה מידית מהקאש כדי למנוע "לפעמים אין כלום"
    const cachedList = readCache(LS_KEY_LISTINGS, 10 * 60 * 1000);
    const cachedCats = readCache(LS_KEY_CATS, 30 * 60 * 1000);
    if (Array.isArray(cachedList) && cachedList.length > 0) {
      setItems(cachedList);
      setLoading(false); // Can set loading to false early if we have cache
    }
    if (Array.isArray(cachedCats) && cachedCats.length > 0) {
      setCats(cachedCats);
    }

    const load = async () => {
      setError("");
      setLoading(true); // Always set loading to true when starting a new fetch operation
      // פונקציית שליפה עם נסיון חוזר
      const fetchWithRetry = async (fn, tries = 2, delayMs = 700) => {
        let lastErr;
        for (let i = 0; i < tries; i++) {
          try {
            return await fn();
          } catch (err) {
            lastErr = err;
            if (i < tries - 1) {
              console.warn(`Retry ${i + 1}/${tries} after ${delayMs}ms:`, err.message);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              delayMs *= 1.5; // Exponential backoff
            }
          }
        }
        throw lastErr;
      };

      try {
        // שליפת עמודי עסק אחרונים
        const response = await fetchWithRetry(() => getRecentBusinessPages({ limit: 8 }));
        console.log("✅ Recent business pages response:", response);

        if (!response?.data?.success) {
          throw new Error(response?.data?.error || "שגיאה לא ידועה");
        }

        const businessPages = response.data.business_pages || [];
        
        // טעינת קטגוריות (עם קאש ארוך יותר)
        let categories = cachedCats;
        if (!categories) {
          categories = await fetchWithRetry(() => Category.list());
          writeCache(LS_KEY_CATS, categories);
        }

        setItems(businessPages);
        setCats(categories);
        writeCache(LS_KEY_LISTINGS, businessPages);
        
      } catch (err) {
        console.error("❌ Error loading recent business pages:", err);
        setError(err.message || "שגיאה בטעינת הנתונים");
        
        // אם נכשלנו אבל יש קאש ישן, נשתמש בו
        const fallbackData = readCache(LS_KEY_LISTINGS, 2 * 60 * 60 * 1000); // 2 שעות
        if (fallbackData && fallbackData.length > 0) {
          console.log("🔄 Using fallback cached data");
          setItems(fallbackData);
          setError(""); // Clear error if we have fallback
        }
      } finally {
        setLoading(false);
      }
    };

    // Load immediately but delay slightly to avoid render blocking
    setTimeout(load, 100);
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-6">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">עסקים אחרונים</h2>
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 to-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            עסקים שהצטרפו לאחרונה
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            גלו את העסקים החדשים שהצטרפו לקהילה שלנו השבוע
          </p>
          {error && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ מציג נתונים שמורים (לא עדכניים)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((page, index) => {
            const category = cats.find(c => c.id === page.category_id);
            // שימוש בתמונת התצוגה אם קיימת, אחרת בתמונה הראשית
            const displayImage = page.preview_image || page.images?.[0];
            
            return (
              <div 
                key={page.id || index} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100 hover:-translate-y-1"
                onClick={() => {
                  window.location.href = createBusinessUrl(page.url_slug || page.id);
                }}
              >
                <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={page.display_title || page.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        // Ensure the fallback icon is displayed if the image fails to load
                        e.target.nextElementSibling.style.display = 'flex'; 
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {page.featured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ מומלץ
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
                        {page.display_title || page.business_name}
                      </h3>
                      
                      <div className="flex items-center mt-1">
                        {category && (
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {page.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {page.smart_rating > 0 && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-slate-700 mr-1">
                          {page.smart_rating.toFixed(1)}
                        </span>
                        {page.reviews_count > 0 && (
                          <span className="text-xs text-slate-500 mr-1">
                            ({page.reviews_count})
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-left">
                      {page.price_range && (
                        <div className="text-lg font-bold text-indigo-600">
                          {page.price_range}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        עמוד עסק
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

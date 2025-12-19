import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ListingGrid from "@/components/explore/ListingGrid";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, Store, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { isOpenNow } from "@/components/utils/businessTime";

// Exact Regex from Browse.js
const foodRegex = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|שווארמה|קפה|קונדיטור|מאפים)/i;
const shopRegex = /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר)/i;

export default function StoresPage() {
  const [storePage, setStorePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeListings, setActiveListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allStorePages, setAllStorePages] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const rawSlug = urlParams.get("slug");
  // Normalize slug: decode -> lowercase -> trim to match Admin logic
  const slug = rawSlug ? decodeURIComponent(rawSlug).trim().toLowerCase() : null;

  // Load Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Load categories
        const cats = await base44.entities.Category.list("sort_order");
        setCategories(cats);

        if (slug) {
          // Load Specific Store Page
          const pages = await base44.entities.StorePage.filter({ slug });
          
          // Fallback: Try exact match if filter failed (sometimes DB is sensitive)
          // or try decoding again if double encoded
          
          if (pages.length === 0) {
            console.log("Store page not found for slug:", slug);
            setError("הדף לא נמצא");
          } else {
            const page = pages[0];
            setStorePage(page);
            
            let listings = [];
            
            // If Manual List
            if (page.specific_business_ids && page.specific_business_ids.length > 0) {
                // Fetch specific businesses
                // Relaxing filters slightly to ensure we get the objects, 
                // but ListingGrid might filter visualy if we want strict browse behavior.
                // For now, fetching approved/active matches Browse.
                const allMatches = await base44.entities.BusinessPage.filter({
                    id: { $in: page.specific_business_ids }
                });

                // Client-side filter for active/approved to be safe
                listings = allMatches.filter(b => b.is_active && b.approval_status === 'approved' && !b.is_frozen);
                
                // Preserve Sort Order
                const idMap = new Map(page.specific_business_ids.map((id, index) => [id, index]));
                listings.sort((a, b) => (idMap.get(a.id) || 0) - (idMap.get(b.id) || 0));
                
            } else {
                // If Auto Filter - Fetch recent pool (Browse usually fetches 200-500)
                listings = await base44.entities.BusinessPage.filter({
                  is_active: true,
                  approval_status: 'approved',
                  is_frozen: false
                }, "-created_date", 500);
            }

            setActiveListings(listings);
            
            // Increment view count (fire and forget)
            base44.entities.StorePage.update(page.id, { view_count: (page.view_count || 0) + 1 }).catch(() => {});
          }
        } else {
          // Directory View
          const pages = await base44.entities.StorePage.filter({ is_active: true }, "title");
          setAllStorePages(pages);
        }
      } catch (err) {
        console.error(err);
        setError("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Helpers for Categories (Matched with Browse.js)
  const idToName = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, c.name || ""));
    return map;
  }, [categories]);

  const isFoodCatId = useCallback((id) => {
    if (!id) return false;
    const name = idToName.get(id) || "";
    return foodRegex.test(name);
  }, [idToName]);

  const isShopCatId = useCallback((id) => {
    if (!id) return false;
    const name = idToName.get(id) || "";
    return shopRegex.test(name);
  }, [idToName]);

  // Filter Logic
  const filteredListings = useMemo(() => {
    if (!storePage || !activeListings.length) return [];
    
    // Manual List - Return as is (already filtered for active/approved in fetch)
    if (storePage.specific_business_ids && storePage.specific_business_ids.length > 0) {
        return activeListings;
    }
    
    // Auto Filters
    const filters = storePage.filters || {};
    let result = activeListings;

    // 1. Category ID (Specific)
    if (filters.category_id && filters.category_id !== "all") {
        result = result.filter(l => l.category_id === filters.category_id);
    }

    // 2. Active Tab (Food vs Shopping) - Critical for "Browse Sync"
    if (filters.active_tab && filters.active_tab !== "all") {
        if (filters.active_tab === "food") {
            result = result.filter(l => 
              isFoodCatId(l.category_id) || 
              (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(id => isFoodCatId(id))) ||
              isFoodCatId(l.subcategory_id)
            );
        } else if (filters.active_tab === "shopping") {
            result = result.filter(l => 
              isShopCatId(l.category_id) || 
              (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(id => isShopCatId(id))) ||
              isShopCatId(l.subcategory_id)
            );
        }
    }

    // 3. Subcategories
    if (filters.subcategory_ids && filters.subcategory_ids.length > 0) {
        result = result.filter(l => {
            if (Array.isArray(l.subcategory_ids)) {
                return l.subcategory_ids.some(id => filters.subcategory_ids.includes(id));
            }
            return filters.subcategory_ids.includes(l.subcategory_id);
        });
    }

    // 4. Tags
    if (filters.tags && filters.tags.length > 0) {
        result = result.filter(l => {
            const lTags = l.special_fields?.tags || [];
            return filters.tags.some(t => lTags.includes(t));
        });
    }

    // 5. Kashrut
    if (filters.kashrut && filters.kashrut.length > 0) {
        result = result.filter(l => 
            filters.kashrut.includes(l.kashrut_authority_name) || 
            filters.kashrut.includes(l.kashrut_authority_type)
        );
    }

    // 6. Price
    if (filters.price_range && filters.price_range.length > 0) {
        result = result.filter(l => filters.price_range.includes(l.price_range));
    }

    // 7. Booleans
    if (filters.delivery) result = result.filter(l => l.has_delivery);
    if (filters.pickup) result = result.filter(l => l.has_pickup);
    if (filters.open_now) result = result.filter(l => isOpenNow(l.hours));

    return result;
  }, [storePage, activeListings, isFoodCatId, isShopCatId]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
         <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 animate-gradient-smooth"></div>
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
         </div>
         <style>{`
            .animate-gradient-smooth { background: linear-gradient(-45deg, #FFFFFF, #F0F9FF, #E0F2FE, #BAE6FD); background-size: 400% 400%; animation: gradient-flow 20s ease infinite; }
            @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(186, 230, 253, 0.25), rgba(240, 249, 255, 0.1)); backdrop-filter: blur(3px); }
            .bubble-1 { width: 80px; height: 80px; left: 10%; animation: float-up 12s linear infinite; }
            .bubble-2 { width: 60px; height: 60px; left: 25%; animation: float-up 15s linear infinite 2s; }
            @keyframes float-up { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }
         `}</style>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Directory View
  if (!slug) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <SeoMeta title="אינדקס דפים - משלנו" description="דפים נבחרים" />
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">דפים נבחרים</h1>
            {allStorePages.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                    <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>עדיין לא נוצרו דפים.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStorePages.map(page => (
                        <a key={page.id} href={createPageUrl(`Stores?slug=${page.slug}`)} className="block group">
                            <Card className="hover:shadow-lg transition-shadow border-slate-200">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">
                                        {page.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm line-clamp-2">{page.meta_description}</p>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
      </div>
    );
  }

  // 404 View
  if (error || !storePage) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative" dir="rtl">
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">הדף לא נמצא</h1>
            <Button onClick={() => window.location.href = createPageUrl('Browse')}>חזרה לחיפוש עסקים</Button>
        </div>
    );
  }

  // Main Page View
  return (
    <div className="min-h-screen relative" dir="rtl">
        <SeoMeta title={storePage.meta_title || storePage.title} description={storePage.meta_description || ""} />
        
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 animate-gradient-smooth"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`bubble bubble-${i+1}`}></div>)}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight drop-shadow-sm">
                    {storePage.title}
                </h1>
                
                {storePage.description && (
                    <div 
                        className="prose prose-lg max-w-3xl mx-auto text-slate-700 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50"
                        dangerouslySetInnerHTML={{ __html: storePage.description }}
                    />
                )}
            </div>

            <div className="mb-6 flex items-center justify-between gap-2 text-slate-500 text-sm bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-slate-700">נמצאו {filteredListings.length} עסקים מומלצים</span>
                </div>
            </div>
            
            <ListingGrid listings={filteredListings} loading={false} categories={categories} />
        </div>
    </div>
  );
}
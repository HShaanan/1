import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import ListingGrid from "@/components/explore/ListingGrid";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, Store, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { isOpenNow } from "@/components/utils/businessTime";

export default function StoresPage() {
  const [storePage, setStorePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeListings, setActiveListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allStorePages, setAllStorePages] = useState([]); // For directory view

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  // Load Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Load categories for Grid
        const cats = await base44.entities.Category.list("sort_order");
        setCategories(cats);

        if (slug) {
          // Load Specific Store Page
          // Relaxed active check to allow preview, could restrict to admin later
          const pages = await base44.entities.StorePage.filter({ slug }); 
          if (pages.length === 0) {
            setError("הדף לא נמצא");
          } else {
            const page = pages[0];
            setStorePage(page);
            
            // Logic: If specific_business_ids exist, load them. Else, load all and filter.
            let listings = [];
            
            if (page.specific_business_ids && page.specific_business_ids.length > 0) {
                // Load specific businesses
                // Note: filter with $in is supported
                listings = await base44.entities.BusinessPage.filter({
                    id: { $in: page.specific_business_ids },
                    is_active: true,
                    approval_status: 'approved',
                    is_frozen: false
                });
                
                // Preserve order of IDs if possible (client side sort)
                const idMap = new Map(page.specific_business_ids.map((id, index) => [id, index]));
                listings.sort((a, b) => (idMap.get(a.id) || 0) - (idMap.get(b.id) || 0));
                
            } else {
                // Fallback to filters logic - load recent 500
                listings = await base44.entities.BusinessPage.filter({
                  is_active: true,
                  approval_status: 'approved',
                  is_frozen: false
                }, "-created_date", 500);
            }

            setActiveListings(listings);
            
            // Increment view count
            try {
                await base44.entities.StorePage.update(page.id, { view_count: (page.view_count || 0) + 1 });
            } catch (e) { /* ignore */ }
          }
        } else {
          // Directory View - Load all store pages
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

  // Filter Logic (Only applies if NOT using specific IDs, or maybe additional client side filtering?)
  // If specific_business_ids are used, we assume the admin wants EXACTLY those. 
  // But we can still apply the storePage.filters on top if we wanted dynamic subset of specific list.
  // For simplicity: If specific_business_ids, show them all. Else filter the big list.
  const filteredListings = useMemo(() => {
    if (!storePage || !activeListings.length) return [];
    
    // If specific IDs were used, activeListings already contains exactly what we want
    if (storePage.specific_business_ids && storePage.specific_business_ids.length > 0) {
        return activeListings;
    }
    
    // Fallback filtering logic
    const filters = storePage.filters || {};
    let result = activeListings;

    // Category ID
    if (filters.category_id && filters.category_id !== "all") {
        result = result.filter(l => l.category_id === filters.category_id);
    }

    // Subcategory IDs
    if (filters.subcategory_ids && filters.subcategory_ids.length > 0) {
        result = result.filter(l => {
            if (Array.isArray(l.subcategory_ids)) {
                return l.subcategory_ids.some(id => filters.subcategory_ids.includes(id));
            }
            return filters.subcategory_ids.includes(l.subcategory_id);
        });
    }

    // Tags
    if (filters.tags && filters.tags.length > 0) {
        result = result.filter(l => {
            const lTags = l.special_fields?.tags || [];
            return filters.tags.some(t => lTags.includes(t));
        });
    }

    // Kashrut
    if (filters.kashrut && filters.kashrut.length > 0) {
        result = result.filter(l => 
            filters.kashrut.includes(l.kashrut_authority_name) || 
            filters.kashrut.includes(l.kashrut_authority_type)
        );
    }

    // Price
    if (filters.price_range && filters.price_range.length > 0) {
        result = result.filter(l => filters.price_range.includes(l.price_range));
    }

    // Features
    if (filters.delivery) result = result.filter(l => l.has_delivery);
    if (filters.pickup) result = result.filter(l => l.has_pickup);
    if (filters.open_now) result = result.filter(l => isOpenNow(l.hours));
    
    // Tab Filter
    if (filters.active_tab && filters.active_tab !== "all") {
        if (filters.active_tab === "food") {
            // Simple heuristic for food
            result = result.filter(l => /food|restaur|אוכל|מסעד/i.test(l.category_slug || "") || /food|restaur|אוכל|מסעד/i.test(l.category_name || ""));
        } else if (filters.active_tab === "shopping") {
             // Simple heuristic for shopping (everything else mostly)
            result = result.filter(l => !(/food|restaur|אוכל|מסעד/i.test(l.category_slug || "") || /food|restaur|אוכל|מסעד/i.test(l.category_name || "")));
        }
    }

    return result;
  }, [storePage, activeListings]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
         {/* Background Animation from Browse */}
         <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 animate-gradient-smooth"></div>
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
         </div>
         <style>{`
            .animate-gradient-smooth { background: linear-gradient(-45deg, #FFFFFF, #F0F9FF, #E0F2FE, #BAE6FD); background-size: 400% 400%; animation: gradient-flow 20s ease infinite; }
            @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(186, 230, 253, 0.25), rgba(240, 249, 255, 0.1)); backdrop-filter: blur(3px); }
            .bubble-1 { width: 80px; height: 80px; left: 10%; animation: float-up 12s linear infinite; }
            .bubble-2 { width: 60px; height: 60px; left: 25%; animation: float-up 15s linear infinite 2s; }
            .bubble-3 { width: 100px; height: 100px; left: 45%; animation: float-up 18s linear infinite 4s; }
            @keyframes float-up { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }
         `}</style>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Directory View (No Slug)
  if (!slug) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <SeoMeta 
            title="אינדקס עמודים - משלנו" 
            description="דפדף בין קטגוריות ודפים נבחרים באתר משלנו"
        />
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
                        <a 
                            key={page.id} 
                            href={createPageUrl(`Stores?slug=${page.slug}`)}
                            className="block group"
                        >
                            <Card className="hover:shadow-lg transition-shadow border-slate-200">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">
                                        {page.title}
                                    </h3>
                                    {page.meta_description && (
                                        <p className="text-slate-600 text-sm line-clamp-2">
                                            {page.meta_description}
                                        </p>
                                    )}
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

  // Error View
  if (error || !storePage) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative overflow-hidden" dir="rtl">
            {/* Same Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 animate-gradient-smooth"></div>
            </div>
            
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">הדף לא נמצא</h1>
            <p className="text-slate-600 mb-6">מצטערים, לא הצלחנו למצוא את הדף שחיפשת.</p>
            <Button onClick={() => window.location.href = createPageUrl('Browse')}>
                חזרה לחיפוש עסקים
            </Button>
        </div>
    );
  }

  // Detail View (With Slug) - Browse Style
  return (
    <div className="min-h-screen relative" dir="rtl">
        <SeoMeta 
            title={storePage.meta_title || storePage.title}
            description={storePage.meta_description || ""}
        />
        
        {/* Background Animation - Same as Browse */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 animate-gradient-smooth"></div>
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
            <div className="bubble bubble-4"></div>
            <div className="bubble bubble-5"></div>
            <div className="bubble bubble-6"></div>
            <div className="bubble bubble-7"></div>
            <div className="bubble bubble-8"></div>
        </div>

        <style>{`
            .animate-gradient-smooth {
              background: linear-gradient(
                -45deg, 
                #FFFFFF, #F0F9FF, #E0F2FE, #BAE6FD, 
                #FFFFFF, #F8FAFC, #E0F2FE, #F0F9FF
              );
              background-size: 400% 400%;
              animation: gradient-flow 20s ease infinite;
            }
            @keyframes gradient-flow {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float-up {
              0% { transform: translateY(100vh) scale(0); opacity: 0; }
              10% { opacity: 0.4; }
              90% { opacity: 0.4; }
              100% { transform: translateY(-100vh) scale(1); opacity: 0; }
            }
            .bubble {
              position: absolute; border-radius: 50%;
              background: radial-gradient(circle at 30% 30%, rgba(186, 230, 253, 0.25), rgba(240, 249, 255, 0.1));
              box-shadow: 0 8px 32px rgba(186, 230, 253, 0.1);
              backdrop-filter: blur(3px);
              animation: float-up linear infinite;
            }
            .bubble-1 { width: 80px; height: 80px; left: 10%; animation-duration: 12s; }
            .bubble-2 { width: 60px; height: 60px; left: 25%; animation-duration: 15s; animation-delay: 2s; }
            .bubble-3 { width: 100px; height: 100px; left: 45%; animation-duration: 18s; animation-delay: 4s; }
            .bubble-4 { width: 70px; height: 70px; left: 65%; animation-duration: 13s; animation-delay: 1s; }
            .bubble-5 { width: 90px; height: 90px; left: 80%; animation-duration: 16s; animation-delay: 3s; }
            .bubble-6 { width: 50px; height: 50px; left: 15%; animation-duration: 14s; animation-delay: 5s; }
            .bubble-7 { width: 110px; height: 110px; left: 55%; animation-duration: 20s; animation-delay: 6s; }
            .bubble-8 { width: 65px; height: 65px; left: 90%; animation-duration: 17s; animation-delay: 2.5s; }
        `}</style>
        
        {/* Content */}
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
            
            <ListingGrid 
                listings={filteredListings}
                loading={false}
                categories={categories}
            />
        </div>
    </div>
  );
}
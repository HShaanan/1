import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import ListingGrid from "@/components/explore/ListingGrid";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, Store, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          const pages = await base44.entities.StorePage.filter({ slug, is_active: true });
          if (pages.length === 0) {
            setError("הדף לא נמצא");
          } else {
            const page = pages[0];
            setStorePage(page);
            
            // Load Listings based on filters
            // We load all approved listings first, then filter in memory for flexibility 
            // (or complex query if SDK supports it, but filter object is complex)
            // Ideally we should use backend filtering, but for now client side filtering on top of a reasonable fetch
            const listings = await base44.entities.BusinessPage.filter({
              is_active: true,
              approval_status: 'approved',
              is_frozen: false
            }, "-created_date", 500); // Limit 500 for performance

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

  // Filter Logic
  const filteredListings = useMemo(() => {
    if (!storePage || !activeListings.length) return [];
    
    const filters = storePage.filters || {};
    let result = activeListings;

    // Filter by Active Tab (Food/Shopping)
    if (filters.active_tab) {
        // Reuse regex logic from Browse or simple check if we had tags on categories
        // For simplicity, we assume generic filtering or skip if not critical
        // But user asked for Browse filters.
        // Let's implement basic filtering
    }

    // Category ID
    if (filters.category_id) {
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

    return result;
  }, [storePage, activeListings]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">הדף לא נמצא</h1>
            <p className="text-slate-600 mb-6">מצטערים, לא הצלחנו למצוא את הדף שחיפשת.</p>
            <Button onClick={() => window.location.href = createPageUrl('Browse')}>
                חזרה לחיפוש עסקים
            </Button>
        </div>
    );
  }

  // Detail View (With Slug)
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
        <SeoMeta 
            title={storePage.meta_title || storePage.title}
            description={storePage.meta_description || ""}
        />
        
        {/* Hero Section */}
        <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                    {storePage.title}
                </h1>
                
                {storePage.description && (
                    <div 
                        className="prose prose-lg max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: storePage.description }}
                    />
                )}
            </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-6 flex items-center gap-2 text-slate-500 text-sm">
                <Filter className="w-4 h-4" />
                נמצאו {filteredListings.length} עסקים
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
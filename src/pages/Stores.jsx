import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, Store, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import BrowsePage from "./Browse";

export default function StoresPage() {
  const [storePage, setStorePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allStorePages, setAllStorePages] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const rawSlug = urlParams.get("slug");
  // Normalize slug: decode -> lowercase -> trim -> replace spaces/plus with dashes to match Admin logic
  const slug = rawSlug ? decodeURIComponent(rawSlug).trim().toLowerCase().replace(/[\s+]+/g, '-') : null;

  // Load Data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (slug) {
          // Load Specific Store Page
          const pages = await base44.entities.StorePage.filter({ slug });
          
          if (pages.length === 0) {
            console.log("Store page not found for slug:", slug);
            setError("הדף לא נמצא");
          } else {
            const page = pages[0];
            setStorePage(page);
            
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

  const preSelectedState = useMemo(() => {
      if (!storePage) return null;
      const filters = storePage.filters || {};
      
      return {
          activeTab: filters.active_tab || 'food',
          categoryId: filters.category_id,
          subcategoryIds: filters.subcategory_ids || [],
          kashrut: filters.kashrut || [],
          delivery: filters.delivery || false,
          pickup: filters.pickup || false,
          openNow: filters.open_now || false
      };
  }, [storePage]);


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

  // Main Page View - Wraps Browse with SEO headers and Pre-selected filters
  return (
    <div className="min-h-screen relative" dir="rtl">
        <SeoMeta title={storePage.meta_title || storePage.title} description={storePage.meta_description || ""} />
        
        {/* SEO Header - Hidden visually for cleaner UX, but kept for Google & Accessibility */}
        <h1 className="sr-only">
            {storePage.title}
        </h1>
        
        {storePage.description && (
            <div 
                className="sr-only"
                dangerouslySetInnerHTML={{ __html: storePage.description }}
            />
        )}

        {/* The Actual Browse App with Pre-sets */}
        <BrowsePage preSelectedState={preSelectedState} />
    </div>
  );
}
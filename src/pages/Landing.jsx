import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setError("חסר פרמטר slug");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const pages = await base44.entities.LandingPage.filter({ slug });
        
        if (pages.length === 0) {
          setError("הדף לא נמצא");
        } else {
          const page = pages[0];
          setLandingPage(page);
          
          // עדכון מונה צפיות
          base44.entities.LandingPage.update(page.id, { 
            view_count: (page.view_count || 0) + 1 
          }).catch(() => {});
          
          // ניווט אוטומטי לעמוד העסק
          setTimeout(() => {
            navigate(createPageUrl(`BusinessPage?id=${page.business_page_id}`));
          }, 1500);
        }
      } catch (err) {
        console.error(err);
        setError("שגיאה בטעינת הדף");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

  if (loading || landingPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-6" dir="rtl">
        {landingPage && (
          <>
            <SeoMeta 
              title={landingPage.meta_title || landingPage.title} 
              description={landingPage.meta_description || ""} 
            />
            <h1 className="sr-only">{landingPage.title}</h1>
            {landingPage.description && (
              <div className="sr-only" dangerouslySetInnerHTML={{ __html: landingPage.description }} />
            )}
          </>
        )}
        
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {landingPage ? `מעביר אותך ל${landingPage.business_name}...` : 'טוען...'}
          </h2>
          {landingPage && (
            <p className="text-slate-600">רגע אחד, אנחנו מעבירים אותך לעמוד העסק</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">הדף לא נמצא</h1>
        <Button onClick={() => navigate(createPageUrl('Browse'))}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לחיפוש עסקים
        </Button>
      </div>
    );
  }

  return null;
}
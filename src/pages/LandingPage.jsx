import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { WebsiteSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";



export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await base44.entities.Category.list();
        setCategories(cats || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const topSubcategories = categories
    .filter(c => c.parent_id && c.image && c.is_active)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FAFBFC] overflow-x-hidden" dir="rtl">
      <WebsiteSchema />
      <OrganizationSchema />
      
      {/* ============== HERO SECTION - FULL IMAGE ============== */}
      <section className="relative w-full overflow-hidden">
        <Link 
          to={createPageUrl("Browse")}
          className="block w-full touch-manipulation group"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/fb8c8a10a_image3.jpg"
            alt="כל מה שטוב, כשר וקרוב - זירת המסחר הדיגיטלית החדשה של המגזר החרדי"
            className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-700"
          />
        </Link>
      </section>



      {/* ============== CATEGORIES GRID ============== */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            מה תרצו להזמין היום?
          </h2>
          <p className="text-slate-600">
            בחר קטגוריה וגלה את העסקים הכשרים הטובים ביותר באזורך
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {topSubcategories.map((cat) => (
            <Link
              key={cat.id}
              to={createPageUrl(`Browse?q=${encodeURIComponent(cat.name)}`)}
              className="group relative overflow-hidden rounded-2xl aspect-square flex items-end text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <img 
                src={cat.image} 
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="relative z-10 p-3 w-full">
                <h3 className="font-bold text-sm md:text-base text-center">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to={createPageUrl("Browse")}>
            <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold px-8 py-6 shadow-xl">
              גלו את כל החנויות
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============== BUSINESS CTA ============== */}
      <section className="py-8">
        <Link to={createPageUrl("BusinessLanding")} className="block group">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/1052bfba5_prompt-data_167864307029-8280832736374030336_877de5aa-6c2b-4e78-a4c7-6914d47d053a-.png"
            alt="הצטרף כבעל עסק למשלנו"
            className="w-full h-auto transform group-hover:scale-[1.01] transition-transform duration-500"
          />
        </Link>
      </section>



      {/* ============== FOOTER ============== */}
      <footer className="bg-slate-950 text-white py-8 sm:py-12 pb-24 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:gap-8 md:flex-row md:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png"
                alt="לוגו משלנו"
                className="h-12 sm:h-16 w-auto"
              />
              <div>
                <h3 className="text-lg sm:text-xl font-bold">משלנו</h3>
                <p className="text-white/50 text-xs sm:text-sm">הפלטפורמה הכשרה למשלוחים</p>
              </div>
            </div>

            <nav className="flex items-center gap-4 sm:gap-6" aria-label="ניווט פוטר">
              <Link to={createPageUrl("Browse")} className="text-white/60 hover:text-white transition-colors text-sm sm:text-base touch-manipulation py-2">עסקים</Link>
              <Link to={createPageUrl("Add")} className="text-white/60 hover:text-white transition-colors text-sm sm:text-base touch-manipulation py-2">הצטרפות</Link>
              <Link to={createPageUrl("AccessibilityStatement")} className="text-white/60 hover:text-white transition-colors text-sm sm:text-base touch-manipulation py-2">נגישות</Link>
            </nav>
          </div>

          <div className="border-t border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-white/40 text-xs sm:text-sm">
            © {new Date().getFullYear()} משלנו. כל הזכויות שמורות.
          </div>
        </div>
      </footer>


    </div>
  );
}
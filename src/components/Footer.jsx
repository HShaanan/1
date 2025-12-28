import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white py-8 sm:py-12 pb-24 sm:pb-12" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png"
              alt="לוגו משלנו"
              className="h-12 sm:h-16 w-auto" />

            <div className="text-center md:text-right">
              <h3 className="text-lg sm:text-xl font-bold">משלנו</h3>
              <p className="text-white/50 text-xs sm:text-sm">כל מה שטוב כשר וקרוב
הכל במקום אחד</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-right">
            <h4 className="font-bold text-white mb-4">קישורים</h4>
            <nav className="flex flex-col gap-2" aria-label="קישורים מהירים">
              <Link to={createPageUrl("Browse")} className="text-white/60 hover:text-white transition-colors text-sm">עסקים</Link>
              <Link to={createPageUrl("BusinessLanding")} className="text-white/60 hover:text-white transition-colors text-sm">הצטרפות</Link>
              <Link to={createPageUrl("TermsOfUsePage")} className="text-white/60 hover:text-white transition-colors text-sm">תקנון</Link>
              <Link to={createPageUrl("AccessibilityStatement")} className="text-white/60 hover:text-white transition-colors text-sm">הצהרת נגישות</Link>
              <Link to={createPageUrl("ContactPage")} className="text-white/60 hover:text-white transition-colors text-sm">צור קשר</Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="text-center md:text-right">
            <h4 className="font-bold text-white mb-4">קטגוריות פופולריות</h4>
            <nav className="flex flex-col gap-2" aria-label="קטגוריות פופולריות">
              <Link to={createPageUrl("Browse?q=פיצה")} className="text-white/60 hover:text-white transition-colors text-sm">פיצה</Link>
              <Link to={createPageUrl("Browse?q=סושי")} className="text-white/60 hover:text-white transition-colors text-sm">סושי</Link>
              <Link to={createPageUrl("Browse?q=המבורגר")} className="text-white/60 hover:text-white transition-colors text-sm">המבורגר</Link>
              <Link to={createPageUrl("Browse?q=בשר")} className="text-white/60 hover:text-white transition-colors text-sm">בשר</Link>
              <Link to={createPageUrl("Browse?q=מתוקים")} className="text-white/60 hover:text-white transition-colors text-sm">מתוקים</Link>
            </nav>
          </div>

          {/* Kashrut */}
          <div className="text-center md:text-right">
            <h4 className="font-bold text-white mb-4">כשרויות</h4>
            <nav className="flex flex-col gap-2" aria-label="רשויות כשרות">
              <Link to={createPageUrl("Browse?kashrut=בד%22צ%20העדה-החרדית")} className="text-white/60 hover:text-white transition-colors text-sm">בד"צ העדה החרדית</Link>
              <Link to={createPageUrl("Browse?kashrut=בד%22צ%20בית%20יוסף")} className="text-white/60 hover:text-white transition-colors text-sm">בד"צ בית יוסף</Link>
              <Link to={createPageUrl("Browse?kashrut=רבנות%20מהדרין")} className="text-white/60 hover:text-white transition-colors text-sm">רבנות מהדרין</Link>
              <Link to={createPageUrl("Browse?kashrut=רבנות")} className="text-white/60 hover:text-white transition-colors text-sm">רבנות</Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 sm:pt-8 text-center text-white/40 text-xs sm:text-sm">
          © {new Date().getFullYear()} משלנו. כל הזכויות שמורות.
        </div>
      </div>
    </footer>);
}
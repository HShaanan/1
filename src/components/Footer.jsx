import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function Footer() {
  const [footerLinks, setFooterLinks] = React.useState([]);

  React.useEffect(() => {
    const loadFooterLinks = async () => {
      try {
        const links = await base44.entities.FooterLink.filter({ is_active: true }, "sort_order");
        setFooterLinks(links || []);
      } catch (error) {
        console.error("Error loading footer links:", error);
      }
    };
    loadFooterLinks();
  }, []);

  // Group links by column
  const groupedLinks = footerLinks.reduce((acc, link) => {
    const key = `${link.column_type}-${link.column_title || ''}`;
    if (!acc[key]) {
      // Default titles based on column type
      let defaultTitle = 'קטגוריות';
      if (link.column_type === 'city') defaultTitle = 'עיר';
      else if (link.column_type === 'kashrut') defaultTitle = 'כשרות';
      
      acc[key] = {
        type: link.column_type,
        title: link.column_title || defaultTitle,
        links: []
      };
    }
    acc[key].links.push(link);
    return acc;
  }, {});

  return (
    <footer className="bg-slate-950 text-white py-8 sm:py-12 pb-24 sm:pb-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
              <Link to={createPageUrl("ContactPage")} className="text-white/60 hover:text-white transition-colors text-sm">צור קשר</Link>
            </nav>
          </div>

          {/* Dynamic Footer Columns */}
          {Object.entries(groupedLinks).map(([key, column]) => (
            <div key={key} className="text-center md:text-right">
              <h4 className="font-bold text-white mb-4">{column.title}</h4>
              <nav className="flex flex-col gap-2" aria-label={column.title}>
                {column.links.map((link) => {
                  const query = new URLSearchParams();
                  query.set('subcategory', link.subcategory_name);
                  if (link.kashrut) query.set('kashrut', link.kashrut);
                  if (link.city) query.set('city', link.city);

                  return (
                    <Link 
                      key={link.id}
                      to={`${createPageUrl("Browse")}?${query.toString()}`}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {link.link_text}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          </div>

        <div className="border-t border-white/10 pt-6 sm:pt-8 text-center text-white/40 text-xs sm:text-sm">
          © {new Date().getFullYear()} משלנו. כל הזכויות שמורות.
        </div>
      </div>
    </footer>);
}
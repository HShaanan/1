import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { LazyImage } from "@/components/PerformanceOptimizations";

export default function ListingPreviewCard({ businessPage, onClick, categories = [] }) {
  const navigate = useNavigate();
  
  if (!businessPage) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(businessPage);
      return;
    }
    const slug = businessPage.url_slug || businessPage.id;
    navigate(createPageUrl("BusinessPage") + `?slug=${slug}`);
  };

  const displayImage = businessPage.preview_image || businessPage.images?.[0] || "";
  const kashrutLogo = businessPage.kashrut_logo_url;

  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden bg-white border-slate-200 hover:-translate-y-1"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* תמונה ראשית */}
      <div className="relative w-full aspect-[21/9] overflow-hidden bg-slate-100">
        {displayImage ? (
          <LazyImage
            src={displayImage}
            alt={businessPage.business_name}
            className="w-full h-full"
            imgClassName="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-5xl">🏪</span>
          </div>
        )}

        {/* Badge כשר */}
        {businessPage.kashrut_authority_type && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow-sm">
            <span className="text-xs font-semibold text-slate-700">כשר</span>
          </div>
        )}

        {/* לוגו כשרות - שמאל למטה */}
        {kashrutLogo && (
          <div className="absolute bottom-2 right-2 bg-white/90 p-0.5 rounded shadow-md">
            <img 
              src={kashrutLogo} 
              alt="לוגו כשרות" 
              className="w-12 h-12 object-contain"
            />
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {/* שם העסק */}
        <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {businessPage.business_name}
        </h3>

        {/* תיאור קצר */}
        {businessPage.description && (
          <p className="text-xs text-slate-600 line-clamp-2">
            {businessPage.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
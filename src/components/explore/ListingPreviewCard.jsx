import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Truck, ShoppingBag } from "lucide-react";
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

  const defaultImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/e8b173c76_image2.jpg";
  const displayImage = businessPage.preview_image || businessPage.images?.[0] || defaultImage;
  const kashrutLogo = businessPage.kashrut_logo_url;

  return (
    <Card
      className={`group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1 ${
        businessPage.is_promoted 
          ? 'border-2 border-amber-400 ring-2 ring-amber-200 shadow-amber-200/50' 
          : 'border-slate-200'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      aria-label={`הצג פרטים עבור ${businessPage.business_name}`}
    >
      {/* תמונה ראשית */}
      <div className="relative w-full aspect-[21/9] overflow-hidden bg-slate-100" aria-hidden="true">
        <LazyImage
          src={displayImage}
          alt={businessPage.business_name}
          className="w-full h-full"
          imgClassName="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Promoted Badge */}
        {businessPage.is_promoted && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1 font-bold text-xs">
            <TrendingUp className="w-3 h-3" />
            מקודם
          </div>
        )}

        {/* Badge כשר */}
        {businessPage.kashrut_authority_type && (
          <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded-md shadow-sm">
            <span className="text-xs font-semibold text-slate-700">כשר</span>
          </div>
        )}

        {/* Delivery & Pickup Badges */}
        {(businessPage.has_delivery || businessPage.has_pickup) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {businessPage.has_delivery && (
              <Badge className="bg-blue-600 text-white shadow-md flex items-center gap-1 text-xs">
                <Truck className="w-3 h-3" />
                משלוח
              </Badge>
            )}
            {businessPage.has_pickup && (
              <Badge className="bg-green-600 text-white shadow-md flex items-center gap-1 text-xs">
                <ShoppingBag className="w-3 h-3" />
                איסוף
              </Badge>
            )}
          </div>
        )}

        {/* לוגו כשרות - ימין למטה, מוגדל */}
        {kashrutLogo && (
          <div className="absolute bottom-2 right-2 bg-white/95 p-1 rounded-lg shadow-lg z-10">
            <LazyImage
              src={kashrutLogo}
              alt="לוגו כשרות"
              className="w-16 h-16 sm:w-20 sm:h-20" // Increased size significantly
              imgClassName="object-contain"
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* שם העסק - מוגדל */}
        <h3 className="text-lg font-bold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {businessPage.business_name}
        </h3>

        {/* כתובת - מוגדל */}
        {businessPage.address && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-1 font-medium">
            📍 {businessPage.address}
          </p>
        )}

        {/* תיאור קצר - מוגדל */}
        {businessPage.description && (
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {businessPage.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
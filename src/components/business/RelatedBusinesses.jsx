import { Store, Star } from "lucide-react";
import { LazyImage } from "@/components/PerformanceOptimizations";
import ScrollReveal from "@/components/ScrollReveal";
import { createPageUrl, createBusinessUrl } from "@/utils";

export default function RelatedBusinesses({ businesses, onBusinessClick }) {
  if (!businesses || businesses.length === 0) return null;
  return (
    <ScrollReveal delay={0.2}>
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-200/80">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Store className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
          עוד עסקים בקטגוריה
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businesses.map((related) => (
            <a
              key={related.id}
              href={createBusinessUrl(related.url_slug || related.id)}
              className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200"
              onClick={(e) => {
                e.preventDefault();
                onBusinessClick(related.id);
                window.location.href = createBusinessUrl(related.url_slug || related.id);
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                {related.preview_image || related.images?.[0] ? (
                  <LazyImage
                    src={related.preview_image || related.images?.[0]}
                    alt={related.business_name}
                    className="w-full h-full"
                    imgClassName="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {related.business_name}
                </h4>
                {related.smart_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-slate-600">{related.smart_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

import React from "react";
import { createPageUrl } from "@/utils";

export default function CategoryShowcase({ categories = [] }) {
  const visible = Array.isArray(categories)
    ? categories.filter(c => !c.parent_id && c.is_active).sort((a,b)=> (a.sort_order||0)-(b.sort_order||0)).slice(0, 10)
    : [];

  if (visible.length === 0) return null;

  const goToCategory = (catId) => {
    // ננתב לחיפוש עם פרמטר קטגוריה כדי לסנן מיד
    const url = createPageUrl(`Search?category=${encodeURIComponent(catId)}`);
    window.location.href = url;
  };

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-transparent to-slate-50">
      <div className="max-w-7xl mx-auto px-4" dir="rtl">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-6">קטגוריות מובילות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {visible.map((cat) => (
            <button
              key={cat.id}
              onClick={() => goToCategory(cat.id)}
              className="group relative p-4 rounded-2xl bg-white border shadow-sm hover:shadow-lg transition-all text-right"
              title={`פתח ${cat.name}`}
            >
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">{cat.icon || "📁"}</div>
                )}
              </div>
              <div className="font-bold text-slate-800">{cat.name}</div>
              <div className="text-xs text-slate-500">לחיצה תפתח תוצאות מתאימות</div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-indigo-200 transition" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
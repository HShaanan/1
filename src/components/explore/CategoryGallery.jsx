
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import HorizontalScroller from "./HorizontalScroller";

export default function CategoryGallery({ categories = [], loading, onSelect, selectedId, filterPredicate = null }) {
  const mainCats = Array.isArray(categories)
    ? categories.filter(c => !c.parent_id && c.is_active)
    : [];

  // חדש: מסנן לפי לשונית/פילטר אם קיים
  const visibleCats = typeof filterPredicate === "function" ? mainCats.filter(filterPredicate) : mainCats;

  if (loading) {
    return (
      <div className="relative" dir="rtl">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-1 py-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[160px]">
              <Skeleton className="w-full h-28 rounded-2xl mb-2" />
              <Skeleton className="w-2/3 h-3 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pastelPalette = [
    "bg-rose-100",
    "bg-orange-100",
    "bg-amber-100",
    "bg-lime-100",
    "bg-emerald-100",
    "bg-teal-100",
    "bg-sky-100",
    "bg-indigo-100",
    "bg-violet-100",
    "bg-fuchsia-100"
  ];

  return (
    <div dir="rtl">
      <HorizontalScroller ariaLabel="קטגוריות" itemWidth={160} gap={16}>
        {visibleCats.map((cat, idx) => {
          const active = selectedId === cat.id;
          const pastel = pastelPalette[idx % pastelPalette.length];
          return (
            <button
              key={cat.id}
              role="listitem"
              onClick={() => onSelect?.(cat.id)}
              className="shrink-0 w-[160px] text-center group"
              title={cat.name}
              aria-pressed={active}
              type="button"
              dir="rtl"
            >
              <div
                className={`rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  active ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
                } ${pastel} p-4`}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <span className="text-3xl">{cat.icon || "🛍️"}</span>
                </div>
                <div className="px-2 py-2">
                  <div className="text-sm font-semibold tracking-tight text-slate-900 line-clamp-1">
                    {cat.name}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </HorizontalScroller>
    </div>
  );
}

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/PerformanceOptimizations";
import HorizontalScroller from "./HorizontalScroller";

export default function FoodSubcategoryGallery({ categories = [], loading, onSelect, selectedId }) {
  // סינון כל תתי־הקטגוריות ששייכות לקטגוריות על "אוכל" לפי שם
  const foodRegex = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|קפה|קונדיטור|מאפים)/i;

  // מציג קטגוריות ראשיות (ללא הורה) שמתאימות לחיפוש "אוכל"
  // זה מאפשר לקטגוריות כמו "פיצה", "בשרים" וכו' להופיע אם הן מוגדרות כראשיות
  const subs = (Array.isArray(categories) ? categories : [])
    .filter(c => !c.parent_id && foodRegex.test(c.name || "") && (c.is_active ?? true));

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

  if (!subs.length) return null;

  // הוסר pastelPalette – לא משתמשים יותר ברקעי צבע

  return (
    <div dir="rtl">
      <HorizontalScroller ariaLabel="תתי־קטגוריות אוכל" itemWidth={200} gap={16}>
        {subs.map((sc) => {
          const active = selectedId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelect?.(sc.id)}
              className="shrink-0 w-[200px] text-center group"
              title={sc.name}
              aria-pressed={active}
              type="button"
              dir="rtl"
            >
              <div
                className={`rounded-2xl overflow-hidden border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  active ? "border-blue-400 shadow-md" : "border-gray-200"
                }`}
              >
                {/* תמונה מלאה בראש הכרטיס ביחס 4:3 */}
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {sc.image ? (
                    <LazyImage
                      src={sc.image}
                      alt={sc.name}
                      className="w-full h-full"
                      imgClassName="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50">
                      <span className="text-6xl drop-shadow-sm">{sc.icon || "🍽️"}</span>
                    </div>
                  )}
                </div>

                {/* טקסט מתחת לתמונה */}
                <div className="px-3 py-2 bg-white border-t">
                  <div className="text-sm md:text-[15px] font-semibold tracking-tight text-slate-900 line-clamp-1">
                    {sc.name}
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
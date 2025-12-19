import React from "react";
import { LazyImage } from "@/components/PerformanceOptimizations";
import HorizontalScroller from "./HorizontalScroller";

export default function SubcategoryChips({ categories = [], parentId, items, selectedSubId, onSelect, showAllTile = true, filterSubIds = null }) {
  // Logic to determine which items to show: prop 'items' takes precedence, otherwise filter by parentId
  let subs = [];
  
  if (items && Array.isArray(items)) {
      subs = items;
  } else if (parentId) {
      const subsBase = Array.isArray(categories)
        ? categories.filter(c => c.parent_id === parentId && c.is_active)
        : [];
      subs = Array.isArray(filterSubIds) && filterSubIds.length > 0
        ? subsBase.filter(c => filterSubIds.includes(c.id))
        : subsBase;
  }

  // If no items found, return null
  if (subs.length === 0) return null;

  // Tile component for displaying individual subcategory chips.
  const Tile = ({ active, title, image, icon, onClick }) => (
    <button
      onClick={onClick}
      className="shrink-0 w-[220px] text-right group" // Width is fixed at 220px
      title={title}
      aria-pressed={active}
      type="button" // Ensures button behaves semantically
      dir="rtl" // Added for RTL alignment
    >
      <div
        className={`rounded-2xl overflow-hidden border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
          active ? "border-indigo-400 ring-2 ring-indigo-200" : "border-gray-200"
        }`}
      >
        <div className="w-full aspect-[4/3] bg-gray-100">
          {image ? (
            // Display image if available
            <LazyImage
              src={image}
              alt={title}
              className="w-full h-full"
              imgClassName="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            // Fallback to icon if no image
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{icon || "📁"}</span> {/* Default icon */}
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="text-sm md:text-[15px] font-semibold tracking-tight text-slate-900 line-clamp-1">
            {title}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    // Wrap with a div to enforce RTL for the entire scrolling section
    <div dir="rtl">
      {/* HorizontalScroller component manages the scrolling and arrow navigation.
      It takes care of the ref, scroll logic, and arrow rendering. */}
      <HorizontalScroller
        ariaLabel="תתי־קטגוריות"
        itemWidth={220} // The fixed width of each Tile
        gap={16} // The gap between items (tailwind 'gap-4' is 16px)
      >
        {/* 'All' Tile - show only if allowed */}
        {showAllTile && (
          <Tile
            active={!selectedSubId} // Active if no subcategory is selected
            title="הכל"
            image="" // No image for 'All'
            icon="⭐" // Special icon for 'All'
            onClick={() => onSelect?.(null)} // Selects null to indicate 'All'
          />
        )}

        {/* Map through subcategories to create Tiles */}
        {subs.map((sc) => (
          <Tile
            key={sc.id}
            active={selectedSubId === sc.id} // Active if its ID matches the selectedSubId
            title={sc.name}
            image={sc.image}
            icon={sc.icon}
            onClick={() => onSelect?.(sc.id)} // Selects the subcategory by its ID
          />
        ))}
      </HorizontalScroller>
    </div>
  );
}
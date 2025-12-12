import React from "react";
import HorizontalScroller from "./HorizontalScroller";

export default function ProfessionalsGroupChips({ groups = [], selectedGroupId, onSelect }) {
  const Tile = ({ active, title, icon, onClick }) => (
    <button
      onClick={onClick}
      className="shrink-0 w-[220px] text-right group"
      aria-pressed={active}
      type="button"
      dir="rtl"
      title={title}
    >
      <div
        className={`rounded-2xl overflow-hidden border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
          active ? "border-indigo-400 ring-2 ring-indigo-200" : "border-gray-200"
        }`}
      >
        <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center">
          <span className="text-5xl">{icon || "✨"}</span>
        </div>
        <div className="px-3 py-2">
          <div className="text-sm md:text-[15px] font-semibold tracking-tight text-slate-900 line-clamp-1">
            {title}
          </div>
        </div>
      </div>
    </button>
  );

  if (!Array.isArray(groups) || groups.length === 0) return null;

  return (
    <div dir="rtl">
      <HorizontalScroller ariaLabel="קבוצות אנשי מקצוע" itemWidth={220} gap={16}>
        {groups.map(g => (
          <Tile
            key={g.id}
            active={selectedGroupId === g.id}
            title={g.label}
            icon={g.icon}
            onClick={() => onSelect?.(g.id)}
          />
        ))}
      </HorizontalScroller>
    </div>
  );
}
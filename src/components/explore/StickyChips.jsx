import React from "react";

export default function StickyChips({ children }) {
  return (
    <div className="lg:hidden sticky top-28 z-20 bg-gradient-to-b from-white/95 to-white/70 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-3 py-2" dir="rtl">
        {children}
      </div>
    </div>
  );
}
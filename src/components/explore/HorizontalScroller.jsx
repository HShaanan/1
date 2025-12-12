import React from "react";

export default function HorizontalScroller({
  children,
  ariaLabel = "",
  className = "",
  itemWidth = 220,
  gap = 16,
}) {
  const scrollerRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < max - 1);
  }, []);

  // פוליפיל לגלילה חלקה
  const smoothScrollBy = (dx, duration = 400) => {
    const el = scrollerRef.current;
    if (!el) return;
    try {
      el.scrollBy({ left: dx, behavior: "smooth" });
    } catch {
      const start = el.scrollLeft;
      let startTime = null;
      const step = (t) => {
        if (!startTime) startTime = t;
        const p = Math.min(1, (t - startTime) / duration);
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;
        el.scrollLeft = start + dx * ease;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(itemWidth * 2.5, Math.floor(el.clientWidth * 0.9));
    smoothScrollBy(-amount);
  };

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(itemWidth * 2.5, Math.floor(el.clientWidth * 0.9));
    smoothScrollBy(amount);
  };

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateArrows();
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);

    const t1 = setTimeout(updateArrows, 120);
    const t2 = setTimeout(updateArrows, 400);

    return () => {
      el.removeEventListener("scroll", onScroll);
      try { ro.disconnect(); } catch {}
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateArrows]);

  return (
    <div className={`relative ${className}`} dir="rtl" aria-label={ariaLabel}>
      {/* חץ ימני — קדימה */}
      <button
        type="button"
        onClick={scrollNext}
        aria-label="גלול קדימה"
        disabled={!canScrollRight}
        className={`hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow transition
          ${canScrollRight ? "bg-white/90 backdrop-blur hover:bg-white" : "bg-white/60 cursor-not-allowed opacity-50"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* חץ שמאלי — אחורה */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="גלול אחורה"
        disabled={!canScrollLeft}
        className={`hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow transition
          ${canScrollLeft ? "bg-white/90 backdrop-blur hover:bg-white" : "bg-white/60 cursor-not-allowed opacity-50"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* מסילה — dir='ltr' לשמירה על עקביות */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar px-1 py-2 scroll-smooth"
        dir="ltr"
        role="list"
        onLoad={updateArrows}
      >
        {children}
      </div>
    </div>
  );
}
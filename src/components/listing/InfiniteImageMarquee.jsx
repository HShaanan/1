import React, { useMemo } from "react";
import { LazyImage } from "@/components/PerformanceOptimizations";

export default function InfiniteImageMarquee({
  images = [],
  height = { mobile: 96, desktop: 128 },
  gap = 12,
  speedSeconds = 30
}) {
  const imgs = useMemo(() => Array.isArray(images) ? images.filter(Boolean) : [], [images]);

  // שכפול 3 פעמים - מבטיח כיסוי מלא
  const tripled = useMemo(() => [...imgs, ...imgs, ...imgs], [imgs]);

  if (!imgs.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl" aria-label="תמונות העסק">
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />

      <div className="text-black opacity-100 rounded marquee-wrapper">
        <div className="marquee-track" style={{ animationDuration: `${speedSeconds}s` }}>
          {tripled.map((src, idx) =>
          <div
            key={`${src}-${idx}`}
            className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            style={{
              width: 160,
              height: height?.mobile || 96,
              marginInlineStart: idx === 0 ? 0 : gap
            }}>

              <LazyImage
              src={src}
              alt={`תמונת עסק ${idx % imgs.length + 1}`}
              className="w-full h-full"
              imgClassName="object-cover w-full h-full" />

            </div>
          )}
        </div>
      </div>

      <style>{`
        .marquee-wrapper {
          direction: ltr;
          width: 100%;
          overflow: hidden;
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          animation: marquee-scroll linear infinite;
          will-change: transform;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0%); }
          to   { transform: translateX(-33.333333%); }
        }
        @media (min-width: 768px) {
          .marquee-track > div {
            height: ${height?.desktop || 128}px !important;
            width: 200px !important;
          }
        }
      `}</style>
    </div>);

}
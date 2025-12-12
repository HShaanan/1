import React, { useMemo } from "react";

export default function BrandsCarousel({ logos = [] }) {
  // הכנה לפני כל return - אין קריאות מותנות ל-Hooks
  const safeLogos = Array.isArray(logos) ? logos.filter(Boolean) : [];
  const doubled = useMemo(() => [...safeLogos, ...safeLogos], [safeLogos]);
  const durationSec = Math.max(18, Math.round((safeLogos.length || 6) * 2.4)); // ברירת מחדל למהירות נעימה

  if (safeLogos.length === 0) return null;

  return (
    <div className="w-full py-4 overflow-hidden">
      <div className="brands-wrapper">
        <div
          className="brands-track"
          style={{ ["--duration"]: `${durationSec}s` }}
        >
          {doubled.map((logo, idx) => (
            <div key={`brand-${idx}`} className="brand-item">
              <img
                src={logo}
                alt={`מותג ${(idx % safeLogos.length) + 1}`}
                className="brand-img"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .brands-wrapper {
          direction: ltr;           /* האנימציה לשמאל */
          width: 100%;
          overflow: hidden;
        }

        .brands-track {
          display: inline-flex;     /* inline-flex מאפשר translate לפי רוחב התוכן */
          align-items: center;
          gap: 24px;                /* מרווח בין לוגואים (לא padding בתוך הפריט) */
          animation: brands-scroll var(--duration) linear infinite;
          will-change: transform;
        }

        .brand-item {
          width: 140px;             /* רוחב קבוע ללופ יציב */
          height: 70px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-img {
          width: 100%;
          height: 100%;
          object-fit: contain;      /* ללא שוליים לבנים */
          filter: grayscale(100%);
          opacity: 0.6;
          transition: transform 300ms, filter 300ms, opacity 300ms;
          cursor: pointer;
        }

        .brand-img:hover {
          transform: scale(1.1);
          filter: none;
          opacity: 1;
        }

        @keyframes brands-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* חצי מרוחב ה-track => רציף ללא קפיצה */
        }

        @media (max-width: 768px) {
          .brands-track { gap: 16px; }
          .brand-item { width: 110px; height: 55px; }
        }
      `}</style>
    </div>
  );
}
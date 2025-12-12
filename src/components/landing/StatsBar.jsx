
import React from "react";
import AnimatedCounter from "./AnimatedCounter";
import { Users, FileText, Layers } from "lucide-react";

export default function StatsBar({ stats, loading }) {
  const keys = ["totalListings", "activeUsers", "categories"];
  const items = [
    { key: "totalListings", label: "מודעות פעילות", icon: FileText },
    { key: "activeUsers", label: "משתמשים", icon: Users },
    { key: "categories", label: "קטגוריות", icon: Layers },
  ];

  // פלטות צבע לאפקט LED
  const palettes = {
    totalListings: { from: "from-emerald-400", to: "to-teal-600", ring: "ring-emerald-300/60" },
    activeUsers: { from: "from-fuchsia-500", to: "to-purple-600", ring: "ring-fuchsia-300/60" },
    categories: { from: "from-sky-500", to: "to-indigo-600", ring: "ring-sky-300/60" },
  };

  const [stable, setStable] = React.useState({ totalListings: 0, activeUsers: 0, categories: 0 });

  React.useEffect(() => {
    if (stats && typeof stats === "object") {
      // Create a new object to avoid direct mutation and ensure state update
      const nextStableState = { ...stable }; 
      
      keys.forEach((k) => {
        // Only update if the incoming stat is a valid number
        if (typeof stats[k] === "number" && !Number.isNaN(stats[k])) {
          nextStableState[k] = stats[k];
        }
      });
      
      // Update state only if there are changes to avoid unnecessary re-renders
      if (JSON.stringify(stable) !== JSON.stringify(nextStableState)) {
        setStable(nextStableState);
      }
    }
     
  }, [stats]); // Effect depends only on 'stats' prop

  return (
    <section className="bg-white/80 backdrop-blur border-y">
      {/* אנימציית נשימה עדינה להילה */}
      <style jsx>{`
        @keyframes neonPulse {
          0% { transform: scale(1); opacity: .55; }
          50% { transform: scale(1.06); opacity: .85; }
          100% { transform: scale(1); opacity: .55; }
        }
        .animate-neon {
          animation: neonPulse 3.2s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map(({ key, label, icon: Icon }) => {
            const pal = palettes[key] || palettes.totalListings;
            return (
              <div
                key={key}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur border border-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* אייקון עם הילה ניאונית */}
                <div className="relative">
                  <div
                    className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${pal.from} ${pal.to} text-white flex items-center justify-center shadow-lg ring-1 ${pal.ring}`}
                  >
                    <Icon className="w-6 h-6 drop-shadow-sm" />
                    {/* הילה */}
                    <div
                      className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br ${pal.from} ${pal.to} blur-md opacity-60 animate-neon`}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* מספרים וטקסט */}
                <div className="min-w-0">
                  <div className="text-slate-900 text-xl font-extrabold tracking-tight">
                    {loading ? "…" : <AnimatedCounter value={Number(stable[key] || 0)} />}
                  </div>
                  <div className="text-slate-500 text-sm leading-5">{label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

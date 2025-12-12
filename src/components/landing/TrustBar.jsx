import React from "react";
import { Award, MapPin, Heart } from "lucide-react";

export default function TrustBar() {
  const items = [
    { icon: MapPin, text: "קרוב לבית", color: "text-blue-700 bg-blue-100" },
    { icon: Heart, text: "קרוב ללב", color: "text-rose-700 bg-rose-100" },
    { icon: Award, text: "איכות", color: "text-amber-700 bg-amber-100" }
  ];

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${it.color} shadow-sm`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{it.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
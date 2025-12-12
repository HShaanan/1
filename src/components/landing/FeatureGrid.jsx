import React from "react";
import { ShieldCheck, Zap, Users, MapPin, Clock, Sparkles } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "תוכן מאושר",
    text: "מודעות נבדקות ומסוננות כדי לשמור על אמינות ובטיחות.",
    color: "from-emerald-100 to-teal-100 text-emerald-700",
    iconColor: "text-emerald-600"
  },
  {
    icon: Zap,
    title: "מהיר ויעיל",
    text: "פרסום וחיפוש זריזים עם חיפוש חכם ומותאם מובייל.",
    color: "from-yellow-100 to-amber-100 text-yellow-700",
    iconColor: "text-yellow-600"
  },
  {
    icon: Users,
    title: "קהילה צומחת",
    text: "עסקים, מוכרים וקונים במקום אחד – בקצב שמזיז דברים.",
    color: "from-indigo-100 to-blue-100 text-indigo-700",
    iconColor: "text-indigo-600"
  },
  {
    icon: MapPin,
    title: "מותאם אזור",
    text: "סינון לפי אזור וקרבה כדי למצוא את מה שצריך קרוב לבית.",
    color: "from-blue-100 to-cyan-100 text-blue-700",
    iconColor: "text-blue-600"
  },
  {
    icon: Clock,
    title: "עדכונים בזמן אמת",
    text: "מודעות חדשות, סטטוסים ומבצעים – הכל מתעדכן ברקע.",
    color: "from-purple-100 to-violet-100 text-purple-700",
    iconColor: "text-purple-600"
  },
  {
    icon: Sparkles,
    title: "חוויה נעימה",
    text: "עיצוב נקי עם אנימציות עדינות שמרגישות פשוט נכון.",
    color: "from-pink-100 to-rose-100 text-pink-700",
    iconColor: "text-pink-600"
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-10 md:py-14 relative">
      <div className="max-w-7xl mx-auto px-4" dir="rtl">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-3">למה דווקא משלנו?</h2>
        <p className="text-slate-600 text-center mb-8 text-lg">יתרונות שמרגישים מהרגע הראשון</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-2"
              >
                {/* רקע אנימטיבי */}
                <div className={`absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br ${f.color} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                    <Icon className={`w-6 h-6 ${f.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">{f.title}</h3>
                    <p className="text-slate-600 text-sm leading-6">{f.text}</p>
                  </div>
                </div>

                {/* זוהר עדין בעת רחף */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
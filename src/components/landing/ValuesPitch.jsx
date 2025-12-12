import React from "react";
import { MapPin, Heart, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function ValuesPitch() {
  const cards = [
    {
      icon: MapPin,
      title: "הכי קרוב פיזית",
      text: "מצא בעלי מקצוע ועסקים במרחק הליכה. מנוע החיפוש המתקדם שלנו נותן עדיפות למי שקרוב אליך, כדי שתוכל לקבל שירות מהיר ונוח.",
      color: "from-blue-50 to-blue-100"
    },
    {
      icon: Heart,
      title: "הכי קרוב לערכים",
      text: "כל המודעות והתכנים עוברים סינון ובקרה כדי להתאים לערכי הקהילה. אצלנו תרגיש בבית, עם תוכן נקי, מכבד ואמין.",
      color: "from-rose-50 to-rose-100"
    },
    {
      icon: Star,
      title: "איכות",
      text: "מערכת דירוג וביקורות שקופה מאפשרת לקהילה להמליץ על הטובים ביותר. סמוך על חוכמת ההמונים כדי למצוא שירות מעולה.",
      color: "from-amber-50 to-amber-100"
    }
  ];

  return (
    <section className="py-10 md:py-14 bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-4" dir="rtl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">החזון שלנו: קהילה. אמון. קרבה.</h2>
          <p className="text-slate-600 mt-2 text-lg">אנחנו מאמינים שלמצוא שירות מעולה לא צריך להיות מסובך. במשלנו, הכל מתחיל ונגמר בקהילה.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="group relative overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className={`absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br ${c.color} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition`} />
                <div className="relative p-6">
                  <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center shadow-sm mb-4">
                    <Icon className="w-6 h-6 text-slate-800" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{c.title}</h3>
                  <p className="text-slate-600 text-base mt-2 leading-relaxed">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button
            onClick={() => (window.location.href = createPageUrl("Browse"))}
            size="lg"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
          >
            גלה עסקים בקהילה
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
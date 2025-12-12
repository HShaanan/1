import React from "react";
import { Search, Plus, CheckCircle2 } from "lucide-react";

const steps = [
  { 
    icon: Search, 
    title: "חפשו במהירות", 
    text: "הקלידו מה שאתם צריכים וסננו לפי קטגוריות.",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    icon: Plus, 
    title: "פרסמו בקלות", 
    text: "טופס קצר, העלאת תמונות – והמודעה בדרך לאישור.",
    color: "from-purple-500 to-pink-500"
  },
  { 
    icon: CheckCircle2, 
    title: "מוצאים ומתאמים", 
    text: "צרו קשר ישיר, קבלו הצעות ונסגר עניין.",
    color: "from-emerald-500 to-teal-500"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-10 md:py-14 relative">
      <div className="max-w-7xl mx-auto px-4" dir="rtl">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-3">איך זה עובד?</h2>
        <p className="text-slate-600 text-center mb-8 text-lg">3 צעדים פשוטים שמביאים תוצאות</p>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500 group hover:-translate-y-1">
                {/* רקע צבעוני עדין */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-white/40 rounded-2xl"></div>
                
                <div className="relative text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${s.color} text-white flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3 text-xl">{s.title}</h3>
                  <p className="text-slate-600 leading-6">{s.text}</p>
                </div>

                {/* מספר השלב */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {i + 1}
                </div>

                {/* זוהר עדין */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-r from-blue-200/30 to-purple-200/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
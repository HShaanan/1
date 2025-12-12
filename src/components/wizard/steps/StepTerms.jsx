import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function StepTerms({ accepted = false, onChange = () => {} }) {
  return (
    <div className="space-y-6" dir="rtl">
      {/* כותרת */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white mb-2 shadow-lg">
          <Shield className="w-5 h-5" />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold" style={{ 
          background: 'linear-gradient(135deg, #f97316, #ea580c)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          fontFamily: '"Ronda", sans-serif'
        }}>
          תנאי שימוש ופרסום
        </h2>
      </div>

      {/* תיבה: עקרונות האתר */}
      <div className="rounded-2xl border border-orange-400/40 bg-orange-50/60 backdrop-blur-sm p-4 md:p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-orange-500">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-800">עקרונות אתר "משלנו"</h3>
            <p className="text-sm text-orange-700 mt-1">
              "משלנו" הוא לוח קהילתי נקי המותאם לציבור הדתי והחרדי. אנו שואפים ליצור מרחב נעים, מכבד ובטוח לכולם.
            </p>
          </div>
        </div>
      </div>

      {/* תיבה: כללי פרסום */}
      <div className="rounded-2xl border border-green-400/40 bg-green-50/60 backdrop-blur-sm p-4 md:p-5 shadow-lg">
        <h3 className="text-sm font-bold text-green-800 mb-2">כללי הפרסום</h3>
        <ul className="list-disc pr-5 space-y-1.5 text-sm text-green-700">
          <li>פרסום בשפה נקייה, מכבדת ועניינית.</li>
          <li>הקפדה על תוכן הולם, ללא פגיעה בצניעות ובנורמות הציבור.</li>
          <li>דייקו בפרטים, ללא הטעיה או הבטחות יתר.</li>
          <li>אין לפרסם זכויות יוצרים, זיופים או תוכן אסור.</li>
        </ul>
      </div>

      {/* תיבה: הבהרה חשובה */}
      <div className="rounded-2xl border border-red-400/40 bg-red-50/60 backdrop-blur-sm p-4 md:p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800">הבהרה חשובה</h3>
            <p className="text-sm text-red-700 mt-1">
              אחריות התוכן מוטלת על המפרסם בלבד. הנהלת האתר אינה אחראית לטיב השירות או המוצר. הנהלת האתר רשאית להסיר מודעה לפי שיקול דעתה.
            </p>
          </div>
        </div>
      </div>

      {/* קישורים למדיניות/תקנון */}
      <div className="text-center text-xs text-slate-600">
        המשך התהליך מהווה הסכמה לתנאים. ניתן לעיין ב:
        {" "}
        <a
          href={createPageUrl("PrivacyPolicy")}
          className="text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors"
        >
          מדיניות פרטיות
        </a>
        {" | "}
        <a
          href={createPageUrl("TermsOfUsePage")}
          className="text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors"
        >
          תנאי השימוש
        </a>
      </div>

      {/* כפתור אישור */}
      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          disabled={accepted}
          onClick={() => onChange(true)}
          className="px-6 py-5 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/40 transition-all transform hover:scale-105"
        >
          אני מסכים
        </Button>

        {accepted && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg px-3 py-1.5 shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>אושר — ניתן להמשיך לשלב הבא</span>
          </div>
        )}
      </div>
    </div>
  );
}
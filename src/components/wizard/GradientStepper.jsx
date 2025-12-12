
import React, { useMemo } from "react";
import { Check } from "lucide-react";

export default function GradientStepper({ steps = [], currentStep = 0 }) {
  const progress = useMemo(() => ((currentStep + 1) / Math.max(steps.length, 1)) * 100, [steps.length, currentStep]);

  return (
    <aside className="w-full lg:w-[260px]" dir="rtl">
      {/* מובייל: פס התקדמות עדין */}
      <div className="block lg:hidden mb-4">
        <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--gd-mid), var(--gd-to))" }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-600 text-center">
          שלב {currentStep + 1} מתוך {steps.length}
        </div>
      </div>

      {/* דסקטופ: סיידבר אנכי מינימליסטי */}
      <div className="hidden lg:block">
        <div className="rounded-2xl p-4 border bg-white/85 backdrop-blur-sm shadow-xl relative overflow-hidden stepper-surface">
          <ul className="space-y-3 relative z-10">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isCurrent = i === currentStep;
              const isDone = i < currentStep;

              return (
                <li key={s.key || i} className="flex items-center gap-3">
                  <div
                    className={[
                      "relative shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300",
                      isCurrent
                        ? "border-blue-300 shadow-[0_8px_24px_rgba(37,99,235,0.22)] animate-pop"
                        : isDone
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-slate-50 border-slate-200 text-slate-500",
                    ].join(" ")}
                    style={isCurrent ? { background: "linear-gradient(135deg, var(--gd-mid), var(--gd-to))" } : undefined}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    {isCurrent && <span className="ring-2 ring-blue-300/60 absolute inset-0 rounded-xl animate-ping" />}
                  </div>
                  <div className="min-w-0">
                    <div className={"text-sm font-bold " + (isCurrent ? "text-slate-900" : "text-slate-700")}>
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{s.desc}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* פס התקדמות צדדי בצבע כחול */}
          <div className="absolute top-0 left-0 h-full w-[6px] bg-slate-200/60 rounded-l-2xl overflow-hidden">
            <div
              className="h-full w-full origin-top animate-sheen"
              style={{ transform: `scaleY(${Math.max(0.06, progress / 100)})`, background: "linear-gradient(180deg, var(--gd-mid), var(--gd-to))" }}
            />
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --gd-mid: #3b82f6; /* Tailwind blue-500 */
          --gd-to: #2563eb;  /* Tailwind blue-600 */
        }
        @keyframes sheenMove { 0% { transform: translateX(0); } 100% { transform: translateX(-200%); } }
        @keyframes pop { 0% { transform: scale(.96); } 100% { transform: scale(1); } }

        .stepper-surface::after {
          content: "";
          position: absolute; inset: 0;
          background: radial-gradient(900px 100px at 100% 0%, rgba(219,234,254,0.35), transparent 60%);
          pointer-events: none;
        }
        .animate-sheen { animation: sheenMove 6s linear infinite; }
        .animate-pop { animation: pop .25s ease-out; }
      `}</style>
    </aside>
  );
}

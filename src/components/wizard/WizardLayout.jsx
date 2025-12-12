import React from "react";

export default function WizardLayout({
  steps = [],
  stepIndex = 0,
  onPrev = () => {},
  onNext = () => {},
  onSubmit = () => {},
  canNext = false,
  isSubmitting = false,
  submitError = "",
  successMessage = "",
  children,
  dir = "rtl",
  title = "יצירת מודעה חדשה",
  frameless = false
}) {
  // בדיקה אם אנחנו בשלב details
  const isDetailsStep = steps[stepIndex]?.key === "details";
  
  return (
    <div
      className={frameless ? "min-h-full relative flex flex-col wizard-theme-sky" : "min-h-screen relative flex flex-col wizard-theme-sky"}
      dir={dir}
    >
      <div className={frameless ? `mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-2 ${isDetailsStep ? 'max-w-[90vw] w-full' : 'max-w-6xl'}` : `mx-auto px-3 sm:px-6 lg:px-8 py-6 lg:py-10 ${isDetailsStep ? 'max-w-[90vw] w-full' : 'max-w-6xl'}`}>
        
        {/* פריסת תוכן בלבד - ללא כותרת */}
        <div className="w-full flex justify-center">
          {/* תוכן הטופס */}
          <div className={`${frameless ? "mb-4 overflow-visible pb-8" : "bg-white/15 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-8"} ${isDetailsStep ? 'w-full' : 'w-full'}`}>
            {children}
          </div>
        </div>

      </div>
      
      {/* הודעות */}
      {(submitError || successMessage) && (
        <div className="w-full px-3 sm:px-6 lg:px-8 mb-4">
          <div className={`mx-auto ${isDetailsStep ? 'max-w-[90vw]' : 'max-w-6xl'}`}>
            {submitError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl p-3 shadow">
                {submitError}
              </div>
            )}
            {successMessage && (
              <div className="mb-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow">
                {successMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* סגנונות כפתורים */}
      <style>{`
        .wizard-theme-sky {
          --gd-from: #ffffff;
          --gd-mid:  #e0f2fe;
          --gd-to:   #3b82f6;
          --ink:     #0f172a;
        }

        .btn-gd-primary, .btn-gd-secondary {
          display:inline-flex;align-items:center;justify-content:center;
          padding:.75rem 1.75rem;border-radius:9999px;font-weight:800;
          transition:transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease;
          letter-spacing:.2px; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
          white-space: nowrap;
        }
        .btn-gd-primary {
          background-image: linear-gradient(135deg, #60a5fa 0%, var(--gd-to) 100%);
          color:#fff;border:1px solid rgba(59,130,246,.25);
          box-shadow: 0 10px 26px rgba(59,130,246,.18), inset 0 1px 0 rgba(255,255,255,.85);
        }
        .btn-gd-primary:hover { transform: translateY(-1px) scale(1.01); }
        .btn-gd-primary:active { transform: translateY(0); }
        .btn-gd-primary:disabled { opacity:.6; cursor:not-allowed; }

        .btn-gd-secondary {
          background:#ffffff;
          color:#0f172a;border:1px solid rgba(203,213,225,.9);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
        }
        .btn-gd-secondary:hover { transform: translateY(-1px); }
        .btn-gd-secondary:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>
    </div>
  );
}
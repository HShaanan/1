import React, { useState, useEffect, useCallback } from 'react';
import { 
  Accessibility, X, ZoomIn, ZoomOut, Contrast, Link2, 
  Pause, Play, RotateCcw, FileText, Eye, MousePointer2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    highContrast: false,
    highlightLinks: false,
    pauseAnimations: false,
    bigCursor: false,
    focusHighlight: false,
  });

  // טעינת הגדרות מ-localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.error('Error loading accessibility settings:', e);
      }
    }
  }, []);

  // שמירה והחלת הגדרות
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
      applySettings(newSettings);
      return newSettings;
    });
  }, []);

  const applySettings = (s) => {
    const html = document.documentElement;
    const body = document.body;

    // גודל טקסט
    html.style.fontSize = `${s.fontSize}%`;

    // ניגודיות גבוהה
    if (s.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // הדגשת קישורים
    if (s.highlightLinks) {
      body.classList.add('highlight-links');
    } else {
      body.classList.remove('highlight-links');
    }

    // עצירת אנימציות
    if (s.pauseAnimations) {
      body.classList.add('pause-animations');
    } else {
      body.classList.remove('pause-animations');
    }

    // סמן גדול
    if (s.bigCursor) {
      body.classList.add('big-cursor');
    } else {
      body.classList.remove('big-cursor');
    }

    // הדגשת פוקוס
    if (s.focusHighlight) {
      body.classList.add('enhanced-focus');
    } else {
      body.classList.remove('enhanced-focus');
    }
  };

  const resetAll = () => {
    const defaultSettings = {
      fontSize: 100,
      highContrast: false,
      highlightLinks: false,
      pauseAnimations: false,
      bigCursor: false,
      focusHighlight: false,
    };
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility_settings');
    applySettings(defaultSettings);
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSetting('fontSize', settings.fontSize + 10);
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      updateSetting('fontSize', settings.fontSize - 10);
    }
  };

  return (
    <>
      {/* סגנונות נגישות גלובליים */}
      <style>{`
        /* ניגודיות גבוהה */
        .high-contrast {
          filter: contrast(1.4) !important;
        }
        
        .high-contrast *:not(#accessibility-widget):not(#accessibility-widget *) {
          border-color: #000 !important;
        }

        /* הדגשת קישורים */
        .highlight-links a:not(#accessibility-widget a) {
          background-color: #ffff00 !important;
          color: #000000 !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          text-decoration: underline !important;
          outline: 2px solid #000 !important;
        }

        /* עצירת אנימציות */
        .pause-animations *:not(#accessibility-widget *),
        .pause-animations *:not(#accessibility-widget *)::before,
        .pause-animations *:not(#accessibility-widget *)::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }

        /* סמן גדול */
        .big-cursor,
        .big-cursor * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='1'%3E%3Cpath d='M4 4l7 19 2-8 8-2z'/%3E%3C/svg%3E") 4 4, auto !important;
        }

        .big-cursor a,
        .big-cursor button,
        .big-cursor [role="button"],
        .big-cursor input[type="submit"],
        .big-cursor input[type="button"] {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='1'%3E%3Cpath d='M7 11v-6a5 5 0 0 1 10 0v6'/%3E%3Cpath d='M4 11h16v10H4z'/%3E%3C/svg%3E") 16 4, pointer !important;
        }

        /* הדגשת פוקוס משופרת */
        .enhanced-focus *:focus {
          outline: 4px solid #0066cc !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 6px rgba(0, 102, 204, 0.3) !important;
        }

        .enhanced-focus *:focus-visible {
          outline: 4px solid #0066cc !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 6px rgba(0, 102, 204, 0.3) !important;
        }

        /* וידג'ט הנגישות - תמיד ייראה רגיל */
        #accessibility-widget,
        #accessibility-widget * {
          filter: none !important;
        }
      `}</style>

      {/* כפתור נגישות צף */}
      <div id="accessibility-widget" className="fixed left-4 bottom-24 lg:bottom-6 z-[9999]" dir="rtl">
        {/* כפתור פתיחה */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label={isOpen ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
          aria-expanded={isOpen}
          aria-controls="accessibility-panel"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Accessibility className="w-7 h-7" />
          )}
        </button>

        {/* פאנל נגישות */}
        {isOpen && (
          <div
            id="accessibility-panel"
            role="dialog"
            aria-label="הגדרות נגישות"
            className="absolute bottom-16 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* כותרת */}
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                הגדרות נגישות
              </h2>
              <p className="text-blue-100 text-sm mt-1">התאמת תצוגה לצרכים שלך</p>
            </div>

            {/* תוכן */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* גודל טקסט */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  גודל טקסט: {settings.fontSize}%
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decreaseFontSize}
                    disabled={settings.fontSize <= 80}
                    className="flex-1"
                    aria-label="הקטן טקסט"
                  >
                    <ZoomOut className="w-4 h-4 ml-1" />
                    הקטן
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={increaseFontSize}
                    disabled={settings.fontSize >= 150}
                    className="flex-1"
                    aria-label="הגדל טקסט"
                  >
                    <ZoomIn className="w-4 h-4 ml-1" />
                    הגדל
                  </Button>
                </div>
              </div>

              {/* כפתורי מצב */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSetting('highContrast', !settings.highContrast)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    settings.highContrast 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                  aria-pressed={settings.highContrast}
                  aria-label="ניגודיות גבוהה"
                >
                  <Contrast className="w-5 h-5" />
                  ניגודיות
                </button>

                <button
                  onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    settings.highlightLinks 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                  aria-pressed={settings.highlightLinks}
                  aria-label="הדגשת קישורים"
                >
                  <Link2 className="w-5 h-5" />
                  קישורים
                </button>

                <button
                  onClick={() => updateSetting('pauseAnimations', !settings.pauseAnimations)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    settings.pauseAnimations 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                  aria-pressed={settings.pauseAnimations}
                  aria-label={settings.pauseAnimations ? "הפעל אנימציות" : "עצור אנימציות"}
                >
                  {settings.pauseAnimations ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  אנימציות
                </button>

                <button
                  onClick={() => updateSetting('bigCursor', !settings.bigCursor)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    settings.bigCursor 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                  aria-pressed={settings.bigCursor}
                  aria-label="סמן גדול"
                >
                  <MousePointer2 className="w-5 h-5" />
                  סמן גדול
                </button>

                <button
                  onClick={() => updateSetting('focusHighlight', !settings.focusHighlight)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 col-span-2 ${
                    settings.focusHighlight 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                  aria-pressed={settings.focusHighlight}
                  aria-label="הדגשת פוקוס"
                >
                  <Eye className="w-5 h-5" />
                  הדגשת פוקוס מוגברת
                </button>
              </div>

              {/* כפתור איפוס */}
              <Button
                variant="outline"
                onClick={resetAll}
                className="w-full"
                aria-label="איפוס כל ההגדרות"
              >
                <RotateCcw className="w-4 h-4 ml-2" />
                איפוס הגדרות
              </Button>

              {/* קישור להצהרת נגישות */}
              <a
                href={createPageUrl('AccessibilityStatement')}
                className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium py-2 border-t border-gray-100 mt-2"
                aria-label="מעבר להצהרת נגישות"
              >
                <FileText className="w-4 h-4" />
                הצהרת נגישות
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
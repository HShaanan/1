import React, { useState, useEffect, useCallback } from 'react';
import { 
  Accessibility, X, ZoomIn, ZoomOut, Contrast, Link2, 
  Pause, Play, RotateCcw, FileText, Eye, MousePointer2,
  Type, Image as ImageIcon, Heading
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import AccessibilityStyles from './AccessibilityStyles';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default settings
  const defaultSettings = {
    fontSize: 100,
    highContrast: false,
    grayscale: false,
    highlightLinks: false,
    pauseAnimations: false,
    bigCursor: false,
    focusHighlight: false,
    readableFont: false,
    highlightHeaders: false,
    hideImages: false
  };

  const [settings, setSettings] = useState(defaultSettings);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // Update and Save
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const resetAll = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility_settings');
  };

  const toggleFeature = (key) => updateSetting(key, !settings[key]);

  return (
    <>
      <AccessibilityStyles settings={settings} />

      <div id="accessibility-widget" className="fixed left-4 bottom-24 lg:bottom-6 z-[9999]" dir="rtl">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label={isOpen ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {isOpen ? <X className="w-8 h-8" /> : <Accessibility className="w-8 h-8" />}
        </button>

        {/* Panel */}
        {isOpen && (
          <div
            role="dialog"
            aria-label="כלי נגישות"
            className="absolute bottom-16 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Accessibility className="w-6 h-6" />
                כלי נגישות
              </h2>
              <p className="text-blue-100 text-xs mt-1">התאם את האתר לצרכים שלך</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Font Size */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 text-sm">גודל טקסט</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{settings.fontSize}%</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" size="sm" className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
                    onClick={() => updateSetting('fontSize', Math.max(80, settings.fontSize - 10))}
                    disabled={settings.fontSize <= 80}
                  >
                    <ZoomOut className="w-4 h-4 ml-1" /> הקטן
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
                    onClick={() => updateSetting('fontSize', Math.min(200, settings.fontSize + 10))}
                    disabled={settings.fontSize >= 200}
                  >
                    <ZoomIn className="w-4 h-4 ml-1" /> הגדל
                  </Button>
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-2 gap-2">
                <FeatureButton 
                  icon={Contrast} 
                  label="ניגודיות גבוהה" 
                  active={settings.highContrast} 
                  onClick={() => toggleFeature('highContrast')} 
                />
                <FeatureButton 
                  icon={Link2} 
                  label="הדגשת קישורים" 
                  active={settings.highlightLinks} 
                  onClick={() => toggleFeature('highlightLinks')} 
                />
                <FeatureButton 
                  icon={Type} 
                  label="גופן קריא" 
                  active={settings.readableFont} 
                  onClick={() => toggleFeature('readableFont')} 
                />
                <FeatureButton 
                  icon={settings.pauseAnimations ? Play : Pause} 
                  label={settings.pauseAnimations ? "הפעל אנימציות" : "עצור אנימציות"}
                  active={settings.pauseAnimations} 
                  onClick={() => toggleFeature('pauseAnimations')} 
                />
                <FeatureButton 
                  icon={MousePointer2} 
                  label="סמן גדול" 
                  active={settings.bigCursor} 
                  onClick={() => toggleFeature('bigCursor')} 
                />
                <FeatureButton 
                  icon={Eye} 
                  label="מיקוד (Focus)" 
                  active={settings.focusHighlight} 
                  onClick={() => toggleFeature('focusHighlight')} 
                />
                <FeatureButton 
                  icon={Heading} 
                  label="הדגשת כותרות" 
                  active={settings.highlightHeaders} 
                  onClick={() => toggleFeature('highlightHeaders')} 
                />
                <FeatureButton 
                  icon={ImageIcon} 
                  label="הסתר תמונות" 
                  active={settings.hideImages} 
                  onClick={() => toggleFeature('hideImages')} 
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                  onClick={resetAll}
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  איפוס הגדרות
                </Button>
                
                <a
                  href={createPageUrl('AccessibilityStatement')}
                  className="flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600 text-xs py-1"
                >
                  <FileText className="w-3 h-3" />
                  הצהרת נגישות
                </a>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FeatureButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`
        p-2.5 rounded-xl border-2 text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1.5 min-h-[80px] text-center
        ${active 
          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
      <span>{label}</span>
    </button>
  );
}
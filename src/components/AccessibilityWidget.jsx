import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Accessibility, X, ZoomIn, ZoomOut, Contrast, Link2, 
  Pause, Play, RotateCcw, FileText, Eye, MousePointer2,
  Type, Image as ImageIcon, Heading, Ruler, Zap, User, ArrowUpCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import AccessibilityStyles from './AccessibilityStyles';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  
  // Default settings structure
  const defaultSettings = {
    // Visual
    fontSize: 100,
    highContrast: false,
    grayscale: false,
    invertColors: false,
    
    // Cognitive & Learning
    highlightLinks: false,
    readableFont: false,
    highlightHeaders: false,
    
    // Motor & Focus
    pauseAnimations: false,
    bigCursor: false,
    focusHighlight: false,
    readingGuide: false,
    hideImages: false,
    
    // Profiles (Active profile name or null)
    activeProfile: null
  };

  const [settings, setSettings] = useState(defaultSettings);

  // Load settings & Handle Keyboard Shortcut
  useEffect(() => {
    // Load from storage
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    // Keyboard shortcut (CTRL+U)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reading Guide Mouse Follower
  useEffect(() => {
    if (settings.readingGuide) {
      const handleMouseMove = (e) => {
        document.documentElement.style.setProperty('--reading-guide-top', `${e.clientY}px`);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [settings.readingGuide]);

  // Update Settings Helper
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value, activeProfile: null }; // Custom change clears profile
      localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // Apply Profile
  const applyProfile = (profileName) => {
    let newSettings = { ...defaultSettings }; // Reset first

    switch (profileName) {
      case 'vision':
        newSettings = { ...newSettings, fontSize: 120, highContrast: true, bigCursor: true, highlightLinks: true, activeProfile: 'vision' };
        break;
      case 'seizure':
        newSettings = { ...newSettings, pauseAnimations: true, activeProfile: 'seizure' };
        break;
      case 'adhd':
        newSettings = { ...newSettings, focusHighlight: true, readingGuide: true, activeProfile: 'adhd' };
        break;
      case 'cognitive':
        newSettings = { ...newSettings, readableFont: true, highlightHeaders: true, highlightLinks: true, activeProfile: 'cognitive' };
        break;
      default:
        break;
    }
    
    setSettings(newSettings);
    localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
  };

  const resetAll = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility_settings');
    setIsOpen(false);
    setTimeout(() => {
        // Return focus to trigger after close
        if (triggerRef.current) triggerRef.current.focus();
    }, 100);
  };

  const toggleFeature = (key) => updateSetting(key, !settings[key]);

  return (
    <>
      <AccessibilityStyles settings={settings} />

      <div id="accessibility-widget" className="fixed left-4 bottom-24 lg:bottom-6 z-[9999] font-sans" dir="rtl">
        {/* Toggle Button */}
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 relative
            ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-blue-600 hover:bg-blue-700 text-white'}
          `}
          aria-label={isOpen ? "סגור תפריט נגישות (CTRL+U)" : "פתח תפריט נגישות (CTRL+U)"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title="תפריט נגישות (CTRL+U)"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Accessibility className="w-8 h-8" />}
          
          {/* Active Indicator Dot */}
          {JSON.stringify(settings) !== JSON.stringify(defaultSettings) && !isOpen && (
             <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </button>

        {/* Panel */}
        {isOpen && (
          <div
            role="dialog"
            aria-label="כלי נגישות"
            className="absolute bottom-16 left-0 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 text-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Accessibility className="w-6 h-6" />
                  נגישות
                </h2>
                <p className="text-blue-100 text-xs mt-1">התאמת האתר לצרכים שלך</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                   setSettings(defaultSettings); 
                   localStorage.removeItem('accessibility_settings');
                }}
                className="text-blue-100 hover:text-white hover:bg-blue-800 h-auto py-1 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 ml-1" />
                איפוס
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              
              {/* Profiles Section */}
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">פרופילים חכמים</h3>
                <div className="grid grid-cols-2 gap-2">
                  <ProfileButton 
                    label="לקות ראייה" 
                    icon={Eye} 
                    active={settings.activeProfile === 'vision'} 
                    onClick={() => applyProfile(settings.activeProfile === 'vision' ? null : 'vision')} 
                  />
                  <ProfileButton 
                    label="בטוח להתקפים" 
                    icon={Zap} 
                    active={settings.activeProfile === 'seizure'} 
                    onClick={() => applyProfile(settings.activeProfile === 'seizure' ? null : 'seizure')} 
                  />
                  <ProfileButton 
                    label="הפרעות קשב" 
                    icon={User} 
                    active={settings.activeProfile === 'adhd'} 
                    onClick={() => applyProfile(settings.activeProfile === 'adhd' ? null : 'adhd')} 
                  />
                  <ProfileButton 
                    label="סיוע קוגניטיבי" 
                    icon={Heading} 
                    active={settings.activeProfile === 'cognitive'} 
                    onClick={() => applyProfile(settings.activeProfile === 'cognitive' ? null : 'cognitive')} 
                  />
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Adjustments Section */}
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">התאמות תוכן ותצוגה</h3>
                
                {/* Font Size Slider */}
                <div className="bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                        <Type className="w-4 h-4" /> גודל טקסט
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{settings.fontSize}%</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button 
                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                        onClick={() => updateSetting('fontSize', Math.max(80, settings.fontSize - 10))}
                        disabled={settings.fontSize <= 80}
                        aria-label="הקטן טקסט"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(settings.fontSize - 80) / 1.2}%` }}></div>
                    </div>
                    <Button 
                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                        onClick={() => updateSetting('fontSize', Math.min(200, settings.fontSize + 10))}
                        disabled={settings.fontSize >= 200}
                        aria-label="הגדל טקסט"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <FeatureToggle icon={Contrast} label="ניגודיות גבוהה" active={settings.highContrast} onClick={() => toggleFeature('highContrast')} />
                  <FeatureToggle icon={Link2} label="הדגשת קישורים" active={settings.highlightLinks} onClick={() => toggleFeature('highlightLinks')} />
                  <FeatureToggle icon={Type} label="גופן קריא" active={settings.readableFont} onClick={() => toggleFeature('readableFont')} />
                  <FeatureToggle icon={Heading} label="הדגשת כותרות" active={settings.highlightHeaders} onClick={() => toggleFeature('highlightHeaders')} />
                  <FeatureToggle icon={Ruler} label="סרגל קריאה" active={settings.readingGuide} onClick={() => toggleFeature('readingGuide')} />
                  <FeatureToggle icon={MousePointer2} label="סמן גדול" active={settings.bigCursor} onClick={() => toggleFeature('bigCursor')} />
                  <FeatureToggle icon={settings.pauseAnimations ? Play : Pause} label={settings.pauseAnimations ? "הפעל אנימציות" : "עצור אנימציות"} active={settings.pauseAnimations} onClick={() => toggleFeature('pauseAnimations')} />
                  <FeatureToggle icon={Eye} label="פוקוס מודגש" active={settings.focusHighlight} onClick={() => toggleFeature('focusHighlight')} />
                  <FeatureToggle icon={ImageIcon} label="הסתר תמונות" active={settings.hideImages} onClick={() => toggleFeature('hideImages')} />
                  <FeatureToggle icon={Contrast} label="היפוך צבעים" active={settings.invertColors} onClick={() => toggleFeature('invertColors')} />
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-2 border-t border-gray-100 flex justify-center shrink-0">
               <a
                  href={createPageUrl('AccessibilityStatement')}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-xs py-1 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  הצהרת נגישות
                </a>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

function ProfileButton({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-20
                ${active 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                }
            `}
            aria-pressed={active}
        >
            <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-blue-600'}`} />
            <span className="text-xs font-bold leading-tight">{label}</span>
        </button>
    )
}

function FeatureToggle({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`
        flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all text-right
        ${active 
          ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-sm' 
          : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200'
        }
      `}
    >
        <div className={`p-1.5 rounded-md ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
             <Icon className="w-4 h-4" />
        </div>
        <span>{label}</span>
        {active && <span className="mr-auto w-2 h-2 rounded-full bg-green-500"></span>}
    </button>
  );
}
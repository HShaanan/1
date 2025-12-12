
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

const PRESET_PALETTES = [
  { 
    name: 'ורוד', 
    value: 'pink',
    colors: { primary: '#EC4899', primaryHover: '#DB2777', primaryLight: '#FCE7F3', primaryDark: '#831843' },
    preview: '#EC4899'
  },
  { 
    name: 'זהב', 
    value: 'gold',
    colors: { primary: '#F59E0B', primaryHover: '#D97706', primaryLight: '#FEF3C7', primaryDark: '#92400E' },
    preview: '#F59E0B'
  },
  { 
    name: 'ירוק', 
    value: 'green',
    colors: { primary: '#10B981', primaryHover: '#059669', primaryLight: '#D1FAE5', primaryDark: '#065F46' },
    preview: '#10B981'
  },
  { 
    name: 'אדום', 
    value: 'red',
    colors: { primary: '#EF4444', primaryHover: '#DC2626', primaryLight: '#FEE2E2', primaryDark: '#991B1B' },
    preview: '#EF4444'
  },
  { 
    name: 'כחול', 
    value: 'blue',
    colors: { primary: '#3B82F6', primaryHover: '#2563EB', primaryLight: '#DBEAFE', primaryDark: '#1E40AF' },
    preview: '#3B82F6'
  },
  { 
    name: 'סגול', 
    value: 'purple',
    colors: { primary: '#A855F7', primaryHover: '#9333EA', primaryLight: '#F3E8FF', primaryDark: '#6B21A8' },
    preview: '#A855F7'
  },
  { 
    name: 'כתום', 
    value: 'orange',
    colors: { primary: '#F97316', primaryHover: '#EA580C', primaryLight: '#FFEDD5', primaryDark: '#9A3412' },
    preview: '#F97316'
  }
];

export default function ColorPicker({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('palettes');
  const [customColor, setCustomColor] = useState('#EC4899');
  const [hue, setHue] = useState(330);

  // סנכרון הצבע עם הבחירה הנוכחית
  useEffect(() => {
    if (value?.color_scheme && value.color_scheme !== 'custom') {
      const palette = PRESET_PALETTES.find(p => p.value === value.color_scheme);
      if (palette) {
        setCustomColor(palette.preview);
        setHue(hexToHue(palette.preview));
      }
    } else if (value?.custom_colors?.primary) {
      setCustomColor(value.custom_colors.primary);
      setHue(hexToHue(value.custom_colors.primary));
    }
  }, [value]);

  const hexToHue = (hex) => {
    if (!hex || hex.length !== 7) return 0; // Handle invalid hex
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let hueValue = 0;
    if (delta !== 0) {
      if (max === r) {
        hueValue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        hueValue = ((b - r) / delta + 2) * 60;
      } else {
        hueValue = ((r - g) / delta + 4) * 60;
      }
    }
    return hueValue;
  };

  const handlePaletteSelect = (palette) => {
    setCustomColor(palette.preview);
    setHue(hexToHue(palette.preview));
    // לא שולחים background_type - הרקע תמיד יישאר לבן
    onChange({
      color_scheme: palette.value,
      custom_colors: null
    });
  };

  const handleCustomColorChange = (color) => {
    setCustomColor(color);
    setHue(hexToHue(color));
    
    // יצירת ערכות צבעים אוטומטית מהצבע הבסיסי
    const lightenColor = (hex, percent) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent / 100)));
      const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + ((255 - ((num >> 8) & 0x00FF)) * percent / 100)));
      const b = Math.min(255, Math.floor((num & 0x0000FF) + ((255 - (num & 0x0000FF)) * percent / 100)));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };

    const darkenColor = (hex, percent) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.floor((num >> 16) * (1 - percent / 100));
      const g = Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100));
      const b = Math.floor((num & 0x0000FF) * (1 - percent / 100));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };

    // לא שולחים background_type - הרקע תמיד יישאר לבן
    onChange({
      color_scheme: 'custom',
      custom_colors: {
        primary: color,
        primaryHover: darkenColor(color, 10),
        primaryLight: lightenColor(color, 80),
        primaryDark: darkenColor(color, 40)
      }
    });
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2,
      r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    if (r.length === 1) r = "0" + r;
    if (g.length === 1) g = "0" + g;
    if (b.length === 1) b = "0" + b;

    return "#" + r + g + b;
  };

  const handleGradientClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = (x / rect.width) * 360;
    const newColor = hslToHex(newHue, 85, 60); // Default saturation and lightness
    setHue(newHue);
    handleCustomColorChange(newColor);
  };

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Saturation goes from left (0%) to right (100%)
    const saturation = (x / rect.width) * 100;
    // Lightness goes from bottom (0%) to top (100%)
    const lightness = 100 - (y / rect.height) * 100;
    
    const newColor = hslToHex(hue, saturation, lightness);
    handleCustomColorChange(newColor);
  };

  const isSelected = (paletteValue) => {
    return value?.color_scheme === paletteValue;
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('palettes')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'palettes'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Palettes
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Palettes Tab */}
      {activeTab === 'palettes' && (
        <div className="grid grid-cols-3 gap-3">
          {PRESET_PALETTES.map((palette) => (
            <button
              key={palette.value}
              onClick={() => handlePaletteSelect(palette)}
              className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                isSelected(palette.value)
                  ? 'border-blue-600 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className="w-full h-16 rounded-lg mb-2"
                style={{ backgroundColor: palette.preview }}
              />
              <div className="text-sm font-medium text-slate-800">{palette.name}</div>
              
              {isSelected(palette.value) && (
                <div className="absolute top-2 left-2 bg-blue-600 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {/* Color Preview and Input */}
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                setCustomColor(val); // Update input visually immediately
                if (/^#[0-9A-F]{6}$/i.test(val)) { // Only update parent state if full valid hex
                  handleCustomColorChange(val);
                }
              }}
              className="flex-1 text-center font-mono"
              placeholder="#EC4899"
            />
            <div
              className="w-20 h-12 rounded-lg border-2 border-slate-300"
              style={{ backgroundColor: customColor }}
            />
          </div>

          {/* Saturation/Lightness Canvas */}
          <div
            onClick={handleCanvasClick}
            className="w-full h-64 rounded-lg cursor-crosshair relative overflow-hidden"
            style={{
              background: `
                linear-gradient(to top, #000 0%, transparent 100%),
                linear-gradient(to right, #fff 0%, hsl(${hue}, 100%, 50%) 100%)
              `
            }}
          />

          {/* Hue Gradient Bar */}
          <div className="relative">
            <div
              onClick={handleGradientClick}
              className="w-full h-8 rounded-full cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)'
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-800 rounded-full pointer-events-none"
              style={{ left: `${(hue / 360) * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

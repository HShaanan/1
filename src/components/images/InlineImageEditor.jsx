import React from "react";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, RefreshCw, Loader2, Image as ImageIcon, Edit } from "lucide-react";

const FALLBACK_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='338'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='18'>אין תמונה</text></svg>";

const sanitize = (u) => {
  if (!u || typeof u !== "string") return FALLBACK_IMG;
  const s = u.trim();
  if (s.startsWith("http://")) return "https://" + s.slice(7);
  return s;
};

export default function InlineImageEditor({
  images = [],
  onChange = () => {},
  maxImages = 30,
  disabled = false,
  className = "",
  onEditLogo = null  // פונקציה חדשה לעריכת הלוגו
}) {
  const [busyMap, setBusyMap] = React.useState({});
  const [uploadProgress, setUploadProgress] = React.useState("");
  const fileInputsRef = React.useRef({});

  const setBusy = (key, v) => setBusyMap((m) => ({ ...m, [key]: v }));

  const handleAddFiles = async (filesList) => {
    if (!filesList?.length) return;
    const files = Array.from(filesList);
    const remaining = Math.max(0, maxImages - images.length);
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) {
      alert(`הגעת למספר המקסימלי של ${maxImages} תמונות`);
      return;
    }

    setBusy("add", true);
    setUploadProgress(`מעלה 0/${toUpload.length} תמונות...`);
    
    try {
      const urls = [];
      for (let i = 0; i < toUpload.length; i++) {
        const f = toUpload[i];
        setUploadProgress(`מעלה ${i + 1}/${toUpload.length} תמונות...`);
        
        try {
          const { file_url } = await UploadFile({ file: f });
          if (file_url) urls.push(sanitize(file_url));
        } catch (error) {
          console.error(`Failed to upload ${f.name}:`, error);
        }
      }
      
      if (urls.length) {
        onChange([...(images || []), ...urls]);
      }
      
      if (urls.length < toUpload.length) {
        alert(`הועלו ${urls.length} מתוך ${toUpload.length} תמונות בהצלחה`);
      }
    } finally {
      setBusy("add", false);
      setUploadProgress("");
    }
  };

  const handleReplace = async (idx, file) => {
    if (!file) return;
    setBusy(idx, true);
    try {
      const { file_url } = await UploadFile({ file });
      if (file_url) {
        const next = [...(images || [])];
        next[idx] = sanitize(file_url);
        onChange(next);
      }
    } finally {
      setBusy(idx, false);
    }
  };

  const handleRemove = (idx) => {
    const next = [...(images || [])];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <Card className={`p-4 ${className}`} dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-slate-800">ניהול תמונות</div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {images.length}/{maxImages}
          </div>
          {uploadProgress && (
            <div className="text-xs text-blue-600 font-medium">
              {uploadProgress}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {(images || []).map((img, idx) => (
          <div key={idx} className="relative group border-2 border-slate-200 rounded-xl overflow-hidden bg-white hover:border-pink-400 transition-colors">
            <div className="aspect-square">
              <img
                src={sanitize(img)}
                alt={`image_${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
            </div>

            {/* שכבת פעולות */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => (fileInputsRef.current[idx] = el)}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReplace(idx, f);
                  e.target.value = "";
                }}
              />
              
              {/* כפתור "ערוך לוגו" - רק לתמונה מספר 2 (אינדקס 1) */}
              {idx === 1 && onEditLogo && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={disabled || busyMap[idx]}
                  onClick={() => onEditLogo(img, idx)}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                  title="ערוך מיצוב לוגו"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled || busyMap[idx]}
                onClick={() => fileInputsRef.current[idx]?.click()}
                className="bg-white hover:bg-slate-100 text-slate-800"
                title="החלף תמונה"
              >
                {busyMap[idx] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={disabled || busyMap[idx]}
                onClick={() => handleRemove(idx)}
                title="מחק תמונה"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* מספר תמונה + תווית לוגו */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                {idx + 1}
              </div>
              {idx === 1 && (
                <div className="bg-purple-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm">
                  לוגו
                </div>
              )}
            </div>
          </div>
        ))}

        {/* כרטיס להוספת תמונות */}
        {images.length < maxImages && (
          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-pink-50 hover:border-pink-400 transition-all group">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                handleAddFiles(files);
                e.target.value = "";
              }}
              disabled={disabled || busyMap["add"]}
            />
            {busyMap["add"] ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                <span className="text-xs text-slate-600 text-center px-2">
                  {uploadProgress}
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-pink-100 group-hover:bg-pink-200 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="w-6 h-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-pink-600 transition-colors">
                  הוסף תמונות
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  עד {maxImages - images.length} תמונות
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {/* הנחיה קצרה */}
      <div className="text-xs text-slate-500 mt-4 flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
        <ImageIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold mb-1">טיפים להעלאת תמונות:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>אפשר להעלות עד {maxImages} תמונות בבת אחת</li>
            <li>תמונה מספר 2 היא הלוגו - ניתן לערוך את מיצובה</li>
            <li>לחץ על תמונה להחלפה או מחיקה</li>
            <li>התמונה הראשונה תשמש כתמונת שער</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
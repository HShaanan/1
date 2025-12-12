
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, ArrowUp, ArrowDown, ArrowRight, Move } from 'lucide-react';
import { Input } from "@/components/ui/input"; // Added import

// קומפוננטה חדשה לפי הקוד שסופק, עם התאמות שם/התנהגות לשמירה על תאימות
export default function ImagePositioner({
  imageUrl,                  // תמונה ראשונית חיצונית (אופציונלי)
  initialPosition,           // {zoom, x, y, rotation} אופציונלי
  onPositionChange,          // קולבק שמחזיר {zoom, x%, y%, rotation}
  className = "",
  cropSize = 360 // הוגדל מ-200 ל-360px
}) {
  const [image, setImage] = useState(imageUrl || null);
  const [scale, setScale] = useState(initialPosition?.zoom || 1);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // הזחה בפיקסלים מציר מרכז
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // סנכרון תמונה חיצונית (אם משתנה)
  useEffect(() => {
    if (imageUrl) setImage(imageUrl);
  }, [imageUrl]);

  // דיווח למעלה על שינויי זום/מיקום בפורמט נתמך קודם: אחוזים מהקונטיינר (מרכז=50%)
  useEffect(() => {
    if (!containerRef.current || !onPositionChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate the image's effective size based on scale
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return;

    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // Determine the rendered size of the image within the container with object-contain
    let renderedWidth, renderedHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    const imageAspectRatio = naturalWidth / naturalHeight;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container, height is constrained
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageAspectRatio;
    } else {
      // Image is taller than container, width is constrained
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageAspectRatio;
    }

    const scaledRenderedWidth = renderedWidth * scale;
    const scaledRenderedHeight = renderedHeight * scale;

    // Center of the image relative to container center
    // The position.x/y is already the offset from the container's center for the image's center
    // The image's center is at (containerWidth / 2 + position.x, containerHeight / 2 + position.y)

    // We need to calculate the position of the *cropped area* relative to the *image*
    // The cropped area is cropSize x cropSize
    // Its center is at the container's center (0,0 relative to position)
    // The image's top-left corner without transform:
    const imageX = (containerWidth - scaledRenderedWidth) / 2 + position.x;
    const imageY = (containerHeight - scaledRenderedHeight) / 2 + position.y;

    // Center of the crop area relative to the image's top-left corner
    const cropCenterX_relativeToImageTL = (containerWidth / 2) - imageX;
    const cropCenterY_relativeToImageTL = (containerHeight / 2) - imageY;

    // Convert to percentage relative to the *scaled* image dimensions
    // The x and y values are reported as the *center* of the crop box
    // So if the crop box center is at the image's (0,0) (top-left), that's 0% for x and y
    // If the crop box center is at the image's (scaledRenderedWidth, scaledRenderedHeight), that's 100% for x and y
    const xPct = (cropCenterX_relativeToImageTL / scaledRenderedWidth) * 100;
    const yPct = (cropCenterY_relativeToImageTL / scaledRenderedHeight) * 100;

    onPositionChange({
      zoom: scale,
      x: Math.max(0, Math.min(100, xPct)), // Ensure within 0-100%
      y: Math.max(0, Math.min(100, yPct)), // Ensure within 0-100%
      rotation: 0
    });
  }, [scale, position, onPositionChange, cropSize]);


  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only allow left mouse button
    if (scale > 1) { // Only allow dragging if zoomed in
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // כלי עזר לקלמפ + שינוי זום באחוזים
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const setZoomPercent = (pct) => {
    const clamped = clamp(Number(pct) || 0, 50, 500); // טווח מותר: 50%–500%
    setScale(clamped / 100);
  };

  // הוספת נאג' להזזת תמונה עם חצים (כפתורים/מקלדת)
  const NUDGE_BASE = 10;
  const nudge = (dx, dy) => {
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  const centerPosition = () => setPosition({ x: 0, y: 0 });

  const handleKeyDown = (e) => {
    const step = e.shiftKey ? NUDGE_BASE * 2 : NUDGE_BASE;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault(); // Prevent page scrolling
    }
    if (e.key === "ArrowUp") nudge(0, -step);
    if (e.key === "ArrowDown") nudge(0, step);
    if (e.key === "ArrowLeft") nudge(-step, 0);
    if (e.key === "ArrowRight") nudge(step, 0);
  };

  return (
    <div dir="rtl" className={`w-full ${className}`}>
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-4 flex justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            <Upload size={18} />
            העלה תמונה
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {image ? (
          <>
            <div className="mb-3 flex justify-center gap-2">
              <button
                onClick={handleZoomIn}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                type="button"
              >
                <ZoomIn size={18} />
                זום פנימה
              </button>
              <button
                onClick={handleZoomOut}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                type="button"
              >
                <ZoomOut size={18} />
                זום החוצה
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                type="button"
              >
                <RotateCcw size={18} />
                איפוס
              </button>
            </div>

            {/* שורת זום עם קלט מדויק באחוזים */}
            <div className="mb-2 flex items-center justify-center gap-2 text-slate-700 text-sm">
              <span>רמת זום:</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={50}
                  max={500}
                  step={1}
                  value={Math.round(scale * 100)}
                  onChange={(e) => setZoomPercent(e.target.value)}
                  className="w-24 h-8 text-center"
                />
                <span>%</span>
              </div>
            </div>

            {/* מקשי הזזה */}
            <div className="mb-3 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-1">
                <div />
                <button
                  type="button"
                  onClick={() => nudge(0, -NUDGE_BASE)}
                  className="p-2 rounded-md border bg-white hover:bg-slate-50"
                  title="למעלה (Shift להאצה)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div />

                <button
                  type="button"
                  onClick={() => nudge(-NUDGE_BASE, 0)}
                  className="p-2 rounded-md border bg-white hover:bg-slate-50"
                  title="שמאלה (Shift להאצה)"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> {/* ArrowRight rotated 180 deg looks like ArrowLeft */}
                </button>
                <button
                  type="button"
                  onClick={centerPosition}
                  className="p-2 rounded-md border bg-white hover:bg-slate-50"
                  title="מרכז"
                >
                  <Move className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(NUDGE_BASE, 0)}
                  className="p-2 rounded-md border bg-white hover:bg-slate-50"
                  title="ימינה (Shift להאצה)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div />
                <button
                  type="button"
                  onClick={() => nudge(0, NUDGE_BASE)}
                  className="p-2 rounded-md border bg-white hover:bg-slate-50"
                  title="למטה (Shift להאצה)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div />
              </div>
            </div>

            <div
              ref={containerRef}
              className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200"
              style={{ height: '480px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              tabIndex={0} // Make div focusable for keyboard events
              onKeyDown={handleKeyDown} // Handle keyboard events
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <img
                  src={image}
                  alt="תצוגה"
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                  draggable={false}
                />
              </div>

              {/* ריבוע אינדיקציה במרכז - מסמן בדיוק מה ייכנס למסגרת הלוגו בעמוד העסק */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
                style={{
                  width: cropSize,
                  height: cropSize,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', // מחשיך הכל חוץ מהריבוע
                  border: '2px dashed #60a5fa',               // מסגרת כחולה דקה
                  background: 'transparent'
                }}
              />
            </div>

            <div className="mt-3 text-center text-xs text-slate-500">
              טיפ: גלגלת לעדכון זום • גרירה כאשר התמונה מוגדלת להזזה • מקשי חצים במקלדת להזזה (Shift להאצה) • הזן אחוז זום מדויק
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-400 text-base">העלה תמונה כדי להתחיל</p>
          </div>
        )}
      </div>
    </div>
  );
}

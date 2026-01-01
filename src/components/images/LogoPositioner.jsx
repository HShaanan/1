import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, ArrowUp, ArrowDown, ArrowRight, Move, Save, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

/**
 * כלי מיצוב לוגו מתקדם - אחיד לכל המערכת
 * 
 * @param {string} imageUrl - URL תמונת הלוגו הקיימת
 * @param {object} initialPosition - מיצוב התחלתי {zoom, x, y, rotation}
 * @param {function} onPositionSave - קולבק לשמירת מיצוב {zoom, x, y, rotation}
 * @param {function} onLogoSave - קולבק לשמירת לוגו חתוך חדש (URL)
 * @param {number} cropSize - גודל ברירת המחדל של מסגרת החיתוך (360px)
 */
export default function LogoPositioner({
  imageUrl,
  initialPosition,
  onPositionSave,
  onLogoSave,
  cropSize = 360
}) {
  const [image, setImage] = useState(imageUrl || null);
  const [scale, setScale] = useState(initialPosition?.zoom || 1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // סנכרון תמונה חיצונית
  useEffect(() => {
    if (imageUrl) setImage(imageUrl);
  }, [imageUrl]);

  // סנכרון מיצוב התחלתי
  useEffect(() => {
    if (initialPosition) {
      setScale(initialPosition.zoom || 1);
      // המרה מאחוזים לפיקסלים (אם יש)
      if (initialPosition.x !== undefined && initialPosition.y !== undefined) {
        // נשתמש במרכז כברירת מחדל
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [initialPosition]);

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
    if (e.button !== 0) return;
    if (scale > 1) {
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

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  
  const setZoomPercent = (pct) => {
    const clamped = clamp(Number(pct) || 0, 50, 500);
    setScale(clamped / 100);
  };

  const NUDGE_BASE = 10;
  const nudge = (dx, dy) => {
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  
  const centerPosition = () => setPosition({ x: 0, y: 0 });

  const handleKeyDown = (e) => {
    const step = e.shiftKey ? NUDGE_BASE * 2 : NUDGE_BASE;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowUp") nudge(0, -step);
    if (e.key === "ArrowDown") nudge(0, step);
    if (e.key === "ArrowLeft") nudge(-step, 0);
    if (e.key === "ArrowRight") nudge(step, 0);
  };

  // שמירת מיצוב בלבד (ללא חיתוך)
  const savePositionOnly = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // חישוב מיקום המסגרת ביחס לתמונה
    const frameCenterX = containerRect.width / 2;
    const frameCenterY = containerRect.height / 2;
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    // חישוב אחוזים של מרכז המסגרת ביחס לתמונה
    const xPercent = ((frameCenterX - imgLeft) / imgWidth) * 100;
    const yPercent = ((frameCenterY - imgTop) / imgHeight) * 100;

    const positionData = {
      zoom: scale,
      x: clamp(xPercent, 0, 100),
      y: clamp(yPercent, 0, 100),
      rotation: 0
    };

    onPositionSave?.(positionData);
  };

  // חיתוך ושמירת לוגו
  const cropAndSaveLogo = async () => {
    const container = containerRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!container || !img || !canvas || !image) return;

    setIsSaving(true);

    try {
      const containerRect = container.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      
      const frameCenterX = containerRect.width / 2;
      const frameCenterY = containerRect.height / 2;
      const frameLeft = frameCenterX - cropSize / 2;
      const frameTop = frameCenterY - cropSize / 2;

      const imgLeft = imgRect.left - containerRect.left;
      const imgTop = imgRect.top - containerRect.top;

      const sourceX = (frameLeft - imgLeft) / scale;
      const sourceY = (frameTop - imgTop) / scale;
      const sourceWidth = cropSize / scale;
      const sourceHeight = cropSize / scale;

      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');

      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        tempImg.onload = async () => {
          const scaleX = tempImg.naturalWidth / img.width;
          const scaleY = tempImg.naturalHeight / img.height;

          ctx.clearRect(0, 0, cropSize, cropSize);
          ctx.drawImage(
            tempImg,
            sourceX * scaleX,
            sourceY * scaleY,
            sourceWidth * scaleX,
            sourceHeight * scaleY,
            0,
            0,
            cropSize,
            cropSize
          );

          // המרת canvas ל-blob ושמירה
          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error('Failed to create blob'));
            
            const file = new File([blob], "business-logo.png", { type: "image/png" });
            const res = await base44.integrations.Core.UploadFile({ file });
            const url = res?.file_url;
            
            if (url) {
              // שמירת הלוגו החדש
              onLogoSave?.(url);
              
              // שמירת המיצוב
              savePositionOnly();
              
              resolve();
            } else {
              reject(new Error('No URL returned from upload'));
            }
          }, "image/png", 0.92);
        };
        tempImg.onerror = () => reject(new Error('Failed to load image'));
        tempImg.src = image;
      });

    } catch (err) {
      console.error("Error saving logo:", err);
      alert("שגיאה בשמירת הלוגו: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const capturePreview = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!container || !img || !canvas || !image) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    const frameCenterX = containerRect.width / 2;
    const frameCenterY = containerRect.height / 2;
    const frameLeft = frameCenterX - cropSize / 2;
    const frameTop = frameCenterY - cropSize / 2;

    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;

    const sourceX = (frameLeft - imgLeft) / scale;
    const sourceY = (frameTop - imgTop) / scale;
    const sourceWidth = cropSize / scale;
    const sourceHeight = cropSize / scale;

    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');

    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.onload = () => {
      const scaleX = tempImg.naturalWidth / img.width;
      const scaleY = tempImg.naturalHeight / img.height;

      ctx.clearRect(0, 0, cropSize, cropSize);
      ctx.drawImage(
        tempImg,
        sourceX * scaleX,
        sourceY * scaleY,
        sourceWidth * scaleX,
        sourceHeight * scaleY,
        0,
        0,
        cropSize,
        cropSize
      );
      
      setShowPreview(true);
    };
    tempImg.src = image;
  };

  // תצוגת פריוויו
  if (showPreview) {
    return (
      <div className="w-full" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
          >
            ← חזרה לעריכה
          </Button>
          <Button
            onClick={async () => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              
              setIsSaving(true);
              try {
                await new Promise((resolve) => {
                  canvas.toBlob(async (blob) => {
                    if (!blob) return resolve();
                    const file = new File([blob], "business-logo.png", { type: "image/png" });
                    const res = await base44.integrations.Core.UploadFile({ file });
                    const url = res?.file_url;
                    if (url) {
                      onLogoSave?.(url);
                      savePositionOnly();
                    }
                    resolve();
                  }, "image/png", 0.92);
                });
              } catch (err) {
                console.error(err);
                alert("שגיאה בשמירה");
              } finally {
                setIsSaving(false);
                setShowPreview(false);
              }
            }}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? "שומר..." : "שמור לוגו"}
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="relative bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-2xl p-5">
            <canvas
              ref={canvasRef}
              className="rounded-2xl shadow-inner border-4 border-white/80"
            />
            <div className="absolute -inset-1 rounded-3xl opacity-20 -z-10" style={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              filter: 'blur(20px)'
            }} />
          </div>
        </div>

        <p className="mt-4 text-slate-600 text-center text-sm">
          כך הלוגו יופיע בעמוד העסק ({cropSize}x{cropSize}px)
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full">
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-6">
        {/* כפתורי העלאה וזום */}
        <div className="mb-4 flex justify-center gap-3 flex-wrap">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 ml-2" />
            העלה תמונה
          </Button>
          
          {image && (
            <>
              <Button
                onClick={handleZoomIn}
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <ZoomIn className="w-4 h-4 ml-2" />
                זום +
              </Button>
              <Button
                onClick={handleZoomOut}
                variant="default"
                className="bg-amber-600 hover:bg-amber-700"
              >
                <ZoomOut className="w-4 h-4 ml-2" />
                זום -
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 ml-2" />
                איפוס
              </Button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* בקרת זום מדויקת */}
        {image && (
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-sm font-medium text-slate-700">רמת זום:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={50}
                max={500}
                step={5}
                value={Math.round(scale * 100)}
                onChange={(e) => setZoomPercent(e.target.value)}
                className="w-24 h-9 text-center font-semibold"
              />
              <span className="text-sm font-medium text-slate-700">%</span>
            </div>
          </div>
        )}

        {/* בקרי הזזה */}
        {image && (
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="grid grid-cols-3 gap-1">
                <div />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nudge(0, -NUDGE_BASE)}
                  className="p-2 h-9 w-9"
                  title="למעלה"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <div />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nudge(-NUDGE_BASE, 0)}
                  className="p-2 h-9 w-9"
                  title="שמאלה"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={centerPosition}
                  className="p-2 h-9 w-9"
                  title="מרכז"
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nudge(NUDGE_BASE, 0)}
                  className="p-2 h-9 w-9"
                  title="ימינה"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nudge(0, NUDGE_BASE)}
                  className="p-2 h-9 w-9"
                  title="למטה"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <div />
              </div>
            </div>
          </div>
        )}

        {/* אזור המיצוב */}
        {image ? (
          <div
            ref={containerRef}
            className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden border-4 border-slate-300 shadow-inner"
            style={{ height: '500px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <img
                ref={imgRef}
                src={image}
                alt="לוגו"
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                draggable={false}
              />
            </div>

            {/* ריבוע המסגרת - מסמן בדיוק מה ייכנס ללוגו */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
              style={{
                width: cropSize,
                height: cropSize,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                border: '3px solid #3b82f6',
                background: 'transparent'
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                אזור הלוגו
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-4 border-dashed border-slate-300">
            <p className="text-slate-400 text-lg font-medium">העלה תמונה כדי להתחיל</p>
          </div>
        )}

        {/* כפתורי פעולה */}
        {image && (
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Button
              onClick={capturePreview}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              צפה בתוצאה
            </Button>
            <Button
              onClick={savePositionOnly}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <Save className="w-4 h-4" />
              שמור מיצוב בלבד
            </Button>
            <Button
              onClick={cropAndSaveLogo}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {isSaving ? (
                "שומר לוגו..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  חתוך ושמור לוגו
                </>
              )}
            </Button>
          </div>
        )}

        {/* טיפים */}
        <div className="mt-4 text-center text-xs text-slate-500 space-y-1">
          <p>💡 <strong>גלגלת העכבר</strong> - זום פנימה/החוצה</p>
          <p>🖱️ <strong>גרירה</strong> - הזז את התמונה (כשהיא מוגדלת)</p>
          <p>⌨️ <strong>חצים במקלדת</strong> - הזזה מדויקת (Shift להאצה)</p>
          <p>📏 <strong>רק מה שבתוך המסגרת הכחולה</strong> ייכנס ללוגו הסופי</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
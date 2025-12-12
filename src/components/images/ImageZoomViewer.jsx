
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Eye, Download } from 'lucide-react';
import { UploadFile } from "@/integrations/Core";

export default function ImageZoomViewer({
  initialImage = null,
  onSaved,
  height = 600,
  frameSize: initialFrameSize = 300,
  onPositionSave
}) {
  const [image, setImage] = useState(initialImage);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAvatar, setShowAvatar] = useState(false);
  
  // שינוי: עכשיו המסגרת יכולה להיות מלבן
  const [frameRect, setFrameRect] = useState({
    width: initialFrameSize,
    height: initialFrameSize
  });
  
  // הוספה: מצב לשינוי גודל המסגרת
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [initialImage]);

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

  const handleZoomIn = () => setScale((p) => Math.min(p + 0.2, 5));
  const handleZoomOut = () => setScale((p) => Math.max(p - 0.2, 0.5));
  const handleReset = () => { 
    setScale(1); 
    setPosition({ x: 0, y: 0 });
    setFrameRect({ width: initialFrameSize, height: initialFrameSize });
  };

  // טיפול בגרירת התמונה
  const handleImageMouseDown = (e) => {
    // בדיקה שלא לחצנו על ידית או על המסגרת
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const frameLeft = (rect.width - frameRect.width) / 2;
    const frameTop = (rect.height - frameRect.height) / 2;
    const frameRight = frameLeft + frameRect.width;
    const frameBottom = frameTop + frameRect.height;
    
    // אם לחצנו מחוץ למסגרת, נגרור את התמונה
    if (x < frameLeft || x > frameRight || y < frameTop || y > frameBottom) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // טיפול בשינוי גודל המסגרת
  const handleFrameMouseDown = (e, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setFrameRect(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        
        // שינוי לפי הידית שנלחצה
        switch(resizeHandle) {
          case 'e': // ימין
            newWidth = Math.max(100, Math.min(800, prev.width + deltaX));
            break;
          case 'w': // שמאל
            newWidth = Math.max(100, Math.min(800, prev.width - deltaX));
            break;
          case 's': // למטה
            newHeight = Math.max(100, Math.min(800, prev.height + deltaY));
            break;
          case 'n': // למעלה
            newHeight = Math.max(100, Math.min(800, prev.height - deltaY));
            break;
          case 'se': // פינה ימין-למטה
            newWidth = Math.max(100, Math.min(800, prev.width + deltaX));
            newHeight = Math.max(100, Math.min(800, prev.height + deltaY));
            break;
          case 'sw': // פינה שמאל-למטה
            newWidth = Math.max(100, Math.min(800, prev.width - deltaX));
            newHeight = Math.max(100, Math.min(800, prev.height + deltaY));
            break;
          case 'ne': // פינה ימין-למעלה
            newWidth = Math.max(100, Math.min(800, prev.width + deltaX));
            newHeight = Math.max(100, Math.min(800, prev.height - deltaY));
            break;
          case 'nw': // פינה שמאל-למעלה
            newWidth = Math.max(100, Math.min(800, prev.width - deltaX));
            newHeight = Math.max(100, Math.min(800, prev.height - deltaY));
            break;
        }
        
        return { width: newWidth, height: newHeight };
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((p) => Math.max(0.5, Math.min(5, p + delta)));
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const cropAndSaveLogo = async () => {
    const container = containerRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!container || !img || !canvas || !image) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const frameCenterX = containerRect.width / 2;
    const frameCenterY = containerRect.height / 2;
    const frameLeft = frameCenterX - frameRect.width / 2;
    const frameTop = frameCenterY - frameRect.height / 2;

    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;

    const sourceX = (frameLeft - imgLeft) / scale;
    const sourceY = (frameTop - imgTop) / scale;
    const sourceWidth = frameRect.width / scale;
    const sourceHeight = frameRect.height / scale;

    canvas.width = frameRect.width;
    canvas.height = frameRect.height;
    const ctx = canvas.getContext('2d');

    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.onload = async () => {
      const scaleX = tempImg.naturalWidth / img.width;
      const scaleY = tempImg.naturalHeight / img.height;

      ctx.clearRect(0, 0, frameRect.width, frameRect.height);
      ctx.drawImage(
        tempImg,
        sourceX * scaleX,
        sourceY * scaleY,
        sourceWidth * scaleX,
        sourceHeight * scaleY,
        0,
        0,
        frameRect.width,
        frameRect.height
      );

      await new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return resolve();
          const file = new File([blob], "business-logo.png", { type: "image/png" });
          const res = await UploadFile({ file });
          const url = res?.data?.file_url || res?.file_url || null;
          if (url) {
            onSaved?.(url);
          }
          resolve();
        }, "image/png", 0.92);
      });

      const leftPercent = 50 + (position.x / frameRect.width) * 100;
      const topPercent = 50 + (position.y / frameRect.height) * 100;
      onPositionSave?.({
        x: clamp(leftPercent, -5000, 5000),
        y: clamp(topPercent, -5000, 5000),
        zoom: scale,
        rotation: 0
      });
    };
    tempImg.src = image;
  };

  const savePositionOnly = () => {
    const leftPercent = 50 + (position.x / frameRect.width) * 100;
    const topPercent = 50 + (position.y / frameRect.height) * 100;
    const pos = {
      x: clamp(leftPercent, -5000, 5000),
      y: clamp(topPercent, -5000, 5000),
      zoom: scale,
      rotation: 0
    };
    onPositionSave?.(pos);
  };

  const captureAvatar = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !image) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const frameCenterX = containerRect.width / 2;
    const frameCenterY = containerRect.height / 2;
    const frameLeft = frameCenterX - frameRect.width / 2;
    const frameTop = frameCenterY - frameRect.height / 2;

    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;

    const sourceX = (frameLeft - imgLeft) / scale;
    const sourceY = (frameTop - imgTop) / scale;
    const sourceWidth = frameRect.width / scale;
    const sourceHeight = frameRect.height / scale;

    const canvas = canvasRef.current;
    canvas.width = frameRect.width;
    canvas.height = frameRect.height;
    const ctx = canvas.getContext('2d');

    const tempImg = new Image();
    tempImg.onload = () => {
      const naturalAspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
      let renderedWidthAtScale1, renderedHeightAtScale1;
      const containerAspectRatio = containerRect.width / containerRect.height;

      if (naturalAspectRatio > containerAspectRatio) {
        renderedWidthAtScale1 = containerRect.width;
        renderedHeightAtScale1 = containerRect.width / naturalAspectRatio;
      } else {
        renderedHeightAtScale1 = containerRect.height;
        renderedWidthAtScale1 = containerRect.height * naturalAspectRatio;
      }

      const effectiveImgWidth = renderedWidthAtScale1 * scale;
      const effectiveImgHeight = renderedHeightAtScale1 * scale;

      const currentImgX = (containerRect.width - effectiveImgWidth) / 2 + position.x;
      const currentImgY = (containerRect.height - effectiveImgHeight) / 2 + position.y;

      const currentFrameX = frameCenterX - frameRect.width / 2;
      const currentFrameY = frameCenterY - frameRect.height / 2;

      const cropXInImagePixels = (currentFrameX - currentImgX);
      const cropYInImagePixels = (currentFrameY - currentImgY);

      const imageToNaturalRatioX = tempImg.naturalWidth / effectiveImgWidth;
      const imageToNaturalRatioY = tempImg.naturalHeight / effectiveImgHeight;

      const finalSourceX = cropXInImagePixels * imageToNaturalRatioX;
      const finalSourceY = cropYInImagePixels * imageToNaturalRatioY;
      const finalSourceWidth = frameRect.width * imageToNaturalRatioX;
      const finalSourceHeight = frameRect.height * imageToNaturalRatioY;
      
      ctx.clearRect(0, 0, frameRect.width, frameRect.height);
      ctx.drawImage(
        tempImg,
        finalSourceX,
        finalSourceY,
        finalSourceWidth,
        finalSourceHeight,
        0,
        0,
        frameRect.width,
        frameRect.height
      );
      setShowAvatar(true);
    };
    tempImg.src = image;
  };

  const saveAvatar = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve();
        const file = new File([blob], "business-logo.png", { type: "image/png" });
        const res = await UploadFile({ file });
        const url = res?.data?.file_url || res?.file_url || null;
        if (url) {
          onSaved?.(url);
        }
        resolve();
      }, "image/png", 0.92);
    });
  };

  if (showAvatar) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowAvatar(false)}
            className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            ← חזרה לעריכה
          </button>
          <div className="flex gap-2">
            <button
              onClick={saveAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              title="שמור ללוגו"
            >
              <Download size={18} />
              שמור ללוגו
            </button>
          </div>
        </div>

        <div className="relative inline-block">
          <div
            className="relative bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-2xl"
            style={{ width: frameRect.width + 40, height: frameRect.height + 40 }}
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden" style={{ padding: 20 }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover rounded-2xl shadow-inner"
                style={{ border: '4px solid rgba(255, 255, 255, 0.8)' }}
              />
            </div>
            <div className="absolute -inset-1 rounded-3xl opacity-20" style={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              filter: 'blur(20px)',
              zIndex: -1
            }} />
          </div>
        </div>

        <p className="mt-4 text-slate-600 text-center text-sm">
          זוהי התצוגה שתישמר ותופיע בעמוד העסק ({frameRect.width}x{frameRect.height}px)
        </p>
      </div>
    );
  }

  // סגנון ידיות
  const handleStyle = "absolute w-4 h-4 bg-purple-600 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform z-10";

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          type="button"
        >
          <Upload size={18} />
          העלה תמונה
        </button>
        {image && (
          <>
            <button
              onClick={captureAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              type="button"
            >
              <Eye size={18} />
              הצג אווטאר
            </button>
            <button
              onClick={savePositionOnly}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              type="button"
              title="שמור מיצוב"
            >
              שמור מיצוב
            </button>
            <button
              onClick={cropAndSaveLogo}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              type="button"
              title="קבע לוגו"
            >
              <Download size={18} />
              קבע לוגו
            </button>
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

      {image && (
        <>
          <div className="mb-3 flex justify-center gap-2 flex-wrap">
            <button onClick={handleZoomIn} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <ZoomIn size={18} className="inline ml-1" /> זום
            </button>
            <button onClick={handleZoomOut} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              <ZoomOut size={18} className="inline ml-1" /> זום -
            </button>
            <button onClick={handleReset} className="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
              <RotateCcw size={18} className="inline ml-1" /> איפוס
            </button>
          </div>

          <div className="mb-3 flex items-center justify-center gap-4 text-slate-700 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span>זום:</span>
              <input
                type="number"
                min={50}
                max={500}
                step={1}
                value={Math.round(scale * 100)}
                onChange={(e) => {
                  const val = Math.max(50, Math.min(500, parseInt(e.target.value || "100", 10)));
                  setScale(val / 100);
                }}
                className="w-16 px-2 py-1 border-2 border-gray-300 rounded-lg text-center font-semibold focus:border-blue-500 focus:outline-none"
              />
              <span>%</span>
            </div>

            <div className="flex items-center gap-2">
              <span>רוחב:</span>
              <input
                type="number"
                min={100}
                max={800} // Corrected: Added `=` for max prop
                step={10}
                value={Math.round(frameRect.width)}
                onChange={(e) => {
                  const val = Math.max(100, Math.min(800, parseInt(e.target.value || "300", 10)));
                  setFrameRect(prev => ({ ...prev, width: val }));
                }}
                className="w-16 px-2 py-1 border-2 border-gray-300 rounded-lg text-center font-semibold focus:border-purple-500 focus:outline-none"
              />
              <span>px</span>
            </div>

            <div className="flex items-center gap-2">
              <span>גובה:</span>
              <input
                type="number"
                min={100}
                max={800}
                step={10}
                value={Math.round(frameRect.height)}
                onChange={(e) => {
                  const val = Math.max(100, Math.min(800, parseInt(e.target.value || "300", 10)));
                  setFrameRect(prev => ({ ...prev, height: val }));
                }}
                className="w-16 px-2 py-1 border-2 border-gray-300 rounded-lg text-center font-semibold focus:border-purple-500 focus:outline-none"
              />
              <span>px</span>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-300"
            style={{ height }}
            onMouseDown={handleImageMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div className="absolute inset-0 flex items-center justify-center" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
              <img
                ref={imgRef}
                src={image}
                alt="תמונה למיצוג"
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                draggable={false}
              />
            </div>

            {/* מסגרת החיתוך עם ידיות */}
            <div
              className="absolute pointer-events-auto"
              style={{
                left: '50%',
                top: '50%',
                width: `${frameRect.width}px`,
                height: `${frameRect.height}px`,
                transform: 'translate(-50%, -50%)',
                border: '4px solid rgba(147, 51, 234, 0.8)',
                borderRadius: '12px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(147, 51, 234, 0.3)',
                background: 'transparent'
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap pointer-events-none">
                אזור האווטאר ({frameRect.width}×{frameRect.height})
              </div>
              
              {/* רשת עזר */}
              <div className="absolute inset-0 border-2 border-white border-dashed opacity-50 rounded-lg pointer-events-none" />

              {/* ידיות פינות */}
              <div className={handleStyle} style={{ top: -8, left: -8, cursor: 'nw-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'nw')} />
              <div className={handleStyle} style={{ top: -8, right: -8, cursor: 'ne-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'ne')} />
              <div className={handleStyle} style={{ bottom: -8, left: -8, cursor: 'sw-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'sw')} />
              <div className={handleStyle} style={{ bottom: -8, right: -8, cursor: 'se-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'se')} />
              
              {/* ידיות צלעות */}
              <div className={handleStyle} style={{ top: -8, left: '50%', marginLeft: -8, cursor: 'n-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'n')} />
              <div className={handleStyle} style={{ bottom: -8, left: '50%', marginLeft: -8, cursor: 's-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 's')} />
              <div className={handleStyle} style={{ top: '50%', left: -8, marginTop: -8, cursor: 'w-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'w')} />
              <div className={handleStyle} style={{ top: '50%', right: -8, marginTop: -8, cursor: 'e-resize' }} onMouseDown={(e) => handleFrameMouseDown(e, 'e')} />
            </div>
          </div>

          <div className="mt-3 text-center text-sm text-gray-500">
            💡 גרור תמונה | גלגלת לזום | גרור ידיות סגולות לשינוי גודל מסגרת | מה שבתוך המסגרת יישמר ללוגו
          </div>
        </>
      )}

      {!image && (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-400 text-base">העלה תמונה כדי להתחיל</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

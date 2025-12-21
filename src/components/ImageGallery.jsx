import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export default function ImageGallery({
  images,
  isOpen = true,
  onClose,
  initialIndex = 0,
  currentIndex,              // optional controlled index
  onIndexChange,             // optional controlled setter
}) {
  const isControlled = typeof currentIndex === "number" && typeof onIndexChange === "function";
  const [uncontrolledIndex, setUncontrolledIndex] = useState(initialIndex);
  const index = isControlled ? currentIndex : uncontrolledIndex;

  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MAX_ZOOM = 5;

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset internal index if initialIndex changes and component is uncontrolled
  useEffect(() => {
    if (!isControlled) {
      setUncontrolledIndex(initialIndex || 0);
      resetZoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  // רק עכשיו נוכל להחזיר null אם אין תמונות, אחרי שכל ה-Hooks הוגדרו
  if (!images || images.length === 0) return null;

  const setIndex = (val) => {
    if (isControlled) {
      onIndexChange(val);
    } else {
      setUncontrolledIndex(val);
    }
    resetZoom();
  };

  const goToPrevious = () => setIndex(index === 0 ? images.length - 1 : index - 1);
  const goToNext = () => setIndex(index === images.length - 1 ? 0 : index + 1);

  // תמיכה במקלדת
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index, images.length, onClose]);

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, MAX_ZOOM));
  const zoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => {
    e.preventDefault();
    e.deltaY < 0 ? zoomIn() : zoomOut();
  };

  return (
    <Dialog open={isOpen ?? true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
        <DialogTitle className="sr-only">גלריית תמונות</DialogTitle>

        {/* Header with controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm">
            {index + 1} / {images.length}
          </div>
          <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="text-white text-xs self-center px-2 min-w-[40px] text-center">
              {Math.round(zoomLevel * 100)}%
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              disabled={zoomLevel >= MAX_ZOOM}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Main image */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default' }}
        >
          <img
            src={images[index]}
            alt={`תמונה ${index + 1}`}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`, transformOrigin: 'center center' }}
            draggable={false}
            onDoubleClick={() => setZoomLevel((prev) => (prev === 1 ? 3 : 1))}
          />
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 max-w-[90vw] overflow-x-auto">
            {images.map((image, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${i === index ? 'border-white shadow-lg' : 'border-white/30 hover:border-white/60'}`}
              >
                <img src={image} alt={`תמונה ממוזערת ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
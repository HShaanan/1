import React, { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageComparison({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "לפני", 
  afterLabel = "אחרי" 
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const bind = useDrag(
    ({ down, movement: [mx], memo = sliderPosition }) => {
      if (!containerRef.current) return memo;
      
      const containerWidth = containerRef.current.offsetWidth;
      const delta = (mx / containerWidth) * 100;
      const newPosition = Math.max(0, Math.min(100, memo + delta));
      
      if (down) {
        setSliderPosition(newPosition);
      }
      
      return down ? memo : newPosition;
    },
    {
      axis: 'x',
      bounds: { left: 0, right: 0 },
      rubberband: true,
    }
  );

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return; // Only if mouse button is pressed
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newPosition = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl cursor-col-resize select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Full) */}
      <div className="relative w-full">
        <img 
          src={afterImage} 
          alt={afterLabel}
          className="w-full h-auto block"
          draggable={false}
        />
        {/* After Label */}
        <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 z-10">
          <span className="text-lg">✨</span>
          <span>{afterLabel}</span>
        </div>
      </div>

      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="relative w-full h-full">
          <img 
            src={beforeImage} 
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            style={{ 
              width: '100vw',
              maxWidth: 'none',
              position: 'absolute',
              right: 0,
              top: 0
            }}
          />
        </div>
        {/* Before Label */}
        <div className="absolute top-4 right-4 bg-slate-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 z-10">
          <span>{beforeLabel}</span>
          <span className="text-lg">😕</span>
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle Circle */}
        <div 
          {...bind()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none border-4 border-blue-500 hover:scale-110 transition-transform"
          style={{ touchAction: 'none' }}
        >
          <ChevronRight className="w-6 h-6 text-blue-600 absolute -right-1" />
          <ChevronLeft className="w-6 h-6 text-blue-600 absolute -left-1" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
        👆 גרור לצדדים להשוואה
      </div>
    </div>
  );
}
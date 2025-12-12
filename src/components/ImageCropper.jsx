import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  Move, Check, X, Maximize, Square, 
  Smartphone, Monitor, Camera, Palette, Circle
} from "lucide-react";

export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel, 
  isOpen,
  aspectRatioOptions = [
    { name: "חופשי", ratio: null, icon: Maximize },
    { name: "ריבוע", ratio: 1, icon: Square },
    { name: "תמונה", ratio: 4/3, icon: Camera },
    { name: "נייד", ratio: 9/16, icon: Smartphone },
    { name: "דסקטופ", ratio: 16/9, icon: Monitor }
  ]
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // מצב החיתוך
  const [cropState, setCropState] = useState({
    x: 50,
    y: 50,
    width: 300,
    height: 300,
    scale: 1,
    rotation: 0
  });
  
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(1);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [addWhiteMargin, setAddWhiteMargin] = useState(false);
  const [marginSize, setMarginSize] = useState([10]);
  const [isCircleCrop, setIsCircleCrop] = useState(false);

  const CONTAINER_WIDTH = 500;
  const CONTAINER_HEIGHT = 400;

  // אתחול כאשר התמונה נטענת
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    
    setImagePosition({ x: 0, y: 0 });
    
    setCropState({
      x: CONTAINER_WIDTH / 2 - 150,
      y: CONTAINER_HEIGHT / 2 - 150,
      width: 300,
      height: 300,
      scale: 1,
      rotation: 0
    });
    
    setImageLoaded(true);
  }, []);

  // טיפול בהתחלת גרירת מיכל החיתוך
  const handleCropMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // בדיקה אם לחץ על פינה לשינוי גודל
    const handles = [
      { name: 'nw', x: cropState.x, y: cropState.y },
      { name: 'ne', x: cropState.x + cropState.width, y: cropState.y },
      { name: 'sw', x: cropState.x, y: cropState.y + cropState.height },
      { name: 'se', x: cropState.x + cropState.width, y: cropState.y + cropState.height }
    ];
    
    const HANDLE_SIZE = 10;
    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= HANDLE_SIZE && Math.abs(y - handle.y) <= HANDLE_SIZE) {
        setIsResizing(true);
        setResizeHandle(handle.name);
        setDragStart({ x, y });
        return;
      }
    }
    
    // אם לא לחץ על פינה, זה גרירה רגילה של המיכל
    if (x >= cropState.x && x <= cropState.x + cropState.width &&
        y >= cropState.y && y <= cropState.y + cropState.height) {
      setIsDraggingCrop(true);
      setDragStart({
        x: x - cropState.x,
        y: y - cropState.y
      });
    }
  }, [cropState]);

  // טיפול בהתחלת גרירת התמונה
  const handleImageMouseDown = useCallback((e) => {
    // רק אם לא לחץ בתוך אזור החיתוך
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < cropState.x || x > cropState.x + cropState.width ||
        y < cropState.y || y > cropState.y + cropState.height) {
      e.preventDefault();
      setIsDraggingImage(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  }, [cropState, imagePosition]);

  // טיפול בתנועת העכבר
  const handleMouseMove = useCallback((e) => {
    if (isDraggingCrop) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragStart.x;
      const newY = e.clientY - rect.top - dragStart.y;
      
      setCropState(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CONTAINER_WIDTH - prev.width, newX)),
        y: Math.max(0, Math.min(CONTAINER_HEIGHT - prev.height, newY))
      }));
    } else if (isDraggingImage) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const maxMove = 200;
      setImagePosition({
        x: Math.max(-maxMove, Math.min(maxMove, newX)),
        y: Math.max(-maxMove, Math.min(maxMove, newY))
      });
    } else if (isResizing && resizeHandle) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      let newX = cropState.x;
      let newY = cropState.y;
      let newWidth = cropState.width;
      let newHeight = cropState.height;
      
      const minSize = 50;
      
      switch (resizeHandle) {
        case 'nw':
          newWidth = Math.max(minSize, cropState.width + (cropState.x - currentX));
          newHeight = Math.max(minSize, cropState.height + (cropState.y - currentY));
          newX = cropState.x - (newWidth - cropState.width);
          newY = cropState.y - (newHeight - cropState.height);
          break;
        case 'ne':
          newWidth = Math.max(minSize, currentX - cropState.x);
          newHeight = Math.max(minSize, cropState.height + (cropState.y - currentY));
          newY = cropState.y - (newHeight - cropState.height);
          break;
        case 'sw':
          newWidth = Math.max(minSize, cropState.width + (cropState.x - currentX));
          newHeight = Math.max(minSize, currentY - cropState.y);
          newX = cropState.x - (newWidth - cropState.width);
          break;
        case 'se':
          newWidth = Math.max(minSize, currentX - cropState.x);
          newHeight = Math.max(minSize, currentY - cropState.y);
          break;
      }
      
      // שמירה על יחס גובה-רוחב אם נבחר
      if (selectedAspectRatio && !isCircleCrop) {
        if (resizeHandle.includes('e')) {
          newHeight = newWidth / selectedAspectRatio;
        } else {
          newWidth = newHeight * selectedAspectRatio;
        }
      }
      
      // ודוא שהמיכל נשאר בתוך הגבולות
      newX = Math.max(0, Math.min(CONTAINER_WIDTH - newWidth, newX));
      newY = Math.max(0, Math.min(CONTAINER_HEIGHT - newHeight, newY));
      newWidth = Math.min(newWidth, CONTAINER_WIDTH - newX);
      newHeight = Math.min(newHeight, CONTAINER_HEIGHT - newY);
      
      // חיתוך עגול - שמירה על ריבוע
      if (isCircleCrop) {
        const size = Math.min(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
      }
      
      setCropState(prev => ({
        ...prev,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }));
    }
  }, [isDraggingCrop, isDraggingImage, isResizing, resizeHandle, dragStart, cropState, selectedAspectRatio, isCircleCrop]);

  // טיפול בשחרור העכבר
  const handleMouseUp = useCallback(() => {
    setIsDraggingCrop(false);
    setIsDraggingImage(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleAspectRatioChange = useCallback((ratio) => {
    setSelectedAspectRatio(ratio);
    
    if (ratio) {
      const maxWidth = Math.min(CONTAINER_WIDTH * 0.8, 400);
      const maxHeight = Math.min(CONTAINER_HEIGHT * 0.8, 300);
      
      let newWidth, newHeight;
      
      if (ratio >= 1) {
        newWidth = Math.min(maxWidth, maxHeight * ratio);
        newHeight = newWidth / ratio;
      } else {
        newHeight = Math.min(maxHeight, maxWidth / ratio);
        newWidth = newHeight * ratio;
      }
      
      setCropState(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight,
        x: (CONTAINER_WIDTH - newWidth) / 2,
        y: (CONTAINER_HEIGHT - newHeight) / 2
      }));
    }
  }, []);

  const handleCircleCropToggle = useCallback((enabled) => {
    setIsCircleCrop(enabled);
    if (enabled) {
      // כאשר עוברים לחיתוך עגול, הופכים לריבוע
      const size = Math.min(cropState.width, cropState.height);
      setCropState(prev => ({
        ...prev,
        width: size,
        height: size,
        x: (CONTAINER_WIDTH - size) / 2,
        y: (CONTAINER_HEIGHT - size) / 2
      }));
      setSelectedAspectRatio(1);
    }
  }, [cropState.width, cropState.height]);

  const handleRotate = useCallback((direction) => {
    setCropState(prev => ({
      ...prev,
      rotation: (prev.rotation + (direction * 90)) % 360
    }));
  }, []);

  const handleZoom = useCallback((newScale) => {
    setCropState(prev => ({
      ...prev,
      scale: newScale[0]
    }));
  }, []);

  const resetImagePosition = useCallback(() => {
    setImagePosition({ x: 0, y: 0 });
    setCropState(prev => ({
      ...prev,
      scale: 1,
      rotation: 0
    }));
  }, []);

  // ביצוע החיתוך
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      let finalWidth = isCircleCrop ? Math.min(cropState.width, cropState.height) : cropState.width;
      let finalHeight = isCircleCrop ? finalWidth : cropState.height;
      let marginPixels = 0;
      
      if (addWhiteMargin) {
        marginPixels = Math.min(finalWidth, finalHeight) * (marginSize[0] / 100);
        finalWidth += marginPixels * 2;
        finalHeight += marginPixels * 2;
      }
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      if (addWhiteMargin) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }
      
      ctx.save();
      
      const targetX = addWhiteMargin ? marginPixels : 0;
      const targetY = addWhiteMargin ? marginPixels : 0;
      const targetWidth = isCircleCrop ? Math.min(cropState.width, cropState.height) : cropState.width;
      const targetHeight = isCircleCrop ? targetWidth : cropState.height;
      
      if (isCircleCrop) {
        ctx.beginPath();
        ctx.arc(
          targetX + targetWidth / 2, 
          targetY + targetHeight / 2, 
          targetWidth / 2, 
          0, 
          2 * Math.PI
        );
        ctx.clip();
      }
      
      if (cropState.rotation !== 0) {
        ctx.translate(targetX + targetWidth / 2, targetY + targetHeight / 2);
        ctx.rotate((cropState.rotation * Math.PI) / 180);
        ctx.translate(-targetWidth / 2, -targetHeight / 2);
      } else {
        ctx.translate(targetX, targetY);
      }
      
      const displayScale = Math.min(
        CONTAINER_WIDTH / img.naturalWidth,
        CONTAINER_HEIGHT / img.naturalHeight
      ) * cropState.scale;
      
      const displayImageWidth = img.naturalWidth * displayScale;
      const displayImageHeight = img.naturalHeight * displayScale;
      
      const imageDisplayX = (CONTAINER_WIDTH - displayImageWidth) / 2 + imagePosition.x;
      const imageDisplayY = (CONTAINER_HEIGHT - displayImageHeight) / 2 + imagePosition.y;
      
      const sourceX = Math.max(0, (cropState.x - imageDisplayX) / displayScale);
      const sourceY = Math.max(0, (cropState.y - imageDisplayY) / displayScale);
      const sourceWidth = Math.min(
        img.naturalWidth - sourceX, 
        targetWidth / displayScale
      );
      const sourceHeight = Math.min(
        img.naturalHeight - sourceY, 
        targetHeight / displayScale
      );
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
      
      ctx.restore();
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        onCropComplete(blob);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cropState, imagePosition, onCropComplete, addWhiteMargin, marginSize, imageUrl, isCircleCrop]);

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            עריכת תמונה מתקדמת
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* אזור התמונה והחיתוך */}
          <div className="lg:col-span-3 space-y-4">
            <div 
              ref={containerRef}
              className="relative bg-gray-200 rounded-xl overflow-hidden mx-auto cursor-move select-none"
              style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseDown={handleImageMouseDown}
            >
              {imageUrl && (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="לחיתוך"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  style={{
                    transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${cropState.scale}) rotate(${cropState.rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                  onLoad={handleImageLoad}
                  draggable={false}
                  crossOrigin="anonymous"
                />
              )}
              
              {/* חלון החיתוך */}
              {imageLoaded && (
                <>
                  {/* רקע כהה */}
                  <div className="absolute inset-0 bg-black opacity-40 pointer-events-none" />
                  
                  {/* אזור החיתוך */}
                  <div
                    className="absolute cursor-move select-none"
                    style={{
                      left: cropState.x,
                      top: cropState.y,
                      width: cropState.width,
                      height: cropState.height,
                      border: isCircleCrop ? 'none' : '2px solid #3b82f6',
                      backgroundColor: 'transparent',
                      boxShadow: `0 0 0 ${CONTAINER_WIDTH + CONTAINER_HEIGHT}px rgba(0, 0, 0, 0.4)`,
                      borderRadius: isCircleCrop ? '50%' : '0'
                    }}
                    onMouseDown={handleCropMouseDown}
                  >
                    {/* גבול עגול לחיתוך עגול */}
                    {isCircleCrop && (
                      <div 
                        className="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none"
                        style={{
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    )}
                    
                    {/* פינות לשינוי גודל - רק אם לא חיתוך עגול */}
                    {!isCircleCrop && (
                      <>
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize"
                          style={{ top: -8, left: -8 }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize"
                          style={{ top: -8, right: -8 }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize"
                          style={{ bottom: -8, left: -8 }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize"
                          style={{ bottom: -8, right: -8 }}
                        />
                      </>
                    )}
                    
                    {/* רשת עזר - רק אם לא חיתוך עגול */}
                    {!isCircleCrop && (
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {Array(9).fill(0).map((_, i) => (
                          <div key={i} className="border border-white opacity-40" />
                        ))}
                      </div>
                    )}
                    
                    {/* תצוגה מקדימה של השוליים */}
                    {addWhiteMargin && (
                      <div 
                        className="absolute border-2 border-gray-300 border-dashed pointer-events-none"
                        style={{
                          left: -marginSize[0],
                          top: -marginSize[0],
                          right: -marginSize[0],
                          bottom: -marginSize[0],
                          borderColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: isCircleCrop ? '50%' : '0'
                        }}
                      />
                    )}
                  </div>
                </>
              )}
              
              {/* הוראות שימוש */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded">
                <div>🖱️ גרור תמונה: להזיז את התמונה</div>
                <div>🔲 גרור מסגרת: להזיז את החיתוך</div>
                <div>🔵 גרור פינות: לשנות גודל</div>
                {isCircleCrop && <div>⭕ חיתוך עגול פעיל</div>}
              </div>
            </div>

            {/* כלי עזר */}
            <div className="flex flex-wrap items-center justify-center gap-4 bg-gray-50 p-4 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(-1)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                סובב שמאלה
              </Button>
              
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" />
                <Slider
                  value={[cropState.scale]}
                  onValueChange={handleZoom}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-32"
                />
                <ZoomIn className="w-4 h-4" />
                <span className="text-sm text-gray-500">{Math.round(cropState.scale * 100)}%</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(1)}
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                סובב ימינה
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetImagePosition}
                className="flex items-center gap-2"
              >
                <Move className="w-4 h-4" />
                איפוס
              </Button>
            </div>
          </div>

          {/* פאנל בקרה */}
          <div className="space-y-6">
            {/* חיתוך עגול */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Circle className="w-4 h-4" />
                  סוג חיתוך
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="circle-crop"
                    checked={isCircleCrop}
                    onCheckedChange={handleCircleCropToggle}
                  />
                  <Label htmlFor="circle-crop" className="text-sm">חיתוך עגול</Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {isCircleCrop ? "התמונה תיחתך בצורת עיגול מושלם" : "חיתוך רגיל עם פינות"}
                </p>
              </CardContent>
            </Card>

            {/* יחס גובה-רוחב - נבטל כאשר חיתוך עגול פעיל */}
            {!isCircleCrop && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">יחס גובה-רוחב</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aspectRatioOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.name}
                        variant={selectedAspectRatio === option.ratio ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleAspectRatioChange(option.ratio)}
                      >
                        <Icon className="w-4 h-4 ml-2" />
                        {option.name}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  שוליים לבנים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="white-margin"
                    checked={addWhiteMargin}
                    onCheckedChange={setAddWhiteMargin}
                  />
                  <Label htmlFor="white-margin" className="text-sm">הוסף שוליים לבנים</Label>
                </div>
                
                {addWhiteMargin && (
                  <div className="space-y-2">
                    <Label className="text-xs">גודל השוליים: {marginSize[0]}%</Label>
                    <Slider
                      value={marginSize}
                      onValueChange={setMarginSize}
                      max={25}
                      min={2}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">פרטי החיתוך</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>רוחב:</span>
                  <Badge variant="outline">{Math.round(cropState.width)}px</Badge>
                </div>
                <div className="flex justify-between">
                  <span>גובה:</span>
                  <Badge variant="outline">{Math.round(cropState.height)}px</Badge>
                </div>
                <div className="flex justify-between">
                  <span>זום:</span>
                  <Badge variant="outline">{Math.round(cropState.scale * 100)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>סיבוב:</span>
                  <Badge variant="outline">{cropState.rotation}°</Badge>
                </div>
                {isCircleCrop && (
                  <div className="flex justify-between">
                    <span>סוג:</span>
                    <Badge variant="outline" className="bg-purple-50">עגול</Badge>
                  </div>
                )}
                {addWhiteMargin && (
                  <div className="flex justify-between">
                    <span>שוליים:</span>
                    <Badge variant="outline" className="bg-blue-50">{marginSize[0]}%</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* כפתורי פעולה */}
            <div className="space-y-2">
              <Button
                onClick={handleCrop}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מעבד...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    אשר חיתוך {isCircleCrop ? "עגול" : ""}
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full"
              >
                <X className="w-4 h-4 ml-2" />
                ביטול
              </Button>
            </div>
          </div>
        </div>

        {/* קנבס נסתר לחיתוך */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
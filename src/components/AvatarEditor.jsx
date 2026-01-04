import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Save, X } from 'lucide-react';

export default function AvatarEditorModal({ isOpen, imageUrl, onSave, onCancel, title = "עריכת תמונה" }) {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [proxyImageUrl, setProxyImageUrl] = useState(null);

  // Load image as blob to avoid CORS issues
  React.useEffect(() => {
    if (!imageUrl) {
      setProxyImageUrl(null);
      return;
    }

    const loadImage = async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setProxyImageUrl(url);
      } catch (error) {
        console.error('Error loading image:', error);
        setProxyImageUrl(imageUrl); // Fallback to original URL
      }
    };

    loadImage();

    return () => {
      if (proxyImageUrl && proxyImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proxyImageUrl);
      }
    };
  }, [imageUrl]);

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* עורך התמונה */}
          <div className="flex justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-6">
            {proxyImageUrl ? (
              <AvatarEditor
                ref={editorRef}
                image={proxyImageUrl}
                width={300}
                height={300}
                border={20}
                borderRadius={8}
                color={[255, 255, 255, 0.8]}
                scale={scale}
                rotate={rotate}
                className="shadow-2xl"
              />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-white rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* בקרות זום */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ZoomOut className="w-5 h-5 text-slate-600" />
              <Slider
                value={[scale]}
                onValueChange={(vals) => setScale(vals[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
                dir="ltr"
              />
              <ZoomIn className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-600 w-12 text-center">{scale.toFixed(1)}x</span>
            </div>

            <Button
              onClick={handleRotate}
              variant="outline"
              className="w-full gap-2"
            >
              <RotateCw className="w-4 h-4" />
              סובב 90°
            </Button>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save className="w-4 h-4" />
              שמור
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
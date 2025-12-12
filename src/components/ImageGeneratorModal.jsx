
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ImageGeneratorModal({ isOpen, onClose, onImageGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerate = async () => {
    if (!prompt) return;

    // בדיקת התחברות – מונע 401
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedImage(null);
    try {
      const res = await base44.functions.invoke('googleAiImageGenerate', { prompt });
      const { data } = res || {};
      if (data?.ok && data?.data_url) {
        setGeneratedImage(data.data_url);
      } else {
        if (res?.status === 403) {
          throw new Error('אין לך הרשאה לפעולה זו (Admin only).');
        }
        throw new Error(data?.error || 'Failed to generate image');
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401) {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            יצירת תמונה עם AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="תאר את התמונה שברצונך ליצור (באנגלית)... לדוגמה: a professional logo for a hair salon, elegant, black and gold, minimalist"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                יוצר תמונה... (עשוי לקחת כ-20 שניות)
              </>
            ) : (
              'צור תמונה'
            )}
          </Button>

          {error && (
            <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 rounded-md">
              <AlertTriangle className="w-4 h-4" />
              <span>שגיאה: {error}</span>
            </div>
          )}

          <div className="mt-4 flex justify-center items-center min-h-[256px] bg-slate-50 rounded-lg border">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated" className="max-w-full max-h-96 rounded-md" />
            ) : (
              <span className="text-slate-400">התמונה שתיווצר תוצג כאן</span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
          <Button onClick={handleUseImage} disabled={!generatedImage}>
            השתמש בתמונה זו
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

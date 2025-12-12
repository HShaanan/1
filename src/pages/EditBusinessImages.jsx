import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, AlertTriangle, Loader2, ImageIcon, 
  ChevronLeft, Upload, Wand2, Download
} from "lucide-react";
import { createPageUrl } from "@/utils";
import InlineImageEditor from "@/components/images/InlineImageEditor";
import ImageZoomViewer from "@/components/images/ImageZoomViewer";
import ImageGeneratorModal from "@/components/ImageGeneratorModal";

export default function EditBusinessImagesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingGooglePhotos, setLoadingGooglePhotos] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [editingLogoUrl, setEditingLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    images: [],
    preview_image: "",
    metadata: {}
  });

  useEffect(() => {
    const loadData = async () => {
      let currentUser;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (!pageId) {
        setError("לא נמצא מזהה עמוד עסק");
        setIsLoading(false);
        return;
      }

      try {
        const pageData = await base44.entities.BusinessPage.filter({ id: pageId });
        const page = Array.isArray(pageData) ? pageData[0] : pageData;

        if (!page) {
          setError("עמוד העסק לא נמצא");
          setIsLoading(false);
          return;
        }

        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          setError("אין לך הרשאה לערוך עמוד עסק זה");
          setIsLoading(false);
          return;
        }

        setBusinessPage(page);
        const pageImages = Array.isArray(page.images) ? [...page.images] : [];

        setForm({
          images: pageImages,
          preview_image: page.preview_image || "",
          metadata: page.metadata || {}
        });

      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updateData = {
        images: form.images.filter(Boolean),
        preview_image: form.preview_image || null,
        metadata: form.metadata
      };

      await base44.entities.BusinessPage.update(pageId, updateData);
      setSuccessMessage("התמונות נשמרו בהצלחה!");

      setTimeout(() => {
        window.location.href = createPageUrl(`BusinessManage?id=${pageId}`);
      }, 1500);

    } catch (err) {
      setError("שגיאה בשמירה: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLogo = useCallback((imageUrl, imageIndex) => {
    if (imageIndex === 1 && imageUrl) {
      setEditingLogoUrl(imageUrl);
      setIsLogoEditorOpen(true);
    } else if (imageIndex === 1 && !imageUrl) {
      setError("אין לוגו קיים לעריכה. אנא העלה לוגו קודם.");
      setTimeout(() => setError(""), 3000);
    } else {
      setError("ניתן לערוך רק את התמונה השנייה ברשימה כלוגו.");
      setTimeout(() => setError(""), 3000);
    }
  }, []);

  const handleLogoPositionSave = useCallback((position) => {
    setForm(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        logo_position: position
      }
    }));
    setSuccessMessage("מיצוב הלוגו נשמר! 🎯");
    setTimeout(() => setSuccessMessage(""), 3000);
  }, []);

  const handleLogoSaved = useCallback((logoUrl) => {
    setForm(prev => {
      const updatedImages = [...(prev.images || [])];
      while (updatedImages.length < 2) {
        updatedImages.push(null);
      }
      updatedImages[1] = logoUrl;
      return { ...prev, images: updatedImages };
    });
    setSuccessMessage("הלוגו עודכן בהצלחה! ✨");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLogoEditorOpen(false);
  }, []);

  const uploadPreviewImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res?.data?.file_url || res?.file_url;
      if (url) {
        setForm(prev => ({ ...prev, preview_image: url }));
        setSuccessMessage("תמונת התצוגה הועלתה בהצלחה!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("לא התקבל URL עבור התמונה שהועלתה.");
      }
    } catch (error) {
      console.error("Error uploading preview image:", error);
      setError("שגיאה בהעלאת תמונת התצוגה: " + (error.message || ""));
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleFetchGooglePhotos = async () => {
    if (!businessPage) return;

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך לשאוב תמונות מ-Google Places עבור "${businessPage.business_name}"?\n\n` +
      'התמונות שנמצאו יתווספו לגלריית התמונות הקיימת.'
    );

    if (!confirmed) return;

    setLoadingGooglePhotos(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await base44.functions.invoke('fetchGooglePlacesImages', {
        businessName: businessPage.business_name,
        address: businessPage.address
      });

      const data = res?.data;

      if (!data?.ok) {
        setError(data?.error || 'שגיאה בשאיבת תמונות מ-Google Places');
        return;
      }

      const googlePhotos = data.photos || [];

      if (googlePhotos.length === 0) {
        setError('לא נמצאו תמונות עבור עסק זה ב-Google Places');
        return;
      }

      const currentImages = form.images || [];
      const newImages = [...currentImages, ...googlePhotos].slice(0, 30);

      setForm(prev => ({
        ...prev,
        images: newImages
      }));

      setSuccessMessage(
        `נוספו ${googlePhotos.length} תמונות מ-Google Places! ✨\n` +
        `סה"כ תמונות: ${newImages.length}/30`
      );

      setTimeout(() => setSuccessMessage(""), 5000);

    } catch (err) {
      console.error('Error fetching Google photos:', err);
      setError('שגיאה בשאיבת תמונות: ' + (err.message || ''));
    } finally {
      setLoadingGooglePhotos(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !businessPage) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      {user?.role === 'admin' && (
        <ImageGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          onImageGenerated={(imageUrl) => {
            setForm(prev => {
              const newImages = [...(prev.images || [])];
              newImages.push(imageUrl);
              return { ...prev, images: newImages };
            });
            setIsGeneratorOpen(false);
          }}
        />
      )}

      <Dialog open={isLogoEditorOpen} onOpenChange={setIsLogoEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">עריכת מיצוב הלוגו</DialogTitle>
            <p className="text-sm text-slate-600 mt-2">
              גרור את התמונה, זום בגלגלת העכבר, וגרור את הידיות הסגולות לשינוי גודל המסגרת
            </p>
          </DialogHeader>
          {editingLogoUrl && (
            <ImageZoomViewer
              initialImage={editingLogoUrl}
              onSaved={handleLogoSaved}
              height={600}
              frameSize={300}
              onPositionSave={handleLogoPositionSave}
              initialPosition={form.metadata?.logo_position}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = createPageUrl(`BusinessManage?id=${pageId}`)}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
                חזרה
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ניהול תמונות
                </h1>
                <p className="text-gray-500 mt-1">
                  {businessPage?.business_name || "טוען..."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>

          {successMessage && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-900">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-6">
          {/* תמונת תצוגה מיוחדת */}
          <Card className="p-6 bg-white/80 backdrop-blur border-slate-200 shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              תמונת תצוגה (Browse ודף נחיתה)
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              תמונה מיוחדת שתוצג בכרטיס העסק בדף העיון ובדף הנחיתה. אם לא תועלה, תוצג התמונה הראשית.
            </p>

            {form.preview_image ? (
              <div className="relative group">
                <img
                  src={form.preview_image}
                  alt="תמונת תצוגה"
                  className="w-full h-64 object-cover rounded-xl border-2 border-slate-200"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => document.getElementById('preview-image-input').click()}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    החלף
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setForm(prev => ({ ...prev, preview_image: "" }))}
                    className="bg-red-500/90 hover:bg-red-600"
                  >
                    הסר
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById('preview-image-input').click()}
                disabled={uploading}
                className="w-full h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-slate-400" />
                    <span className="text-sm text-slate-600">לחץ להעלאת תמונת תצוגה</span>
                  </>
                )}
              </button>
            )}

            <input
              id="preview-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  uploadPreviewImage(e.target.files[0]);
                }
              }}
            />
          </Card>

          {/* תמונות - עד 30 */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-bold text-slate-800">תמונות העסק</h3>
              <div className="flex flex-wrap gap-2">
                {user?.role === 'admin' && (
                  <Button
                    variant="outline"
                    onClick={() => setIsGeneratorOpen(true)}
                    className="gap-2"
                  >
                    <Wand2 className="w-4 h-4 text-purple-600" />
                    יצירת תמונה עם AI
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleFetchGooglePhotos}
                  disabled={loadingGooglePhotos}
                  className="gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200"
                >
                  {loadingGooglePhotos ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      שואב תמונות...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-blue-600" />
                      שאיבת תמונות מ-Google
                    </>
                  )}
                </Button>
              </div>
            </div>
            <InlineImageEditor
              images={form.images || []}
              onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))}
              maxImages={30}
              onEditLogo={handleEditLogo}
            />
          </Card>
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> שומר...</>
            ) : (
              <><Save className="w-4 h-4 ml-2" /> שמור שינויים</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = createPageUrl(`BusinessManage?id=${pageId}`)}
          >
            ביטול
          </Button>
        </div>
      </div>
    </div>
  );
}
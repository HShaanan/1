import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, Camera, Sparkles, Eye, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * SmartImageGenerator - מחולל תמונות חכם עם מיצוב מקצועי
 * משתמש במנוע AI לבניית פרומפטים מתקדמים
 */
export default function SmartImageGenerator({ 
  isOpen, 
  onClose, 
  onImageGenerated, // callback(imageUrl)
  defaultType = "product",
  title = "יצירת תמונה חכמה"
}) {
  const [description, setDescription] = useState("");
  const [imageType, setImageType] = useState(defaultType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const [masterPrompt, setMasterPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const imageTypes = [
    { value: "logo", label: "לוגו עסק", icon: "🏢" },
    { value: "kashrut_logo", label: "לוגו כשרות", icon: "✡️" },
    { value: "product", label: "מוצר/מנה", icon: "🍽️" },
    { value: "hero", label: "תמונה ראשית", icon: "🎬" },
    { value: "interior", label: "פנים העסק", icon: "🏪" }
  ];

  const resetState = () => {
    setDescription("");
    setImageType(defaultType);
    setShowBlueprint(false);
    setBlueprint(null);
    setMasterPrompt("");
    setGeneratedImageUrl(null);
    setError("");
    setCopied(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const generatePrompt = async () => {
    if (!description.trim()) {
      setError("אנא הזן תיאור לתמונה");
      return;
    }

    setIsGenerating(true);
    setError("");
    setShowBlueprint(true);

    try {
      const result = await base44.functions.invoke('generateSmartImagePrompt', {
        description: description.trim(),
        image_type: imageType
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Failed to generate prompt');
      }

      setBlueprint(result.data.visual_blueprint);
      setMasterPrompt(result.data.master_prompt);
    } catch (err) {
      console.error("Prompt generation error:", err);
      setError("שגיאה ביצירת הפרומפט: " + err.message);
      setShowBlueprint(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!masterPrompt) {
      setError("אין פרומפט להפעלה");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: masterPrompt
      });

      const imageUrl = result?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      setGeneratedImageUrl(imageUrl);
      
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
    } catch (err) {
      console.error("Image generation error:", err);
      setError("שגיאה ביצירת התמונה: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="w-6 h-6 text-purple-600" />
            {title}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            מנוע AI מתקדם עם מיצוב מקצועי וקומפוזיציה חכמה
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1: Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">סוג התמונה</label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">תיאור התמונה</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="לדוגמה: לוגו כשרות של הרבנות הראשית לישראל עם טקסט בעברית"
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={generatePrompt}
              disabled={isGenerating || !description.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייצר פרומפט חכם...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור פרומפט מקצועי
                </>
              )}
            </Button>
          </div>

          {/* Step 2: Blueprint Preview */}
          {showBlueprint && blueprint && (
            <div className="space-y-4 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  תכנית חזותית
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  AI Blueprint
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-semibold text-blue-900 mb-2">📐 קומפוזיציה</div>
                  <p className="text-slate-700">{blueprint.composition_style}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-semibold text-blue-900 mb-2">📹 זווית מצלמה</div>
                  <p className="text-slate-700">{blueprint.spatial_positioning.camera_angle}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-semibold text-blue-900 mb-2">🎯 עומק שדה</div>
                  <p className="text-slate-700">{blueprint.spatial_positioning.depth_of_field}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="font-semibold text-blue-900 mb-2">💡 תאורה</div>
                  <p className="text-slate-700">{blueprint.lighting_map}</p>
                </div>
              </div>

              {/* Master Prompt Display */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-blue-900">🎨 פרומפט מקצועי</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyPrompt}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        העתק
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border max-h-32 overflow-y-auto font-mono">
                  {masterPrompt}
                </div>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מייצר תמונה... (5-10 שניות)
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 ml-2" />
                    צור תמונה מהפרומפט
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Generated Image */}
          {generatedImageUrl && (
            <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                תמונה נוצרה בהצלחה!
              </h3>
              
              <div className="bg-white p-4 rounded-lg border">
                <img 
                  src={generatedImageUrl} 
                  alt="תמונה שנוצרה"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  סיום - השתמש בתמונה
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedImageUrl(null);
                    setShowBlueprint(false);
                    setMasterPrompt("");
                    setBlueprint(null);
                  }}
                  variant="outline"
                >
                  נסה שוב
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
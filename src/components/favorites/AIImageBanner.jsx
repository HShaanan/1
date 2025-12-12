import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Wand2, Download } from "lucide-react";
import ImageGeneratorModal from "@/components/ImageGeneratorModal";

function buildPromptFromFavorites(listings = [], categoriesMap = {}) {
  const cats = listings
    .map(l => categoriesMap[l.category_id]?.name)
    .filter(Boolean);

  const topCats = Array.from(new Set(cats)).slice(0, 6).join(", ");

  return `צור/י באנר קולאז' מודרני, נקי וצנוע עבור רשימת המועדפים שלי בקטגוריות: ${topCats}.
סגנון: רקעים בהירים, אייקונים נקיים ומינימליסטיים, ללא טקסט על גבי התמונה, מותאם ל-RTL ולקהל הדתי/חרדי.`;
}

export default function AIImageBanner({ listings = [], categoriesMap = {} }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);

  const initialPrompt = buildPromptFromFavorites(listings, categoriesMap);

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = "favorites-banner.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          יצירת באנר AI לשיתוף
        </CardTitle>
        <Button onClick={() => setOpen(true)} className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
          <Wand2 className="w-4 h-4 ml-2" />
          צור באנר
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          צרו תמונת קולאז' נקייה ומכבדת לשיתוף המועדפים שלכם – מותאם אוטומטית ל-RTL.
        </p>

        {image && (
          <div className="space-y-2">
            <img src={image} alt="AI banner" className="w-full rounded-lg border object-contain max-h-96" />
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleDownload} className="rounded-lg">
                <Download className="w-4 h-4 ml-2" />
                הורד/י תמונה
              </Button>
            </div>
          </div>
        )}

        <ImageGeneratorModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onImageGenerated={(dataUrl) => setImage(dataUrl)}
          initialPrompt={initialPrompt}
        />
      </CardContent>
    </Card>
  );
}
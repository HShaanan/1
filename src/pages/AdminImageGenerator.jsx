
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { googleAiImageGenerate } from "@/functions/googleAiImageGenerate"; // החלפה ל-googleAiImageGenerate
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon, Sparkles, Loader2, CheckCircle, 
  XCircle, AlertTriangle, Wand2, Zap, Download, 
  PlayCircle
} from "lucide-react";

export default function AdminImageGeneratorPage() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories();
    }
  }, [selectedCategory]);

  const checkAdminAccess = async () => {
    try {
      const userData = await User.me().catch(() => null);
      if (!userData) {
        await User.loginWithRedirect(window.location.href);
        return;
      }

      if (userData.role !== 'admin') {
        setError("אין לך הרשאות גישה לעמוד זה");
        return;
      }

      setUser(userData);
      await loadCategories();
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await Category.list("sort_order");
      const mainCategories = categoriesData.filter(cat => !cat.parent_id && cat.is_active);
      setCategories(mainCategories);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("שגיאה בטעינת הקטגוריות");
    }
  };

  const loadSubcategories = async () => {
    try {
      const categoriesData = await Category.list("sort_order");
      const subs = categoriesData.filter(cat => 
        cat.parent_id === selectedCategory && cat.is_active
      );
      setSubcategories(subs);
      setSelectedSubcategory(""); // איפוס בחירת תת-קטגוריה
    } catch (err) {
      console.error("Error loading subcategories:", err);
      setError("שגיאה בטעינת תתי הקטגוריות");
    }
  };

  const createSimplePrompt = (subcategory, category) => {
    return `Create a professional marketing image for ${subcategory} in ${category} category. 
    Show only men, no women. Orthodox Jewish professional in business attire. 
    Clean, modern design. No text in image. High quality for website use.`;
  };

  const handleSingleGeneration = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      setError("יש לבחור קטגוריה ותת-קטגוריה");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");
    setGeneratedImage(null);

    try {
      const categoryData = categories.find(c => c.id === selectedCategory);
      const subcategoryData = subcategories.find(s => s.id === selectedSubcategory);

      console.log('[AdminImageGenerator] Calling googleAiImageGenerate with:', {
        subcategoryName: subcategoryData.name,
        categoryName: categoryData.name
      });

      const prompt = createSimplePrompt(subcategoryData.name, categoryData.name);
      const { data } = await googleAiImageGenerate({
        prompt,
        aspect_ratio: "1:1",
        number_of_images: 1,
        mime_type: "image/png"
      });

      if (data?.ok && data?.data_url) {
        setGeneratedImage({
          url: data.data_url,
          subcategory: subcategoryData.name,
          category: categoryData.name
        });
        setSuccess(`תמונה נוצרה בהצלחה עבור "${subcategoryData.name}"`);
      } else {
        throw new Error(data?.error || "לא התקבלה תמונה מ-Gemini");
      }
    } catch (err) {
      console.error("Error generating single image:", err);
      setError(`שגיאה ביצירת התמונה: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGeneration = async () => {
    setIsBatchGenerating(true);
    setError("");
    setSuccess("");
    setBatchResults([]);
    setProgress(0);

    const professionalSubcategories = [
      'רופא', 'רופא שיניים', 'עורך דין', 'רואה חשבון',
      'אדריכל', 'מהנדס', 'פסיכולוג', 'פיזיותרפיסט',
      'נטורופת', 'מעצב פנים', 'מורה פרטי', 'רפאי'
    ];

    try {
      const results = [];
      let completed = 0;

      for (const subcategory of professionalSubcategories) {
        try {
          console.log(`Generating image for ${subcategory}...`);

          const prompt = createSimplePrompt(subcategory, 'אנשי מקצוע');
          const { data } = await googleAiImageGenerate({
            prompt,
            aspect_ratio: "1:1",
            number_of_images: 1,
            mime_type: "image/png"
          });
          
          if (data?.ok && data?.data_url) {
            results.push({
              subcategory,
              success: true,
              imageUrl: data.data_url
            });
          } else {
            results.push({
              subcategory,
              success: false,
              error: data?.error || "לא התקבלה תמונה"
            });
          }
        } catch (error) {
          console.error(`Error generating image for ${subcategory}:`, error);
          results.push({
            subcategory,
            success: false,
            error: error.message
          });
        }

        completed++;
        setProgress((completed / professionalSubcategories.length) * 100);
        setBatchResults([...results]);

        // המתנה קצרה בין תמונות כדי לא לחרוג מ-rate limits
        if (completed < professionalSubcategories.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // דיליי עדין למניעת רייט-לימיט
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      setSuccess(`יצירת תמונות בבאצ' הושלמה: ${successful} הצליחו, ${failed} נכשלו`);

    } catch (err) {
      console.error("Error in batch generation:", err);
      setError(`שגיאה ביצירת תמונות בבאצ': ${err.message}`);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <p className="text-gray-600">טוען מחולל תמונות AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              מחולל תמונות AI
            </h1>
            <p className="text-gray-600">יצירת תמונות שיווקיות מותאמות לציבור החרדי</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              תמונה יחידה
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              יצירה בבאצ'
            </TabsTrigger>
          </TabsList>

          {/* Single Image Generation */}
          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  יצירת תמונה יחידה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      בחר קטגוריה
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      בחר תת-קטגוריה
                    </label>
                    <Select 
                      value={selectedSubcategory} 
                      onValueChange={setSelectedSubcategory}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר תת-קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map(subcategory => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            <div className="flex items-center gap-2">
                              {subcategory.icon && <span className="text-base">{subcategory.icon}</span>}
                              <span>{subcategory.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSingleGeneration}
                  disabled={isGenerating || !selectedCategory || !selectedSubcategory}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      יוצר תמונה... (עד 30 שניות)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      צור תמונה
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        תמונה שנוצרה עבור: {generatedImage.subcategory}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(generatedImage.url, `${generatedImage.subcategory}-image`)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        הורד
                      </Button>
                    </div>
                    <img
                      src={generatedImage.url}
                      alt={`תמונה עבור ${generatedImage.subcategory}`}
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Generation */}
          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  יצירה בבאצ' - אנשי מקצוע
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">מה כלול בבאצ':</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm text-indigo-700">
                    {['רופא', 'רופא שיניים', 'עורך דין', 'רואה חשבון', 'אדריכל', 'מהנדס', 'פסיכולוג', 'פיזיותרפיסט', 'נטורופת', 'מעצב פנים', 'מורה פרטי', 'רפאי'].map(profession => (
                      <div key={profession} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {profession}
                      </div>
                    ))}
                  </div>
                </div>

                {isBatchGenerating && (
                  <div className="space-y-3">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-600 text-center">
                      יוצר תמונות... זה עלול לקחת כמה דקות
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleBatchGeneration}
                  disabled={isBatchGenerating}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {isBatchGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      יוצר 12 תמונות בבאצ'... (כמה דקות)
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 mr-2" />
                      צור כל התמונות של אנשי מקצוע
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {batchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">תוצאות יצירה בבאצ':</h3>
                <div className="grid gap-4">
                  {batchResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">{result.subcategory}</span>
                        {!result.success && result.error && (
                          <Badge variant="destructive" className="text-xs">
                            {result.error}
                          </Badge>
                        )}
                      </div>
                      {result.success && result.imageUrl && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(result.imageUrl, `${result.subcategory}-batch`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <img
                            src={result.imageUrl}
                            alt={result.subcategory}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

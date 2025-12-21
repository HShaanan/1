import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { UploadFile, GenerateImage } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Settings, Plus, Trash2, Save, AlertTriangle, Edit,
  Tag, ArrowUp, ArrowDown, Check, X, ChevronDown, ChevronRight,
  Upload, Image as ImageIcon, Maximize, Square, Camera, Wand2
} from "lucide-react";
import IconPicker from "@/components/IconPicker";
import ImageCropper from "@/components/ImageCropper";
import ImageGeneratorModal from "@/components/ImageGeneratorModal";
import { buildProfessionalsGroups } from "@/components/explore/ProfessionalsGrouping";

export default function AdminCategoriesPage() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState(null);
  const [iconPickerCategory, setIconPickerCategory] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // מצבים חדשים עבור חלון יצירת התמונה
  const [showImageGeneratorModal, setShowImageGeneratorModal] = useState(false);
  const [imageGeneratorTarget, setImageGeneratorTarget] = useState(null);
  const [imageGeneratorInitialPrompt, setImageGeneratorInitialPrompt] = useState("");

  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);

  // הוספת מצב לטעינת יצירת תמונות (retained, though bulk generation removed)
  const [isGenerating, setIsGenerating] = useState(false);

  // NEW: add state to add sub-subcategory inline
  const [addingSubSubTo, setAddingSubSubTo] = useState(null);

  // NEW: add state for professionals reset operation
  const [isResetting, setIsResetting] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "🏪",
    image: "",
    parent_id: "",
    color: "#22d3ee",
    is_active: true,
    sort_order: 0
  });

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await Category.list("sort_order");
      console.log("Loaded categories from server:", categoriesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("שגיאה בטעינת הקטגוריות");
    }
  }, []);

  const checkAdminAccess = useCallback(async () => {
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
  }, [loadCategories]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  // helper: מחיקה בטוחה שמתעלמת מאובייקט שלא נמצא
  const safeDelete = async (id) => {
    try {
      await Category.delete(id);
    } catch (e) {
      const msg = (e && (e.message || e.error || JSON.stringify(e))) || "";
      // Check for "not found" errors in various formats
      if (!/not found|ObjectNotFound/i.test(msg)) {
        throw e;
      }
      // ignore not-found errors
      console.debug("safeDelete: object not found (ignored)", id);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim() || (!newCategory.icon.trim() && !newCategory.image.trim())) {
      setError("נא למלא את כל השדות הנדרשים (שם וגם אייקון/תמונה)");
      return;
    }

    try {
      console.log("Creating category with data:", {
        ...newCategory,
        parent_id: newCategory.parent_id || null,
        icon: newCategory.image ? "" : newCategory.icon,
        image: newCategory.image || "",
      });

      await Category.create({
        ...newCategory,
        parent_id: newCategory.parent_id || null,
        icon: newCategory.image ? "" : newCategory.icon,
        image: newCategory.image || "",
      });

      setNewCategory({
        name: "",
        icon: "🏪",
        image: "",
        parent_id: "",
        color: "#22d3ee",
        is_active: true,
        sort_order: 0
      });
      setSuccess("הקטגוריה נוספה בהצלחה");
      await loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating category:", err);
      setError("שגיאה בהוספת הקטגוריה: " + (err.message || err));
    }
  };

  const handleEditCategory = async (category) => {
    if (!category.name.trim() || (!category.icon.trim() && !category.image.trim())) {
      setError("נא למלא את כל השדות הנדרשים (שם וגם אייקון/תמונה)");
      return;
    }

    try {
      console.log("Updating category with data:", {
        ...category,
        parent_id: category.parent_id || null,
        icon: category.image ? "" : category.icon,
        image: category.image || "",
      });

      await Category.update(category.id, {
        ...category,
        parent_id: category.parent_id || null,
        icon: category.image ? "" : category.icon,
        image: category.image || "",
      });

      setEditingCategory(null);
      setSuccess("הקטגוריה עודכנה בהצלחה");
      await loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating category:", err);
      setError("שגיאה בעדכון הקטגוריה: " + (err.message || err));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו? פעולה זו תמחק גם את כל תת-הקטגוריות שלה.")) {
      try {
        // רענון קטגוריות טריות למניעת מזהים ישנים
        const fresh = await Category.list("sort_order");
        const subs = fresh.filter(cat => cat.parent_id === categoryId);

        // מחיקה בטוחה של תת־תת
        for (const sub of subs) {
          const subSubs = fresh.filter(cat => cat.parent_id === sub.id);
          for (const s2 of subSubs) {
            await safeDelete(s2.id);
          }
          await safeDelete(sub.id);
        }

        await safeDelete(categoryId);

        setSuccess("הקטגוריה נמחקה בהצלחה");
        await loadCategories();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("שגיאה במחיקת הקטגוריה");
      }
    }
  };

  const handleToggleActive = async (categoryId, isActive) => {
    try {
      await Category.update(categoryId, { is_active: isActive });
      await loadCategories();
    } catch (err) {
      setError("שגיאה בעדכון סטטוס הקטגוריה");
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddSubcategory = (parentId) => {
    setNewCategory({
      name: "",
      icon: "🏪",
      image: "",
      parent_id: parentId,
      color: "#22d3ee",
      is_active: true,
      sort_order: 0
    });
    setAddingSubcategoryTo(parentId);
    setExpandedCategories(prev => new Set([...prev, parentId]));
  };

  const handleCancelAddSubcategory = () => {
    setAddingSubcategoryTo(null);
    setNewCategory({
      name: "",
      icon: "🏪",
      image: "",
      parent_id: "",
      color: "#22d3ee",
      is_active: true,
      sort_order: 0
    });
  };

  const handleSaveNewSubcategory = async () => {
    if (!newCategory.name.trim() || (!newCategory.icon.trim() && !newCategory.image.trim())) {
      setError("נא למלא את כל השדות הנדרשים (שם וגם אייקון/תמונה)");
      return;
    }

    try {
      await Category.create({
        ...newCategory,
        icon: newCategory.image ? "" : newCategory.icon,
        image: newCategory.image || "",
      });
      setAddingSubcategoryTo(null);
      setNewCategory({
        name: "",
        icon: "🏪",
        image: "",
        parent_id: "",
        color: "#22d3ee",
        is_active: true,
        sort_order: 0
      });
      setSuccess("תת-הקטגוריה נוספה בהצלחה");
      await loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("שגיאה בהוספת תת-הקטגוריה");
    }
  };

  // NEW: add sub-subcategory handlers (reusing newCategory for form state)
  const handleAddSubSubcategory = (parentSubId) => {
    setNewCategory({
      name: "",
      icon: "✨",
      image: "",
      parent_id: parentSubId,
      color: "#a78bfa",
      is_active: true,
      sort_order: 0
    });
    setAddingSubSubTo(parentSubId);
  };

  const handleCancelAddSubSubcategory = () => {
    setAddingSubSubTo(null);
    setNewCategory({
      name: "",
      icon: "🏪",
      image: "",
      parent_id: "",
      color: "#22d3ee",
      is_active: true,
      sort_order: 0
    });
  };

  const handleSaveNewSubSubcategory = async () => {
    if (!newCategory.name.trim() || (!newCategory.icon.trim() && !newCategory.image.trim())) {
      setError("נא למלא שם וגם אייקון/תמונה");
      return;
    }
    try {
      await Category.create({
        ...newCategory,
        icon: newCategory.image ? "" : newCategory.icon,
        image: newCategory.image || "",
      });
      setAddingSubSubTo(null);
      setNewCategory({
        name: "",
        icon: "🏪",
        image: "",
        parent_id: "",
        color: "#22d3ee",
        is_active: true,
        sort_order: 0
      });
      setSuccess("תת־תת־קטגוריה נוספה בהצלחה");
      await loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("שגיאה בהוספת תת־תת־קטגוריה");
    }
  };


  const openImageGenerator = (target, categoryData) => {
    const categoryName = categoryData.name;
    const prompt = categoryName && categoryName !== "שם הקטגוריה"
      ? `לוגו או אייקון מקצועי, נקי וברור עבור קטגוריה בשם '${categoryName}', מתאים לאתר קהילתי חרדי, ללא דמויות אנשים`
      : `לוגו מקצועי לאתר קהילתי, סגנון נקי ומודרני, ללא דמויות אנשים`;
    setImageGeneratorInitialPrompt(prompt);
    setImageGeneratorTarget(target);
    setShowImageGeneratorModal(true);
  };

  const handleImageGenerated = (imageUrl) => {
    if (imageGeneratorTarget === 'new' || imageGeneratorTarget === 'subcategory') {
      setNewCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
    } else if (imageGeneratorTarget === 'editing') {
      setEditingCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
    }
    setShowImageGeneratorModal(false);
  };


  const handleImageUpload = async (file, target) => {
    if (!file) return;

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      const result = await UploadFile({ file });
      const imageUrl = result.file_url;

      if (target === 'new' || target === 'subcategory') {
        setNewCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
      } else if (target === 'editing') {
        setEditingCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
      }

      setSuccess("התמונה הועלתה בהצלחה");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("שגיאה בהעלאת התמונה: " + (err.message || err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenImageCropper = (imageUrl, target) => {
    setImageToCrop(imageUrl);
    setCropTarget(target);
    setShowImageCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob) => {
    try {
      setUploadingImage(true);

      // Convert blob to file
      const file = new File([croppedImageBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // Upload the cropped image
      const result = await UploadFile({ file });
      const imageUrl = result.file_url;

      if (cropTarget === 'new' || cropTarget === 'subcategory') {
        setNewCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
      } else if (cropTarget === 'editing') {
        setEditingCategory(prev => ({ ...prev, image: imageUrl, icon: "" }));
      }

      setSuccess("התמונה נחתכה והועלתה בהצלחה");
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("Error uploading cropped image:", err);
      setError("שגיאה בהעלאת התמונה החתוכה: " + (err.message || err));
    } finally {
      setUploadingImage(false);
      setShowImageCropper(false);
      setImageToCrop(null);
      setCropTarget(null);
    }
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setImageToCrop(null);
    setCropTarget(null);
  };

  const handleRemoveImage = (target) => {
    if (target === 'new' || target === 'subcategory') {
      setNewCategory(prev => ({ ...prev, image: "", icon: "🏪" }));
    } else if (target === 'editing') {
      setEditingCategory(prev => ({ ...prev, image: "", icon: "🏪" }));
    }
  };

  const handleIconSelect = (icon) => {
    if (iconPickerTarget === 'new') {
      setNewCategory({ ...newCategory, icon, image: "" });
    } else if (iconPickerTarget === 'editing') {
      setEditingCategory({ ...editingCategory, icon, image: "" });
    } else if (iconPickerTarget === 'subcategory') { // This handles both sub and sub-sub in newCategory state
      setNewCategory({ ...newCategory, icon, image: "" });
    }
    setShowIconPicker(false);
    setIconPickerTarget(null);
    setIconPickerCategory(null);
  };

  const openIconPicker = (target, category = null) => {
    setIconPickerTarget(target);
    setIconPickerCategory(category);
    setShowIconPicker(true);
  };

  const getMainCategories = () => categories.filter(cat => !cat.parent_id);
  const getSubCategories = (parentId) => categories.filter(cat => cat.parent_id === parentId);

  const professionalsMain = React.useMemo(() => {
    return categories.find(c => !c.parent_id && /אנשי\s*מקצוע|אישי מקצוע/.test(c.name));
  }, [categories]);

  const professionalsGroups = React.useMemo(() => {
    if (!professionalsMain) return [];
    return buildProfessionalsGroups(categories, professionalsMain.id);
  }, [categories, professionalsMain]);

  // NEW: Reset professionals structure (delete all current subs + create 25 new subs)
  const resetProfessionalsStructure = async () => {
    try {
      if (isResetting) return; // Prevent multiple clicks
      setIsResetting(true);
      setError("");
      setSuccess("");

      // רענון רשימה טרייה לפני חישובים ומחיקות
      const freshCategories = await Category.list("sort_order");

      // identify "אנשי מקצוע"
      const prosMain = freshCategories.find(c => !c.parent_id && /אנשי\s*מקצוע|אישי מקצוע/.test(c.name));
      if (!prosMain) {
        setError("לא נמצאה קטגוריית 'אנשי מקצוע'.");
        setIsResetting(false);
        return;
      }

      const ok = window.confirm("אזהרה: פעולה זו תמחק את כל תתי־הקטגוריות (והתתי־תת) תחת 'אנשי מקצוע' ותיצור מבנה חדש. האם להמשיך?");
      if (!ok) {
        setIsResetting(false);
        return;
      }

      // gather all current subs under professionals
      const subs = freshCategories.filter(c => c.parent_id === prosMain.id);

      // delete sub-sub first (בטוח)
      for (const sub of subs) {
        const subsubs = freshCategories.filter(c => c.parent_id === sub.id);
        for (const s2 of subsubs) {
          await safeDelete(s2.id);
        }
      }
      // delete subs (בטוח)
      for (const sub of subs) {
        await safeDelete(sub.id);
      }

      // mapping for the 25 requested subs
      const newSubs = [
        { name: "בריאות ורפואה", icon: "🩺", color: "#22c55e" },
        { name: "חינוך והוראה", icon: "📚", color: "#60a5fa" },
        { name: "משפט ועסקים", icon: "⚖️", color: "#f59e0b" },
        { name: "בנייה ותחזוקה", icon: "🏗️", color: "#f97316" },
        { name: "רכב ותיקונים", icon: "🚗", color: "#ef4444" },
        { name: "יופי וטיפוח", icon: "💄", color: "#ec4899" },
        { name: "טכנולוגיה ומחשבים", icon: "💻", color: "#3b82f6" },
        { name: "שירותי בית", icon: "🏠", color: "#22d3ee" },
        { name: "מזון וקייטרינג", icon: "🍽️", color: "#84cc16" },
        { name: "בגדים ואופנה", icon: "👗", color: "#a855f7" },
        { name: "נדל\"ן ובנייה", icon: "🏢", color: "#0891b2" },
        { name: "הובלה ומשלוחים", icon: "🚚", color: "#06b6d4" },
        { name: "אמנות ועיצוב", icon: "🎨", color: "#f43f5e" },
        { name: "ספורט ופנאי", icon: "🏃", color: "#10b981" },
        { name: "חקלאות ובעלי חיים", icon: "🐾", color: "#16a34a" },
        { name: "תעשייה וייצור", icon: "🏭", color: "#64748b" },
        { name: "תחבורה ונהיגה", icon: "🚌", color: "#0ea5e9" },
        { name: "כספים וביטוח", icon: "💼", color: "#fb923c" },
        { name: "תקשורת ומדיה", icon: "🗞️", color: "#94a3b8" },
        { name: "שירותי דת", icon: "✡️", color: "#7c3aed" },
        { name: "אבטחה ובטיחות", icon: "🛡️", color: "#ef4444" },
        { name: "שירותים אישיים", icon: "🤝", color: "#06b6d4" },
        { name: "סביבה וניקיון", icon: "♻️", color: "#22c55e" },
        { name: "מכירות ושיווק", icon: "📈", color: "#f59e0b" },
        { name: "מדע ומחקר", icon: "🔬", color: "#6366f1" },
      ];

      // יצירה מרוכזת + סדר תצוגה
      let order = 1;
      const payload = newSubs.map(sub => ({
        name: sub.name,
        icon: sub.icon,
        image: "",
        parent_id: prosMain.id,
        color: sub.color,
        is_active: true,
        sort_order: order++
      }));

      // Check if bulkCreate method exists, otherwise fallback to individual creates
      if (Category.bulkCreate) {
        await Category.bulkCreate(payload);
      } else {
        for (const rec of payload) {
          await Category.create(rec);
        }
      }

      await loadCategories();
      setSuccess("מבנה 'אנשי מקצוע' אופס ונוצרו 25 תתי־קטגוריות חדשות.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError("שגיאה באיפוס מבנה 'אנשי מקצוע'");
    } finally {
      setIsResetting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <p className="text-gray-600">טוען קטגוריות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Tag className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-purple-600 to-pink-500 bg-clip-text text-transparent">
              ניהול קטגוריות
            </h1>
            <p className="text-gray-600">נהל קטגוריות ותת-קטגוריות של המודעות</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              ניהול קטגוריות
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הוספת קטגוריה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            {/* NEW: Professionals reset card */}
            {professionalsMain && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                    איפוס מבנה "אנשי מקצוע"
                  </CardTitle>
                  <Button
                    variant="destructive"
                    onClick={resetProfessionalsStructure}
                    className="bg-red-600 hover:bg-red-700"
                    title="מוחק את כל התתי־קטגוריות תחת 'אנשי מקצוע' ויוצר 25 חדשות"
                    disabled={isResetting}
                  >
                    {isResetting ? "מבצע איפוס..." : "איפוס אנשי מקצוע"}
                  </Button>
                </CardHeader>
                <CardContent className="text-amber-900">
                  פעולה זו תמחק את כל התתי־קטגוריות (וגם תתי־תת במקרה שקיימות) תחת "אנשי מקצוע" ותיצור 25 חדשות לפי המבנה שהגדרת. מומלץ לבצע רק אם אין נתונים תלויים.
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  קטגוריות וקטגוריות משנה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getMainCategories().map((category) => {
                    const subcategories = getSubCategories(category.id);
                    const isExpanded = expandedCategories.has(category.id);
                    const isEditing = editingCategory?.id === category.id;
                    const isAddingSubcat = addingSubcategoryTo === category.id;

                    return (
                      <div key={category.id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {(subcategories.length > 0 || isAddingSubcat) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCategoryExpansion(category.id)}
                                className="p-1"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            )}

                            {isEditing ? (
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex flex-col gap-2">
                                  {editingCategory.image ? (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                      <img
                                        src={editingCategory.image}
                                        alt="קטגוריה"
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={() => handleRemoveImage('editing')}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        title="הסר תמונה"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      <Input
                                        value={editingCategory.icon}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                        className="w-14 text-center"
                                        placeholder="🏪"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openIconPicker('editing')}
                                        className="px-2 hover:bg-cyan-50"
                                        title="בחר אייקון"
                                      >
                                        <span className="text-sm">🎨</span>
                                      </Button>
                                    </div>
                                  )}
                                  <div className="flex gap-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(e.target.files[0], 'editing')}
                                      className="hidden"
                                      id={`image-upload-edit-${category.id}`}
                                    />
                                    <label
                                      htmlFor={`image-upload-edit-${category.id}`}
                                      className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                    >
                                      {uploadingImage ? (
                                        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                      ) : (
                                        <Upload className="w-3 h-3" />
                                      )}
                                      {editingCategory.image ? 'החלף תמונה' : 'העלה תמונה'}
                                    </label>

                                    {/* כפתור יצירת תמונה חדש */}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openImageGenerator('editing', editingCategory)}
                                      disabled={uploadingImage}
                                      className="px-2 text-xs hover:bg-purple-50 border-purple-200"
                                      title="יצור תמונה באמצעות AI"
                                    >
                                      {uploadingImage ? (
                                        <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin"></div>
                                      ) : (
                                        <Wand2 className="w-3 h-3" />
                                      )}
                                    </Button>

                                    {editingCategory.image && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenImageCropper(editingCategory.image, 'editing')}
                                        className="px-2 text-xs hover:bg-blue-50"
                                        title="חתוך תמונה"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  className="flex-1"
                                  placeholder="שם קטגוריה"
                                />
                                <Input
                                  type="color"
                                  value={editingCategory.color}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                  className="w-16"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                  {category.image ? (
                                    <img
                                      src={category.image}
                                      alt={category.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-2xl">{category.icon}</span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg" style={{ color: category.color }}>
                                    {category.name}
                                  </h3>
                                  {subcategories.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {subcategories.length} תת-קטגוריות
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!category.is_active && (
                              <Badge variant="destructive" className="text-xs">לא פעיל</Badge>
                            )}

                            {!isEditing && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddSubcategory(category.id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                title="הוסף תת-קטגוריה"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}

                            <Switch
                              checked={category.is_active}
                              onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                            />

                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditCategory(editingCategory)}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCategory(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isExpanded && (subcategories.length > 0 || isAddingSubcat) && (
                          <div className="mt-4 mr-8 space-y-2">
                            {subcategories.map((subcategory) => {
                              const isEditingSubcat = editingCategory?.id === subcategory.id;
                              const subSubcategories = getSubCategories(subcategory.id); // Get sub-sub-categories

                              return (
                                <div key={subcategory.id} className="p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    {/* LEFT: subcategory display/edit */}
                                    <div className="flex items-center gap-3 flex-1">
                                      {isEditingSubcat ? (
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="flex flex-col gap-1">
                                            {editingCategory.image ? (
                                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                                                <img
                                                  src={editingCategory.image}
                                                  alt="תת קטגוריה"
                                                  className="w-full h-full object-cover"
                                                />
                                                <button
                                                  onClick={() => handleRemoveImage('editing')}
                                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                                  title="הסר תמונה"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex gap-1">
                                                <Input
                                                  value={editingCategory.icon}
                                                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                                  className="w-12 text-center"
                                                  placeholder="🍕"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => openIconPicker('editing')}
                                                  className="px-1 text-xs hover:bg-cyan-50"
                                                  title="בחר אייקון"
                                                >
                                                  🎨
                                                </Button>
                                              </div>
                                            )}
                                            <div className="flex gap-1">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'editing')}
                                                className="hidden"
                                                id={`image-upload-edit-sub-${subcategory.id}`}
                                              />
                                              <label
                                                htmlFor={`image-upload-edit-sub-${subcategory.id}`}
                                                className="cursor-pointer inline-flex items-center gap-1 px-1 py-0.5 text-xs border rounded hover:bg-gray-50"
                                                title="העלה תמונה"
                                              >
                                                {uploadingImage ? (
                                                  <div className="w-2 h-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                                ) : (
                                                  <Upload className="w-3 h-3" />
                                                )}
                                              </label>

                                              {/* כפתור יצירת תמונה לתת-קטגוריה */}
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openImageGenerator('editing', editingCategory)}
                                                disabled={uploadingImage}
                                                className="px-1 text-xs hover:bg-purple-50 border-purple-200"
                                                title="יצור תמונה באמצעות AI"
                                              >
                                                {uploadingImage ? (
                                                  <div className="w-2 h-2 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin"></div>
                                                ) : (
                                                  <Wand2 className="w-2 h-2" />
                                                )}
                                              </Button>

                                              {editingCategory.image && (
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleOpenImageCropper(editingCategory.image, 'editing')}
                                                  className="px-1 text-xs hover:bg-blue-50"
                                                  title="חתוך תמונה"
                                                >
                                                  <Edit className="w-2 h-2" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <Input
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            className="flex-1"
                                            placeholder="שם תת-קטגוריה"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {subcategory.image ? (
                                              <img
                                                src={subcategory.image}
                                                alt={subcategory.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-lg">{subcategory.icon}</span>
                                            )}
                                          </div>
                                          <span className="font-medium" style={{ color: subcategory.color }}>
                                            {subcategory.name}
                                          </span>
                                          {subSubcategories.length > 0 && (
                                            <Badge variant="secondary" className="text-xs ml-2">
                                              {subSubcategories.length} תתי־תת
                                            </Badge>
                                          )}
                                          {!subcategory.is_active && (
                                            <Badge variant="secondary" className="text-xs">לא פעיל</Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* RIGHT: actions */}
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={subcategory.is_active}
                                        onCheckedChange={(checked) => handleToggleActive(subcategory.id, checked)}
                                        className="scale-75"
                                      />

                                      {/* NEW: add sub-subcategory button for 'אנשי מקצוע' */}
                                      {professionalsMain && subcategory.parent_id === professionalsMain.id && !isEditingSubcat && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAddSubSubcategory(subcategory.id)}
                                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                          title="הוסף תת־תת־קטגוריה"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      )}

                                      {isEditingSubcat ? (
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            onClick={() => handleEditCategory(editingCategory)}
                                            className="bg-green-500 hover:bg-green-600 text-white p-1"
                                          >
                                            <Check className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingCategory(null)}
                                            className="p-1"
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingCategory(subcategory)}
                                            className="p-1"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteCategory(subcategory.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Render sub-subcategories */}
                                  {subSubcategories.length > 0 && (
                                    <div className="mt-2 mr-6 space-y-2">
                                      {subSubcategories.map((subSubcategory) => {
                                        const isEditingSubSubcat = editingCategory?.id === subSubcategory.id;
                                        return (
                                          <div key={subSubcategory.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                            {isEditingSubSubcat ? (
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="flex flex-col gap-1">
                                                  {editingCategory.image ? (
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border">
                                                      <img
                                                        src={editingCategory.image}
                                                        alt="תת תת קטגוריה"
                                                        className="w-full h-full object-cover"
                                                      />
                                                      <button
                                                        onClick={() => handleRemoveImage('editing')}
                                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                                        title="הסר תמונה"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="flex gap-1">
                                                      <Input
                                                        value={editingCategory.icon}
                                                        onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                                        className="w-10 text-center text-sm"
                                                        placeholder="🌟"
                                                      />
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openIconPicker('editing')}
                                                        className="px-1 text-xs hover:bg-cyan-50"
                                                        title="בחר אייקון"
                                                      >
                                                        🎨
                                                      </Button>
                                                    </div>
                                                  )}
                                                  <div className="flex gap-1">
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      onChange={(e) => handleImageUpload(e.target.files[0], 'editing')}
                                                      className="hidden"
                                                      id={`image-upload-edit-subsub-${subSubcategory.id}`}
                                                    />
                                                    <label
                                                      htmlFor={`image-upload-edit-subsub-${subSubcategory.id}`}
                                                      className="cursor-pointer inline-flex items-center gap-1 px-1 py-0.5 text-xs border rounded hover:bg-gray-50"
                                                      title="העלה תמונה"
                                                    >
                                                      {uploadingImage ? (
                                                        <div className="w-2 h-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                                      ) : (
                                                        <Upload className="w-3 h-3" />
                                                      )}
                                                    </label>
                                                    {editingCategory.image && (
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenImageCropper(editingCategory.image, 'editing')}
                                                        className="px-1 text-xs hover:bg-blue-50"
                                                        title="חתוך תמונה"
                                                      >
                                                        <Edit className="w-2 h-2" />
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                                <Input
                                                  value={editingCategory.name}
                                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                  className="flex-1 text-sm"
                                                  placeholder="שם תת-תת-קטגוריה"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                                  {subSubcategory.image ? (
                                                    <img
                                                      src={subSubcategory.image}
                                                      alt={subSubcategory.name}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    <span className="text-base">{subSubcategory.icon}</span>
                                                  )}
                                                </div>
                                                <span className="font-medium text-sm" style={{ color: subSubcategory.color }}>
                                                  {subSubcategory.name}
                                                </span>
                                                {!subSubcategory.is_active && (
                                                  <Badge variant="secondary" className="text-xs">לא פעיל</Badge>
                                                )}
                                              </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                              <Switch
                                                checked={subSubcategory.is_active}
                                                onCheckedChange={(checked) => handleToggleActive(subSubcategory.id, checked)}
                                                className="scale-75"
                                              />
                                              {isEditingSubSubcat ? (
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    onClick={() => handleEditCategory(editingCategory)}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-1"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingCategory(null)}
                                                    className="p-1"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingCategory(subSubcategory)}
                                                    className="p-1"
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteCategory(subSubcategory.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* NEW: inline add sub-subcategory panel */}
                                  {addingSubSubTo === subcategory.id && (
                                    <div className="mt-3 p-3 bg-violet-50 rounded-lg border-2 border-violet-200 border-dashed">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Plus className="w-4 h-4 text-violet-600" />
                                        <span className="font-medium text-violet-800">הוספת תת־תת־קטגוריה</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {newCategory.image ? (
                                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                            <img
                                              src={newCategory.image}
                                              alt="תת־תת־קטגוריה חדשה"
                                              className="w-full h-full object-cover"
                                            />
                                            <button
                                              onClick={() => handleRemoveImage('subcategory')}
                                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                              title="הסר תמונה"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-1">
                                            <Input
                                              value={newCategory.icon}
                                              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                              className="text-center flex-1"
                                              placeholder="✨"
                                              maxLength={2}
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openIconPicker('subcategory')}
                                              className="px-2 hover:bg-violet-100"
                                              title="בחר אייקון"
                                            >
                                              🎨
                                            </Button>
                                          </div>
                                        )}
                                        <div>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'subcategory')}
                                            className="hidden"
                                            id={`new-subsub-image-upload-${subcategory.id}`}
                                          />
                                          <label
                                            htmlFor={`new-subsub-image-upload-${subcategory.id}`}
                                            className="cursor-pointer inline-flex items-center gap-1 px-1 py-0.5 text-xs border rounded hover:bg-gray-50"
                                          >
                                            {uploadingImage ? (
                                              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                            ) : (
                                              <Upload className="w-3 h-3" />
                                            )}
                                            {newCategory.image ? 'החלף תמונה' : 'העלה תמונה'}
                                          </label>

                                          {newCategory.image && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleOpenImageCropper(newCategory.image, 'subcategory')}
                                              className="text-xs hover:bg-blue-50"
                                              title="ח cutout תמונה"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                        <Input
                                          value={newCategory.name}
                                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                          placeholder="שם תת־תת־קטגוריה"
                                          className="md:col-span-2"
                                        />
                                      </div>
                                      <div className="flex items-center gap-3 mt-3">
                                        <Input
                                          type="color"
                                          value={newCategory.color}
                                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                          className="w-16"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={newCategory.is_active}
                                            onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_active: checked })}
                                          />
                                          <span className="text-sm text-gray-600">פעיל</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2 mt-3">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelAddSubSubcategory}
                                        >
                                          ביטול
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveNewSubSubcategory}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                          <Plus className="w-4 h-4 ml-1" />
                                          הוסף
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {isAddingSubcat && (
                              <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200 border-dashed">
                                <div className="flex items-center gap-3 mb-3">
                                  <Plus className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-blue-800">הוספת תת-קטגוריה חדשה</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {newCategory.image ? (
                                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                        <img
                                          src={newCategory.image}
                                          alt="תת קטגוריה חדשה"
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => handleRemoveImage('subcategory')}
                                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          title="הסר תמונה"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        <Input
                                          value={newCategory.icon}
                                          onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                          className="text-center flex-1"
                                          placeholder="🍕"
                                          maxLength={2}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openIconPicker('subcategory')}
                                          className="px-2 hover:bg-blue-100"
                                          title="בחר אייקון"
                                        >
                                          🎨
                                        </Button>
                                      </div>
                                    )}
                                    <div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'subcategory')}
                                        className="hidden"
                                        id="new-subcategory-image-upload"
                                      />
                                      <label
                                        htmlFor="new-subcategory-image-upload"
                                        className="cursor-pointer inline-flex items-center gap-1 px-1 py-0.5 text-xs border rounded hover:bg-gray-50"
                                      >
                                        {uploadingImage ? (
                                          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                        ) : (
                                          <Upload className="w-3 h-3" />
                                        )}
                                        {newCategory.image ? 'החלף תמונה' : 'העלה תמונה'}
                                      </label>

                                      {/* כפתור יצירת תמונה לתת-קטגוריה חדשה */}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openImageGenerator('subcategory', newCategory)}
                                        disabled={uploadingImage || !newCategory.name}
                                        className="text-xs hover:bg-purple-50 border-purple-200"
                                        title="יצור תמונה באמצעות AI"
                                      >
                                        {uploadingImage ? (
                                          <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin"></div>
                                        ) : (
                                          <Wand2 className="w-2 h-2" />
                                        )}
                                      </Button>

                                      {newCategory.image && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleOpenImageCropper(newCategory.image, 'subcategory')}
                                          className="text-xs hover:bg-blue-50"
                                          title="חתוך תמונה"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <Input
                                      value={newCategory.name}
                                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                      placeholder="שם תת-קטגוריה"
                                      className="md:col-span-2"
                                    />
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Input
                                      type="color"
                                      value={newCategory.color}
                                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                      className="w-16"
                                    />
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={newCategory.is_active}
                                        onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_active: checked })}
                                      />
                                      <span className="text-sm text-gray-600">פעיל</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelAddSubcategory}
                                    >
                                      ביטול
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleSaveNewSubcategory}
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      <Plus className="w-4 h-4 ml-1" />
                                      הוסף
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* תצוגת קיבוץ תתי־קטגוריות עבור "אנשי מקצוע" */}
            {professionalsMain && professionalsGroups.length > 0 && (
              <Card className="border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    קיבוץ "אנשי מקצוע" לתתי־קטגוריות כלליות (תצוגה מקדימה)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professionalsGroups.map((g) => {
                      // Filter out sub-sub-categories from display here for 'Professionals Groups'
                      // The buildProfessionalsGroups logic already groups by immediate parent, so this is fine.
                      const subsInGroup = g.subIds.map(sid => categories.find(c => c.id === sid)).filter(Boolean);

                      return (
                        <div key={g.id} className="p-3 rounded-lg border bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{g.icon}</span>
                              <span className="font-semibold">{g.label}</span>
                            </div>
                            <Badge variant="secondary">{subsInGroup.length} פריטים</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {subsInGroup.map((sc) => (
                              <span key={sc.id} className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {sc.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    הערה: מדובר בשכבת תצוגה בלבד כדי לארגן את תתי־הקטגוריות. לא מבוצע שינוי אמיתי בקטגוריות.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  הוסף קטגוריה או תת-קטגוריה חדשה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category-name">שם הקטגוריה *</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="למשל: מסעדות"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>תמונה או אייקון</Label>
                    <div className="mt-1 space-y-2">
                      {newCategory.image ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img
                            src={newCategory.image}
                            alt="תמונת קטגוריה"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage('new')}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-600"
                            title="הסר תמונה"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={newCategory.icon}
                            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                            placeholder="🍽️"
                            maxLength={2}
                            className="text-center w-20"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openIconPicker('new')}
                            className="px-3 hover:bg-cyan-50 border-cyan-200"
                            title="בחר אייקון"
                          >
                            <span className="text-lg">🎨</span>
                          </Button>
                        </div>
                      )}

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'new')}
                          className="hidden"
                          id="new-category-image-upload"
                        />
                        <label
                          htmlFor="new-category-image-upload"
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                              <span className="text-sm">מעלה...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">העלה תמונה</span>
                            </>
                          )}
                        </label>

                        {/* כפתור יצירת תמונה לקטגוריה חדשה */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openImageGenerator('new', newCategory)}
                          disabled={uploadingImage || !newCategory.name}
                          className="flex items-center gap-2 hover:bg-purple-50 border-purple-200"
                          title="יצור תמונה באמצעות AI"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin"></div>
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                          <span className="text-sm">יצור תמונה</span>
                        </Button>

                        {newCategory.image && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenImageCropper(newCategory.image, 'new')}
                            className="text-sm hover:bg-blue-50"
                            title="חתוך תמונה"
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            חתוך תמונה
                          </Button>
                        )}
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG עד 2MB | או יצור תמונה באמצעות AI</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>צבע הקטגוריה</Label>
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="mt-1 h-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>קטגוריה אב (אופציונלי)</Label>
                    <Select value={newCategory.parent_id} onValueChange={(value) => setNewCategory({ ...newCategory, parent_id: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="בחר קטגוריה אב או השאר ריק לקטגוריה ראשית" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>ללא קטגוריה אב (קטגוריה ראשית)</SelectItem>
                        {categories.filter(cat => !cat.parent_id && cat.is_active).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="w-5 h-5 object-cover rounded-sm" />
                              ) : (
                                <span>{category.icon}</span>
                              )}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category-order">סדר הצגה</Label>
                    <Input
                      id="category-order"
                      type="number"
                      value={newCategory.sort_order}
                      onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={newCategory.is_active}
                    onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_active: checked })}
                  />
                  <Label>קטגוריה פעילה</Label>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-700 mb-3">תצוגה מקדימה:</h3>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {newCategory.image ? (
                        <img
                          src={newCategory.image}
                          alt="תצוגה מקדימה"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          {newCategory.icon || "❓"}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold" style={{ color: newCategory.color }}>
                        {newCategory.name || "שם הקטגוריה"}
                      </span>
                      {newCategory.parent_id && (
                        <div className="text-sm text-gray-500">
                          תת-קטגוריה של: {categories.find(c => c.id === newCategory.parent_id)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddCategory}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  הוסף קטגוריה
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Generator Modal */}
        {showImageGeneratorModal && (
          <ImageGeneratorModal
            isOpen={showImageGeneratorModal}
            onClose={() => setShowImageGeneratorModal(false)}
            onImageGenerated={handleImageGenerated}
            initialPrompt={imageGeneratorInitialPrompt}
          />
        )}

        {/* Image Cropper Modal */}
        {showImageCropper && imageToCrop && (
          <ImageCropper
            imageUrl={imageToCrop}
            isOpen={showImageCropper}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatioOptions={[
              { name: "חופשי", ratio: null, icon: Maximize },
              { name: "ריבוע", ratio: 1, icon: Square },
              { name: "תמונה", ratio: 4 / 3, icon: Camera }
            ]}
          />
        )}

        {/* Icon Picker Modal */}
        {showIconPicker && (
          <IconPicker
            value={
              iconPickerTarget === 'new' || iconPickerTarget === 'subcategory'
                ? newCategory.icon
                : editingCategory?.icon || ''
            }
            onChange={handleIconSelect}
            onClose={() => {
              setShowIconPicker(false);
              setIconPickerTarget(null);
              setIconPickerCategory(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
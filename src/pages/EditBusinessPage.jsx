import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { BusinessPage } from "@/entities/BusinessPage";
import { Category } from "@/entities/Category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Save, AlertTriangle, Loader2,
  Phone, Globe, MapPin, Tag, Clock, X, Wand2, Shield,
  Upload, Plus, ImageIcon, Sparkles, Download, Palette, Trash2, ChevronDown, Check, ChevronLeft,
  Search, // Added Search icon
  Star,   // Added Star icon
} from "lucide-react";
import { createPageUrl } from "@/utils";
import BusinessHoursComponent from "@/components/wizard/fields/BusinessHoursComponent";
import MenuBuilder from "@/components/wizard/fields/MenuBuilder";
import TagsInput from "@/components/fields/TagsInput";
import { aiImproveBusinessContent } from "@/functions/aiImproveBusinessContent";
import KashrutBox from "@/components/kashrut/KashrutBox";
import { agentSDK } from "@/agents";
import ImageZoomViewer from "@/components/images/ImageZoomViewer";
import InlineImageEditor from "@/components/images/InlineImageEditor";
import ImageGeneratorModal from "@/components/ImageGeneratorModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ColorPicker from "@/components/theme/ColorPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function EditBusinessPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [improving, setImproving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [loadingGooglePhotos, setLoadingGooglePhotos] = useState(false);
  const [fixingHours, setFixingHours] = useState(false);

  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [editingLogoUrl, setEditingLogoUrl] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false); // Added for preview image upload

  const [isImportingFromGoogle, setIsImportingFromGoogle] = useState(false);
  const [googleImportSuccess, setGoogleImportSuccess] = useState(false);
  const [showGoogleSearchDialog, setShowGoogleSearchDialog] = useState(false); // NEW
  const [googleSearchName, setGoogleSearchName] = useState(""); // NEW
  const [googleSearchAddress, setGoogleSearchAddress] = useState(""); // NEW
  const [googleSearchResults, setGoogleSearchResults] = useState([]); // NEW
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false); // NEW
  const [selectedGooglePlace, setSelectedGooglePlace] = useState(null); // NEW

  const [form, setForm] = useState({
    business_name: "",
    display_title: "",
    description: "",
    contact_phone: "",
    whatsapp_phone: "",
    website_url: "",
    address: "",
    price_range: "",
    images: [],
    hours: null,
    special_fields: {},
    whatsapp_message: "",
    whatsapp_button_text: "",
    kashrut_authority_type: "",
    kashrut_authority_name: "",
    kashrut_rabbinate_city: "",
    kashrut_logo_url: "",
    kashrut_certificate_urls: [],
    metadata: {},
    brands_logos: [],
    theme_settings: {},
    preview_image: "",
    category_id: "",
    subcategory_ids: [], // שונה למערך
  });

  // All hooks (useState, useEffect, useCallback, useMemo) must be called unconditionally at the top level
  // of the component.
  // Move the memoized category calculations here to ensure they are hooks.
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSpecialFieldChange = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      special_fields: { ...prev.special_fields, [field]: value }
    }));
  }, []);

  const handleEditLogo = useCallback((imageUrl, imageIndex) => {
    // This logic assumes `images[1]` is designated as the logo by InlineImageEditor.
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
    // שמירת מיצוב הלוגו ב-metadata
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
    // עדכון תמונה מספר 2 (אינדקס 1) עם הלוגו החדש
    setForm(prev => {
      const updatedImages = [...(prev.images || [])];
      // Ensure there's a slot for the logo. If not, add it.
      while (updatedImages.length < 2) {
          updatedImages.push(null); // Add null placeholders until index 1 exists
      }
      updatedImages[1] = logoUrl; // This assumes images[1] is ALWAYS the logo.
      return { ...prev, images: updatedImages };
    });
    setSuccessMessage("הלוגו עודכן בהצלחה! ✨");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLogoEditorOpen(false);
  }, []);

  const handleSubcategoryToggle = useCallback((subcatId) => {
    setForm(prev => {
      const current = prev.subcategory_ids || [];
      const isSelected = current.includes(subcatId);

      // אם מסירים תת-קטגוריה, צריך גם להסיר את התת-תת שלה
      if (isSelected) {
        const subSubsToRemove = categories
          .filter(c => c.parent_id === subcatId)
          .map(c => c.id);
        
        return {
          ...prev,
          subcategory_ids: current.filter(id => id !== subcatId && !subSubsToRemove.includes(id))
        };
      }

      return {
        ...prev,
        subcategory_ids: [...current, subcatId]
      };
    });
  }, [categories]);

  // קטגוריות ראשיות (אלו ללא parent_id)
  const mainCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);

  // תתי קטגוריות של הקטגוריה הראשית הנבחרת
  const subcategories = useMemo(() =>
    form.category_id
      ? categories.filter(c => c.parent_id === form.category_id)
      : [],
    [form.category_id, categories]
  );

  // תת-תת-קטגוריות של התתי-קטגוריות הנבחרות
  const subSubcategories = useMemo(() => {
    if (!form.subcategory_ids || form.subcategory_ids.length === 0) return [];
    
    // מצא את כל התת-תת-קטגוריות של התתי-קטגוריות הנבחרות
    const allSubSubs = [];
    form.subcategory_ids.forEach(subcatId => {
      const subSubs = categories.filter(c => c.parent_id === subcatId);
      allSubSubs.push(...subSubs);
    });
    return allSubSubs;
  }, [form.subcategory_ids, categories]);

  useEffect(() => {
    const loadData = async () => {
      let currentUser;
      try {
        currentUser = await base44.auth.me(); // Updated from User.me()
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href); // Updated from User.loginWithRedirect()
        return;
      }

      if (!pageId) {
        setError("לא נמצא מזהה עמוד עסק");
        setIsLoading(false);
        return;
      }

      try {
        const [pageData, catsData] = await Promise.all([
          base44.entities.BusinessPage.filter({ id: pageId }), // Updated from BusinessPage.filter()
          base44.entities.Category.list() // Updated from Category.list()
        ]);

        const page = Array.isArray(pageData) ? pageData[0] : pageData;

        if (!page) {
          setError("עמוד העסק לא נמצא");
          setIsLoading(false);
          return;
        }

        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          setError("אין לך הרשאה לערוך עמוד עסק זה. הנך מועבר לדף הבית...");
          setIsLoading(false);
          setTimeout(() => {
            window.location.href = createPageUrl("Browse");
          }, 3000);
          return;
        }

        setBusinessPage(page);
        setCategories(catsData);

        // Images are now managed as a single flat array by InlineImageEditor.
        // No special handling for images[0] or images[1] for cover/logo in the form state.
        const pageImages = Array.isArray(page.images) ? [...page.images] : [];

        setForm({
          business_name: page.business_name || "",
          display_title: page.display_title || "",
          description: page.description || "",
          contact_phone: page.contact_phone || "",
          whatsapp_phone: page.whatsapp_phone || "", // Initialize new field
          website_url: page.website_url || "",
          address: page.address || "",
          price_range: page.price_range || "",
          images: pageImages, // All images loaded into a flat array
          hours: typeof page.hours === 'string' ? JSON.parse(page.hours) : page.hours,
          special_fields: page.special_fields || {},
          whatsapp_message: page.whatsapp_message || "",
          whatsapp_button_text: page.whatsapp_button_text || "",
          kashrut_authority_type: page.kashrut_authority_type || "",
          kashrut_authority_name: page.kashrut_authority_name || "",
          kashrut_rabbinate_city: page.kashrut_rabbinate_city || "",
          kashrut_logo_url: page.kashrut_logo_url || "",
          kashrut_certificate_urls: Array.isArray(page.kashrut_certificate_urls) ? page.kashrut_certificate_urls : [],
          metadata: page.metadata || {},
          brands_logos: Array.isArray(page.brands_logos) ? page.brands_logos : [],
          theme_settings: page.theme_settings || {}, // Initialize theme_settings
          preview_image: page.preview_image || "", // Initialize preview_image
          category_id: page.category_id || "", // Initialize new field
          subcategory_ids: Array.isArray(page.subcategory_ids) && page.subcategory_ids.length > 0
            ? page.subcategory_ids
            : (page.subcategory_id ? [page.subcategory_id] : []), // תמיכה לאחור
        });

      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const runAIImprove = async () => {
    if (!form.business_name && !form.description) {
      setError("נא למלא לפחות שם עסק או תיאור לשיפור");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setImproving(true);
    setAiError("");
    setSuccessMessage("");

    try {
      const categoryName = categories.find(c => c.id === form.category_id)?.name || "";
      const subcategoryName = (Array.isArray(form.subcategory_ids) && form.subcategory_ids.length > 0)
        ? categories.find(c => c.id === form.subcategory_ids[0])?.name || ""
        : "";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `שפר את התוכן הבא לעמוד עסק בשפה עברית צנועה ומקצועית.

נתוני העסק:
- שם: ${form.business_name || ""}
- כותרת: ${form.display_title || ""}
- תיאור: ${form.description || ""}
- קטגוריה: ${categoryName}
- תת-קטגוריה: ${subcategoryName}
- כתובת: ${form.address || ""}

הנחיות:
1. שפר את הכותרת (עד 70 תווים)
2. שפר את התיאור (200-400 תווים, ברור ואטרקטיבי)
3. הצע טקסט לכפתור ווטסאפ (עד 40 תווים)
4. הצע הודעת ווטסאפ (עד 140 תווים)
5. הצע 3-5 תגיות רלוונטיות

החזר JSON בלבד בפורמט הזה:
{
  "improved_title": "...",
  "improved_description": "...",
  "whatsapp_button_text": "...",
  "whatsapp_message": "...",
  "tags": ["תגית1", "תגית2", "תגית3"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            improved_title: { type: "string" },
            improved_description: { type: "string" },
            whatsapp_button_text: { type: "string" },
            whatsapp_message: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      const improved = result;

      if (improved.improved_title) {
        setForm(prev => ({ ...prev, display_title: improved.improved_title.slice(0, 80) }));
      }
      if (improved.improved_description) {
        setForm(prev => ({ ...prev, description: improved.improved_description }));
      }
      if (improved.whatsapp_button_text) {
        setForm(prev => ({ ...prev, whatsapp_button_text: improved.whatsapp_button_text.slice(0, 40) }));
      }
      if (improved.whatsapp_message) {
        setForm(prev => ({ ...prev, whatsapp_message: improved.whatsapp_message.slice(0, 140) }));
      }
      if (Array.isArray(improved.tags) && improved.tags.length > 0) {
        setForm(prev => ({
          ...prev,
          special_fields: {
            ...prev.special_fields,
            tags: [...new Set([...(prev.special_fields?.tags || []), ...improved.tags])]
          }
        }));
      }

      setSuccessMessage("✨ התוכן שופר בהצלחה עם AI!");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      setAiError("שגיאה בשיפור עם AI: " + (err.message || ""));
      setTimeout(() => setAiError(""), 5000);
    } finally {
      setImproving(false);
    }
  };

  const handleThemeChange = (themeData) => {
    setForm(prev => ({
      ...prev,
      theme_settings: {
        ...prev.theme_settings,
        ...themeData
      }
    }));
  };

  const uploadPreviewImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res?.data?.file_url || res?.file_url;
      if (url) {
        handleFieldChange("preview_image", url);
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

  const cleanMenuImages = async (menu) => {
    if (!menu || !Array.isArray(menu)) return menu;

    const cleanedMenu = [];

    for (const category of menu) {
      const cleanedCategory = { ...category, items: [] };

      for (const item of category.items || []) {
        const cleanedItem = { ...item };

        // בדיקה אם התמונה היא data URL
        if (cleanedItem.image && typeof cleanedItem.image === 'string' && cleanedItem.image.startsWith('data:')) {
          console.log('🔄 Converting data URL to uploaded file for:', cleanedItem.name);

          try {
            // המרת data URL לקובץ
            const mimeMatch = cleanedItem.image.match(/^data:(.*?);base64,/);
            const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/png'; // Default to png
            const fileExtension = mimeType.split('/')[1] || 'png';

            const blob = await fetch(cleanedItem.image).then(r => r.blob());
            const file = new File([blob], `${cleanedItem.name || 'item'}.${fileExtension}`, { type: mimeType });

            // העלאה לשרת
            const res = await base44.integrations.Core.UploadFile({ file });
            const url = res?.data?.file_url || res?.file_url;

            if (url) {
              cleanedItem.image = url;
              console.log('✅ Converted to URL:', url);
            } else {
              // אם ההעלאה נכשלה, הסר את התמונה
              cleanedItem.image = '';
              console.warn('⚠️ Upload failed, removing image for item:', cleanedItem.name);
            }
          } catch (error) {
            console.error('❌ Error converting image for item:', cleanedItem.name, error);
            cleanedItem.image = '';
          }
        }

        cleanedCategory.items.push(cleanedItem);
      }

      cleanedMenu.push(cleanedCategory);
    }

    return cleanedMenu;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    setAiError("");
    setGoogleImportSuccess(false);

    try {
      // המרת data URLs לקבצים מועלים לפני השמירה
      const cleanedMenu = await cleanMenuImages(form.special_fields?.menu);

      const updateData = {
        business_name: form.business_name.trim(),
        display_title: form.display_title.trim(),
        description: form.description.trim(),
        contact_phone: form.contact_phone.trim(),
        whatsapp_phone: form.whatsapp_phone?.trim() || null, // Include new field in update
        website_url: form.website_url.trim() || null,
        address: form.address.trim() || null,
        price_range: form.price_range || null,
        images: form.images.filter(Boolean), // Filter out nulls/empty strings before saving
        hours: form.hours ? JSON.stringify(form.hours) : null,
        special_fields: {
          ...form.special_fields,
          menu: cleanedMenu
        },
        whatsapp_message: form.whatsapp_message?.trim() || null,
        whatsapp_button_text: form.whatsapp_button_text?.trim() || null,
        kashrut_authority_type: form.kashrut_authority_type || null,
        kashrut_authority_name: form.kashrut_authority_name || null,
        kashrut_rabbinate_city: form.kashrut_rabbinate_city || null,
        kashrut_logo_url: form.kashrut_logo_url || null,
        kashrut_certificate_urls: Array.isArray(form.kashrut_certificate_urls) ? form.kashrut_certificate_urls : [],
        metadata: form.metadata,
        brands_logos: Array.isArray(form.brands_logos) ? form.brands_logos : [],
        theme_settings: form.theme_settings || {}, // Include theme_settings in update
        preview_image: form.preview_image || null, // Include preview_image in update
        category_id: form.category_id || null, // Include new field in update
        subcategory_ids: form.subcategory_ids, // שמירת המערך
        // תאימות לאחור
        subcategory_id: form.subcategory_ids.length > 0 ? form.subcategory_ids[0] : null,
      };

      await base44.entities.BusinessPage.update(pageId, updateData); // Updated from BusinessPage.update()
      setSuccessMessage("עמוד העסק נשמר בהצלחה!");

      setTimeout(() => {
        window.location.href = createPageUrl(`BusinessPage?id=${pageId}`);
      }, 1500);

    } catch (err) {
      setError("שגיאה בשמירה: " + err.message);
    } finally {
      setIsSaving(false);
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

      // הוספת התמונות החדשות לרשימה הקיימת
      const currentImages = form.images || [];
      const newImages = [...currentImages, ...googlePhotos].slice(0, 30); // מגביל ל-30 תמונות

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

  const handleFixHours = () => {
    if (!form.hours) {
      setError("אין שעות פעילות לתיקון");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFixingHours(true);

    try {
      let parsedHours = form.hours;
      
      // If it's a string, try to parse and convert
      if (typeof parsedHours === 'string') {
        try {
          parsedHours = JSON.parse(parsedHours);
        } catch (e) {
          // It's plain text format - convert it
          const textHours = parsedHours;
          const schedule = {};
          
          const dayMapping = {
            'ראשון': 'sunday',
            'שני': 'monday',
            'שלישי': 'tuesday',
            'רביעי': 'wednesday',
            'חמישי': 'thursday',
            'שישי': 'friday',
            'שבת': 'saturday'
          };
          
          const lines = textHours.split('\n');
          lines.forEach(line => {
            const match = line.match(/יום\s+(\S+):\s+(.+)/);
            if (match) {
              const hebrewDay = match[1];
              const timeStr = match[2].trim();
              const dayKey = dayMapping[hebrewDay];
              
              if (dayKey) {
                if (timeStr === 'סגור') {
                  schedule[dayKey] = { isOpen: false };
                } else {
                  const ranges = timeStr.split(',').map(r => r.trim());
                  const timeRanges = ranges.map(range => {
                    const times = range.split(/[–-]/).map(t => t.trim());
                    if (times.length === 2) {
                      return { open: times[0], close: times[1] };
                    }
                    return null;
                  }).filter(Boolean);
                  
                  if (timeRanges.length > 0) {
                    schedule[dayKey] = {
                      isOpen: true,
                      is24Hours: false,
                      timeRanges
                    };
                  }
                }
              }
            }
          });
          
          parsedHours = { schedule };
        }
      }
      
      // Convert old format to new if needed
      if (parsedHours) {
        const schedule = parsedHours.schedule || parsedHours;
        
        if (schedule && Object.keys(schedule).length > 0) {
          const firstKey = Object.keys(schedule)[0];
          const firstDay = schedule[firstKey];
          
          if (firstDay && (firstDay.hasOwnProperty('open') || firstDay.hasOwnProperty('closed'))) {
            const newSchedule = {};
            Object.keys(schedule).forEach(day => {
              const oldDay = schedule[day];
              if (oldDay.closed) {
                newSchedule[day] = { isOpen: false };
              } else if (oldDay.open && oldDay.close) {
                newSchedule[day] = {
                  isOpen: true,
                  is24Hours: false,
                  timeRanges: [{ open: oldDay.open, close: oldDay.close }]
                };
              }
            });
            parsedHours = { schedule: newSchedule };
          }
        }
      }
      
      setForm(prev => ({ ...prev, hours: parsedHours }));
      setSuccessMessage("✅ שעות הפעילות תוקנו בהצלחה!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (err) {
      setError("שגיאה בתיקון שעות: " + err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setFixingHours(false);
    }
  };

  const handleSearchGoogle = async () => {
    if (!googleSearchName) {
      setError("נא למלא את שם העסק לחיפוש");
      return;
    }

    setIsSearchingGoogle(true);
    setGoogleSearchResults([]);
    setSelectedGooglePlace(null);
    setError("");

    try {
      console.log('🔍 Searching Google Places...');
      console.log('   Search name:', googleSearchName);
      console.log('   Search address:', googleSearchAddress);

      const searchQuery = googleSearchAddress
        ? `${googleSearchName}, ${googleSearchAddress}`
        : googleSearchName;

      // The GOOGLE_MAPS_KEY reference from the outline should be managed on the backend.
      // e.g. const GOOGLE_MAPS_KEY = "AIzaSyDnNy8RXxO_TsFMtXKn4cK1Wq6dUgT8kYs"; // Replace with your key

      // Call through a backend function to avoid CORS and hide API key
      const { data } = await base44.functions.invoke('searchGooglePlacesForEdit', {
        query: searchQuery
      });

      console.log('📊 Search results:', data);

      if (data.success && data.results) {
        setGoogleSearchResults(data.results);
        if (data.results.length === 0) {
          setError("לא נמצאו תוצאות. נסה שם או כתובת אחרת.");
        } else {
          setError(""); // Clear previous errors if search was successful
        }
      } else {
        setError(data.error || "שגיאה בחיפוש");
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError("שגיאה בחיפוש: " + err.message);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleImportSelectedPlace = async () => {
    if (!selectedGooglePlace) {
      setError("נא לבחור עסק מהרשימה");
      return;
    }

    setIsImportingFromGoogle(true);
    setGoogleImportSuccess(false);
    setError(""); // Clear previous errors

    try {
      console.log('📥 Importing selected place:', selectedGooglePlace);

      const { data } = await base44.functions.invoke('fetchBusinessDataFromGoogle', {
        business_name: selectedGooglePlace.name,
        address: selectedGooglePlace.formatted_address,
        place_id: selectedGooglePlace.place_id
      });

      console.log('📊 Google data received:', data);

      if (data.success && data.data) {
        const googleData = data.data;

        // עדכון הטופס עם הנתונים החדשים
        setForm(prev => {
          const currentImages = prev.images || [];
          const newPhotos = googleData.photos || [];
          const mergedImages = [...currentImages, ...newPhotos.filter(p => !currentImages.includes(p))].slice(0, 30); // Merge and limit to 30

          return {
            ...prev,
            contact_phone: googleData.phone || prev.contact_phone,
            website_url: googleData.website || prev.website_url,
            address: googleData.address || prev.address,
            hours: googleData.hours || prev.hours,
            images: mergedImages,
            metadata: {
              ...prev.metadata,
              google_place_id: googleData.place_id,
              last_google_sync: new Date().toISOString()
            }
          };
        });

        // עדכון קואורדינטות אם קיימות
        if (googleData.lat && googleData.lng) {
          await base44.entities.BusinessPage.update(pageId, {
            lat: googleData.lat,
            lng: googleData.lng
          });
        }

        setGoogleImportSuccess(true);
        setSuccessMessage(`✅ הנתונים עודכנו בהצלחה מ-Google Places!\n\nעסק: ${selectedGooglePlace.name}\nכתובת: ${selectedGooglePlace.formatted_address}`);
        setShowGoogleSearchDialog(false);
        setGoogleSearchName("");
        setGoogleSearchAddress("");
        setGoogleSearchResults([]); // Clear search results
        setSelectedGooglePlace(null); // Clear selected place

        setTimeout(() => {
          setGoogleImportSuccess(false);
          setSuccessMessage(""); // Clear success message after a while
        }, 5000);

      } else {
        setError(data.error || 'לא ניתן לייבא נתונים מ-Google Places');
      }

    } catch (err) {
      console.error('❌ Error importing from Google:', err);
      setError('שגיאה בייבוא נתונים: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsImportingFromGoogle(false);
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
              // Add the new image to the list. For simplicity, adding it to the end.
              newImages.push(imageUrl);
              return { ...prev, images: newImages };
            });
            setIsGeneratorOpen(false); // Close modal after image is generated
          }}
        />
      )}
      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">בחירת צבע נושא</DialogTitle>
          </DialogHeader>
          <ColorPicker
            value={form.theme_settings || {}}
            onChange={handleThemeChange}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowColorPicker(false)}>
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
                חזרה
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  עריכת עמוד עסק
                </h1>
                <p className="text-gray-500 mt-1">
                  {businessPage?.business_name || "טוען..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* כפתור ייבוא מ-Google Places */}
              <Button
                onClick={() => {
                  setGoogleSearchName(form.business_name);
                  setGoogleSearchAddress(form.address);
                  setShowGoogleSearchDialog(true);
                }}
                disabled={isImportingFromGoogle || isSaving}
                variant="outline"
                className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                <Download className="w-4 h-4" />
                ייבוא מ-Google Places
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowColorPicker(true)}
                className="gap-2"
              >
                <Palette className="w-4 h-4 ml-2" />
                בחירת צבע נושא
              </Button>
              <Button
                onClick={runAIImprove}
                disabled={improving}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {improving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    משפר...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    שפר תוכן עם AI
                  </>
                )}
              </Button>
              {/* כפתור שמירה */}
              <Button
                onClick={handleSave}
                disabled={isSaving || isImportingFromGoogle}
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
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {googleImportSuccess && (
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <Download className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                ✅ הנתונים מ-Google Places עודכנו בהצלחה! אל תשכח ללחוץ "שמור שינויים" כדי לשמור את העדכונים.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {aiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 h-4" />
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                      onClick={() => handleFieldChange("preview_image", null)}
                      className="bg-red-500/90 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
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

            <Card>
              <CardHeader>
                <CardTitle>פרטים בסיסיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">שם העסק *</label>
                    <Input
                      value={form.business_name}
                      onChange={(e) => handleFieldChange("business_name", e.target.value)}
                      placeholder="שם העסק"
                      dir="rtl"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">כותרת תצוגה *</label>
                    <Input
                      value={form.display_title}
                      onChange={(e) => handleFieldChange("display_title", e.target.value)}
                      placeholder="כותרת לתצוגה"
                      dir="rtl"
                      className="text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">תיאור העסק *</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="תאר את העסק שלך..."
                    rows={4}
                    dir="rtl"
                    className="text-right"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4" />
                    כתובת
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="כתובת העסק"
                    dir="rtl"
                    className="text-right"
                  />
                </div>

                {/* בחירת קטגוריות */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900">
                    <Tag className="w-6 h-6 text-blue-600" />
                    קטגוריות
                  </h2>

                  {/* קטגוריה ראשית */}
                  <div className="mb-6">
                    <Label className="text-base font-semibold mb-3 block text-blue-800">
                      קטגוריה ראשית *
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mainCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            category_id: cat.id,
                            subcategory_ids: [] // איפוס תתי-קטגוריות
                          }))}
                          className={`p-4 rounded-xl border-2 transition-all text-right ${
                            form.category_id === cat.id
                              ? 'border-blue-500 bg-blue-100 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{cat.icon || '📁'}</span>
                            <span className="font-semibold">{cat.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* תתי-קטגוריות - בחירה מרובה */}
                  {subcategories.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block text-blue-800">
                        תתי-קטגוריות (בחר אחת או יותר)
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subcategories.map((subcat) => {
                          const isSelected = form.subcategory_ids.includes(subcat.id);
                          return (
                            <button
                              key={subcat.id}
                              type="button"
                              onClick={() => handleSubcategoryToggle(subcat.id)}
                              className={`p-4 rounded-xl border-2 transition-all text-right flex items-center gap-3 ${
                                isSelected
                                  ? 'border-green-500 bg-green-100 shadow-md'
                                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <span className="text-2xl">{subcat.icon || '📌'}</span>
                              <span className="font-semibold flex-1">{subcat.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {form.subcategory_ids.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            ✅ נבחרו {form.subcategory_ids.length} תתי-קטגוריות
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* תת-תת-קטגוריות */}
                  {subSubcategories.length > 0 && (
                    <div className="mt-6">
                      <Label className="text-base font-semibold mb-3 block text-indigo-800">
                        תת-תת-קטגוריות (בחר לפירוט נוסף)
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subSubcategories.map((subSubcat) => {
                          const isSelected = form.subcategory_ids.includes(subSubcat.id);
                          return (
                            <button
                              key={subSubcat.id}
                              type="button"
                              onClick={() => handleSubcategoryToggle(subSubcat.id)}
                              className={`p-3 rounded-xl border-2 transition-all text-right flex items-center gap-3 ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-100 shadow-md'
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-xl">{subSubcat.icon || '✨'}</span>
                              <span className="font-medium flex-1 text-sm">{subSubcat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* טלפון להתקשרות */}
            <Card className="p-6 bg-white/80 backdrop-blur border-slate-200 shadow-lg">
              <h3 className="text-lg font-bold mb-4">פרטי התקשרות</h3>

              <div className="space-y-4">
                {/* טלפון להתקשרות */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    טלפון להתקשרות *
                  </label>
                  <Input
                    type="tel"
                    value={form.contact_phone || ""}
                    onChange={(e) => handleFieldChange("contact_phone", e.target.value)}
                    placeholder="050-1234567"
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                {/* טלפון לווטסאפ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    טלפון לווטסאפ (אופציונלי)
                  </label>
                  <Input
                    type="tel"
                    value={form.whatsapp_phone || ""}
                    onChange={(e) => handleFieldChange("whatsapp_phone", e.target.value)}
                    placeholder="050-7654321 (אם שונה מטלפון ההתקשרות)"
                    className="text-right"
                    dir="rtl"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    אם לא תמלא, ישתמש במספר ההתקשרות
                  </p>
                </div>

                {/* הודעת ווטסאפ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    הודעת ברירת מחדל (ווטסאפ)
                  </label>
                  <Textarea
                    value={form.whatsapp_message || ""}
                    onChange={(e) => handleFieldChange("whatsapp_message", e.target.value)}
                    placeholder="שלום, אני מעוניין לקבל מידע נוסף..."
                    className="text-right min-h-[80px]"
                    dir="rtl"
                  />
                </div>

                {/* טקסט כפתור ווטסאפ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    טקסט כפתור ווטסאפ
                  </label>
                  <Input
                    type="text"
                    value={form.whatsapp_button_text || ""}
                    onChange={(e) => handleFieldChange("whatsapp_button_text", e.target.value)}
                    placeholder="שלח הודעה בווטסאפ"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </Card>

            {/* אתר אינטרנט */}
            <Card className="p-6 bg-white/80 backdrop-blur border-slate-200 shadow-lg">
              <h3 className="text-lg font-bold mb-4">אתר אינטרנט</h3>
              <Input
                type="url"
                value={form.website_url || ""}
                onChange={(e) => handleFieldChange("website_url", e.target.value)}
                placeholder="https://www.example.com"
                className="text-right"
                dir="rtl"
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
                onChange={(imgs) => handleFieldChange("images", imgs)}
                maxImages={30}
                onEditLogo={handleEditLogo}
              />
            </Card>

            {/* סרגל מותגים */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">סרגל מותגים (אופציונלי)</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                הוסף לוגואים של מותגים/ספקים איתם אתה עובד. הלוגואים יוצגו בקרוסלה מתגלגלת בעמוד העסק.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {(form.brands_logos || []).map((logo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-white">
                      <img
                        src={logo}
                        alt={`לוגו מותג ${index + 1}`}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newLogos = [...(form.brands_logos || [])];
                        newLogos.splice(index, 1);
                        setForm({ ...form, brands_logos: newLogos });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      try {
                        const uploadPromises = files.map(async (file) => {
                          const res = await base44.integrations.Core.UploadFile({ file });
                          // תיקון: בדיקת כל המבנים האפשריים של התגובה
                          const url = res?.data?.file_url || res?.file_url || null;
                          if (!url) {
                            console.error('No file_url in response:', res);
                            throw new Error('לא התקבל URL לקובץ שהועלה');
                          }
                          return url;
                        });

                        const uploadedUrls = await Promise.all(uploadPromises);
                        setForm(prevForm => ({
                          ...prevForm,
                          brands_logos: [...(prevForm.brands_logos || []), ...uploadedUrls]
                        }));
                      } catch (error) {
                        console.error("Error uploading logos:", error);
                        setError("שגיאה בהעלאת לוגואים: " + (error.message || ""));
                      }
                    }}
                  />
                  <Plus className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600">הוסף לוגו</span>
                </label>
              </div>

              {(form.brands_logos || []).length > 0 && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-800 font-medium">
                    💡 הלוגואים יוצגו בקרוסלה מתגלגלת בעמוד העסק
                  </p>
                </div>
              )}
            </div>

            {form.hours && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      שעות פעילות
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFixHours}
                      disabled={fixingHours}
                      className="gap-2 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {fixingHours ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          מתקן...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          תקן שעות
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BusinessHoursComponent
                    value={form.hours}
                    onChange={(hours) => handleFieldChange("hours", hours)}
                  />
                </CardContent>
              </Card>
            )}
            {!form.hours && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    שעות פעילות
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    טרם הוגדרו שעות פעילות. ניתן להוסיף שעות פעילות לעסק בלחיצה על הכפתור.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleFieldChange("hours", { schedule: {} })}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף שעות פעילות
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  הכשר
                </CardTitle>
              </CardHeader>
              <CardContent>
                <KashrutBox
                  businessPage={form}
                  canEdit={true}
                  mode="local"
                  onUpdated={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  תגיות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagsInput
                  value={form.special_fields?.tags || []}
                  onChange={(tags) => handleSpecialFieldChange("tags", tags)}
                  placeholder="הוסף תגיות..."
                />
              </CardContent>
            </Card>

            {form.special_fields?.menu && Array.isArray(form.special_fields.menu) && (
              <Card>
                <CardHeader>
                  <CardTitle>מחירון / תפריט</CardTitle>
                </CardHeader>
                <CardContent>
                  <MenuBuilder
                    value={form.special_fields.menu}
                    onChange={(menu) => handleSpecialFieldChange("menu", menu)}
                  />
                </CardContent>
              </Card>
            )}
            {(!form.special_fields?.menu || !Array.isArray(form.special_fields.menu)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    מחירון / תפריט
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    טרם נוצר מחירון לעסק. ניתן להתחיל לבנות קטגוריות ופריטים בלחיצה על הכפתור.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        special_fields: { ...(prev.special_fields || {}), menu: [] },
                      }))
                    }
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    התחל לבנות מחירון
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Right sidebar or additional content can go here if needed, in the lg:col-span-1 */}
          <div className="lg:col-span-1 space-y-6">
            {/* You can add more cards/sections here if the layout requires it */}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving || isImportingFromGoogle}
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
            onClick={() => window.location.href = createPageUrl(`BusinessPage?id=${pageId}`)}
          >
            ביטול
          </Button>
        </div>
      </div>

      {/* מודל עריכת לוגו */}
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

      {/* דיאלוג חיפוש Google Places */}
      <Dialog open={showGoogleSearchDialog} onOpenChange={(open) => {
        setShowGoogleSearchDialog(open);
        if (!open) {
          // Reset dialog state when closed
          setGoogleSearchResults([]);
          setSelectedGooglePlace(null);
          setGoogleSearchName("");
          setGoogleSearchAddress("");
          setError(""); // Clear error when dialog closes
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              ייבוא נתונים מ-Google Places
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* טופס חיפוש */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  שם העסק לחיפוש *
                </Label>
                <Input
                  value={googleSearchName}
                  onChange={(e) => setGoogleSearchName(e.target.value)}
                  placeholder="למשל: מרכז חינוך ביתר עילית"
                  dir="rtl"
                  className="text-right"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchGoogle();
                    }
                  }}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  כתובת לחיפוש (אופציונלי)
                </Label>
                <Input
                  value={googleSearchAddress}
                  onChange={(e) => setGoogleSearchAddress(e.target.value)}
                  placeholder="למשל: ביתר עילית"
                  dir="rtl"
                  className="text-right"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchGoogle();
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleSearchGoogle}
                disabled={isSearchingGoogle || !googleSearchName}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSearchingGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מחפש...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 ml-2" />
                    חפש ב-Google Places
                  </>
                )}
              </Button>
            </div>

            {/* תוצאות חיפוש */}
            {googleSearchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium block">
                  תוצאות חיפוש ({googleSearchResults.length})
                </Label>
                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2"> {/* Added overflow-y-auto */}
                  {googleSearchResults.map((place, idx) => (
                    <button
                      key={place.place_id || idx} // Use place_id for key if available, fallback to index
                      type="button"
                      onClick={() => setSelectedGooglePlace(place)}
                      className={`w-full text-right p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedGooglePlace?.place_id === place.place_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {selectedGooglePlace?.place_id === place.place_id ? (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{place.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{place.formatted_address}</div>
                          {place.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{place.rating}</span>
                              {place.user_ratings_total && (
                                <span className="text-xs text-gray-500">
                                  ({place.user_ratings_total} ביקורות)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGoogleSearchDialog(false)}
              disabled={isImportingFromGoogle}
            >
              ביטול
            </Button>
            <Button
              onClick={handleImportSelectedPlace}
              disabled={isImportingFromGoogle || !selectedGooglePlace}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isImportingFromGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייבא...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  ייבוא עסק נבחר
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
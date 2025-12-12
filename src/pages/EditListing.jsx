
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Listing } from '@/entities/Listing';
import { Category } from '@/entities/Category';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Upload, Phone, Globe,
  MapPin, Clock, AlertCircle, CheckCircle2, Camera, Tag as TagIcon,
  Menu as MenuIcon, DollarSign, Sparkles, ArrowLeft, Loader2,
  GripVertical, Scissors
} from 'lucide-react';
import { createPageUrl } from '@/utils';
// This will be replaced in the UI
import { UploadFile } from '@/integrations/Core';
import BusinessHoursComponent from '@/components/wizard/fields/BusinessHoursComponent';
import MenuBuilder from '@/components/wizard/fields/MenuBuilder';
import TagsInput from '@/components/fields/TagsInput';
import ImageCropper from '@/components/ImageCropper';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AddressInput from "@/components/fields/AddressInput";
import { toast } from 'react-hot-toast'; // Added toast import

function useQueryParams() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function EditListingPage() {
  const navigate = useNavigate();
  const queryParams = useQueryParams();
  const id = queryParams.get('id'); // Renamed to 'id' for consistency with existing code

  const [user, setUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Image cropper state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  // Form state
  const [form, setForm] = useState({
    // Basic info
    title: '',
    description: '',
    business_name: '',
    category_id: '',
    subcategory_id: '',
    subsubcategory_id: '',
    is_custom_category: false, // New field from outline
    custom_category_name: '', // New field from outline
    custom_subcategory_name: '', // New field from outline
    custom_subsubcategory_name: '', // New field from outline
    custom_notes: '', // New field from outline

    // Contact & location
    contact_phone: '',
    website_url: '',
    address: '',
    lat: null,
    lng: null,

    // Media
    images: [],

    // Business details
    price: '',
    hours: null,

    // Special fields
    special_fields: {
      tags: [],
      menu: null
    },

    is_active: true
  });

  useEffect(() => {
    const initialize = async () => {
      if (!id) {
        setError("מזהה מודעה לא תקין.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(''); // Clear previous errors

      try {
        const [currentUser, categoriesData, listingDataArray] = await Promise.all([
          User.me().catch(err => {
            console.error('❌ EditListing: Failed to load user:', err);
            throw new Error('לא ניתן לזהות משתמש. אנא התחבר מחדש.');
          }),
          Category.list().catch(err => {
            console.error('❌ EditListing: Failed to load categories:', err);
            console.warn('Categories failed to load, continuing without them');
            return []; // Return empty array to allow component to proceed
          }),
          Listing.filter({ id: id }).catch(err => { // Changed to Listing.filter as per outline
            console.error('❌ EditListing: Failed to load listing (ID: ' + id + '):', err);
            if (err.response?.status === 403) {
              throw new Error('אין לך הרשאה לגשת למודעה זו.');
            }
            if (err.response?.status === 404) {
              throw new Error('המודעה לא נמצאה.');
            }
            throw new Error('לא ניתן לטעון את המודעה. ייתכן שאין לך הרשאות לערוך אותה.');
          })
        ]);

        if (!currentUser) {
          throw new Error("לא ניתן לזהות משתמש. אנא התחבר מחדש.");
        }
        setUser(currentUser);

        if (!listingDataArray || listingDataArray.length === 0) {
          throw new Error("המודעה לא נמצאה.");
        }

        const listingFound = listingDataArray[0];
        setListing(listingFound);

        // Permission check as per outline
        const canEdit = listingFound.created_by === currentUser.email || currentUser.role === 'admin';

        if (!canEdit) {
          setError('אין לך הרשאה לערוך מודעה זו.');
          throw new Error('אין לך הרשאה לערוך מודעה זו.');
        }

        setCategories(categoriesData || []);

        let parsedHours = listingFound.hours;
        if (typeof listingFound.hours === 'string') {
          try {
            parsedHours = JSON.parse(listingFound.hours);
          } catch (e) {
            console.warn('Could not parse hours:', listingFound.hours, e);
            parsedHours = null;
          }
        }
        const initialSpecialFields = listingFound.special_fields || {};
        const initialTags = Array.isArray(initialSpecialFields.tags) ? initialSpecialFields.tags : [];
        const initialMenu = initialSpecialFields.menu || null;

        setForm({
          title: listingFound.title || '',
          description: listingFound.description || '',
          business_name: listingFound.business_name || '',
          category_id: listingFound.category_id || '',
          subcategory_id: listingFound.subcategory_id || '',
          subsubcategory_id: listingFound.subsubcategory_id || '',
          is_custom_category: listingFound.is_custom_category || false, // Initialize new fields
          custom_category_name: listingFound.custom_category_name || '', // Initialize new fields
          custom_subcategory_name: listingFound.custom_subcategory_name || '', // Initialize new fields
          custom_subsubcategory_name: listingFound.custom_subsubcategory_name || '', // Initialize new fields
          custom_notes: listingFound.custom_notes || '', // Initialize new fields

          contact_phone: listingFound.contact_phone || '',
          website_url: listingFound.website_url || '',
          address: listingFound.address || '',
          lat: listingFound.lat || null,
          lng: listingFound.lng || null,

          images: Array.isArray(listingFound.images) ? listingFound.images : [],

          price: listingFound.price || '',
          hours: parsedHours,

          special_fields: {
            tags: initialTags,
            menu: initialMenu
          },

          is_active: listingFound.is_active || false
        });

      } catch (err) {
        console.error('❌ EditListing: Final error during data load:', err);
        setError(err.message || "שגיאה כללית בטעינת נתוני המודעה.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [id]); // Only 'id' needed as dependency now, as other states are managed within initialize

  const mainCategories = useMemo(() => categories.filter(c => !c.parent_id && (c.is_active ?? true)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [categories]);

  const subCategories = useMemo(() => {
      if (!form.category_id || form.category_id === 'other') return [];
      return categories.filter(c => c.parent_id === form.category_id && (c.is_active ?? true)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, form.category_id]);
  
  const subSubCategories = useMemo(() => {
      if (!form.subcategory_id || form.subcategory_id === 'other') return [];
      return categories.filter(c => c.parent_id === form.subcategory_id && (c.is_active ?? true)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, form.subcategory_id]);

  const updateForm = (updates) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateSpecialField = (field, value) => {
    setForm(prev => ({
      ...prev,
      special_fields: { ...prev.special_fields, [field]: value }
    }));
  };

  // handleCategoryChange is no longer needed
  // const handleCategoryChange = (categoryData) => { ... }; // This function is now removed.

  // Image handling
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const current = Array.isArray(form.images) ? [...form.images] : [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          console.warn('📄 Skipping non-image file:', file.name);
          continue;
        }

        const { file_url } = await UploadFile({ file });
        if (file_url) current.push(file_url);
      }
      updateForm({ images: current.slice(0, 30) });
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('שגיאה בהעלאת תמונות');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    const arr = Array.isArray(form.images) ? [...form.images] : [];
    arr.splice(idx, 1);
    updateForm({ images: arr });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(form.images || []);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateForm({ images: reordered });
  };

  const openCropper = (src) => {
    setCropSrc(src);
    setCropOpen(true);
  };

  const handleCropComplete = async (blob) => {
    const file = new File([blob], "crop.jpg", { type: "image/jpeg" });
    const { file_url } = await UploadFile({ file });
    if (file_url) {
      const arr = Array.isArray(form.images) ? [...form.images] : [];
      const idx = arr.findIndex((s) => s === cropSrc);
      if (idx >= 0) {
        arr[idx] = file_url;
        updateForm({ images: arr });
      }
    }
    setCropOpen(false);
    setCropSrc(null);
  };

  const handleSave = async () => {
    if (!listing || !user) {
      setError("שגיאת מערכת - נתונים חסרים.");
      toast.error("שגיאת מערכת - נתונים חסרים.");
      return;
    }

    // Permission check before saving as per outline
    if (listing.created_by !== user.email && user.role !== 'admin') {
      setError("אין לך הרשאה לשמור את השינויים.");
      toast.error("אין לך הרשאה לשמור את השינויים.");
      return;
    }

    if (!form.title || !form.description || !form.contact_phone || (!form.category_id && !form.custom_category_name)) {
      setError('אנא מלא את כל השדות הנדרשים: קטגוריה, כותרת, תיאור וטלפון ליצירת קשר.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const validImages = Array.isArray(form.images) ? form.images.filter(imageUrl => {
        if (!imageUrl || typeof imageUrl !== 'string') return false;

        const url = imageUrl.toLowerCase();
        const isImageExtension = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?|$)/i);
        const isPdf = url.includes('.pdf');
        const isDoc = url.match(/\.(doc|docx|txt|rtf)(\?|$)/i);

        if (isPdf || isDoc) {
          return false;
        }

        return isImageExtension || !url.includes('.');
      }) : [];
      
      const isCustom = form.category_id === 'other' || form.subcategory_id === 'other' || form.subsubcategory_id === 'other';

      const updateData = {
        title: form.title.trim(),
        business_name: form.business_name?.trim() || null,
        description: form.description.trim(),
        contact_phone: form.contact_phone.trim(),
        website_url: form.website_url?.trim() || null,
        address: form.address?.trim() || null,

        price: form.price && String(form.price).trim() ? parseFloat(form.price) : null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,

        images: validImages,

        hours: form.hours && Object.keys(form.hours?.schedule || {}).length > 0
          ? JSON.stringify(form.hours)
          : null,

        special_fields: form.special_fields || {},

        // New category logic
        is_custom_category: isCustom,
        category_id: form.category_id !== 'other' ? form.category_id || null : null,
        custom_category_name: form.category_id === 'other' ? (form.custom_category_name || '').trim() : null,
        subcategory_id: form.subcategory_id !== 'other' ? form.subcategory_id || null : null,
        custom_subcategory_name: form.subcategory_id === 'other' ? (form.custom_subcategory_name || '').trim() : null,
        subsubcategory_id: form.subsubcategory_id !== 'other' ? form.subsubcategory_id || null : null,
        custom_subsubcategory_name: form.subsubcategory_id === 'other' ? (form.custom_subsubcategory_name || '').trim() : null,

        custom_notes: form.custom_notes?.trim() || null,

        // CRITICAL CHANGES: Return listing to pending state after any edit
        approval_status: 'pending', // "pending" as per outline
        is_active: false, // Deactivate until approved again
        rejection_reason: null, // Clear any previous rejection reason
      };

      await Listing.update(id, updateData);

      setSuccess('המודעה עודכנה בהצלחה ונשלחה לאישור מחדש.');
      toast.success("המודעה עודכנה ונשלחה לאישור מחדש!"); // Toast notification

      setTimeout(() => {
        navigate(createPageUrl('MyListings'));
      }, 2000);

    } catch (err) {
      console.error('❌ EditListing: Update failed for ID:', id, 'Error:', err);
      console.error('❌ Full error object:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status
      });

      let errorMessage = "שגיאה בשמירת המודעה.";

      if (err.response?.status === 403) {
        errorMessage = "אין לך הרשאה לערוך מודעה זו. ייתכן שהבעלות על המודעה השתנתה או שאין לך את התפקיד המתאים.";
      } else if (err.response?.status === 422) {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail) && detail.length > 0 && detail[0].loc) {
          errorMessage = `שגיאת אימות בשדה '${detail[0].loc[1]}': ${detail[0].msg}`;
        } else if (typeof detail === 'string' && detail.includes('price')) {
          errorMessage = 'שגיאה במחיר - אנא הכנס מספר תקין או השאר ריק.';
        } else {
          errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את כל השדות.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage + " (פרטים נוספים בקונסול המפתח).");
      toast.error(`שגיאה בשמירת המודעה: ${errorMessage}`); // Toast notification
    } finally {
      setSaving(false);
    }
  };

  // Validation helpers
  const phoneError = React.useMemo(() => {
    const phone = String(form.contact_phone || "");
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 9 && !phone.includes("*")) {
      return "מספר טלפון לא תקין";
    }
    return "";
  }, [form.contact_phone]);

  const websiteError = React.useMemo(() => {
    const website = form.website_url || "";
    if (!website) return "";
    if (website && !website.match(/^https?:\/\/.+\..+/)) {
      return "כתובת אתר לא תקינה";
    }
    return "";
  }, [form.website_url]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען מודעה...</p>
        </div>
      </div>
    );
  }

  if (error && !listing) { // Display error if listing failed to load
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-red-600">{error}</h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(createPageUrl('MyListings'))}
          >
            <ArrowLeft className="ml-2 h-4 w-4" /> חזרה למודעות שלי
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">עריכת מודעה</h1>
            <p className="text-gray-600 mt-1">עדכן את פרטי המודעה שלך</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('MyListings'))}
          >
            <ArrowLeft className="ml-2 h-4 w-4" /> חזרה
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* קטגוריה */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  קטגוריה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Category */}
                <div>
                  <Label>קטגוריה ראשית *</Label>
                  <Select
                    value={form.category_id || ""}
                    onValueChange={(value) => {
                        updateForm({
                            category_id: value,
                            subcategory_id: '', // Reset subcategory when main category changes
                            subsubcategory_id: '', // Reset sub-subcategory
                            is_custom_category: value === 'other', // Set custom flag
                            custom_category_name: value === 'other' ? form.custom_category_name : '', // Keep if 'other', else clear
                            custom_subcategory_name: '', // Clear custom sub
                            custom_subsubcategory_name: '', // Clear custom sub-sub
                        });
                    }}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה ראשית..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mainCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        <SelectItem value="other">אחר / בקשה חדשה</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.category_id === 'other' && (
                    <Input
                        value={form.custom_category_name}
                        onChange={(e) => updateForm({ custom_category_name: e.target.value })}
                        placeholder="הקלד שם קטגוריה חדשה..."
                        className="mt-2"
                    />
                  )}
                </div>

                {/* Subcategory */}
                {(form.category_id && form.category_id !== 'other' && subCategories.length > 0) && (
                  <div>
                      <Label>תת קטגוריה</Label>
                      <Select
                          value={form.subcategory_id || ""}
                          onValueChange={(value) => {
                              updateForm({
                                  subcategory_id: value,
                                  subsubcategory_id: '', // Reset sub-subcategory
                                  is_custom_category: (value === 'other' || form.category_id === 'other') ? true : false,
                                  custom_subcategory_name: value === 'other' ? form.custom_subcategory_name : '', // Keep if 'other', else clear
                                  custom_subsubcategory_name: '', // Clear custom sub-sub
                              });
                          }}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="בחר תת קטגוריה (אופציונלי)..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value={null}>-- ללא תת קטגוריה --</SelectItem> {/* Changed to empty string for consistent reset */}
                              {subCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                              <SelectItem value="other">אחר / בקשה חדשה</SelectItem>
                          </SelectContent>
                      </Select>
                      {form.subcategory_id === 'other' && (
                          <Input
                              value={form.custom_subcategory_name}
                              onChange={(e) => updateForm({ custom_subcategory_name: e.target.value })}
                              placeholder="הקלד שם תת קטגוריה חדשה..."
                              className="mt-2"
                          />
                      )}
                  </div>
                )}

                {/* Sub-Subcategory */}
                {(form.subcategory_id && form.subcategory_id !== 'other' && subSubCategories.length > 0) && (
                  <div>
                      <Label>תת-תת קטגוריה</Label>
                      <Select
                          value={form.subsubcategory_id || ""}
                          onValueChange={(value) => {
                              updateForm({
                                  subsubcategory_id: value,
                                  is_custom_category: (value === 'other' || form.category_id === 'other' || form.subcategory_id === 'other') ? true : false,
                                  custom_subsubcategory_name: value === 'other' ? form.custom_subsubcategory_name : '', // Keep if 'other', else clear
                              });
                          }}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="בחר תת-תת קטגוריה (אופציונלי)..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value={null}>-- ללא --</SelectItem> {/* Changed to empty string for consistent reset */}
                              {subSubCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                              <SelectItem value="other">אחר / בקשה חדשה</SelectItem>
                          </SelectContent>
                      </Select>
                      {form.subsubcategory_id === 'other' && (
                          <Input
                              value={form.custom_subsubcategory_name}
                              onChange={(e) => updateForm({ custom_subsubcategory_name: e.target.value })}
                              placeholder="הקלד שם תת-תת קטגוריה חדשה..."
                              className="mt-2"
                          />
                      )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* פרטים בסיסיים */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  פרטים בסיסיים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>שם העסק *</Label>
                    <Input
                      value={form.business_name}
                      onChange={(e) => updateForm({ business_name: e.target.value })}
                      placeholder="שם העסק המלא"
                    />
                  </div>
                  <div>
                    <Label>כותרת המודעה *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => updateForm({ title: e.target.value })}
                      placeholder="כותרת קצרה ומשכת"
                      maxLength={80}
                    />
                  </div>
                </div>

                <div>
                  <Label>תיאור העסק *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="תאר את השירותים והיתרונות שלך..."
                    className="min-h-[120px]"
                    maxLength={1000}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> טלפון *
                    </Label>
                    <Input
                      value={form.contact_phone}
                      onChange={(e) => updateForm({ contact_phone: e.target.value })}
                      placeholder="050-1234567"
                      className={phoneError ? "border-red-500" : ""}
                    />
                    {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" /> אתר אינטרנט
                    </Label>
                    <Input
                      value={form.website_url}
                      onChange={(e) => updateForm({ website_url: e.target.value })}
                      placeholder="https://www.example.com"
                      className={websiteError ? "border-red-500" : ""}
                    />
                    {websiteError && <p className="text-red-500 text-sm mt-1">{websiteError}</p>}
                  </div>
                </div>

                {form.category_id && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> מחיר (אופציונלי)
                    </Label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => updateForm({ price: e.target.value })}
                      placeholder="מחיר בשקלים (רק מספרים)"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      השאר ריק אם אין מחיר קבוע
                    </p>
                  </div>
                )}

                <AddressInput
                  value={form.address}
                  onChange={(address) => updateForm({ address })}
                  onLocationChange={(locationData) => {
                    updateForm({
                      address: locationData.formatted_address,
                      lat: locationData.lat,
                      lng: locationData.lng
                    });
                  }}
                  placeholder="הקלד כתובת או שם עסק..."
                  label="כתובת העסק"
                />

                {form.lat && form.lng && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">כתובת אומתה עם קואורדינטות</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${form.lat},${form.lng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <MapPin className="w-3 h-3 ml-1" />
                          פתח במפות
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `https://waze.com/ul?ll=${form.lat},${form.lng}&navigate=yes`;
                            window.open(url, '_blank');
                          }}
                        >
                          ניווט
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* תמונות */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  תמונות ({form.images.length}/30)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upload Button */}
                <div className="mb-4 flex items-center gap-2">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading || form.images.length >= 30}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> מעלה...</>
                    ) : (
                      <><Upload className="w-4 h-4 ml-2" /> הוסף תמונות</>
                    )}
                  </Button>
                  <span className="text-sm text-gray-500">
                    עד 30 תמונות. התמונה הראשונה תשמש כתמונה ראשית.
                  </span>
                </div>

                {/* Images Grid */}
                {form.images.length > 0 && (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="images" direction="horizontal">
                      {(provided) => (
                        <div
                          className="grid grid-cols-2 md:grid-cols-4 gap-3"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {form.images.map((image, index) => (
                            <Draggable draggableId={image} index={index} key={image}>
                              {(draggableProvided) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  className="relative group rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50"
                                >
                                  <img
                                    src={image}
                                    alt={`תמונה ${index + 1}`}
                                    className="w-full h-24 object-cover"
                                  />

                                  {/* Actions */}
                                  <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      onClick={() => openCropper(image)}
                                      className="bg-white/90 text-gray-700 px-2 py-1 text-xs rounded flex items-center gap-1"
                                      title="חתוך"
                                    >
                                      <Scissors className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="bg-white/90 text-red-600 px-2 py-1 text-xs rounded"
                                      title="הסר"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Drag Handle */}
                                  <div
                                    className="absolute bottom-1 left-1 bg-blue-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1 cursor-grab"
                                    {...draggableProvided.dragHandleProps}
                                  >
                                    <GripVertical className="w-3 h-3" />
                                    גרור
                                  </div>

                                  {/* Main image indicator */}
                                  {index === 0 && (
                                    <div className="absolute top-1 right-1 bg-green-500 text-white px-2 py-0.5 text-xs rounded">
                                      ראשית
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* שעות פעילות */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  שעות פעילות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessHoursComponent
                  value={form.hours}
                  onChange={(hours) => updateForm({ hours })}
                />
              </CardContent>
            </Card>

            {/* תגיות */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  תגיות (האשטאגים)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagsInput
                  value={form.special_fields.tags || []}
                  onChange={(tags) => updateSpecialField('tags', tags)}
                  placeholder="לדוגמה: זול, איכותי, מהיר..."
                  maxTags={15}
                />
              </CardContent>
            </Card>

            {/* מחירון/מנו */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MenuIcon className="w-5 h-5" />
                  מחירון / מנו (אופציונלי)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MenuBuilder
                  value={form.special_fields.menu}
                  onChange={(menu) => updateSpecialField('menu', menu)}
                />
              </CardContent>
            </Card>

            {/* New custom fields based on outline: custom_notes etc. - not explicitly placed in UI, but added to form state & save */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  הערות פנימיות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label>הערות למנהלים (לא יוצגו לקהל)</Label>
                <Textarea
                  value={form.custom_notes}
                  onChange={(e) => updateForm({ custom_notes: e.target.value })}
                  placeholder="הערות פנימיות למערכת..."
                  className="min-h-[80px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  מידע זה ישמש לצרכים פנימיים בלבד ולא יוצג בדף המודעה.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פעולות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.description || !form.contact_phone} // The category validation is in handleSave itself now.
                  className="w-full"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> שומר...</>
                  ) : (
                    <><Save className="w-4 h-4 ml-2" /> שמור שינויים</>
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => updateForm({ is_active: checked })}
                    disabled // Disabled because it will be set to false after save until re-approved
                  />
                  <Label className="text-sm text-gray-600">
                    מודעה פעילה (יופעל לאחר אישור)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הערות חשובות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• לאחר השמירה, המודעה תישלח לאישור מנהל המערכת</p>
                  <p>• המודעה תהפוך ללא פעילה עד לקבלת האישור</p>
                  <p>• תקבל עדכון במייל כאשר המודעה תאושר</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Cropper Modal */}
        <ImageCropper
          isOpen={cropOpen}
          imageUrl={cropSrc}
          onCancel={() => { setCropOpen(false); setCropSrc(null); }}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
}

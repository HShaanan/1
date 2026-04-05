import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Store,
  Users,
  Upload,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Camera,
} from "lucide-react";
import { createPageUrl } from "@/utils";

const STEPS = [
  { label: "סוג ופרטים בסיסיים", icon: Store },
  { label: "פרטים נוספים", icon: Users },
  { label: "תמונות", icon: Camera },
  { label: "תשלום", icon: CreditCard },
];

const PLAN_BENEFITS = [
  "חשיפה מלאה בתוצאות החיפוש",
  "קבלת חוות דעת מלקוחות",
  "לוח בקרה עם נתונים וסטטיסטיקות",
  "תמיכה טכנית מלאה",
];

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [specialtyInput, setSpecialtyInput] = useState("");

  const [formData, setFormData] = useState({
    listing_type: "",
    name: "",
    category_id: "",
    professional_title: "",
    specialties: [],
    city: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
    service_area: "",
    years_experience: "",
    price_range: "",
    logo_url: "",
    cover_image_url: "",
    gallery_urls: [],
  });

  // Auth check and prefill
  useEffect(() => {
    async function init() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          navigate(createPageUrl("Login"));
          return;
        }
        const user = await User.me();
        if (user?.email) {
          setFormData((prev) => ({ ...prev, email: user.email }));
        }
      } catch {
        navigate(createPageUrl("Login"));
      }
    }
    init();
  }, [navigate]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await Category.list();
        setCategories(cats || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addSpecialty = () => {
    const trimmed = specialtyInput.trim();
    if (trimmed && !formData.specialties.includes(trimmed)) {
      updateField("specialties", [...formData.specialties, trimmed]);
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (index) => {
    updateField(
      "specialties",
      formData.specialties.filter((_, i) => i !== index)
    );
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const result = await base44.integrations.Core.UploadFile(file);
      updateField(field, result.file_url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.gallery_urls.length >= 5) return;
    try {
      setLoading(true);
      const result = await base44.integrations.Core.UploadFile(file);
      updateField("gallery_urls", [...formData.gallery_urls, result.file_url]);
    } catch (err) {
      console.error("Gallery upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeGalleryImage = (index) => {
    updateField(
      "gallery_urls",
      formData.gallery_urls.filter((_, i) => i !== index)
    );
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 0) {
      if (!formData.listing_type)
        newErrors.listing_type = "יש לבחור סוג רישום";
      if (!formData.name.trim()) newErrors.name = "שם הוא שדה חובה";
      if (!formData.category_id) newErrors.category_id = "יש לבחור קטגוריה";
      if (!formData.city.trim()) newErrors.city = "עיר היא שדה חובה";
      if (formData.listing_type === "professional") {
        if (!formData.professional_title.trim())
          newErrors.professional_title = "תואר מקצועי הוא שדה חובה";
      }
    }

    if (currentStep === 1) {
      if (!formData.phone.trim()) newErrors.phone = "טלפון הוא שדה חובה";
      if (!formData.email.trim()) newErrors.email = "אימייל הוא שדה חובה";
      if (!formData.description.trim())
        newErrors.description = "תיאור הוא שדה חובה";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const goBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      // Save pending registration to localStorage before redirect
      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify(formData)
      );

      const { data, error } = await base44.auth.me().then(async (user) => {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/createSubscriptionPayment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(await import("@/lib/supabaseClient")).supabase.auth.getSession().then((s) => s.data?.session?.access_token)}`,
            },
            body: JSON.stringify({
              registration_data: formData,
              user_id: user.id,
              plan: "monthly",
              amount: 49,
            }),
          }
        );
        return response.json();
      });

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Step Indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                    ? "bg-blue-600 text-white ring-4 ring-blue-200"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                i === currentStep
                  ? "text-blue-600 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 mt-[-18px] ${
                i < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Step 1: Type & Basic Info ──
  const Step1 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">
          סוג הרישום
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField("listing_type", "business")}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 hover:shadow-md ${
              formData.listing_type === "business"
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white"
            }`}
          >
            <Store
              className={`w-10 h-10 ${
                formData.listing_type === "business"
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            />
            <span
              className={`text-lg font-semibold ${
                formData.listing_type === "business"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              עסק
            </span>
          </button>
          <button
            type="button"
            onClick={() => updateField("listing_type", "professional")}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 hover:shadow-md ${
              formData.listing_type === "professional"
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white"
            }`}
          >
            <Users
              className={`w-10 h-10 ${
                formData.listing_type === "professional"
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            />
            <span
              className={`text-lg font-semibold ${
                formData.listing_type === "professional"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              מומחה
            </span>
          </button>
        </div>
        {errors.listing_type && (
          <p className="text-red-500 text-sm mt-1">{errors.listing_type}</p>
        )}
      </div>

      <div>
        <Label htmlFor="name">
          {formData.listing_type === "professional" ? "שם מלא" : "שם העסק"}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder={
            formData.listing_type === "professional"
              ? "הזן את שמך המלא"
              : "הזן את שם העסק"
          }
          className="mt-1"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category_id">קטגוריה</Label>
        <Select
          value={formData.category_id}
          onValueChange={(val) => updateField("category_id", val)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
        )}
      </div>

      {formData.listing_type === "professional" && (
        <>
          <div>
            <Label htmlFor="professional_title">תואר מקצועי</Label>
            <Input
              id="professional_title"
              value={formData.professional_title}
              onChange={(e) =>
                updateField("professional_title", e.target.value)
              }
              placeholder="לדוגמה: עורך דין, רואה חשבון"
              className="mt-1"
            />
            {errors.professional_title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.professional_title}
              </p>
            )}
          </div>

          <div>
            <Label>התמחויות</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                placeholder="הוסף התמחות"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialty();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSpecialty}>
                הוסף
              </Button>
            </div>
            {formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialties.map((s, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeSpecialty(i)}
                  >
                    {s} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <Label htmlFor="city">עיר</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder="הזן עיר"
          className="mt-1"
        />
        {errors.city && (
          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
        )}
      </div>
    </div>
  );

  // ── Step 2: Details ──
  const Step2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="phone">טלפון</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="050-0000000"
          className="mt-1"
          dir="ltr"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="email@example.com"
          className="mt-1"
          dir="ltr"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="website">אתר אינטרנט (אופציונלי)</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => updateField("website", e.target.value)}
          placeholder="https://www.example.com"
          className="mt-1"
          dir="ltr"
        />
      </div>

      <div>
        <Label htmlFor="address">כתובת (רחוב)</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="הזן כתובת"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="ספר על העסק או השירותים שלך..."
          rows={4}
          className="mt-1"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {formData.listing_type === "professional" && (
        <>
          <div>
            <Label htmlFor="service_area">
              אזור שירות (ערים, מופרדות בפסיק)
            </Label>
            <Input
              id="service_area"
              value={formData.service_area}
              onChange={(e) => updateField("service_area", e.target.value)}
              placeholder="ירושלים, בני ברק, אשדוד"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="years_experience">שנות ניסיון</Label>
            <Input
              id="years_experience"
              type="number"
              value={formData.years_experience}
              onChange={(e) =>
                updateField("years_experience", e.target.value)
              }
              placeholder="לדוגמה: 10"
              className="mt-1"
              dir="ltr"
            />
          </div>
        </>
      )}

      {formData.listing_type === "business" && (
        <div>
          <Label htmlFor="price_range">טווח מחירים</Label>
          <Select
            value={formData.price_range}
            onValueChange={(val) => updateField("price_range", val)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="בחר טווח מחירים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="₪">₪ - חסכוני</SelectItem>
              <SelectItem value="₪₪">₪₪ - בינוני</SelectItem>
              <SelectItem value="₪₪₪">₪₪₪ - פרימיום</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // ── Step 3: Images ──
  const Step3 = () => (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <Label className="text-base font-semibold mb-2 block">לוגו</Label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">העלאת לוגו</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "logo_url")}
            />
          </label>
          {formData.logo_url && (
            <img
              src={formData.logo_url}
              alt="לוגו"
              className="w-16 h-16 object-cover rounded-lg border"
            />
          )}
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <Label className="text-base font-semibold mb-2 block">תמונת כיסוי</Label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
            <Camera className="w-4 h-4" />
            <span className="text-sm font-medium">העלאת תמונת כיסוי</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "cover_image_url")}
            />
          </label>
          {formData.cover_image_url && (
            <img
              src={formData.cover_image_url}
              alt="תמונת כיסוי"
              className="w-24 h-16 object-cover rounded-lg border"
            />
          )}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          גלריית תמונות (עד 5)
        </Label>
        {formData.gallery_urls.length < 5 && (
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">העלאת תמונה לגלריה</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </label>
        )}
        {formData.gallery_urls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
            {formData.gallery_urls.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt={`גלריה ${i + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 left-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-400 mt-2">
          {formData.gallery_urls.length}/5 תמונות הועלו
        </p>
      </div>

      {loading && (
        <p className="text-blue-600 text-sm animate-pulse">מעלה תמונה...</p>
      )}
    </div>
  );

  // ── Step 4: Payment ──
  const Step4 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">מנוי חודשי</h3>
          <div className="mt-2">
            <span className="text-4xl font-extrabold text-blue-600">₪49</span>
            <span className="text-gray-500 mr-1">/חודש</span>
          </div>
        </div>

        <ul className="space-y-3">
          {PLAN_BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border">
        <h4 className="font-semibold text-gray-700 mb-2">סיכום הרישום</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium">סוג:</span>{" "}
            {formData.listing_type === "business" ? "עסק" : "מומחה"}
          </p>
          <p>
            <span className="font-medium">שם:</span> {formData.name}
          </p>
          <p>
            <span className="font-medium">עיר:</span> {formData.city}
          </p>
          <p>
            <span className="font-medium">טלפון:</span> {formData.phone}
          </p>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          "מעבד..."
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            לתשלום
          </span>
        )}
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1 />;
      case 1:
        return <Step2 />;
      case 2:
        return <Step3 />;
      case 3:
        return <Step4 />;
      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            הרשמת עסק או מומחה
          </h1>
          <p className="text-gray-500 mt-2">
            הצטרף לפלטפורמה וקבל חשיפה ללקוחות חדשים
          </p>
        </div>

        <StepIndicator />

        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={goBack} className="gap-1">
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
          ) : (
            <div />
          )}
          {currentStep < STEPS.length - 1 && (
            <Button onClick={goNext} className="gap-1">
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Tag, Plus, Shield, FileText, Check } from "lucide-react";
import { createPageUrl } from "@/utils";
import { geocodeAddress } from "@/functions/geocodeAddress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Wizard Imports
import { Category } from "@/entities/Category";
import { BusinessPage } from "@/entities/BusinessPage";
import WizardLayout from "@/components/wizard/WizardLayout";
import StepDetails from "@/components/wizard/steps/StepDetails";
import StepReview from "@/components/wizard/steps/StepReview";
import BusinessRegistrationForm from "../components/wizard/BusinessRegistrationForm";

// Fields Components
import BusinessHoursComponent from "@/components/wizard/fields/BusinessHoursComponent";
import MenuBuilder from "@/components/wizard/fields/MenuBuilder";
import KashrutSection from "@/components/fields/KashrutSection";

// עדכון: המערך מאוחד ל-2 שלבים בלבד
const steps = [
  { key: "details", name: "פרטי העסק", icon: FileText, desc: "מידע, שירותים ותמונות" },
  { key: "review", name: "סיכום", icon: Check, desc: "בדיקה ושליחה" }
];

const HEBREW_TO_ENGLISH_DAYS_MAP = {
  'יום ראשון': 'sunday',
  'יום שני': 'monday',
  'יום שלישי': 'tuesday',
  'יום רביעי': 'wednesday',
  'יום חמישי': 'thursday',
  'יום שישי': 'friday',
  'שבת': 'saturday'
};

export default function CreateBusinessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizardActive, setWizardActive] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Wizard State
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  // Admin Override State
  const [overrideOwnerEmail, setOverrideOwnerEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [form, setForm] = useState({
    termsAccepted: false,
    category_id: "",
    subcategory_ids: [], // Changed from subcategory_id to subcategory_ids (array)
    subsubcategory_id: "",
    is_custom_category: false,
    custom_category_name: "",
    custom_subcategory_name: "",
    custom_subsubcategory_name: "",
    custom_notes: "",
    title: "",
    business_name: "",
    description: "",
    contact_phone: "",
    website_url: "",
    address: "",
    price_range: "",
    images: [],
    hours: {},
    special_fields: {},
    kashrut_authority_type: "",
    kashrut_authority_name: "",
    kashrut_rabbinate_city: "",
    kashrut_logo_url: "",
    kashrut_certificate_urls: []
  });
  const [extraData, setExtraData] = useState({});

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSpecialFieldChange = useCallback(
    (field, newValue) => {
      console.log("🍔 handleSpecialFieldChange called:", field, newValue);
      updateForm({
        special_fields: { ...(form.special_fields || {}), [field]: newValue }
      });
    },
    [updateForm, form.special_fields]
  );

  // User Authentication - Enforce Business User
  useEffect(() => {
    const checkBusinessUser = async () => {
      try {
        const currentUser = await User.me();

        if (currentUser.user_type !== 'business' && currentUser.role !== 'admin') {
          alert("רק משתמשים עסקיים יכולים ליצור עמוד עסק. אנא שדרג את החשבון שלך.");
          window.location.href = createPageUrl("Browse");
          return;
        }

        setIsAdmin(currentUser.role === 'admin');
        setIsLoading(false);
      } catch (err) {
        try {
          User.loginWithRedirect(window.location.href);
        } catch (redirectErr) {
          console.error("Failed to initiate login redirect:", redirectErr);
          setError("שגיאה בהתחברות. אנא נסה שוב.");
          setIsLoading(false);
        }
      }
    };
    checkBusinessUser();
  }, []);

  // Load Categories when registration is complete
  useEffect(() => {
    if (!registrationComplete) return;
    let mounted = true;
    setCatsLoading(true);
    (async () => {
      try {
        const list = await Category.list("sort_order");
        if (!mounted) return;
        setCategories(Array.isArray(list) ? list : []);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => {mounted = false;};
  }, [registrationComplete]);

  // הוספת useEffect להסתרת header בעמוד זה
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      header.style.display = 'none';
    }

    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = '';
      }
    };
  }, []);

  const validation = useMemo(() => {
    const phoneRaw = String(form.contact_phone || "");
    const cleanPhone = phoneRaw.replace(/\D/g, "");
    const hasValidPhone = cleanPhone.length >= 9 || phoneRaw.includes("*");

    return {
      basic: !!form.title?.trim() && !!form.description?.trim() && hasValidPhone && !!form.category_id
    };
  }, [form]);

  const canNext = useMemo(() => {
    const key = steps[stepIndex].key;
    if (key === "details") return validation.basic;
    return true;
  }, [stepIndex, validation]);

  const onPrev = () => setStepIndex((i) => Math.max(0, i - 1));
  const onNext = async () => {
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentLabels = useMemo(() => {
    const find = (id) => (categories || []).find((c) => c.id === id);
    if (form.is_custom_category) {
      return {
        cat: form.custom_category_name || "התאמה אישית",
        sub: form.custom_subcategory_name || "",
        subsub: form.custom_subsubcategory_name || ""
      };
    }
    const subcategoryNames = Array.isArray(form.subcategory_ids)
      ? form.subcategory_ids.map(id => find(id)?.name).filter(Boolean).join(", ")
      : "";
    return {
      cat: find(form.category_id)?.name || "",
      sub: subcategoryNames || "",
      subsub: find(form.subsubcategory_id)?.name || ""
    };
  }, [categories, form]);

  const submitBusinessPage = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const user = await User.me();
      if (!user || !user.email) {
        throw new Error("לא ניתן לזהות את המשתמש. אנא התחבר מחדש.");
      }

      if (user.user_type !== 'business' && user.role !== 'admin') {
        throw new Error("רק משתמשים עסקיים יכולים ליצור עמוד עסק.");
      }

      const safeTrim = (v) => (typeof v === "string" ? v.trim() : "");
      const nullable = (v) => {
        const s = safeTrim(v);
        return s.length ? s : null;
      };

      let ownerEmail = user.email.trim().toLowerCase();
      const overrideEmailSafe = safeTrim(overrideOwnerEmail || "");
      if (isAdmin && overrideEmailSafe) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(overrideEmailSafe)) {
          throw new Error("פורמט האימייל לשיוך בעלים אינו תקין.");
        }
        ownerEmail = overrideEmailSafe.toLowerCase();
      }

      console.log("=== Creating Business Page ===");
      console.log("Owner Email:", ownerEmail);
      console.log("User Email:", user.email);
      console.log("Is Admin:", isAdmin);
      console.log("Override Email:", overrideEmailSafe || "N/A");

      let coordinates = null;
      const addressSafe = safeTrim(form.address);
      if (addressSafe) {
        try {
          const { data } = await geocodeAddress({ address: addressSafe });
          if (data?.lat && data?.lng) {
            coordinates = { lat: data.lat, lng: data.lng };
          }
        } catch (err) {
          console.warn("Failed to geocode address, proceeding without coordinates:", err);
        }
      }

      const serialNumber = `BP${Date.now()}`.slice(-8) + Math.random().toString(36).substring(2, 6).toUpperCase();
      const imagesToSave = Array.isArray(form.images) ? form.images : [];

      const businessPageData = {
        serial_number: serialNumber,
        business_owner_email: ownerEmail,
        business_name: safeTrim(form.business_name),
        display_title: safeTrim(form.title),
        description: safeTrim(form.description),
        contact_phone: safeTrim(form.contact_phone),
        website_url: nullable(form.website_url),
        address: nullable(form.address),
        price_range: form.price_range || null,
        category_id: form.category_id || null,
        subcategory_ids: Array.isArray(form.subcategory_ids) && form.subcategory_ids.length > 0 ? form.subcategory_ids : null, // Store as array, or null if empty
        subcategory_id: Array.isArray(form.subcategory_ids) && form.subcategory_ids.length > 0 ? form.subcategory_ids[0] : null, // For backward compatibility, use first ID
        subsubcategory_id: form.subsubcategory_id || null,
        is_custom_category: !!form.is_custom_category,
        custom_category_name: nullable(form.custom_category_name),
        custom_subcategory_name: nullable(form.custom_subcategory_name),
        custom_subsubcategory_name: nullable(form.custom_subsubcategory_name),
        custom_notes: nullable(form.custom_notes),
        special_fields: form.special_fields || {},
        images: imagesToSave,
        hours: Object.keys(form?.hours?.schedule || {}).length > 0 ? JSON.stringify(form.hours) : null,
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
        metadata: extraData.metadata || {},
        kashrut_authority_type: form.kashrut_authority_type || null,
        kashrut_authority_name: nullable(form.kashrut_authority_name),
        kashrut_rabbinate_city: nullable(form.kashrut_rabbinate_city),
        kashrut_logo_url: nullable(form.kashrut_logo_url),
        kashrut_certificate_urls: Array.isArray(form.kashrut_certificate_urls) && form.kashrut_certificate_urls.length > 0 ? form.kashrut_certificate_urls : null,
        approval_status: "pending",
        is_active: false,
        subscription_level: user.subscription_type || "basic"
      };

      console.log("Business Page Data to be created:");
      console.log(JSON.stringify(businessPageData, null, 2));

      if (!businessPageData.business_name) throw new Error("שם העסק חסר.");
      if (!businessPageData.display_title) throw new Error("כותרת המודעה חסרה.");
      if (!businessPageData.description) throw new Error("תיאור העסק חסר.");
      if (!businessPageData.contact_phone) throw new Error("מספר טלפון חסר.");
      if (!businessPageData.category_id) throw new Error("קטגוריה ראשית חסרה.");

      const newBusinessPage = await BusinessPage.create(businessPageData);

      console.log("=== Business Page Created Successfully ===");
      console.log("ID:", newBusinessPage.id);
      console.log("Owner:", newBusinessPage.business_owner_email);

      setSuccessMessage("עמוד העסק נוצר בהצלחה ונשלח לאישור!");

      setTimeout(() => {
        window.location.href = createPageUrl("MyBusinessPages");
      }, 1200);

    } catch (err) {
      console.error("=== Submit Error ===");
      console.error("Error:", err);
      console.error("Message:", err?.message);
      setSubmitError(err?.message || "שגיאה ביצירת עמוד העסק");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgentApply = useCallback((patch) => {
    console.log("🎯 handleAgentApply received patch:", patch);

    if (!patch || typeof patch !== 'object') {
      console.log("❌ Invalid patch received");
      return;
    }

    try {
      const updatedForm = { ...form };
      let hasChanges = false;

      if (patch.title && patch.title !== form.title) {
        updatedForm.title = patch.title;
        hasChanges = true;
        console.log("📝 Title (display_title) updated:", patch.title);
      }

      if (patch.description && patch.description !== form.description) {
        updatedForm.description = patch.description;
        hasChanges = true;
        console.log("📝 Description updated");
      }

      if (patch.contact_phone && patch.contact_phone !== form.contact_phone) {
        updatedForm.contact_phone = patch.contact_phone;
        hasChanges = true;
        console.log("📱 Phone updated:", patch.contact_phone);
      }

      if (patch.website_url && patch.website_url !== form.website_url) {
        updatedForm.website_url = patch.website_url;
        hasChanges = true;
        console.log("🌐 Website updated:", patch.website_url);
      }

      if (patch.address && patch.address !== form.address) {
        updatedForm.address = patch.address;
        hasChanges = true;
        console.log("📍 Address updated:", patch.address);
      }

      if (patch.price_range && patch.price_range !== form.price_range) {
        updatedForm.price_range = patch.price_range;
        hasChanges = true;
        console.log("💰 Price range updated:", patch.price_range);
      }

      if (patch.images && Array.isArray(patch.images) && patch.images.length > 0) {
        const existingImages = form.images || [];
        const newImages = patch.images;
        const combined = [...newImages, ...existingImages.filter((img) => !newImages.includes(img))];
        updatedForm.images = combined.slice(0, 30);
        hasChanges = true;
        console.log("📸 Images updated (merged):", updatedForm.images.length, "images");
      }

      if (patch.hours && typeof patch.hours === 'object') {
        updatedForm.hours = patch.hours;
        hasChanges = true;
        console.log("🕒 Hours updated:", patch.hours);
      }

      if (patch.special_fields && typeof patch.special_fields === 'object') {
        updatedForm.special_fields = {
          ...(form.special_fields || {}),
          ...patch.special_fields
        };
        hasChanges = true;
        console.log("⚙️ Special fields updated:", patch.special_fields);
      }

      if (hasChanges) {
        console.log("🔄 Applying form updates...");
        setForm(updatedForm);

        if (patch.google_place_id || patch.coordinates || patch.metadata) {
          const newExtraData = {
            coordinates: patch.coordinates || extraData.coordinates,
            metadata: {
              ...(extraData.metadata || {}),
              google_place_id: patch.google_place_id,
              google_maps_url: patch.google_maps_url,
              google_rating: patch.rating,
              google_total_ratings: patch.total_ratings,
              raw_google_data: patch.raw_google_data,
              ...(patch.metadata || {})
            }
          };
          setExtraData(newExtraData);
          console.log("💾 Extra data updated:", newExtraData);
        }

        console.log("✅ Form update completed successfully");
      } else {
        console.log("⚠️ No changes detected in patch");
      }

    } catch (error) {
      console.error("💥 Error applying agent patch:", error);
    }
  }, [form, extraData, setForm, setExtraData]);

  const handleHoursUpdate = useCallback(
    (h) => {
      updateForm({ hours: h });
    },
    [updateForm]
  );

  const handleRegistrationComplete = (data) => {
    setRegistrationComplete(true);
    updateForm({
      business_name: data.businessName,
      contact_phone: `${data.phonePrefix}${data.phone}`,
      address: data.street,
      termsAccepted: true,
      category_id: data.category_id,
      subcategory_ids: data.subcategory_ids || [], // Updated to handle array
      subsubcategory_id: data.subsubcategory_id,
      is_custom_category: data.is_custom_category,
      custom_category_name: data.custom_category_name,
      custom_subcategory_name: data.custom_subcategory_name,
      custom_subsubcategory_name: data.custom_subsubcategory_name,
      custom_notes: data.custom_notes,
      title: data.businessName
    });
    setWizardActive(true);
  };

  const hasHours = useMemo(() => form.hours && form.hours.schedule && Object.keys(form.hours.schedule).length > 0, [form.hours]);
  const hasMenu = useMemo(() => {
    console.log("🔍 Checking hasMenu - menu value:", form.special_fields?.menu);
    const menu = form.special_fields?.menu;
    return menu && Array.isArray(menu) && menu.length > 0;
  }, [form.special_fields?.menu]);

  const hasKashrut = useMemo(() =>
    !!form.kashrut_authority_type ||
    !!form.kashrut_authority_name ||
    !!form.kashrut_rabbinate_city ||
    !!form.kashrut_logo_url ||
    (form.kashrut_certificate_urls && form.kashrut_certificate_urls.length > 0),
    [form.kashrut_authority_type, form.kashrut_authority_name, form.kashrut_rabbinate_city, form.kashrut_logo_url, form.kashrut_certificate_urls]);

  useEffect(() => {
    console.log("📊 Form special_fields updated:", form.special_fields);
  }, [form.special_fields]);

  const specialPreview = useMemo(() => {
    let previewParts = [];

    Object.entries(form.special_fields || {}).forEach(([k, v]) => {
      if (k === "menu" && Array.isArray(v)) {
        const totalItems = v.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
        previewParts.push(`מחירון: ${v.length} קטגוריות, ${totalItems} פריטים`);
      } else if (typeof v === "boolean") {
        if (v) previewParts.push(k);
      } else if (v && (typeof v === "string" || Array.isArray(v) && v.length > 0)) {
        previewParts.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
      }
    });

    if (hasKashrut) {
      let kashrutDetails = [];
      if (form.kashrut_authority_type) kashrutDetails.push(form.kashrut_authority_type);
      if (form.kashrut_authority_name) kashrutDetails.push(form.kashrut_authority_name);
      if (form.kashrut_rabbinate_city) kashrutDetails.push(form.kashrut_rabbinate_city);
      if (kashrutDetails.length > 0) {
        previewParts.push(`כשרות: ${kashrutDetails.join(", ")}`);
      }
    }

    return previewParts.join(" | ");
  }, [form.special_fields, hasKashrut, form.kashrut_authority_type, form.kashrut_authority_name, form.kashrut_rabbinate_city]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-600 font-medium tracking-wide">בודק הרשאות משתמש...</p>
      </div>);
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-red-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>);
  }

  return (
    <div className="min-h-screen relative add-solid-bg text-white" dir="rtl">
      <style>{`
        .add-solid-bg {
          margin: 0;
          font-family: "Ronda", sans-serif;
          overflow: auto;
          --bg-sky: #eaf6fb;
          --bottom-gutter: 0rem;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center center;
          background-attachment: scroll;
          background-color: var(--bg-sky);
          background-image: none !important;
          box-sizing: border-box;
          padding-bottom: var(--bottom-gutter);
          background-clip: content-box;
          background-origin: content-box;
          position: relative;
        }

        .add-solid-bg::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
          background-image: url("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/4218a9d3c_image.png");
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center center;
          background-color: transparent;
        }

        @media (max-width: 768px) {
          .add-solid-bg::before {
            background-position: right top;
          }
        }

        .add-solid-bg .btn {
          background-image: linear-gradient(135deg, #00E1FF 0%, #7C3AED 100%) !important;
          color: #fff !important;
          border: 0 !important;
          box-shadow: 0 12px 30px rgba(124,58,237,0.35), 0 6px 18px rgba(0,225,255,0.25) !important;
          transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
        }
        .add-solid-bg .btn:hover {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 16px 36px rgba(124,58,237,0.45), 0 8px 22px rgba(0,225,255,0.35) !important;
        }
        .add-solid-bg .btn:active {
          transform: translateY(0);
          box-shadow: 0 8px 18px rgba(124,58,237,0.35), 0 4px 12px rgba(0,225,255,0.25) !important;
        }
        .add-solid-bg .btn:disabled {
          opacity: .6;
          cursor: not-allowed;
          box-shadow: none !important;
        }

        .add-solid-bg .bg-white,
        .add-solid-bg .bg-white\\/85,
        .add-solid-bg .backdrop-blur-lg,
        .add-solid-bg .backdrop-blur-sm {
          color: #0f172a;
        }

        .add-hero-title {
          color: #0f172a;
          line-height: 1.15;
          letter-spacing: .2px;
          text-shadow:
            0 1px 0 rgba(255,255,255,0.7),
            0 2px 6px rgba(0,0,0,0.12);
        }
        .add-hero-sub {
          color: #1f2937;
          text-shadow:
            0 1px 0 rgba(255,255,255,0.65),
            0 1px 6px rgba(0,0,0,0.08);
          opacity: .98;
        }

        .add-hero-chip {
          display: inline-block;
          background: rgba(255,255,255,0.65);
          -webkit-backdrop-filter: saturate(1.1) blur(2px);
          backdrop-filter: saturate(1.1) blur(2px);
          padding: .35rem .75rem;
          border-radius: .75rem;
          box-shadow: 0 1px 3px rgba(15,23,42,0.08);
        }

        .add-clouds { display: none !important; }
        .svg-clouds, .svg-cloud { display: none !important; }

        .btn-4 {
          background-color: #4dccc6;
          background-image: linear-gradient(315deg, #4dccc6 0%, #96e4df 74%);
          line-height: 42px;
          padding: 0;
          border: none;
          position: relative;
          color: #000;
          font-weight: 600;
          overflow: hidden;
        }
        .btn-4:hover {
          background-color: #89d8d3;
          background-image: linear-gradient(315deg, #89d8d3 0%, #03c8a8 74%);
        }
        .btn-4 span {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0 30px;
        }
        .btn-4:before,
        .btn-4:after {
          position: absolute;
          content: "";
          right: 0;
          top: 0;
          box-shadow: 4px 4px 6px 0 rgba(255,255,255,.9),
                      -4px -4px 6px 0 rgba(116, 125, 136, .2),
                      inset -4px -4px 6px 0 rgba(255,255,255,.9),
                      inset 4px 4px 6px 0 rgba(116, 125, 136, .3);
          transition: all 0.3s ease;
        }
        .btn-4:before {
          height: 0%;
          width: .1px;
        }
        .btn-4:after {
          width: 0%;
          height: .1px;
        }
        .btn-4:hover:before {
          height: 100%;
        }
        .btn-4:hover:after {
          width: 100%;
        }
        .btn-4 span:before,
        .btn-4 span:after {
          position: absolute;
          content: "";
          left: 0;
          bottom: 0;
          box-shadow: 4px 4px 6px 0 rgba(255,255,255,.9),
                      -4px -4px 6px 0 rgba(116, 125, 136, .2),
                      inset -4px -4px 6px 0 rgba(255,255,255,.9),
                      inset 4px 4px 6px 0 rgba(116, 125, 136, .3);
          transition: all 0.3s ease;
        }
        .btn-4 span:before {
          width: .1px;
          height: 0%;
        }
        .btn-4 span:after {
          width: 0%;
          height: .1px;
        }
        .btn-4 span:hover:before {
          height: 100%;
        }
        .btn-4 span:hover:after {
          width: 100%;
        }
      `}</style>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');
        .varelaRound, .varelaRound input, .varelaRound input::placeholder{
          font-family: 'Varela Round', sans-serif;
          font-weight: normal;
          font-size: 50px;
          border: none;
          background: transparent;
          padding: 30px 30px 30px 30px;
          outline: none;
        }
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@600;700;800;900&display=swap');

        .hero-eyebrow {
          font-family: 'Heebo', 'Varela Round', sans-serif;
          color: #111827;
          font-weight: 700;
          letter-spacing: .2px;
          line-height: 1.2;
          opacity: .95;
        }
        .hero-title {
          font-family: 'Heebo', 'Varela Round', sans-serif;
          color: #111827;
          font-weight: 900;
          letter-spacing: -0.3px;
          line-height: 0.95;
        }
        .hero-title-xl { font-size: 3rem; }
        @media (min-width: 640px) { .hero-title-xl { font-size: 4rem; } }
        @media (min-width: 1024px){ .hero-title-xl { font-size: 4.5rem; } }

        .hero-eyebrow-sm { font-size: 1rem; }
        @media (min-width: 640px) { .hero-eyebrow-sm { font-size: 1.125rem; } }
        @media (min-width: 1024px){ .hero-eyebrow-sm { font-size: 1.25rem; } }

        .hero-soft-shadow {
          text-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        .btn-beracha {
          --c1: #fdfcfb;
          --c2: #e9fbff;
          --ring: rgba(56,189,248,0.35);
          --shadow: rgba(15,23,42,0.08);
          background-image: linear-gradient(135deg, var(--c1) 0%, var(--c2) 100%);
          color: #0f172a;
          border: 1px solid rgba(2,132,199,0.18);
          border-radius: 9999px;
          box-shadow: 0 8px 24px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.8);
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease, letter-spacing .15s ease;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          font-family: 'Heebo', 'Varela Round', sans-serif;
          font-weight: 900;
          letter-spacing: .15px;
          line-height: 1.05;
          text-wrap: balance;
        }
        .btn-beracha:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(2,132,199,0.18), inset 0 1px 0 rgba(255,255,255,0.85);
          background-image: linear-gradient(135deg, #ffffff 0%, #dbf7ff 100%);
          color: #0b1220;
          letter-spacing: .2px;
        }
        .btn-beracha:active {
          transform: translateY(0);
          box-shadow: 0 6px 18px rgba(2,132,199,0.14), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .btn-beracha:focus-visible {
          outline: 3px solid var(--ring);
          outline-offset: 2px;
        }
        .btn-beracha:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-beracha .btn-text {
          display: inline-block;
          padding-inline: 2px;
          text-shadow:
            0 1px 0 rgba(255,255,255,0.9),
            0 1px 3px rgba(15,23,42,0.06);
          letter-spacing: inherit;
          line-height: inherit;
        }
        @media (max-width: 420px) {
          .btn-beracha { font-weight: 800; }
          .btn-beracha .btn-text { text-shadow: 0 1px 0 rgba(255,255,255,0.85); }
        }
      `}</style>

      <div className="relative z-10 w-full px-2 sm:px-4 pt-4 pb-0">
        <div className={wizardActive ? "flex flex-col md:flex-row gap-6 items-start max-w-full mx-auto" : "grid md:grid-cols-2 gap-6 items-start max-w-7xl mx-auto"}>

          {/* עמודה ימנית - כותרת או טקסט ראשוני */}
          {wizardActive ? (
            <div className="w-full md:w-[40%] flex flex-col justify-start pr-0 md:pr-8 order-1">
              <div className="text-right mt-4 md:mt-16 mr-0 md:mr-12">
                <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 mb-4 hero-soft-shadow">
                  בשעה טובה!
                </h2>
                <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-slate-700 hero-soft-shadow">
                  רק עוד כמה צעדים קטנים...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-start order-1 md:order-1">
              <div className="text-right max-w-xl sm:max-w-2xl mr-0">
                <div className="my-8 hero-eyebrow hero-eyebrow-sm hero-soft-shadow">
                  ההצלחה שלכם, הברכה של כולנו!
                </div>

                <h1 className="hero-title hero-title-xl hero-soft-shadow mb-2">
                  <span className="block">בסייעתא דשמיא</span>
                  <span className="text-4xl mt-1 block">בואו נצעד יחד להצלחה מבורכת</span>
                </h1>
              </div>
            </div>
          )}

          {/* עמודה שמאלית - קונטיינר טופס */}
          {wizardActive ? (
            <div className="w-full md:w-[60%] order-2">

              {/* בלוק אדמין: שיוך בעלות לפי מייל */}
              {isAdmin && (
                <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/40 p-4 md:p-5 shadow-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base md:text-lg font-bold text-slate-800">שיוך בעלות (אדמין)</h3>
                    <span className="text-xs text-slate-500">אופציונלי</span>
                  </div>
                  <Label className="text-sm text-slate-700 mb-1 block">
                    כתובת אימייל של בעל העסק
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={overrideOwnerEmail}
                    onChange={(e) => setOverrideOwnerEmail(e.target.value)}
                    className="bg-white text-slate-800"
                    dir="ltr"
                    inputMode="email"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    אם תמלא/י כאן אימייל, הבעלות על העמוד תירשם עבורו. כשהמשתמש ייכנס/יירשם – העמוד יופיע אוטומטית תחת "העסק שלי".
                  </p>
                </div>
              )}

              <WizardLayout
                steps={steps}
                stepIndex={stepIndex}
                onPrev={onPrev}
                onNext={onNext}
                onSubmit={submitBusinessPage}
                canNext={canNext}
                isSubmitting={isSubmitting}
                successMessage={successMessage}
                submitError={submitError}
                frameless={true}>

                <div className="bg-white/85 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-2xl">
                  {stepIndex === 0 && (
                    <div className="space-y-6">
                      <StepDetails
                        value={form}
                        onChange={updateForm}
                        categoryName={currentLabels.cat}
                        subcategoryName={currentLabels.sub}
                        onAgentApply={handleAgentApply}
                        categoryId={form.category_id}
                      />

                      <div className="w-full border-t border-slate-200 my-6"></div>

                      {hasHours && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5" /> שעות פעילות
                          </h3>
                          <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/40 p-4 md:p-5 shadow-lg">
                            <BusinessHoursComponent value={form.hours} onChange={handleHoursUpdate} />
                          </div>
                        </div>
                      )}

                      {hasMenu && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                            <Tag className="w-5 h-5" /> מחירון / תפריט
                          </h3>
                          <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/40 p-4 md:p-5 shadow-lg">
                            <MenuBuilder
                              value={form.special_fields?.menu || []}
                              onChange={(newMenu) => {
                                console.log("📝 MenuBuilder onChange called with:", newMenu);
                                handleSpecialFieldChange("menu", newMenu);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {hasKashrut && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                            <Shield className="w-5 h-5" /> פרטי כשרות
                          </h3>
                          <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/40 p-4 md:p-5 shadow-lg">
                            <KashrutSection value={form} onChange={updateForm} />
                          </div>
                        </div>
                      )}

                      {/* כפתורי הוספה - מוצגים תמיד, רק הכפתור של מודול פתוח נעלם */}
                      <div className="flex justify-center gap-4 pt-4 border-t border-slate-200/60 flex-wrap">
                        {!hasMenu && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              console.log("🎯 Add menu button clicked");
                              handleSpecialFieldChange("menu", [{
                                id: `cat-${Date.now()}`,
                                name: 'קטגוריה ראשונה',
                                items: []
                              }]);
                            }}
                          >
                            <Plus className="w-4 h-4 ml-2" /> הוסף מחירון
                          </Button>
                        )}
                        {!hasHours && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              console.log("🕒 Add hours button clicked - current hours:", form.hours);
                              updateForm({
                                hours: {
                                  schedule: {
                                    sunday: { isOpen: true, is24Hours: false, timeRanges: [{ open: '09:00', close: '17:00' }] }
                                  },
                                  manualStatus: null,
                                  specialNote: ""
                                }
                              });
                              console.log("✅ Hours should be updated now");
                            }}
                          >
                            <Plus className="w-4 h-4 ml-2" /> הוסף שעות פעילות
                          </Button>
                        )}
                        {!hasKashrut && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              console.log("🔯 Add kashrut button clicked - current kashrut:", {
                                type: form.kashrut_authority_type,
                                name: form.kashrut_authority_name
                              });
                              updateForm({
                                kashrut_authority_type: "בד\"צ",
                                kashrut_authority_name: "",
                                kashrut_rabbinate_city: "",
                                kashrut_logo_url: "",
                                kashrut_certificate_urls: []
                              });
                              console.log("✅ Kashrut should be updated now");
                            }}
                          >
                            <Plus className="w-4 h-4 ml-2" /> הוסף פרטי כשרות
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {stepIndex === 1 && (
                    <StepReview
                      value={{
                        ...form,
                        _category_name: currentLabels.cat,
                        _subcategory_name: currentLabels.sub,
                        _special_preview: specialPreview
                      }}
                      onSubmit={submitBusinessPage}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>
              </WizardLayout>

              {/* כפתור סיכום/שליחה מחוץ לקונטיינר */}
              {stepIndex === 0 ? (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={onNext}
                    disabled={!canNext}
                    className="px-12 py-6 text-xl font-black rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
                  >
                    סיכום
                  </Button>
                </div>
              ) : (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={submitBusinessPage}
                    disabled={isSubmitting}
                    className="px-12 py-6 text-xl font-black rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
                  >
                    {isSubmitting ? "שולח..." : "שליחה לאישור"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-start order-2 md:order-2">
              {!registrationComplete && <BusinessRegistrationForm onComplete={handleRegistrationComplete} />}
            </div>
          )}

        </div>
      </div>

      <div className="hidden" />
    </div>
  );
}

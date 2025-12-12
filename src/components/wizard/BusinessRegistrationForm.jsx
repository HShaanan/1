
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { TermsAcceptance } from "@/entities/TermsAcceptance";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label"; // Import Label component

export default function BusinessRegistrationForm({ onComplete }) {
  const [formData, setFormData] = useState({
    businessType: "",
    // subcategory_id removed, now handled by selectedSubcategories
    businessName: "",
    street: "",
    zipCode: "",
    city: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: ""
    // termsAccepted is now implicitly true on submission, no longer a user-controlled state
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]); // New state for multiple subcategory selection

  // בדיקה אם המשתמש הוא admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        setIsAdmin(user.role === 'admin');
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // טעינת קטגוריות
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await Category.list("sort_order");
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // מציאת הקטגוריה הראשית לפי סוג העסק
  const mainCategoryId = useMemo(() => {
    if (!formData.businessType) return null;

    // מציאת קטגוריה ראשית לפי שם
    const categoryName = formData.businessType === 'food' ? 'אוכל' : 'קניות';
    const mainCat = categories.find((c) => !c.parent_id && c.name === categoryName);
    return mainCat?.id || null;
  }, [formData.businessType, categories]);

  // סינון תתי קטגוריות לפי הקטגוריה הראשית
  const subcategories = useMemo(() => {
    if (!mainCategoryId) return [];
    return categories.filter((c) => c.parent_id === mainCategoryId && c.is_active);
  }, [mainCategoryId, categories]);

  // Handler for selecting/deselecting subcategories
  const handleSubcategoryToggle = (subcatId) => {
    setSelectedSubcategories(prev => {
      const isSelected = prev.includes(subcatId);
      return isSelected
        ? prev.filter(id => id !== subcatId)
        : [...prev, subcatId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // אין צורך לבדוק termsAccepted כי זה קורה אוטומטית בלחיצה

    // וולידציה - admin יכול לדלג
    if (!isAdmin) {
      if (!formData.businessName || !formData.email || !formData.phone || selectedSubcategories.length === 0) {
        setError("יש למלא את כל שדות החובה ולבחור לפחות תת-קטגוריה אחת");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const currentUser = await User.me();

      // Update user data with business information
      await User.updateMyUserData({
        business_name: formData.businessName,
        business_description: formData.businessType,
        phone_number: formData.phone, // phonePrefix concatenation removed
        user_type: "business"
      });

      // Record terms acceptance - מתבצע אוטומטית בלחיצה על הכפתור
      await TermsAcceptance.create({
        user_email: currentUser.email,
        terms_version: "1.0",
        acceptance_type: "business_page_creation",
        ip_address: "0.0.0.0"
      });

      // Call the completion handler to move to wizard
      if (onComplete) {
        onComplete({
          ...formData,
          category_id: mainCategoryId,
          subcategory_ids: selectedSubcategories, // Pass array of selected subcategory IDs
          termsAccepted: true // מאושר אוטומטית
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("אירעה שגיאה ברישום. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // אם משנים את סוג העסק, מאפסים את תת-הקטגוריה
      if (field === 'businessType') {
        setSelectedSubcategories([]); // Reset selected subcategories
      }
      return updated;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto" dir="rtl">
      {/* קונטיינר עם עיצוב מעודכן לפי התמונה */}
      <div className="bg-white/90 backdrop-blur-md rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 border border-white/60">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800">רישום העסק שלך</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* סוג העסק */}
          <div>
            <Select value={formData.businessType} onValueChange={(v) => updateField("businessType", v)}>
              <SelectTrigger className="bg-white/80 text-slate-950 px-3 py-2 text-sm flex items-center justify-between border ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-12 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow" dir="rtl" style={{ textAlign: 'right' }}>
                <SelectValue placeholder="סוג העסק" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">אוכל</SelectItem>
                <SelectItem value="shopping">קניות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* תתי-קטגוריות - בחירה מרובה */}
          {formData.businessType && subcategories.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block text-right">
                תתי-קטגוריות (בחר אחת או יותר)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {subcategories.map((subcat) => {
                  const isSelected = selectedSubcategories.includes(subcat.id);
                  return (
                    <button
                      key={subcat.id}
                      type="button"
                      onClick={() => handleSubcategoryToggle(subcat.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-right flex items-center gap-3 ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-md'
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
              
              {selectedSubcategories.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-right">
                  <p className="text-sm text-blue-800">
                    ✅ נבחרו {selectedSubcategories.length} תתי-קטגוריות
                  </p>
                </div>
              )}
            </div>
          )}

          {/* שם בית העסק */}
          <div>
            <Input
              type="text"
              placeholder="שם בית העסק"
              value={formData.businessName}
              onChange={(e) => updateField("businessName", e.target.value)} className="bg-white/80 text-slate-700 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }}
              required={!isAdmin} />
          </div>

          {/* רחוב ומספר בית */}
          <div>
            <Input
              type="text"
              placeholder="רחוב ומספר בית"
              value={formData.street}
              onChange={(e) => updateField("street", e.target.value)} className="bg-white/80 text-slate-700 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }} />
          </div>

          {/* מיקוד ועיר */}
          <div className="grid grid-cols-2 gap-3" dir="rtl">
            <Select value={formData.city} onValueChange={(v) => updateField("city", v)}>
              <SelectTrigger className="bg-white/80 text-slate-950 px-3 py-2 text-sm flex w-full items-center justify-between border ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 h-12 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow" dir="rtl" style={{ textAlign: 'right' }}>
                <SelectValue placeholder="עיר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jerusalem">ירושלים</SelectItem>
                <SelectItem value="beitar-illit">ביתר עילית</SelectItem>
                <SelectItem value="bnei-brak">בני ברק</SelectItem>
                <SelectItem value="modiin-illit">מודיעין עילית</SelectItem>
                <SelectItem value="tel-aviv">תל אביב</SelectItem>
                <SelectItem value="haifa">חיפה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="מיקוד"
              value={formData.zipCode}
              onChange={(e) => updateField("zipCode", e.target.value)} className="bg-white/80 text-slate-700 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }} />
          </div>

          {/* שם פרטי ומשפחה */}
          <div className="grid grid-cols-2 gap-3" dir="rtl">
            <Input
              type="text"
              placeholder="שם משפחה"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)} className="bg-white/80 text-slate-800 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }}
              required={!isAdmin} />

            <Input
              type="text"
              placeholder="שם פרטי"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)} className="bg-white/80 text-slate-800 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }}
              required={!isAdmin} />
          </div>

          {/* טלפון */}
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">טלפון *</Label>
            <Input
              type="tel"
              placeholder="מספר טלפון (לדוגמה: 050-1234567)"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)} className="bg-white/80 text-slate-800 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }}
              required={!isAdmin} />
          </div>

          {/* אימייל */}
          <div>
            <Input
              type="email"
              placeholder="אימייל"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)} className="bg-white/80 text-slate-700 px-3 py-2 text-base rounded-xl flex w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-12 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              dir="rtl"
              style={{ textAlign: 'right' }}
              required={!isAdmin} />
          </div>

          {/* טקסט אישור תנאים */}
          <div className="text-xs text-slate-600 leading-relaxed text-center mt-4">
            בלחיצה על "בואו נתחיל" אני מאשר/ת שקראתי ומסכים/ה ל
            <a href="/terms" className="text-cyan-600 underline hover:text-cyan-700">
              תנאי השירות
            </a>
            ול
            <a href="/privacy" className="text-cyan-600 font-semibold underline hover:text-cyan-700">
              הצהרת הפרטיות
            </a>
            .
          </div>

          {/* כפתור שליחה */}
          <button
            type="submit"
            disabled={isSubmitting || (!isAdmin && (!formData.businessName || !formData.email || !formData.phone || selectedSubcategories.length === 0))}
            className="w-full btn-beracha px-8 py-3 text-base sm:text-lg"
            aria-label="בואו נתחיל">
            <span className="btn-text">
              {isSubmitting ? "שולח..." : "בואו נתחיל"}
            </span>
          </button>

          {error &&
          <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          }

          {isAdmin &&
          <div className="text-xs text-center text-blue-600 bg-blue-50 p-2 rounded-lg">
              🔧 מצב מנהל: ניתן להתקדם ללא מילוי שדות חובה
            </div>
          }
        </form>
      </div>

      {/* סגנון הכפתור btn-beracha */}
      <style>{`
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
    </div>);

}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, TrendingUp, DollarSign, Shield, Bike, Car, MapPin, Zap
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CourierLanding() {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_type: "",
    city: "",
    experience: "",
    availability_hours: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const benefits = [
    { icon: DollarSign, title: "שכר הוגן ואטרקטיבי", desc: "הכנסה יומית + בונוסים על ביצועים" },
    { icon: Clock, title: "גמישות מלאה", desc: "קבע את שעות העבודה שלך" },
    { icon: TrendingUp, title: "צמיחה מקצועית", desc: "הזדמנויות קידום ושכר משתפר" },
    { icon: Shield, title: "ביטוח מקיף", desc: "כיסוי ביטוחי מלא במהלך המשלוחים" },
    { icon: Zap, title: "טכנולוגיה מתקדמת", desc: "אפליקציה חכמה לניהול משלוחים" },
    { icon: MapPin, title: "משלוחים באזורך", desc: "עבודה קרובה לבית" }
  ];

  const requirements = [
    "רישיון נהיגה תקף",
    "כלי רכב מבוטח (אופנוע/רכב)",
    "זמינות של לפחות 20 שעות בשבוע",
    "יכולת הרמה של עד 15 ק\"ג"
  ];



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.full_name || !formData.phone || !formData.vehicle_type) {
        setError("אנא מלא את כל השדות הנדרשים");
        setIsSubmitting(false);
        return;
      }

      // Submit to Courier entity
      await base44.entities.Courier.create({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        vehicle_type: formData.vehicle_type,
        city: formData.city || null,
        experience_years: formData.experience ? parseInt(formData.experience) : 0,
        availability_hours: formData.availability_hours || null,
        notes: formData.notes || null,
        status: "pending",
        is_active: false
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting courier application:", err);
      setError("אירעה שגיאה בשליחת הטופס. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleOptions = [
    { value: "motorcycle", label: "אופנוע/קטנוע", icon: Bike },
    { value: "car", label: "רכב", icon: Car }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-lg w-full shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">תודה על ההרשמה!</h2>
            <p className="text-slate-600 text-lg mb-6">
              קיבלנו את הפרטים שלך ונחזור אליך בהקדם.<br/>
              אחד מנציגינו יצור איתך קשר תוך 24 שעות.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl("Browse")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              חזרה לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" dir="rtl">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/ec47a52c7_image.jpg"
          alt="הצטרף לנבחרת השליחים של משלנו"
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4">
              למה להצטרף למשלנו?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              הצטרף לנבחרת של שליחים מקצועיים ותיהנה מתנאים הטובים ביותר בשוק
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
              דרישות בסיסיות
            </h2>
            <p className="text-lg text-slate-600">
              כל מה שאתה צריך כדי להצטרף
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 lg:p-12 border-2 border-slate-200">
            <div className="space-y-4">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-lg text-slate-700 font-medium">{req}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4">
              מלא פרטים והצטרף עכשיו
            </h2>
            <p className="text-xl text-slate-600">
              נחזור אליך תוך 24 שעות
            </p>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 lg:p-12">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="full_name" className="text-lg font-semibold">שם מלא *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="הזן שם מלא"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-lg font-semibold">טלפון *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="050-1234567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-lg font-semibold">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="example@mail.com"
                  />
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-3 block">סוג כלי רכב *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {vehicleOptions.map((vehicle) => (
                      <button
                        key={vehicle.value}
                        type="button"
                        onClick={() => setFormData({...formData, vehicle_type: vehicle.value})}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          formData.vehicle_type === vehicle.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <vehicle.icon className={`w-8 h-8 mx-auto mb-2 ${
                          formData.vehicle_type === vehicle.value ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <p className="font-semibold text-slate-700">{vehicle.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="city" className="text-lg font-semibold">עיר מגורים</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="ירושלים, בני ברק, אלעד..."
                  />
                </div>

                <div>
                  <Label htmlFor="experience" className="text-lg font-semibold">ניסיון קודם (שנים)</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="availability_hours" className="text-lg font-semibold">זמינות שבועית (שעות)</Label>
                  <Input
                    id="availability_hours"
                    type="number"
                    min="0"
                    max="168"
                    value={formData.availability_hours}
                    onChange={(e) => setFormData({...formData, availability_hours: e.target.value})}
                    className="mt-2 h-12 text-lg"
                    placeholder="כמה שעות בשבוע אתה זמין?"
                  />
                  <p className="text-sm text-slate-500 mt-1">מינימום מומלץ: 20 שעות בשבוע</p>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-lg font-semibold">הערות נוספות</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="mt-2 w-full min-h-[120px] p-4 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="ספר לנו עוד על עצמך..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                >
                  {isSubmitting ? "שולח..." : "שלח מועמדות"}
                </Button>

                <p className="text-sm text-slate-500 text-center">
                  בשליחת הטופס אתה מאשר את תנאי השימוש ומדיניות הפרטיות
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-black mb-6">
            מוכן להתחיל להרוויח?
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 mb-8">
            הצטרף עכשיו לנבחרת השליחים והתחל להרוויח כבר היום
          </p>
          <Button
            onClick={() => document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' })}
            size="lg"
            className="bg-white text-emerald-600 hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-2xl"
          >
            מלא טופס עכשיו
          </Button>
        </div>
      </section>
    </div>
  );
}
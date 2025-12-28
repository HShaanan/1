import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageCircle, Send, CheckCircle, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("אנא מלא את כל השדות הנדרשים");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await base44.integrations.Core.SendEmail({
        to: "support@meshelanu.co.il",
        subject: `יצירת קשר מ${formData.name}`,
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>הודעה חדשה מטופס יצירת קשר</h2>
            <p><strong>שם:</strong> ${formData.name}</p>
            <p><strong>אימייל:</strong> ${formData.email}</p>
            <p><strong>טלפון:</strong> ${formData.phone || 'לא סופק'}</p>
            <p><strong>הודעה:</strong></p>
            <p>${formData.message.replace(/\n/g, '<br>')}</p>
          </div>
        `
      });

      setSubmitted(true);
      toast.success("ההודעה נשלחה בהצלחה! נחזור אליך בהקדם");
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast.error("אירעה שגיאה בשליחת ההודעה. אנא נסה שוב");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            צור קשר
          </h1>
          <p className="text-lg text-slate-600">
            נשמח לעמוד לשירותך ולענות על כל שאלה
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="shadow-xl">
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">ההודעה נשלחה!</h3>
                  <p className="text-slate-600 mb-6">נחזור אליך בהקדם האפשרי</p>
                  <Link to={createPageUrl("Browse")}>
                    <Button variant="outline" className="rounded-xl">
                      חזרה לדף הבית
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">שלח לנו הודעה</h2>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      שם מלא *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="הכנס את שמך המלא"
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      אימייל *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      טלפון
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="050-123-4567"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                      הודעה *
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="כתוב כאן את פנייתך..."
                      required
                      rows={5}
                      className="rounded-xl"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl shadow-lg"
                  >
                    {isSubmitting ? (
                      <>שולח...</>
                    ) : (
                      <>
                        שלח הודעה
                        <Send className="w-5 h-5 mr-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">דרכי התקשרות</h2>
                
                <div className="space-y-6">
                  <a 
                    href="tel:0505196963"
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">טלפון</div>
                      <div className="text-slate-600">050-519-6963</div>
                    </div>
                  </a>

                  <a 
                    href="https://wa.me/972505196963"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">וואטסאפ</div>
                      <div className="text-slate-600">050-519-6963</div>
                    </div>
                  </a>

                  <a 
                    href="mailto:support@meshelanu.co.il"
                    className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">אימייל</div>
                      <div className="text-slate-600">support@meshelanu.co.il</div>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">שעות פעילות</h3>
                <div className="space-y-2 text-white/90">
                  <div className="flex justify-between">
                    <span>ראשון - חמישי:</span>
                    <span className="font-semibold">9:00 - 20:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ערב שבת:</span>
                    <span className="font-semibold">9:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>מוצ״ש:</span>
                    <span className="font-semibold">21:00 - 23:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
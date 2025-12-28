import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AccessibilityStatementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');
  const isAcceptMode = mode === 'accept';

  const TERMS_VERSION = '1.0';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleAgree = async () => {
    setSubmitting(true);
    try {
        await base44.functions.invoke('acceptTerms', {
            version: TERMS_VERSION,
            text: 'User agreed to terms version ' + TERMS_VERSION,
            userAgent: navigator.userAgent
        });

        sessionStorage.setItem(`terms_accepted_${TERMS_VERSION}`, 'true');
        
        toast.success("התקנון אושר בהצלחה");
        navigate(createPageUrl("Browse"));
    } catch (error) {
        console.error("Error accepting terms:", error);
        toast.error("אירעה שגיאה באישור התקנון. אנא נסה שנית.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              תקנון האתר
            </h1>
          </div>
          <p className="text-gray-600">משלנו - הפלטפורמה הקהילתית</p>
          <p className="text-sm text-gray-500 mt-1">גרסה {TERMS_VERSION} | עודכן: דצמבר 2025</p>
        </div>

        <Card className="bg-white shadow-lg mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b bg-gray-50">
                <div 
                    className="h-[65vh] overflow-y-auto p-6 md:p-10 text-right text-slate-700 leading-relaxed scroll-smooth"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f8fafc' }}
                >
                    <div className="max-w-3xl mx-auto space-y-8">
                        
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">כללי</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>
                                    אתר האינטרנט אליו נכנסת ("האתר") מופעל על-ידי HS טכנולוגיות ("החברה"). המשתמש באתר ("המשתמש") מתבקש לקרוא בעיון רב את כל תנאי השימוש המפורטים להלן ("תנאי השימוש"), שכן השימוש והגלישה באתר מותנים בקבלה והסכמה מצדו של המשתמש לכל תנאי השימוש וכן למדיניות הפרטיות של החברה ("מדיניות הפרטיות"), לרבות כפי שישונו ו/או יתעדכנו מעת לעת.
                                </p>
                                <p>
                                    ככל שהמשתמש אינו מסכים לתנאי השימוש, כולם או חלקם, הוא אינו רשאי לגלוש באתר ו/או לעשות בו כל שימוש לכל מטרה שהיא.
                                </p>
                                <p>
                                    החברה מפעילה פלטפורמה טכנולוגית לתיווך בין משתמשים לבין בתי עסק. אלא אם צוין אחרת במפורש, החברה אינה מוכרת את המוצרים/המנות ואינה מספקת שירותי משלוח/מסירה; בית העסק הוא המוכר והאחראי הבלעדי להזמנה, להכנה, לאריזה ולמסירה.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">נגישות</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>
                                    אנו מחויבים להנגיש את האתר שלנו לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות. האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ובהתאם לתקן הישראלי ת"י 5568 ברמת AA של הנחיות WCAG 2.0.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">זכויות יוצרים</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>
                                    כל זכויות היוצרים, זכויות הקניין הרוחני והזכויות אשר דומות במהותן לזכויות יוצרים או זכויות קניין רוחני באתר, במידע, בתכנים הכלולים בו ובשירותים המוצעים בו, שייכות באופן בלעדי לחברה או לצדדים שלישיים שהקנו לחברה את הזכות לפרסמם באתר.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">אחריות</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>
                                    התכנים המוצגים באתר והשירותים והמוצרים המוצעים באתר ניתנים לשימוש במצבם "כמות שהוא" (AS IS). החברה אינה מתחייבת לכך שהתכנים שיוצגו באתר יהלמו את הצרכים והציפיות של המשתמש.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">דין וסמכות שיפוט</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>
                                    הדין החל על האתר, השימוש בו, תנאי השימוש וכל עניין בנוגע לאתר וליחסים בין המשתמש והחברה הנו דין מדינת ישראל. סמכות השיפוט הייחודית והבלעדית נתונה לבתי המשפט המוסמכים לכך בתל-אביב-יפו.
                                </p>
                            </div>
                        </section>
                        
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 bg-white">
                {isAcceptMode ? (
                    <div className="space-y-6 max-w-2xl mx-auto text-center">
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                <p className="text-sm md:text-base font-bold text-slate-800">
                                    אני קראתי ואני מסכים לתקנון האתר
                                </p>
                            </div>

                            <Button 
                                onClick={handleAgree}
                                disabled={submitting}
                                className="w-full py-6 text-lg font-bold shadow-md transition-all rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-[1.01]"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> מעבד...</>
                                ) : (
                                    <>אשר והמשך <ArrowLeft className="w-5 h-5 mr-2" /></>
                                )}
                            </Button>
                            
                            <p className="text-xs text-center text-slate-500">
                                * אישור זה נדרש באופן חד-פעמי (עבור כל משתמש) לצורך המשך השימוש במערכת.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-green-600 font-medium mb-4 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            התקנון הינו לידיעה כללית.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => navigate(createPageUrl("Browse"))}
                            className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-8"
                        >
                            חזרה לדף הבית
                        </Button>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
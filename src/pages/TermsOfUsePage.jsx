import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TermsOfUsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  
  // Parse mode from URL
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode'); // 'accept' or null
  const isAcceptMode = mode === 'accept';

  const TERMS_VERSION = '1.0';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleAgree = async () => {
    if (!agreed) {
        toast.error("יש לאשר את תנאי השימוש כדי להמשיך");
        return;
    }
    
    setSubmitting(true);
    try {
        // Use backend function to record acceptance with IP
        await base44.functions.invoke('acceptTerms', {
            version: TERMS_VERSION,
            text: document.getElementById('terms-content')?.innerText || 'Full text displayed on screen',
            userAgent: navigator.userAgent
        });

        // Update local cache to prevent redirect loop
        sessionStorage.setItem(`terms_accepted_${TERMS_VERSION}`, 'true');
        
        toast.success("תנאי השימוש אושרו בהצלחה");
        navigate(createPageUrl("Browse"));
    } catch (error) {
        console.error("Error accepting terms:", error);
        toast.error("אירעה שגיאה באישור התנאים. אנא נסה שנית.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              תקנון ותנאי שימוש
            </h1>
          </div>
          <p className="text-gray-600">משלנו - הפלטפורמה הקהילתית</p>
          <p className="text-sm text-gray-500 mt-1">גרסה {TERMS_VERSION} | עודכן: דצמבר 2025</p>
        </div>

        {/* Content Card */}
        <Card className="bg-white shadow-lg mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* Scrollable Terms Text */}
            <div 
                id="terms-content"
                className="h-[60vh] overflow-y-auto p-6 md:p-10 text-right space-y-6 text-slate-800 leading-relaxed border-b scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}
            >
                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">כללי</h2>
                    <p>אתר האינטרנט אליו נכנסת ("האתר") מופעל על-ידי HS טכנולוגיות ("החברה"). המשתמש באתר ("המשתמש") מתבקש לקרוא בעיון רב את כל תנאי השימוש המפורטים להלן ("תנאי השימוש"), שכן השימוש והגלישה באתר מותנים בקבלה והסכמה מצדו של המשתמש לכל תנאי השימוש וכן למדיניות הפרטיות של החברה ("מדיניות הפרטיות"), לרבות כפי שישונו ו/או יתעדכנו מעת לעת.</p>
                    <p>ככל שהמשתמש אינו מסכים לתנאי השימוש, כולם או חלקם, הוא אינו רשאי לגלוש באתר ו/או לעשות בו כל שימוש לכל מטרה שהיא. כל משתמש אשר יגלוש או יעשה שימוש באתר ייחשב כמי שהסכים לכל תנאי השימוש ולכל תנאי מדיניות הפרטיות. מובהר בזאת כי מדיניות הפרטיות מהווה חלק בלתי נפרד מתנאי השימוש.</p>
                    <p>החברה מפעילה פלטפורמה טכנולוגית לתיווך בין משתמשים לבין בתי עסק. אלא אם צוין אחרת במפורש, החברה אינה מוכרת את המוצרים/המנות ואינה מספקת שירותי משלוח/מסירה; בית העסק הוא המוכר והאחראי הבלעדי להזמנה, להכנה, לאריזה ולמסירה.</p>
                    <p>האתר מיועד למשתמשים מגיל 18 ואילך בלבד, ואינו מיועד למשתמשים צעירים יותר. השימוש על ידי משתמש שטרם מלאו לו 18 ייעשה אך ורק לאחר שניתן אישור הוריו/אפוטרופוסיו לכך. כמו כן, המשתמש אחראי לקבל אישור מתאים.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">רכישת מוצרים/שירותים באמצעות האתר</h2>
                    <p>האתר מאפשר למשתמשים לרכוש באמצעותו מוצרים או שירותים של החברה או של צדדים שלישיים. ככל שהמשתמש ירכוש מוצרים או שירותים באמצעות האתר, תבוצע הרכישה באמצעות כרטיס אשראי ("אמצעי התשלום") ובהתאם לנהלים של החברה ושל חברות האשראי/ספקי אמצעי התשלום.</p>
                    <p>המשתמש בלבד יהיה אחראי לכל נזק שעלול להיגרם לחברה ו/או לכל צד שלישי כתוצאה מביטול החיובים שבוצעו באמצעי התשלום, הן כשהביטול בוצע בהוראת המשתמש והן על-פי החלטת חברת האשראי.</p>
                    <p>המחירים באתר כוללים מע"מ. המחירים באתר אינם כוללים דמי משלוח, אלא אם כן מצוין במפורש אחרת על ידי בית העסק.</p>
                    <p>החברה אינה מבטיחה זמני הכנה או זמני משלוח קבועים, זמני האספקה מהווים הערכות בלבד.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">ביטול עסקה והחזרות</h2>
                    <p>המשתמש רשאי לבטל עסקה בהתאם לחוק הגנת הצרכן, תשמ"א–1981. עם זאת, מוצרים פסידים – לרבות מוצרי מזון מוכנים, מזון טרי, מוצרים הדורשים קירור או מוצרים שאינם ניתנים למכירה מחדש – מוחרגים מזכות הביטול על פי דין. לפיכך, לאחר ביצוע הזמנה למוצרים אלה לא ניתן לבטלה, לשנותה או להחזירה, אלא במקרה שבו סופק מוצר פגום או שאינו תואם את ההזמנה.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">זכויות יוצרים וקניין רוחני</h2>
                    <p>כל זכויות היוצרים, זכויות הקניין הרוחני והזכויות אשר דומות במהותן לזכויות יוצרים או זכויות קניין רוחני באתר, במידע, בתכנים הכלולים בו ובשירותים המוצעים בו, לרבות טקסט, איורים, אלמנטים גרפיים, צליל, יישומי תוכנה, גרפים ותמונות, שייכות באופן בלעדי לחברה או לצדדים שלישיים שהקנו לחברה את הזכות לפרסמם באתר.</p>
                    <p>אין להעתיק, לשכפל, לשנות, להפיץ, לשדר, להציג בפומבי, להעביר לציבור, לפרסם, לעבד, ליצור יצירות נגזרות, להעניק רישיון, למכור, להשכיר או לאחסן את תוכנו של האתר וכל תוכן אחר שהתקבל באמצעותו ללא קבלת רשות מפורשת לכך מאת החברה, מראש ובכתב.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">פרסום ותכנים של צדדים שלישיים</h2>
                    <p>האתר עשוי להכיל תכנים או מידע אשר שייכים לצדדים שלישיים ו/או למשתמשים. החברה לא תישא בכל אחריות לתכנים הללו, לרבות לעניין הנכונות שלהם, העדכניות שלהם, השלמות שלהם וההשלכות הנובעות מהשימוש בהם.</p>
                    <p>אין לעשות שימוש באתר או בתכנים המוצגים בו למטרות לא חוקיות ו/או באופן העומד בניגוד לתנאי השימוש. בתוך כך, חל איסור לבצע כל שימוש אשר עלול לגרום לפגיעה באתר ו/או בתכנים המוצגים בו ו/או לפעול באופן שיפריע או ישבש את השימוש של משתמשים אחרים באתר.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">הגבלת אחריות</h2>
                    <p>החברה אינה אחראית לכל שיבוש, עיכוב או תקלה הנובעים מהסתמכות על מערכות, שירותים או תשתיות של צדדים שלישיים, לרבות שירותי מיפוי, ניתוב, דיווח מיקום, תקשורת סלולרית או כל שירות חיצוני אחר.</p>
                    <p>החברה אינה נושאת בכל חבות או אחריות ביחס לטעויות, שינויים או שגיאות הנוגעים לתכנים המוצגים באתר, לרבות כאלו שהוזנו לאתר על-ידי המשתמשים.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-3">דין וסמכות שיפוט</h2>
                    <p>הדין החל על האתר, השימוש בו, תנאי השימוש וכל עניין בנוגע לאתר וליחסים בין המשתמש והחברה הנו דין מדינת ישראל. סמכות השיפוט הייחודית והבלעדית לעניין האתר, השימוש בו וכל עניין בנוגע אליו נתונה אך ורק לבתי המשפט המוסמכים לכך בתל-אביב-יפו.</p>
                </section>
            </div>

            {/* Action Area */}
            <div className="p-6 md:p-8 bg-slate-50 border-t">
                {isAcceptMode ? (
                    <div className="space-y-6">
                        <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <Checkbox 
                                id="agree-terms" 
                                checked={agreed}
                                onCheckedChange={(c) => setAgreed(!!c)}
                                className="mt-1"
                            />
                            <label 
                                htmlFor="agree-terms" 
                                className="text-sm md:text-base text-slate-700 cursor-pointer font-medium leading-tight"
                            >
                                קראתי את תנאי השימוש ואני מסכים/ה להם. ידוע לי כי השימוש באתר כפוף לתנאים אלו.
                            </label>
                        </div>

                        <Button 
                            onClick={handleAgree}
                            disabled={!agreed || submitting}
                            className={`w-full py-6 text-lg font-bold shadow-md transition-all rounded-xl
                                ${agreed 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-[1.01]' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                            `}
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> מעבד...</>
                            ) : (
                                <>אני מסכים/ה, המשך <ArrowRight className="w-5 h-5 mr-2" /></>
                            )}
                        </Button>
                        
                        <p className="text-xs text-center text-slate-500">
                            לחיצה על "אני מסכים/ה" מהווה חתימה אלקטרונית מחייבת.
                        </p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-green-600 font-medium mb-4 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            תנאי השימוש הינם לידיעה כללית.
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
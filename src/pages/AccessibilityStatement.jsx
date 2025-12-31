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
        const errorMessage = error?.message || error?.data?.error || "אירעה שגיאה באישור התקנון";
        toast.error(errorMessage);
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
                                <p>אתר האינטרנט אליו נכנסת ("האתר") מופעל על-ידי HS טכנולוגיות ("החברה"). המשתמש באתר ("המשתמש") מתבקש לקרוא בעיון רב את כל תנאי השימוש המפורטים להלן ("תנאי השימוש"), שכן השימוש והגלישה באתר מותנים בקבלה והסכמה מצדו של המשתמש לכל תנאי השימוש וכן למדיניות הפרטיות של החברה ("מדיניות הפרטיות"), לרבות כפי שישונו ו/או יתעדכנו מעת לעת. ככל שהמשתמש אינו מסכים לתנאי השימוש, כולם או חלקם, הוא אינו רשאי לגלוש באתר ו/או לעשות בו כל שימוש לכל מטרה שהיא.</p>
                                
                                <p>החברה מפעילה פלטפורמה טכנולוגית לתיווך בין משתמשים לבין בתי עסק. אלא אם צוין אחרת במפורש, החברה אינה מוכרת את המוצרים/המנות ואינה מספקת שירותי משלוח/מסירה; בית העסק הוא המוכר והאחראי הבלעדי להזמנה, להכנה, לאריזה ולמסירה.</p>

                                <p>האתר מיועד למשתמשים מגיל 18 ואילך בלבד. השימוש על ידי משתמש שטרם מלאו לו 18 ייעשה אך ורק לאחר שניתן אישור הוריו/אפוטרופוסיו לכך.</p>

                                <p>החברה שומרת לעצמה את הזכות לשנות, מעת לעת, את תנאי השימוש, להוסיף עליהם או לגרוע מהם, וזאת ביחס לאתר, כולו או חלקו, למאפיינים שלו (Features) או ליישומים שלו (Applications).</p>

                                <p>החברה אינה אחראית לכל שיבוש, עיכוב או תקלה הנובעים מהסתמכות על מערכות, שירותים או תשתיות של צדדים שלישיים, לרבות שירותי מיפוי, ניתוב, דיווח מיקום, תקשורת סלולרית או כל שירות חיצוני אחר.</p>

                                <p>אין לעשות שימוש באתר או בתכנים המוצגים בו למטרות לא חוקיות ו/או באופן העומד בניגוד לתנאי השימוש.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">רכישת מוצרים/שירותים באמצעות האתר</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>האתר מאפשר למשתמשים לרכוש באמצעותו מוצרים או שירותים. הרכישה תבוצע באמצעות כרטיס אשראי ("אמצעי התשלום") ובהתאם לנהלים של החברה ושל חברות האשראי.</p>

                                <p>המחירים באתר כוללים מע"מ. המחירים באתר אינם כוללים דמי משלוח, אלא אם כן מצוין במפורש אחרת על ידי בית העסק.</p>

                                <p>משתמש שיבצע הזמנת מוצרים באמצעות האתר, יקבל הודעה ראשונית על קליטת פרטי הזמנתו. מובהר, כי הודעה זאת אינה מהווה התחייבות של החברה לספק את המוצרים שהוזמנו. כל ההזמנות כפופות לזמינות מלאי.</p>

                                <p>החברה אינה מבטיחה זמני הכנה או זמני משלוח קבועים, זמני האספקה מהווים הערכות בלבד.</p>

                                <p>האספקה תבוצע על-ידי בית העסק (או שליח מטעמו) לכתובת שמסר המשתמש. לשם שימוש בשירותי החברה על המשתמש להירשם ולמסור פרטים מדויקים.</p>

                                <p>מובהר ומוסכם כי כל המנות, המאכלים, המשקאות והמוצרים המוצעים באמצעות הפלטפורמה מוכנים, מבושלים, נארזים ומסופקים על-ידי בתי העסק בלבד. הפלטפורמה משמשת כגורם מתווך וטכנולוגי בלבד.</p>

                                <p>החברה אינה שותפה בפיקוח קולינרי, פיקוח תברואתי או פיקוח מקצועי על תהליכי ההכנה. כל האחריות בנוגע למנות ולמוצרים מוטלת על בית העסק בלבד.</p>

                                <p>התמונות המוצגות בפלטפורמה מסופקות על־ידי בתי העסק ונועדו להמחשה בלבד. ייתכנו הבדלים בין התמונות לבין המנה בפועל.</p>

                                <p>החברה רשאית לחסום חשבון משתמש במקרה של מסירת מידע כוזב, חשד לשימוש ברעה, פעילות לא חוקית, תלונות חוזרות של ספקים/שליחים, הזמנות פיקטיביות והפרת התקנון.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">ביטולים והחזרות</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>המשתמש רשאי לבטל עסקה בהתאם לחוק הגנת הצרכן, תשמ"א–1981, בתוך ארבעה־עשר ימים ממועד קבלת מוצר בר־החזרה. מוצרים פסידים – לרבות מוצרי מזון מוכנים, מזון טרי, מוצרים הדורשים קירור או מוצרים שאינם ניתנים למכירה מחדש – מוחרגים מזכות הביטול על פי דין.</p>

                                <p>בית העסק ממנו נרכשו המוצרים הוא המוכר, והאתר משמש כפלטפורמה טכנולוגית בלבד להעברת הזמנות. לשם ביצוע ביטול על המשתמש לשלוח הודעה באמצעות טופס השירות באתר, בדוא"ל support@meshelanu.co.il</p>

                                <p>ביטול שנעשה כדין מזכה את המשתמש בהחזר תשלומים, בכפוף להוראות הדין. בביטול שלא מחמת פגם או אי־התאמה, ייגבו דמי ביטול בשיעור הקבוע בחוק - חמישה אחוזים ממחיר העסקה או מאה שקלים, לפי הנמוך מביניהם.</p>

                                <p>המשלוחים מבוצעים על-ידי בית העסק או שליח מטעמו. השליחים אינם עובדי החברה ואינם פועלים מטעמה. כל טענה בקשר להתנהלות שליח תופנה לבית העסק בלבד.</p>

                                <p>המידע על אלרגנים, מרכיבי המנות, ערכים תזונתיים ונתוני כשרות מסופק על־ידי בתי העסק. החברה אינה אחראית לנכונות המידע. האחריות הבלעדית חלה על בית העסק.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">זכויות יוצרים</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>כל זכויות היוצרים, זכויות הקניין הרוחני והזכויות אשר דומות במהותן לזכויות יוצרים או זכויות קניין רוחני באתר, במידע, בתכנים הכלולים בו ובשירותים המוצעים בו, שייכות באופן בלעדי לחברה או לצדדים שלישיים שהקנו לחברה את הזכות לפרסמם באתר, והם מוגנים על ידי חוקי זכויות יוצרים של מדינות מסוימות (ובכללן ישראל) ואמנות בינלאומיות.</p>

                                <p>למעט אם הדבר הותר במפורש, חל איסור מוחלט להעתיק, לשכפל, לשנות, להפיץ, לשדר, להציג בפומבי, להעביר לציבור, לפרסם, לעבד, ליצור יצירות נגזרות, להעניק רישיון, למכור, להשכיר או לאחסן את תוכנו של האתר, בלא קבלת רשות מפורשת לכך מאת החברה, מראש ובכתב.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">קישורים לאתרים אחרים</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>האתר מכיל ו/או עשוי להכיל בתוכו קישורים (hyperlinks) אל מקורות מידע ותכנים אחרים המצויים על אתרים ברשת האינטרנט, אשר אינם חלק מהאתר ("האתרים האחרים"). החברה אינה שולטת או מפקחת על המידע המתפרסם באתרים האחרים. אין בהכללת הפנייה לאתרים האחרים משום הסכמה, מפורשת או משתמעת, מאת החברה לתכנים המפורטים באתרים הללו.</p>

                                <p>החברה לא תישא בכל אחריות לכל אבדן, נזק או הפסד, ישיר או עקיף, אשר עלולים להיגרם כתוצאה מהשימוש באתרים האחרים או במידע המצוי בהם.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">פרסום ותכנים של צדדים שלישיים</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>האתר עשוי להכיל תכנים או מידע אשר שייכים לצדדים שלישיים ו/או למשתמשים. החברה לא תישא בכל אחריות לתכנים הללו, לרבות לעניין הנכונות שלהם, העדכניות שלהם, השלמות שלהם וההשלכות הנובעות מהשימוש בהם.</p>

                                <p>האתר עשוי להכיל מידע מסחרי של צדדים שלישיים ("המפרסמים"), כגון פרסומות ומודעות מכירה. החברה אינה בודקת את תוכן הפרסומים המופיעים באתר, מהימנותם, אמינותם או עדכניותם. כל האחריות ביחס לתוכן של הפרסומים חלה על המפרסמים בלבד.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">אחריות ביחס לאתר ולתכנים המוצגים בו</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>התכנים המוצגים באתר והשירותים והמוצרים המוצעים באתר ניתנים לשימוש במצבם "כמות שהוא" (AS IS). החברה אינה מתחייבת לכך שהתכנים שיוצגו באתר ו/או כי השירותים או המוצרים שירכוש המשתמש באמצעות האתר יהלמו את הצרכים והציפיות של המשתמש.</p>

                                <p>החברה אינה נושאת בכל חבות או אחריות ביחס לטיב התכנים שיוצגו באתר (לרבות על-ידי המשתמשים), וזאת אף אם מדובר בתכנים פוגעניים, מגונים, לא חוקיים, מפרי זכויות יוצרים וכיוצא באלו.</p>

                                <p>על-אף שהחברה נוקטת באמצעים מקובלים לאבטחת התכנים המוצגים באתר, אין באפשרותה של החברה להבטיח כי לא יבוצעו חדירות לאתר, חשיפה של מידע שיוצג באתר, שיבושים או הפרעות לפעילות האתר או כי לא יחולו שגיאות ו/או תקלות. החברה לא תישא בכל חבות ו/או אחריות בקשר עם כל תקלה, הפרעה, הפסקה או נזק כאמור.</p>

                                <p>מבלי לגרוע מהאמור לעיל, מוסכם כי החברה ו/או מי מטעמה לא יישאו בכל אחריות לכל נזק, הפסד, הוצאה ו/או חיסרון כיס, ישירים או עקיפים, חוזיים, נזיקיים או אחרים אשר ייגרמו למשתמש בקשר עם השימוש באתר.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">דין וסמכות שיפוט</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>הדין החל על האתר, השימוש בו, תנאי השימוש וכל עניין בנוגע לאתר וליחסים בין המשתמש והחברה הנו דין מדינת ישראל. סמכות השיפוט הייחודית והבלעדית לעניין האתר נתונה אך ורק לבתי המשפט המוסמכים לכך בתל-אביב-יפו.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">נגישות</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>אנו מחויבים להנגיש את האתר שלנו לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות. האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ובהתאם לתקן הישראלי ת"י 5568 ברמת AA של הנחיות WCAG 2.0.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">כללי</h2>
                            <div className="space-y-4 text-sm md:text-base">
                                <p>תנאי שימוש אלו, ביחד עם התנאים המפורטים בחלקים אחרים של האתר, ממצים את מכלול ההוראות שיחולו לעניין השימוש באתר. שום התנהגות על-ידי החברה לא תחשב כויתור על איזו מזכויותיה על-פי תנאי שימוש אלו.</p>

                                <p>הודעות שתשלח החברה למשתמש בקשר עם השימוש באתר תשלחנה לכתובות שיזין המשתמש במהלך הרישום לאתר. החברה תהיה רשאית לשלוח כל הודעה באמצעות דואר רגיל או דואר אלקטרוני.</p>
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
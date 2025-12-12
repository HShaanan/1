import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, FileText } from "lucide-react";
import { AppSettings } from "@/entities/AppSettings";

export default function TermsOfUsePage() {
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AppSettings.list();
        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});
        
        // הגדרות ברירת מחדל
        const defaultSettings = {
          company_name: 'משלנו',
          company_email: 'info@meshlanoo.co.il',
          company_address: 'ביתר עילית, ישראל',
          terms_last_updated: new Date().toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          terms_version: '1.0',
          ...settingsMap
        };
        
        setAppSettings(defaultSettings);
      } catch (error) {
        console.error('Error loading app settings:', error);
        // הגדרות חירום
        setAppSettings({
          company_name: 'משלנו',
          company_email: 'info@meshlanoo.co.il', 
          company_address: 'ביתר עילית, ישראל',
          terms_last_updated: new Date().toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          terms_version: '1.0'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              תנאי שימוש
            </h1>
          </div>
          <p className="text-gray-600 text-lg">{appSettings.company_name} - לוח המודעות הקהילתי שלנו</p>
          <p className="text-sm text-gray-500 mt-2">
            עדכון אחרון: {appSettings.terms_last_updated} | גרסה: {appSettings.terms_version}
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-8 prose prose-slate max-w-none text-right space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">1. מבוא והגדרות</h2>
              <p>ברוכים הבאים ל"{appSettings.company_name}" (להלן: "האתר"), לוח מודעות קהילתי המיועד לשרת את תושבי ביתר עילית והסביבה. השימוש באתר, לרבות התכנים והשירותים המוצעים בו, כפוף לתנאים המפורטים להלן ("תנאי השימוש"). אנא קרא אותם בעיון, שכן עצם השימוש באתר מהווה הסכמה לתנאים אלו.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">2. הגבלת אחריות</h2>
              <p>האתר משמש כפלטפורמה להצגת מודעות בלבד. המידע והתוכן במודעות מסופקים על ידי המפרסמים והם באחריותם הבלעדית. הנהלת האתר אינה בודקת, מאמתת או נושאת באחריות לתוכן המודעות, לדיוקן, למהימנותן, לטיב המוצרים או השירותים המוצעים, או לכל התקשרות שתיווצר בין המשתמשים.</p>
              <p>השימוש באתר הינו על אחריותו הבלעדית של המשתמש. הנהלת האתר לא תישא באחריות לכל נזק, ישיר או עקיף, שייגרם למשתמש או לכל צד שלישי כתוצאה מהשימוש באתר.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">3. כללי התנהגות ופרסום באתר</h2>
              <p>אנו שואפים לשמור על מרחב נעים, מכבד ובטוח. על כן, חל איסור מוחלט על פרסום תכנים העונים על אחד או יותר מהבאים:</p>
              <ul className="list-disc pr-5 space-y-2 mt-2">
                <li>תוכן פוגעני, מעליב, משמיץ, מאיים או המפר את פרטיותו של אדם אחר.</li>
                <li>תוכן שאינו הולם את רוח המקום וערכי הקהילה, לרבות תכנים המפרים את כללי הצניעות.</li>
                <li>מידע כוזב, שקרי או מטעה.</li>
                <li>תוכן המהווה הפרה של זכויות יוצרים, סימני מסחר או קניין רוחני אחר.</li>
                <li>פרסום חוזר ונשנה של אותה מודעה ("ספאם").</li>
                <li>כל תוכן אחר המהווה עבירה על חוקי מדינת ישראל.</li>
              </ul>
              <p className="mt-2">הנהלת האתר שומרת לעצמה את הזכות המלאה להסיר, לערוך או לדחות כל מודעה לפי שיקול דעתה הבלעדי, ללא צורך במתן הסבר או הודעה מוקדמת.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">4. שירותים בתשלום ומדיניות החזרים</h2>
              <p>האתר עשוי להציע שירותי פרסום בתשלום, כגון הקפצת מודעות או הבלטתן. התשלום הינו עבור שירות הפרסום עצמו (כלומר, עבור חשיפה משופרת), ואינו מהווה ערובה לתוצאות עסקיות כלשהן (כגון פניות או מכירות).</p>
              <p><strong>מדיניות החזרים:</strong> מרגע שהמודעה פורסמה והשירות סופק, לא יינתן החזר כספי. במקרה של תקלה טכנית שמקורה באתר ומנעה את מתן השירות, ייבחן כל מקרה לגופו ותישקל האפשרות למתן זיכוי.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">5. קניין רוחני</h2>
              <p>כל זכויות היוצרים והקניין הרוחני באתר, לרבות עיצובו, הקוד, התכנים והסימנים המסחריים, שייכים להנהלת האתר. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי במידע מהאתר ללא קבלת אישור מפורש בכתב מהנהלת האתר.</p>
              <p>בעת העלאת תוכן לאתר, המשתמש מצהיר כי הוא בעל הזכויות בתוכן ומעניק לאתר רישיון חינמי, כלל-עולמי ובלתי מוגבל בזמן להציג, להפיץ ולעבד את התוכן במסגרת פעילות האתר.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">6. יצירת קשר ותמיכה</h2>
              <p>לכל שאלה, הצעה או תלונה בנוגע לתנאי השימוש או לפעילות האתר, ניתן ליצור קשר עמנו:</p>
              <ul className="list-none pr-0 space-y-1 mt-2">
                <li><strong>אימייל:</strong> {appSettings.company_email}</li>
                <li><strong>כתובת:</strong> {appSettings.company_address}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">7. סמכות שיפוט</h2>
              <p>על השימוש באתר ועל תנאי שימוש אלו יחולו אך ורק דיני מדינת ישראל. סמכות השיפוט הבלעדית בכל מחלוקת הנוגעת לאתר ו/או לשימוש בו תהיה נתונה לבתי המשפט המוסמכים במחוז ירושלים.</p>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-600">
                <strong>הערה:</strong> תנאי השימוש עשויים להתעדכן מעת לעת. המשתמשים יקבלו הודעה על שינויים משמעותיים. 
                המשך השימוש באתר לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            onClick={() => navigate(createPageUrl("Browse"))}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl px-8 py-3 text-lg font-semibold button-hover"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            חזרה לעמוד הראשי
          </Button>
        </div>
      </div>
    </div>
  );
}
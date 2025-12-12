import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accessibility, Phone, Mail } from 'lucide-react';

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-blue-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Accessibility className="w-8 h-8" />
              הצהרת נגישות
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">מחויבות לנגישות</h2>
              <p className="text-gray-600 leading-relaxed">
                אנו מחויבים להנגיש את האתר שלנו לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות. 
                האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), 
                התשע"ג-2013, ובהתאם לתקן הישראלי ת"י 5568 ברמת AA של הנחיות WCAG 2.0.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">התאמות הנגישות באתר</h2>
              <ul className="text-gray-600 space-y-2 list-disc list-inside">
                <li>מבנה סמנטי תקני - שימוש נכון בתגיות HTML לניווט קל</li>
                <li>ניווט מלא באמצעות מקלדת</li>
                <li>חיווי פוקוס ברור לכל האלמנטים האינטראקטיביים</li>
                <li>טקסטים חלופיים לתמונות</li>
                <li>ניגודיות צבעים מספקת</li>
                <li>אפשרות להגדלת טקסט עד 200%</li>
                <li>כפתור "דלג לתוכן" לניווט מהיר</li>
                <li>תוויות ברורות בטפסים</li>
                <li>תמיכה בקוראי מסך</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">כלי הנגישות</h2>
              <p className="text-gray-600 leading-relaxed">
                באתר קיים כפתור נגישות (סמל נגישות בצד שמאל של המסך) המאפשר:
              </p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside mt-2">
                <li>הגדלה והקטנה של טקסט</li>
                <li>מצב ניגודיות גבוהה</li>
                <li>הדגשת קישורים</li>
                <li>עצירת אנימציות</li>
                <li>סמן עכבר מוגדל</li>
                <li>הדגשת פוקוס מוגברת</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">דפדפנים נתמכים</h2>
              <p className="text-gray-600 leading-relaxed">
                האתר תומך בדפדפנים הנפוצים בגרסאותיהם העדכניות: 
                Google Chrome, Mozilla Firefox, Microsoft Edge, Safari.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">פנייה בנושא נגישות</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                אם נתקלתם בבעיית נגישות באתר או שיש לכם הצעות לשיפור, 
                נשמח לשמוע מכם. ניתן לפנות אלינו באחת הדרכים הבאות:
              </p>
              
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-gray-700 font-medium">רכז/ת נגישות:</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>[יש להוסיף כתובת מייל]</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>[יש להוסיף מספר טלפון]</span>
                </div>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">
                הצהרה זו עודכנה לאחרונה בתאריך: {new Date().toLocaleDateString('he-IL')}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
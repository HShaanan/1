import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * AxeReporter
 * משתמש בספריית @axe-core/react כדי לבצע בדיקות נגישות אוטומטיות בזמן אמת.
 * התוצאות יודפסו לקונסול של הדפדפן (Chrome DevTools Console).
 * מומלץ להשתמש בזה בסביבת פיתוח כדי לזהות בעיות כמו ניגודיות, תוויות חסרות ועוד.
 */
export default function AxeReporter() {
  useEffect(() => {
    // טוען את הספרייה דינמית כדי לא להכביד על ה-Bundle הראשוני
    import('@axe-core/react').then(axe => {
      // הרצת הבדיקה עם השהייה של 1000ms כדי לאפשר ל-DOM להתייצב
      axe.default(React, ReactDOM, 1000, {
        // הגדרות אופציונליות - ניתן להוסיף חוקים או להתעלם מאזורים מסוימים
        /*
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
        */
      });
    }).catch(err => {
      console.error('Failed to load @axe-core/react', err);
    });
  }, []);

  return null;
}
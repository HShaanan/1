import { parseISO, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

// פונקציה ליצירת תאריך בשעון ישראל
export const createIsraeliDate = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();
  
  // המרה לשעון ישראל
  const israelTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const israelDateString = `${israelTime.find(p => p.type === 'year').value}-${israelTime.find(p => p.type === 'month').value}-${israelTime.find(p => p.type === 'day').value}T${israelTime.find(p => p.type === 'hour').value}:${israelTime.find(p => p.type === 'minute').value}:${israelTime.find(p => p.type === 'second').value}`;
  
  return new Date(israelDateString);
};

// פונקציה לעיצוב תאריך בלבד בעברית
export const formatIsraeliDate = (dateString) => {
  try {
    if (!dateString) return "תאריך לא זמין";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "תאריך לא תקין";

    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Jerusalem'
    }).format(date);
  } catch (error) {
    console.error('Error formatting Israeli date:', error);
    return "תאריך לא תקין";
  }
};

// פונקציה לעיצוב תאריך ושעה עם היסט (Offset) דינמי
export const formatDateTimeWithOffset = (dateString, offsetHours = 2) => {
  try {
    if (!dateString) return "תאריך לא זמין";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "תאריך לא תקין";

    // שיפור: שימוש ב-Intl עבור ישראל (הכי נפוץ ומדויק לשעון קיץ/חורף)
    if (Math.abs(offsetHours - 2) < 0.1 || Math.abs(offsetHours - 3) < 0.1) {
       return new Intl.DateTimeFormat('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jerusalem',
          hour12: false
       }).format(date).replace(',', '');
    }

    // הוספת ההיסט לזמן ה-UTC (עבור אזורי זמן אחרים)
    const targetTime = new Date(date.getTime() + (offsetHours * 60 * 60 * 1000));
    
    const day = targetTime.getUTCDate().toString().padStart(2, '0');
    const month = (targetTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = targetTime.getUTCFullYear();
    const hours = targetTime.getUTCHours().toString().padStart(2, '0');
    const minutes = targetTime.getUTCMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime with offset:', error);
    return "תאריך לא תקין";
  }
};

// פונקציה לעיצוב תאריך ושעה בעברית - שומרת על תאימות לאחור אך עדיף להשתמש בחדשה
export const formatIsraeliDateTime = (dateString) => {
  // ברירת מחדל - שעון ישראל (כמו שהיה קודם)
  return formatDateTimeWithOffset(dateString, 2); 
};

// פונקציה להצגת זמן יחסי (לפני כמה זמן)
export const formatRelativeTime = (dateString) => {
  try {
    if (!dateString) return "זמן לא ידוע";
    
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    // כאן אנחנו משתמשים בזמן המקומי של הדפדפן לחישוב יחסי, זה בדרך כלל בסדר ל"לפני X זמן"
    // אבל אם רוצים לדייק לפי איזור זמן השרת, זה מורכב יותר כי formatDistanceToNow משווה לזמן הנוכחי של הדפדפן.
    
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: he 
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return "זמן לא תקין";
  }
};

// פונקציה ליצירת תאריך פקיעה (7 ימים מהיום)
export const createExpiryDate = (daysFromNow = 7) => {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return expiryDate.toISOString();
};

// פונקציה לבדיקה האם תאריך פג
export const isExpired = (dateString) => {
  try {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    return false;
  }
};

// פונקציה להשוואת תאריכים
export const isToday = (dateString) => {
  try {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

export default {
  createIsraeliDate,
  formatIsraeliDate,
  formatIsraeliDateTime,
  formatDateTimeWithOffset,
  formatRelativeTime,
  createExpiryDate,
  isExpired,
  isToday
};
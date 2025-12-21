/**
 * בדיקה אם עסק פתוח כרגע על בסיס שעות הפעילות
 * @param {Object} hours - אובייקט שעות הפעילות
 * @returns {Object} - { isOpen: boolean, message: string, nextChange: string }
 */
export function checkBusinessOpen(hours) {
  if (!hours) {
    return { isOpen: false, message: 'שעות פעילות לא צוינו', nextChange: '' };
  }

  // טיפול בפורמטים שונים
  let schedule = {};
  
  if (typeof hours === 'string') {
    try {
      const parsed = JSON.parse(hours);
      schedule = parsed.schedule || parsed;
    } catch (e) {
      return { isOpen: false, message: 'שגיאה בניתוח שעות', nextChange: '' };
    }
  } else if (hours && typeof hours === 'object') {
    schedule = hours.schedule || hours;
  }

  // המרה מפורמט ישן לחדש אם נדרש
  if (schedule && Object.keys(schedule).length > 0) {
    const firstKey = Object.keys(schedule)[0];
    const firstDay = schedule[firstKey];
    
    if (firstDay && (firstDay.hasOwnProperty('open') || firstDay.hasOwnProperty('closed'))) {
      const newSchedule = {};
      Object.keys(schedule).forEach(day => {
        const oldDay = schedule[day];
        if (oldDay.closed) {
          newSchedule[day] = { isOpen: false };
        } else if (oldDay.open && oldDay.close) {
          newSchedule[day] = {
            isOpen: true,
            is24Hours: false,
            timeRanges: [{ open: oldDay.open, close: oldDay.close }]
          };
        }
      });
      schedule = newSchedule;
    }
  }

  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentDayKey = dayOrder[currentDay];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // זמן בדקות מחצות

  const todaySchedule = schedule[currentDayKey];

  if (!todaySchedule || !todaySchedule.isOpen) {
    return { isOpen: false, message: 'סגור כעת', nextChange: '' };
  }

  if (todaySchedule.is24Hours) {
    return { isOpen: true, message: 'פתוח 24 שעות', nextChange: '' };
  }

  if (!todaySchedule.timeRanges || todaySchedule.timeRanges.length === 0) {
    return { isOpen: false, message: 'סגור כעת', nextChange: '' };
  }

  // המרת זמן מטקסט (HH:MM) למספר דקות
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // בדיקה אם השעה הנוכחית נמצאת בטווח כלשהו
  for (const range of todaySchedule.timeRanges) {
    const openTime = timeToMinutes(range.open);
    const closeTime = timeToMinutes(range.close);

    // טיפול במקרה שהעסק סוגר אחרי חצות (למשל 22:00-02:00)
    if (closeTime < openTime) {
      // אם השעה אחרי פתיחה או לפני סגירה
      if (currentTime >= openTime || currentTime < closeTime) {
        const nextClose = currentTime >= openTime 
          ? `סוגר ב-${range.close}`
          : `סוגר ב-${range.close}`;
        return { isOpen: true, message: `פתוח כעת • ${nextClose}`, nextChange: nextClose };
      }
    } else {
      // מקרה רגיל
      if (currentTime >= openTime && currentTime < closeTime) {
        return { isOpen: true, message: `פתוח כעת • סוגר ב-${range.close}`, nextChange: `סוגר ב-${range.close}` };
      }
    }
  }

  // אם הגענו לכאן, העסק סגור כרגע
  // נמצא את השעה הקרובה שהעסק נפתח
  const nextRange = todaySchedule.timeRanges.find(range => {
    const openTime = timeToMinutes(range.open);
    return currentTime < openTime;
  });

  if (nextRange) {
    return { isOpen: false, message: `סגור כעת • פותח ב-${nextRange.open}`, nextChange: `פותח ב-${nextRange.open}` };
  }

  return { isOpen: false, message: 'סגור כעת', nextChange: '' };
}
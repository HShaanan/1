// Utility to parse business hours and check if open
export const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const parseHours = (hoursData) => {
  if (!hoursData) return null;
  
  try {
    // If it's already an object
    if (typeof hoursData === 'object') return hoursData;
    
    // Try to parse JSON
    if (typeof hoursData === 'string' && (hoursData.startsWith('{') || hoursData.startsWith('['))) {
      return JSON.parse(hoursData);
    }
    
    // Handle string format (simplified)
    // This is a basic parser for the legacy string format if used
    return null; 
  } catch (e) {
    console.error("Error parsing hours:", e);
    return null;
  }
};

export const isOpenNow = (hoursData) => {
  const schedule = parseHours(hoursData);
  if (!schedule) return false;

  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday
  
  const currentDayKey = days[dayIndex];
  const daySchedule = schedule[currentDayKey];

  if (!daySchedule || !daySchedule.isOpen) return false;
  if (!daySchedule.open || !daySchedule.close) return false; 

  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const parseTime = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 100 + m;
  };

  const openTime = parseTime(daySchedule.open);
  const closeTime = parseTime(daySchedule.close);

  if (closeTime < openTime) {
    // Crosses midnight (e.g. 18:00 to 02:00)
    return currentTime >= openTime || currentTime <= closeTime;
  }

  return currentTime >= openTime && currentTime <= closeTime;
};
Deno.serve(() => {
  try {
    const now = new Date();
    // שעון ישראל הוא UTC+2 (רגיל) או UTC+3 (קיץ).
    // Intl.DateTimeFormat יודע להתמודד עם שעון קיץ אוטומטית.
    const timeOptions = {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const dateOptions = {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const timeString = new Intl.DateTimeFormat('he-IL', timeOptions).format(now);
    const dateString = new Intl.DateTimeFormat('he-IL', dateOptions).format(now);
    const isoString = now.toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem' }).replace(' ', 'T') + 'Z';

    const response = {
      israel_time: timeString,
      israel_date: dateString,
      full_iso_string: isoString,
      timestamp: now.getTime(),
    };
    
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
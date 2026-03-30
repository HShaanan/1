export async function getIsraelTime(_params) {
  const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  return { data: { time: now, timezone: 'Asia/Jerusalem' } };
}

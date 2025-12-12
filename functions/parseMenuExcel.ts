import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as XLSX from 'npm:xlsx@0.18.5';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeId(prefix = 'id') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

// זיהוי עמודות גמיש
function normalizeHeader(h) {
  if (!h) return '';
  const raw = String(h).trim();
  const s = raw.toLowerCase();

  // ניקוי סוגריים וסימני מטבע מהכותרת עצמה
  const sClean = s
    .replace(/\(.*?\)/g, '')
    .replace(/[₪$€]|nis|ils|ש"ח|שח|ש׳ח|ש”ח|ש״ח/gi, '')
    .trim();

  // בדיקות כוללות
  const includesAny = (str, arr) => arr.some(k => str.includes(k));

  // price
  if (includesAny(sClean, ['price', 'amount', 'cost', 'מחיר', 'עלות', 'סכום', 'תמחור', 'עלות פריט', 'מחירון'])) {
    return 'price';
  }

  // category
  if (includesAny(sClean, ['category', 'קטגור', 'קבוצה', 'סיווג', 'מדור'])) {
    return 'category';
  }

  // item name
  if (includesAny(sClean, ['item', 'product', 'שם פריט', 'פריט', 'מוצר', 'שם'])) {
    // אם הכותרת כוללת גם "קטגור" - זו קטגוריה ולא פריט
    if (sClean.includes('קטגור')) return 'category';
    return 'item';
  }

  // note/description
  if (includesAny(sClean, ['note', 'desc', 'description', 'הערה', 'תיאור'])) {
    return 'note';
  }

  // image/url
  if (includesAny(sClean, ['image', 'img', 'תמונה', 'url', 'קישור'])) {
    return 'image';
  }

  // אם לא זוהה - מחזירים את המקור
  return raw;
}

// חילוץ מחיר ממספר/טקסט
function extractPriceString(val, currencyHint = '') {
  if (val == null) return '';
  // אם הגיע מספר
  if (typeof val === 'number') {
    const asStr = Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)));
    return asStr;
  }
  // טקסט - חילוץ מספר עם עשרוני
  const s = String(val).trim();
  if (!s) return '';
  // מחיקת רווחים לא נחוצים
  const compact = s.replace(/\s+/g, ' ');
  // חיפוש תבנית מספר כולל אלפים/עשרוני
  const match = compact.match(/-?\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!match) return '';

  let numStr = match[0].replace(/\s/g, '');
  // טיפול באלפים: אם יש גם פסיק וגם נקודה, מנרמלים לפי הקשר; אחרת מסירים פסיקים אלפים
  if (/,/.test(numStr) && /\./.test(numStr)) {
    // נסיק שהפסיק הוא מפריד אלפים
    numStr = numStr.replace(/,/g, '');
  } else if (/,/.test(numStr) && !/\./.test(numStr)) {
    // כנראה שפסיק הוא עשרוני
    numStr = numStr.replace(',', '.');
  } else {
    // השמטת פסיק אלפים
    numStr = numStr.replace(/,/g, '');
  }

  // השארת מינוס אם יש
  if (!/^-?\d+(\.\d+)?$/.test(numStr)) return '';

  // השאר כמספר סטרינג
  const withCurrency = /₪|nis|ils|ש"ח|שח|ש׳ח|ש”ח|ש״ח/i.test(s + ' ' + currencyHint);
  // ברירת מחדל: להחזיר רק המספר; אם תרצה מטבע אפשר לצרף " ₪"
  return numStr; // נשאיר בלי מטבע לטובת אחידות במודול
}

function buildMenuFromRows(rows) {
  // rows: array of objects with normalized keys
  const catMap = new Map();
  rows.forEach((r) => {
    // חיפוש שדות גם אם לא נורמלו
    const keys = Object.keys(r);

    // מציאת מחיר אם לא הגיע תחת 'price'
    let priceSource = r.price;
    if (priceSource == null || priceSource === '') {
      // נסה לאתר עמודת מחיר לפי שם שכולל 'price'/'מחיר' וכו'
      const priceKey = keys.find(k => normalizeHeader(k) === 'price');
      if (priceKey) priceSource = r[priceKey];
      else {
        const guessKey = keys.find(k => /מחיר|Price|Amount|עלות|תמחור|סכום/i.test(String(k)));
        if (guessKey) priceSource = r[guessKey];
      }
    }

    // מטבע נפרד אם קיים
    const currencyKey = keys.find(k => /(currency|מטבע|₪|nis|ils)/i.test(String(k)));
    const currencyHint = currencyKey ? r[currencyKey] : '';

    const category =
      (r.category ?? r['קטגוריה'] ?? r['Category'] ?? 'ללא קטגוריה').toString().trim() || 'ללא קטגוריה';

    // שם פריט
    let itemName = (r.item ?? r['פריט'] ?? r['product'] ?? r['שם פריט'] ?? r['מוצר'] ?? '').toString().trim();
    // אם לא נמצא, נסה: אם יש שדה 'שם' והוא לא קטגוריה
    if (!itemName) {
      const nameKey = keys.find(k => /^(שם|name)$/i.test(String(k)) && normalizeHeader(k) !== 'category');
      if (nameKey) itemName = String(r[nameKey] ?? '').trim();
    }
    if (!itemName) return;

    if (!catMap.has(category)) {
      catMap.set(category, {
        id: makeId('cat'),
        name: category,
        items: []
      });
    }

    const priceStr = extractPriceString(priceSource, currencyHint);
    const note = r.note ?? r['הערה'] ?? r['תיאור'] ?? '';
    const image = r.image ?? r['תמונה'] ?? r['url'] ?? '';

    const item = {
      id: makeId('item'),
      name: itemName,
      price: priceStr,
      note: note ? String(note) : '',
      image: image ? String(image) : ''
    };

    catMap.get(category).items.push(item);
  });

  return Array.from(catMap.values());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = body?.file_url;

    if (!fileUrl || typeof fileUrl !== 'string') {
      return json({ ok: false, error: 'file_url is required' }, 400);
    }

    const resp = await fetch(fileUrl);
    if (!resp.ok) {
      return json({ ok: false, error: 'Failed to download file' }, 400);
    }

    const ct = resp.headers.get('content-type') || '';
    const isCSV = /\.csv($|\?)/i.test(fileUrl) || ct.includes('text/csv');

    let workbook;
    if (isCSV) {
      const text = await resp.text();
      workbook = XLSX.read(text, { type: 'string' });
    } else {
      const buf = await resp.arrayBuffer();
      workbook = XLSX.read(new Uint8Array(buf), { type: 'array' });
    }

    const sheetNames = workbook.SheetNames || [];
    if (sheetNames.length === 0) {
      return json({ ok: false, error: 'No sheets found' }, 400);
    }

    // ניסיון לאיתור גיליון מתאים לפי שם, אחרת הראשון
    const itemsSheetName = sheetNames.find(n => /items|תפריט|menu|מוצרים|פריטים/i.test(n)) || sheetNames[0];
    const ws = workbook.Sheets[itemsSheetName];

    let rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    // Normalize headers to unified keys
    rows = rows.map((row) => {
      const out = {};
      Object.keys(row).forEach((k) => {
        const nk = normalizeHeader(k);
        out[nk] = row[k];
      });
      return out;
    });

    const menu = buildMenuFromRows(rows);

    return json({
      ok: true,
      menu,
      stats: { categories: menu.length, items: menu.reduce((s, c) => s + (c.items?.length || 0), 0) }
    });
  } catch (err) {
    console.error('parseMenuExcel error', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});
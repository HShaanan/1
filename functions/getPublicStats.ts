import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

// Simple IP-based rate limiter (in-memory)
const rlMap = new Map(); // key -> {count, start}
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQ = 80; // up to 80 calls / 10m per IP

function getIp(req) {
  const xf = req.headers.get('x-forwarded-for') || '';
  return (xf.split(',')[0] || '').trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRate(req) {
  const ip = getIp(req);
  const now = Date.now();
  const rec = rlMap.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) {
    rlMap.set(ip, { count: 1, start: now });
    return { ok: true };
  }
  if (rec.count >= MAX_REQ) return { ok: false, retryAfter: Math.ceil((rec.start + WINDOW_MS - now) / 1000) };
  rec.count += 1;
  rlMap.set(ip, rec);
  return { ok: true };
}

Deno.serve(async (req) => {
  const rate = checkRate(req);
  if (!rate.ok) {
    return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter || 60) }
    });
  }

  const base44 = createClientFromRequest(req);

  try {
    // service role read only – public stats
    const [listings, categories, users] = await Promise.all([
      base44.asServiceRole.entities.Listing.filter({ is_active: true, approval_status: "approved" }),
      base44.asServiceRole.entities.Category.filter({ is_active: true }),
      base44.asServiceRole.entities.User.list()
    ]);

    const data = {
      totalListings: Array.isArray(listings) ? listings.length : 0,
      activeUsers: Array.isArray(users) ? users.length : 0,
      categories: Array.isArray(categories) ? categories.length : 0
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120'
      }
    });
  } catch (_err) {
    const fallback = { totalListings: 0, activeUsers: 0, categories: 0 };
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
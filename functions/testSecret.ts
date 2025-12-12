
// Redeploy trigger: 2024-08-15 11:00
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function mask(val) {
  if (!val) return null;
  const s = String(val);
  if (s.length <= 6) return '*'.repeat(s.length);
  return `${s.slice(0, 3)}…${s.slice(-3)} (${s.length})`;
}

async function hmacSHA256Base64(keyString, message) {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyString);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  const u8 = new Uint8Array(sigBuf);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // הרשאה: רק משתמש מחובר ורק אדמין
  const authed = await base44.auth.isAuthenticated().catch(() => false);
  if (!authed) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  const me = await base44.auth.me().catch(() => null);
  if (!me || me.role !== "admin") {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" }
    });
  }

  let body = {};
  try { body = await req.json(); } catch {}
  const echo = (body?.echo && String(body.echo)) || `healthcheck-${Date.now()}`;

  const testKey = Deno.env.get("TEST_KEY");
  if (!testKey) {
    return new Response(JSON.stringify({
      ok: false,
      error: "TEST_KEY is missing in environment",
      diagnostics: { present: false }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  try {
    const signature = await hmacSHA256Base64(testKey, echo);
    return new Response(JSON.stringify({
      ok: true,
      present: true,
      using_key: "TEST_KEY",
      key_mask: mask(testKey),
      echo,
      signature,
      note: "Signature is HMAC-SHA256 over the echo string using TEST_KEY"
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(e?.message || e),
      present: true,
      using_key: "TEST_KEY"
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
});

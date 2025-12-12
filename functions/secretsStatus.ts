
// Redeploy trigger: 2024-08-15 11:00
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

function mask(val) {
  if (!val) return null;
  const s = String(val);
  if (s.length <= 8) return '*'.repeat(s.length);
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function pickFirstEnv(keys = []) {
  for (const k of keys) {
    const v = Deno.env.get(k);
    if (v) return { key: k, value: v };
  }
  return { key: null, value: null };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const authed = await base44.auth.isAuthenticated().catch(() => false);
  if (!authed) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const me = await base44.auth.me().catch(() => null);
  if (!me || me.role !== "admin") {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const groups = [
    {
      label: "GoogleAI",
      variants: ["GoogleAI", "GOOGLE_AI_API_KEY", "GOOGLEAI"],
      hint: "מפתח Gemini (Google AI Studio)."
    },
    {
      label: "OpenAI",
      variants: ["OpenAI", "OPENAI_API_KEY", "openai"],
      hint: "מפתח OpenAI."
    },
    {
      label: "Google Maps (Browser/Server)",
      variants: ["GOOGLE_MAPS_APIKEY", "GOOGLE_MAPS_APIKEY_CLIENT", "GOOGLE_MAPS_BROWSER_KEY", "GOOGLE_MAPS_PUBLIC_KEY", "GOOGLE_MAPS_APIKEY_SERVER"],
      hint: "מפתח מפות (Browser/Server)."
    },
    {
      label: "TEST_KEY",
      variants: ["TEST_KEY"],
      hint: "מפתח בדיקות פנימי."
    }
  ];

  const status = groups.map((g) => {
    const found = pickFirstEnv(g.variants);
    const present = !!found.value;
    return {
      name: g.label,
      present,
      using_key: found.key,
      masked: present ? mask(found.value) : null,
      length: present ? String(found.value).length : 0,
      hint: g.hint
    };
  });

  // Optional Map ID
  const mapId = Deno.env.get("GOOGLE_MAPS_MAP_ID") || Deno.env.get("MAPS_MAP_ID") || Deno.env.get("GOOGLE_MAPS_MAPID") || null;

  return new Response(JSON.stringify({ ok: true, secrets: status, mapId: mapId || null }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

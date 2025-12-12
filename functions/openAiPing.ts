import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import OpenAI from 'npm:openai';

function getOpenAIKey() {
  return (
    Deno.env.get("OpenAI") ||
    Deno.env.get("OPENAI_API_KEY") ||
    Deno.env.get("openai")
  );
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const authed = await base44.auth.isAuthenticated().catch(() => false);
  if (!authed) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const me = await base44.auth.me().catch(() => null);
  if (!me || me.role !== "admin") return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await req.json().catch(() => ({}));
  const prompt = body?.prompt || "בדיקת OpenAI קצרה בעברית: החזר JSON {\"ok\":true} בלבד.";

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing OPENAI_API_KEY/OpenAI" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "אתה מחזיר תמיד מענה קצר בעברית." },
        { role: "user", content: prompt }
      ],
      temperature: 0
    });

    const text = resp?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ ok: true, model: "gpt-4o-mini", text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import OpenAI from 'npm:openai';

// קריאת המפתח מהסביבה
function getOpenAIKey() {
  return (
    Deno.env.get("OpenAI") ||
    Deno.env.get("OPENAI_API_KEY") ||
    Deno.env.get("openai")
  );
}

function toString(v) {
  return (v ?? "").toString();
}

function ensureArray(val) {
  return Array.isArray(val) ? val : (val ? [val] : []);
}

// ניקוי וספרסינג JSON בטוח
function tryParseJson(text) {
  if (!text) return null;
  const cleaned = String(text).trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s >= 0 && e > s) {
      try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { return null; }
    }
    return null;
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // הרשאת משתמש רגיל
  const authed = await base44.auth.isAuthenticated().catch(() => false);
  if (!authed) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  // פרמטרים מהלקוח
  let body = {};
  try { body = await req.json(); } catch {}

  const {
    // קלט
    prompt,                 // string אופציונלי
    messages,               // אופציונלי: [{role, content}]
    system_instruction,     // אופציונלי
    // דגם + פרמטרים
    model = "gpt-4o-mini",
    temperature,
    top_p,
    max_tokens,
    // יציאה מובנית
    response_mime_type,     // "application/json" ידרוש JSON יציב
    response_json_schema,   // אובייקט סכמת JSON (הנחיה בלבד בצ'אט; נעשה אימוץ לוגי)
    // אינטרנט
    use_internet = false    // אם true, נרחיב הקשר אוטומטית מהאינטרנט
  } = body || {};

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing OpenAI key (OpenAI/OPENAI_API_KEY)" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // איסוף טקסט המשתמש לצורך חיפוש אינטרנטי
  const userText = (() => {
    if (typeof prompt === "string" && prompt.trim()) return prompt;
    if (Array.isArray(messages)) {
      const last = [...messages].reverse().find(m => m && m.role === "user" && m.content);
      return toString(last?.content);
    }
    return "";
  })();

  // הרחבת הקשר מהאינטרנט (באמצעות Core.InvokeLLM)
  let webContext = "";
  let usedInternet = false;
  if (use_internet && userText) {
    try {
      const ctx = await base44.integrations.Core.InvokeLLM({
        prompt: userText,
        add_context_from_internet: true
      });
      if (typeof ctx === "string") {
        webContext = ctx;
      } else if (ctx && typeof ctx === "object") {
        webContext = JSON.stringify(ctx);
      }
      usedInternet = !!webContext;
    } catch {
      usedInternet = false;
      webContext = "";
    }
  }

  const openai = new OpenAI({ apiKey });

  // בניית ההודעות לצ'אט
  const sysParts = [];
  if (system_instruction) sysParts.push(system_instruction);
  if (webContext) {
    sysParts.push([
      "להלן הקשר מעודכן מהאינטרנט:",
      webContext.slice(0, 6000),
      "השתמש/י בו בזהירות ואל תמציא עובדות. אם משהו לא ודאי – ציין/ני זאת."
    ].join("\n\n"));
  }

  let chatMessages = [];
  if (sysParts.length) {
    chatMessages.push({ role: "system", content: sysParts.join("\n\n---\n\n") });
  }

  if (Array.isArray(messages) && messages.length) {
    chatMessages = chatMessages.concat(messages.map(m => ({
      role: m.role || "user",
      content: toString(m.content)
    })));
  } else if (prompt) {
    chatMessages.push({ role: "user", content: toString(prompt) });
  } else {
    return new Response(JSON.stringify({ ok: false, error: "Missing prompt/messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // אם הלקוח ביקש JSON – נוסיף הנחיה חזקה
  if (response_mime_type === "application/json" && response_json_schema) {
    const schemaHint = "החזר JSON בלבד לפי הסכמה המסופקת. ללא טקסט מחוץ ל-JSON.";
    chatMessages.unshift({
      role: "system",
      content: `${schemaHint}\nסכמה (לייחוס בלבד): ${JSON.stringify(response_json_schema)}`
    });
  }

  try {
    const payload = {
      model,
      messages: chatMessages,
      temperature: typeof temperature === "number" ? temperature : undefined,
      top_p: typeof top_p === "number" ? top_p : undefined,
      max_tokens: typeof max_tokens === "number" ? max_tokens : undefined
    };

    const resp = await openai.chat.completions.create(payload);
    const text = resp?.choices?.[0]?.message?.content || "";

    const result = {
      ok: true,
      model,
      used_internet: usedInternet,
      web_context_excerpt: webContext ? webContext.slice(0, 800) : null,
      text,
      json: null,
      raw: resp
    };

    if (response_mime_type === "application/json") {
      result.json = tryParseJson(text);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
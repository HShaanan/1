
import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Key, CheckCircle, AlertTriangle, RefreshCcw, Globe, MapPin, BrainCircuit } from "lucide-react";
import { Image as ImageIcon, Download } from "lucide-react";

import { secretsStatus } from "@/functions/secretsStatus";
import { openAiPing } from "@/functions/openAiPing";
import { googleAiGenerate } from "@/functions/googleAiGenerate";
import { getGoogleMapsKey } from "@/functions/getGoogleMapsKey";
import { geocodeAddress } from "@/functions/geocodeAddress";
import { googleAiImageGenerate } from "@/functions/googleAiImageGenerate";
import { testSecret } from "@/functions/testSecret"; // NEW: Added import for testSecret

export default function AdminSecrets() {
  const [me, setMe] = useState(null);
  const [authError, setAuthError] = useState("");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [mapId, setMapId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Tests states
  const [googleAiState, setGoogleAiState] = useState({ running: false, ok: null, msg: "" });
  const [openAiState, setOpenAiState] = useState({ running: false, ok: null, msg: "" });
  const [gmapsState, setGmapsState] = useState({ running: false, ok: null, msg: "" });
  const [googleImgState, setGoogleImgState] = useState({
    running: false,
    ok: null,
    msg: "",
    data_url: "",
    diagnostics: null,
    fallback_ok: null, // This field is kept to avoid breaking rendering, but will always be null
    fallback_url: ""   // This field is kept to avoid breaking rendering, but will always be empty
  });
  // NEW: State for TEST_KEY test
  const [testKeyState, setTestKeyState] = useState({ running: false, ok: null, msg: "", mask: "", signature: "", echo: "" });
  const [testEcho, setTestEcho] = useState("healthcheck"); // NEW: טקסט לבדיקה

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        if (u.role !== "admin") {
          setAuthError("אין לך הרשאה לעמוד זה");
          return;
        }
        setMe(u);
        await load();
      } catch {
        setAuthError("יש להתחבר כמנהל כדי לגשת לעמוד זה");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const load = async () => {
    setRefreshing(true);
    try {
      const { data } = await secretsStatus({});
      setItems(data?.secrets || []);
      setMapId(data?.mapId || null);
    } finally {
      setRefreshing(false);
    }
  };

  const runGoogleAiTest = async () => {
    setGoogleAiState({ running: true, ok: null, msg: "" });
    try {
      const { data } = await googleAiGenerate({
        prompt: "בדיקת GoogleAI קצרה: כתוב 'הצלחה' במילה אחת."
      });
      const ok = !!data?.text;
      setGoogleAiState({ running: false, ok, msg: ok ? data.text.slice(0, 120) : (data?.error || "כשל") });
    } catch (e) {
      setGoogleAiState({ running: false, ok: false, msg: String(e?.message || e) });
    }
  };

  const runOpenAiTest = async () => {
    setOpenAiState({ running: true, ok: null, msg: "" });
    try {
      const { data } = await openAiPing({ prompt: "בדיקת OpenAI קצרה: כתוב 'הצלחה' במילה אחת." });
      setOpenAiState({ running: false, ok: !!data?.ok, msg: data?.text || (data?.error || "") });
    } catch (e) {
      setOpenAiState({ running: false, ok: false, msg: String(e?.message || e) });
    }
  };

  const runGmapsTest = async () => {
    setGmapsState({ running: true, ok: null, msg: "" });
    try {
      const { data: keyRes } = await getGoogleMapsKey({});
      if (!keyRes?.ok || !keyRes?.apiKey) {
        setGmapsState({ running: false, ok: false, msg: "מפתח מפות לא הוגדר" });
        return;
      }
      const { data: geoRes } = await geocodeAddress({ address: "ירושלים" });
      const ok = !!(geoRes?.lat && geoRes?.lng);
      setGmapsState({ running: false, ok, msg: ok ? `lat:${geoRes.lat}, lng:${geoRes.lng}` : (geoRes?.error || "כשל גיאוקוד") });
    } catch (e) {
      setGmapsState({ running: false, ok: false, msg: String(e?.message || e) });
    }
  };

  const runGoogleImageTest = async () => {
    const googleSecret = items.find((i) => (i?.name || "").toLowerCase().includes("googleai"));
    setGoogleImgState({
      running: true, ok: null, msg: "", data_url: "",
      diagnostics: { keyPresent: !!googleSecret?.present, usingKey: googleSecret?.using_key || null },
      fallback_ok: null, // Resetting this to null as fallback is removed
      fallback_url: ""   // Resetting this to empty as fallback is removed
    });

    try {
      const prompt = "תמונה שיווקית נקייה בסגנון מודרני (ללא טקסט) המתאימה לתצוגת כרטיס קטגוריה באתר, יחס 1:1. לציבור הדתי/חרדי: אם מופיעים אנשים – רק גברים בלבוש ייצוגי וצנוע.";
      const res = await googleAiImageGenerate({
        prompt,
        aspect_ratio: "1:1",
        number_of_images: 1,
        mime_type: "image/png"
      });

      const ok = !!res?.data?.ok && !!res?.data?.data_url;
      if (ok) {
        setGoogleImgState((s) => ({
          ...s,
          running: false,
          ok: true,
          msg: "נוצרה תמונה בהצלחה",
          data_url: res.data.data_url,
          diagnostics: { ...(s.diagnostics || {}), httpStatus: res?.status || null, model: "Gemini imagegeneration" },
          fallback_ok: null, // Ensure fallback is explicitly null
          fallback_url: ""   // Ensure fallback URL is explicitly empty
        }));
        return;
      }

      // אין פולבאק ל-GenerateImage כדי למנוע 402 — נציג דיאגנוסטיקה במקום
      setGoogleImgState((s) => ({
        ...s,
        running: false,
        ok: false,
        msg: res?.data?.error || "כשל ביצירת תמונה ב-Gemini",
        data_url: "",
        diagnostics: {
          ...(s.diagnostics || {}),
          httpStatus: res?.status || null,
          apiError: res?.data?.error || null,
          apiDetails: res?.data?.details || null
        },
        fallback_ok: null, // Ensure fallback is explicitly null when Gemini fails
        fallback_url: ""   // Ensure fallback URL is explicitly empty when Gemini fails
      }));
    } catch (e) {
      // שגיאת רשת/אחרות
      setGoogleImgState((s) => ({
        ...s,
        running: false,
        ok: false,
        msg: String(e?.message || e),
        data_url: "",
        diagnostics: { ...(s.diagnostics || {}), exception: String(e?.message || e) },
        fallback_ok: null, // Ensure fallback is explicitly null on exception
        fallback_url: ""   // Ensure fallback URL is explicitly empty on exception
      }));
    }
  };

  // NEW: Function for TEST_KEY test
  const runTestKey = async () => {
    setTestKeyState({ running: true, ok: null, msg: "", mask: "", signature: "", echo: "" });
    try {
      const { data } = await testSecret({ echo: testEcho });
      if (data?.ok) {
        setTestKeyState({
          running: false,
          ok: true,
          msg: "TEST_KEY נקרא בהצלחה והשתמשנו בו לחתימת HMAC",
          mask: data?.key_mask || "",
          signature: data?.signature || "",
          echo: data?.echo || ""
        });
      } else {
        setTestKeyState({
          running: false,
          ok: false,
          msg: data?.error || "בדיקת TEST_KEY נכשלה",
          mask: data?.key_mask || "",
          signature: "",
          echo: data?.echo || ""
        });
      }
    } catch (e) {
      setTestKeyState({
        running: false,
        ok: false,
        msg: String(e?.message || e),
        mask: "",
        signature: "",
        echo: ""
      });
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !me) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center text-slate-600">
        טוען...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-50" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ניהול ובדיקת Secrets
            </h1>
            <p className="text-slate-600">סטטוס סודות סביבתיים ובדיקות התחברות מהירות לספקים</p>
          </div>
          <div className="ml-auto">
            <Button onClick={load} disabled={refreshing} variant="outline" className="gap-2">
              <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              רענן
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              סטטוס סודות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-3">
                  <Badge variant={it.present ? "default" : "outline"} className={it.present ? "bg-emerald-600" : ""}>
                    {it.present ? "מוגדר" : "חסר"}
                  </Badge>
                  <div className="font-semibold text-slate-900">{it.name}</div>
                </div>
                <div className="mt-2 sm:mt-0 text-xs text-slate-600">
                  {it.present ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono">({it.using_key})</span>
                      <span>•</span>
                      <span>mask: {it.masked}</span>
                      <span>•</span>
                      <span>len: {it.length}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{it.hint}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {mapId && (
              <div className="text-xs text-slate-600">Google Maps Map ID: <span className="font-mono">{mapId}</span></div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                בדיקת GoogleAI (Gemini)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={runGoogleAiTest} disabled={googleAiState.running} className="gap-2">
                {googleAiState.running ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                הרץ בדיקה
              </Button>
              {googleAiState.ok === true && (
                <div className="text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> עובד • {googleAiState.msg}
                </div>
              )}
              {googleAiState.ok === false && (
                <div className="text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {googleAiState.msg || "כשל"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                בדיקת OpenAI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={runOpenAiTest} disabled={openAiState.running} className="gap-2">
                {openAiState.running ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                הרץ בדיקה
              </Button>
              {openAiState.ok === true && (
                <div className="text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> עובד • {openAiState.msg}
                </div>
              )}
              {openAiState.ok === false && (
                <div className="text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {openAiState.msg || "כשל"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-600" />
                בדיקת Google Maps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-slate-600">בודק מפתח + גיאוקוד של "ירושלים"</div>
              <Button onClick={runGmapsTest} disabled={gmapsState.running} className="gap-2">
                {gmapsState.running ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                הרץ בדיקה
              </Button>
              {gmapsState.ok === true && (
                <div className="text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> עובד • {gmapsState.msg}
                </div>
              )}
              {gmapsState.ok === false && (
                <div className="text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {gmapsState.msg || "כשל"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEW: בדיקת יצירת תמונות (Gemini) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              בדיקת יצירת תמונה (Google AI - Gemini)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={runGoogleImageTest} disabled={googleImgState.running} className="gap-2">
                {googleImgState.running ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                הרץ בדיקה
              </Button>

              {googleImgState.ok === true && (
                <div className="text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {googleImgState.msg}
                </div>
              )}
              {googleImgState.ok === false && (
                <div className="text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {googleImgState.msg}
                </div>
              )}
            </div>

            {/* תצוגת תמונה מוצלחת */}
            {googleImgState.ok && googleImgState.data_url && (
              <div className="flex items-start gap-4">
                <img
                  src={googleImgState.data_url}
                  alt="תמונה מג'מיני"
                  className="w-40 h-40 object-cover rounded-lg border"
                />
                <div className="space-y-2 text-sm text-slate-700">
                  <div>התמונה נוצרה בהצלחה באמצעות Gemini.</div>
                  <a
                    href={googleImgState.data_url}
                    download="gemini_image.png"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Download className="w-4 h-4" /> הורד תמונה
                  </a>
                </div>
              </div>
            )}

            {/* דיאגנוסטיקה כשנכשל */}
            {googleImgState.ok === false && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 space-y-2">
                <div className="font-semibold">דיאגנוסטיקה</div>
                <ul className="list-disc pr-5 space-y-1">
                  <li>מצב מפתח Gemini: {googleImgState?.diagnostics?.keyPresent ? "מוגדר" : "חסר"} {googleImgState?.diagnostics?.usingKey ? `(env: ${googleImgState.diagnostics.usingKey})` : ""}</li>
                  {googleImgState?.diagnostics?.httpStatus != null && (
                    <li>סטטוס HTTP של הקריאה: {String(googleImgState.diagnostics.httpStatus)}</li>
                  )}
                  {googleImgState?.diagnostics?.apiError && (
                    <li>שגיאת API: {String(googleImgState.diagnostics.apiError)}</li>
                  )}
                  {googleImgState?.diagnostics?.apiDetails && (
                    <li>פרטים: {typeof googleImgState.diagnostics.apiDetails === "object" ? "ראה קונסול" : String(googleImgState.diagnostics.apiDetails)}</li>
                  )}
                  {googleImgState?.diagnostics?.exception && (
                    <li>חריגה: {String(googleImgState.diagnostics.exception)}</li>
                  )}
                </ul>

                {/* This section will no longer display content as fallback_ok will always be null */}
                {googleImgState.fallback_ok !== null && (
                  <div className="mt-2">
                    {googleImgState.fallback_ok ? (
                      <div className="text-emerald-700">
                        אינטגרציית ברירת המחדל (Core.GenerateImage) עובדת — כנראה בעיה בסביבת Gemini/מפתח/מודל.
                        {googleImgState.fallback_url && (
                          <div className="mt-2">
                            דוגמה שנוצרה בפולבאק:
                            <img src={googleImgState.fallback_url} alt="fallback" className="w-24 h-24 object-cover rounded border inline-block mr-2 align-middle" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-rose-700">
                        גם הפולבאק נכשל — ייתכן מגבלת רשת/חיוב/ספק; בדוק מפתחות והרשאות.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEW: כרטיס בדיקת TEST_KEY */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600" />
              בדיקת TEST_KEY (חתימת HMAC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-sm text-slate-700 mb-1">טקסט לבדיקה (echo)</label>
                <Input
                  value={testEcho}
                  onChange={(e) => setTestEcho(e.target.value)}
                  placeholder="healthcheck"
                />
              </div>
              <Button onClick={runTestKey} disabled={testKeyState.running} className="gap-2">
                {testKeyState.running ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                הרץ בדיקה
              </Button>
            </div>

            {testKeyState.ok === true && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 space-y-1">
                <div className="font-semibold">הצלחה</div>
                <div>מסיכה של המפתח: <span className="font-mono">{testKeyState.mask}</span></div>
                <div>Echo: <span className="font-mono">{testKeyState.echo}</span></div>
                <div>חתימה (Base64):
                  <span className="font-mono break-all block mt-1">{testKeyState.signature}</span>
                </div>
              </div>
            )}

            {testKeyState.ok === false && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {testKeyState.msg}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-xs text-slate-600">
          כדי להגדיר/לעדכן סודות: Dashboard → Settings → Environment Variables. ודא שמוגדר GoogleAI.
        </div>
      </div>
    </div>
  );
}

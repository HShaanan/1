
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/integrations/Core";
import { agentSDK } from "@/agents";
import { MediaAsset } from "@/entities/MediaAsset";
import { BannerAd } from "@/entities/BannerAd";
import { User } from "@/entities/User";
import { Loader2, Image as ImageIcon, Send, Save, Video, Megaphone } from "lucide-react";
import { googleAiImageGenerate } from "@/functions/googleAiImageGenerate";
import { AlertTriangle } from "lucide-react";

export default function MediaCreator() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [convId, setConvId] = useState(null);
  const convRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [agentError, setAgentError] = useState("");
  
  // חדש: הוספת מצב באנר וידאו
  const [creatingBanner, setCreatingBanner] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("browse_interstitial");

  const agentsAvailable = useMemo(() => {
    return !!agentSDK &&
      typeof agentSDK.createConversation === "function" &&
      typeof agentSDK.addMessage === "function" &&
      typeof agentSDK.subscribeToConversation === "function";
  }, []);

  const ensureConversation = async () => {
    if (!agentsAvailable) {
      setAgentError("Agent SDK לא זמין באפליקציה כרגע.");
      return null;
    }
    if (convRef.current?.id) return convRef.current;

    try {
      const me = await User.me().catch(() => null);
      const key = me?.email ? `media_${me.email.toLowerCase()}` : `media_guest_${Date.now()}`;
      const name = me?.full_name ? `סדנת מדיה — ${me.full_name}` : "סדנת מדיה — אורח";

      const list = await agentSDK.listConversations?.({ agent_name: "media_creator" }).catch(() => []);
      const match = Array.isArray(list) ? list.find((c) => c?.metadata?.key === key) : null;

      const conversation = match || await agentSDK.createConversation({
        agent_name: "media_creator",
        metadata: { key, name, description: "עבודה עם מדיה (טקסט+קבצים)" }
      });

      setConvId(conversation.id || conversation.conversation_id);
      convRef.current = conversation;

      const unsub = agentSDK.subscribeToConversation(conversation.id || conversation.conversation_id, (data) => {
        setMessages(data?.messages || []);
        const last = (data?.messages || []).slice().reverse().find(m => m.role === "assistant" && typeof m.content === "string");
        if (last && last.content && typeof last.content === 'string') {
          const matchDataUrl = last.content.match(/data:image[^"' )]+/);
          if (matchDataUrl) setPreviewUrl(matchDataUrl[0]);
        }
      });
      return () => unsub && unsub();
    } catch (e) {
      setAgentError("הסוכן media_creator לא נמצא או לא נטען (NotFound).");
      return null;
    }
  };

  useEffect(() => {
    ensureConversation();
  }, []);

  const generateDirect = async () => {
    if (!prompt.trim()) {
      alert("נא להזין תיאור קצר ליצירה");
      return;
    }
    setSending(true);
    try {
      const { data } = await googleAiImageGenerate({
        prompt: prompt.trim(),
        aspect_ratio: "1:1",
        number_of_images: 1,
        mime_type: "image/png"
      });
      if (data?.ok && data?.data_url) {
        setPreviewUrl(data.data_url);
      } else {
        alert(data?.error || "כשל ביצירת תמונה");
      }
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (sending) return;
    if (!prompt.trim() && !file) return;

    setSending(true);
    try {
      const conv = await ensureConversation();
      if (!conv) {
        setSending(false);
        return;
      }
      let file_urls = [];
      if (file) {
        const { file_url } = await UploadFile({ file });
        if (file_url) file_urls.push(file_url);
      }

      const content = prompt.trim() || (file ? "מצורפת תמונה, הפק/שפר מדיה מתאימה." : "הפק מדיה.");
      await agentSDK.addMessage(convRef.current, {
        role: "user",
        content,
        file_urls
      });
      setPrompt("");
      setFile(null);
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const url = previewUrl?.trim();
    if (!url) return;

    setSaving(true);
    try {
      await MediaAsset.create({
        title: "מדיה חדשה מ-AI",
        description: "נוצר/ה באמצעות סוכן המדיה",
        media_type: "image",
        url,
        source: url.startsWith("data:") ? "generated" : "external",
        status: "draft",
        tags: ["ai", "media", "rtl"]
      });
      alert("נשמר כמדיה (טיוטה). ניתן לשייך מאוחר יותר לקטגוריה/מודעה.");
    } finally {
      setSaving(false);
    }
  };

  // חדש: יצירת באנר וידאו
  const handleCreateBanner = async () => {
    if (!videoFile || !bannerTitle.trim()) {
      alert("נא לבחור קובץ וידאו ולהזין כותרת");
      return;
    }

    setCreatingBanner(true);
    try {
      // העלאת קובץ הווידאו
      const { file_url } = await UploadFile({ file: videoFile });
      
      // יצירת באנר חדש
      await BannerAd.create({
        title: bannerTitle.trim(),
        video_url: file_url,
        placement: bannerPlacement,
        is_active: true,
        autoplay: true,
        muted: true,
        loop: true,
        sort_order: 0
      });

      alert("באנר וידאו נוצר בהצלחה! הווידאו יופיע ברקע בעמודים שנבחרו.");
      setBannerTitle("");
      setVideoFile(null);
      setBannerPlacement("browse_interstitial");
    } catch (error) {
      alert("שגיאה ביצירת הבאנר: " + (error.message || error));
    } finally {
      setCreatingBanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {agentError && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-bold">שימו לב</div>
              <div className="text-sm">{agentError}</div>
              <div className="text-sm mt-1">ניתן להשתמש בכפתור "יצירה ישירה" למטה ליצירת תמונה מיידית.</div>
            </div>
          </div>
        )}

        {/* חדש: קרטיס יצירת באנר וידאו */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-red-600" />
              יצירת באנר וידאו רקע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder="כותרת הבאנר (לניהול פנימי)"
              dir="rtl"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">בחירת עמוד להצגה</label>
                <Select value={bannerPlacement} onValueChange={setBannerPlacement}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עמוד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browse_interstitial">עמוד הבית (Browse)</SelectItem>
                    <SelectItem value="favorites_interstitial">עמוד מועדפים</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">קובץ וידאו</label>
                <Input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)} 
                  className="max-w-full"
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateBanner} 
              disabled={creatingBanner || !videoFile || !bannerTitle.trim()}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {creatingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              צור באנר וידאו
            </Button>
          </CardContent>
        </Card>

        {/* קרטיס קיים - יצירת מדיה רגילה */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              סדנת מדיה — כתיבה חופשית והעלאת תמונה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="תאר/י מה תרצה ליצור (באנר, אייקון, תמונת קטגוריה...)."
              dir="rtl"
            />
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="max-w-xs" />
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                שלח לסוכן
              </Button>
              <Button variant="secondary" onClick={generateDirect} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                יצירה ישירה (ללא סוכן)
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={!previewUrl || saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                שמור למדיה
              </Button>
            </div>

            {previewUrl && (
              <div className="mt-2">
                <div className="text-sm text-slate-600 mb-1">תצוגה מקדימה</div>
                <img src={previewUrl} alt="preview" className="w-full max-w-md rounded-lg border" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* שיחת הסוכן */}
        <Card>
          <CardHeader>
            <CardTitle>שיחה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[50vh] overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-slate-800 text-white" : "bg-white border"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

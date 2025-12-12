import React, { useEffect, useState } from "react";
import { BannerAd } from "@/entities/BannerAd";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Upload, Image as ImageIcon, Video, Trash2, Calendar, CheckCircle2 } from "lucide-react";

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    poster_url: "",
    link_url: "",
    placement: "browse_top",
    is_active: true,
    start_date: "",
    end_date: "",
    sort_order: 0,
  });

  const load = async () => {
    setLoading(true);
    const list = await BannerAd.list("sort_order");
    setBanners(Array.isArray(list) ? list : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const uploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("video")) {
      alert("נא לבחור קובץ וידאו (MP4/WebM).");
      return;
    }
    const res = await UploadFile({ file });
    const url = res?.data?.file_url || res?.file_url;
    if (url) setForm((f) => ({ ...f, video_url: url }));
  };

  const uploadPoster = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("image")) {
      alert("נא לבחור קובץ תמונה (JPG/PNG/WebP).");
      return;
    }
    const res = await UploadFile({ file });
    const url = res?.data?.file_url || res?.file_url;
    if (url) setForm((f) => ({ ...f, poster_url: url }));
  };

  const createBanner = async () => {
    if (!form.video_url) {
      alert("יש להעלות קובץ וידאו (MP4) לפני שמירה.");
      return;
    }
    setSaving(true);
    await BannerAd.create({
      title: form.title?.trim() || "Video Background",
      description: form.description?.trim() || "",
      video_url: form.video_url,
      poster_url: form.poster_url || null,
      link_url: form.link_url || null,
      placement: form.placement || "browse_top",
      is_active: !!form.is_active,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      sort_order: Number(form.sort_order) || 0,
      autoplay: true,
      muted: true,
      loop: true,
      background_color: null,
      text_color: null,
    });
    setSaving(false);
    setForm({
      title: "",
      description: "",
      video_url: "",
      poster_url: "",
      link_url: "",
      placement: "browse_top",
      is_active: true,
      start_date: "",
      end_date: "",
      sort_order: 0,
    });
    load();
  };

  const toggleActive = async (b) => {
    await BannerAd.update(b.id, { is_active: !b.is_active });
    load();
  };

  const updateSort = async (b, value) => {
    const n = Number(value) || 0;
    await BannerAd.update(b.id, { sort_order: n });
    load();
  };

  const remove = async (b) => {
    if (!confirm(`למחוק את הבאנר "${b.title}"?`)) return;
    await BannerAd.delete(b.id);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6" dir="rtl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">ניהול באנרי וידאו (רקע)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>הוספת באנר חדש (MP4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>כותרת</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="לדוגמה: תצוגת וידאו ראשית" />
            </div>
            <div>
              <Label>קישור (אופציונלי)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>מיקום</Label>
              <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                <SelectTrigger><SelectValue placeholder="בחר מיקום" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="browse_top">רקע עליון</SelectItem>
                  <SelectItem value="browse_interstitial">ביניים - דף גלריה</SelectItem>
                  <SelectItem value="favorites_interstitial">ביניים - מועדפים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between mt-6 sm:mt-0">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="active" />
                <Label htmlFor="active">פעיל</Label>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-36" placeholder="מתאריך" />
                <span className="px-1 text-slate-500">→</span>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-36" placeholder="עד תאריך" />
              </div>
            </div>
            <div>
              <Label>סדר תצוגה</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>תיאור (אופציונלי)</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="טקסט עזר פנימי" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>וידאו MP4</Label>
              <div className="flex items-center gap-2">
                <input id="video-input" type="file" accept="video/*" className="hidden" onChange={uploadVideo} />
                <Button type="button" onClick={() => document.getElementById("video-input")?.click()} className="gap-2">
                  <Upload className="w-4 h-4" /> העלה וידאו
                </Button>
                {form.video_url ? (
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> הועלה
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">לא נבחר קובץ</span>
                )}
              </div>
              {form.video_url && (
                <video src={form.video_url} controls className="w-full rounded-lg border" />
              )}
            </div>

            <div className="space-y-2">
              <Label>תמונת פוסטר (אופציונלי)</Label>
              <div className="flex items-center gap-2">
                <input id="poster-input" type="file" accept="image/*" className="hidden" onChange={uploadPoster} />
                <Button type="button" variant="outline" onClick={() => document.getElementById("poster-input")?.click()} className="gap-2">
                  <ImageIcon className="w-4 h-4" /> העלה תמונת פוסטר
                </Button>
                {form.poster_url ? (
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> הועלה
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">לא נבחר קובץ</span>
                )}
              </div>
              {form.poster_url && (
                <img src={form.poster_url} alt="poster" className="w-full rounded-lg border object-cover max-h-48" />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={createBanner} disabled={saving} className="px-8">
              {saving ? "שומר..." : "שמור באנר"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>באנרים קיימים</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">טוען...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">כותרת</TableHead>
                  <TableHead>וידאו</TableHead>
                  <TableHead>פוסטר</TableHead>
                  <TableHead>פעיל</TableHead>
                  <TableHead>סדר</TableHead>
                  <TableHead>מיקום</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>
                      {b.video_url ? <Video className="w-4 h-4 text-indigo-600" /> : "-"}
                    </TableCell>
                    <TableCell>
                      {b.poster_url ? <ImageIcon className="w-4 h-4 text-slate-600" /> : "-"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!b.is_active} onCheckedChange={() => toggleActive(b)} />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={b.sort_order || 0}
                        className="w-24"
                        onBlur={(e) => updateSort(b, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>{b.placement || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleActive(b)}>
                          {b.is_active ? "כבה" : "הפעל"}
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => remove(b)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
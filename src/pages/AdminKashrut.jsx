import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Upload, Image as ImageIcon, Shield, Pencil, Crop } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";

const TYPES = ["בד\"צ", "רבנות מהדרין", "רבנות", "אחר"];

export default function AdminKashrut() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ authority_type: "", name: "", logo_url: "" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // מצב עריכה
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const load = async () => {
    const rows = await base44.entities.Kashrut.list("name");
    setItems(rows || []);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (item) => {
    setForm({
      authority_type: item.authority_type || "",
      name: item.name || "",
      logo_url: item.logo_url || ""
    });
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ authority_type: "", name: "", logo_url: "" });
  };

  const uploadLogo = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        const file_url = res?.file_url;
        setForm((p) => ({ ...p, logo_url: file_url }));
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleCropSave = async (blob) => {
    setLoading(true);
    setIsCropperOpen(false);
    try {
      const file = new File([blob], "logo_positioned.jpg", { type: "image/jpeg" });
      const res = await base44.integrations.Core.UploadFile({ file });
      const file_url = res?.file_url;
      setForm((p) => ({ ...p, logo_url: file_url }));
    } catch (e) {
      console.error("Error uploading cropped image:", e);
      alert("שגיאה בשמירת התמונה");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.name?.trim()) return alert("יש להזין שם גוף כשרות");
    setLoading(true);
    try {
      if (editingId) {
        await base44.entities.Kashrut.update(editingId, {
          authority_type: form.authority_type || "אחר",
          name: form.name.trim(),
          logo_url: form.logo_url || ""
        });
        setEditingId(null);
      } else {
        await base44.entities.Kashrut.create({
          authority_type: form.authority_type || "אחר",
          name: form.name.trim(),
          logo_url: form.logo_url || "",
          is_active: true
        });
      }
      setForm({ authority_type: "", name: "", logo_url: "" });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.Kashrut.delete(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              ניהול לוגו כשרות
              {editingId && (
                <span className="text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mr-2">
                  מצב עריכה
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <div className="text-sm mb-1">גוף כשרות</div>
                <Select value={form.authority_type} onValueChange={(v) => setForm((p) => ({ ...p, authority_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm mb-1">שם</div>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="שם גוף הכשרות" />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={uploadLogo} className="gap-2" disabled={loading}>
                    <Upload className="w-4 h-4" /> העלה לוגו
                  </Button>
                  {form.logo_url && (
                    <Button variant="outline" onClick={() => setIsCropperOpen(true)} className="gap-2" disabled={loading}>
                      <Crop className="w-4 h-4" /> מיצוב לוגו
                    </Button>
                  )}
                </div>
                <Button onClick={save} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingId ? "עדכן" : "הוסף"}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={cancelEdit} disabled={loading}>
                    ביטול
                  </Button>
                )}
              </div>
            </div>
            {form.logo_url && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ImageIcon className="w-4 h-4" />
                תצוגה מקדימה:
                <img src={form.logo_url} alt="לוגו" className="w-12 h-12 object-contain rounded border" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardHeader><CardTitle>רשימת גופי כשרות</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-slate-600 border-b">
                    <th className="py-2">גוף כשרות</th>
                    <th className="py-2">שם</th>
                    <th className="py-2">LOGO</th>
                    <th className="py-2 w-24">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2">{it.authority_type || "—"}</td>
                      <td className="py-2">{it.name}</td>
                      <td className="py-2">
                        {it.logo_url ? <img src={it.logo_url} alt={it.name} className="w-10 h-10 object-contain rounded border" /> : "—"}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(it)} title="עריכה">
                            <Pencil className="w-4 h-4 text-slate-700" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(it.id)} title="מחיקה">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-500">אין נתונים</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImageCropper
        isOpen={isCropperOpen}
        imageUrl={form.logo_url}
        onCropComplete={handleCropSave}
        onCancel={() => setIsCropperOpen(false)}
        aspectRatioOptions={[
          { name: "ריבוע", ratio: 1, icon: Shield },
          { name: "חופשי", ratio: null, icon: ImageIcon }
        ]}
      />
    </div>
  );
}
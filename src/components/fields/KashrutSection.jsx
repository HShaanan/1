import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/integrations/Core";
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { Kashrut } from "@/entities/Kashrut";

const AUTHORITY_OPTIONS = ["בד\"צ", "רבנות מהדרין", "רבנות", "אחר"];

export default function KashrutSection({ value = {}, onChange }) {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const v = value || {};

  React.useEffect(() => {
    (async () => {
      try {
        const rows = await Kashrut.filter({ is_active: true });
        setList(rows || []);
      } catch {
        setList([]);
      }
    })();
  }, []);

  const filteredByType = React.useMemo(() => {
    if (!v.kashrut_authority_type) return list;
    return (list || []).filter(r => r.authority_type === v.kashrut_authority_type);
  }, [list, v.kashrut_authority_type]);

  const handleUpload = async (kind) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "logo" ? "image/*" : "*/*";
    if (kind === "cert") input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      setLoading(true);
      try {
        if (kind === "logo") {
          const { file_url } = await UploadFile({ file: files[0] });
          onChange?.({ ...v, kashrut_logo_url: file_url });
        } else {
          const uploaded = [];
          for (const f of files) {
            const { file_url } = await UploadFile({ file: f });
            uploaded.push(file_url);
          }
          onChange?.({
            ...v,
            kashrut_certificate_urls: [...(v.kashrut_certificate_urls || []), ...uploaded]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">כשרות</h3>
        {loading && <span className="text-sm text-slate-500">מעלה קבצים...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="mb-1 block">גוף הכשרות (סוג)</Label>
          <Select
            value={v.kashrut_authority_type || ""}
            onValueChange={(val) => {
              const patch = {
                kashrut_authority_type: val,
                // נקה עיר אם לא רלוונטי
                kashrut_rabbinate_city: (val === "רבנות" || val === "רבנות מהדרין") ? (v.kashrut_rabbinate_city || "") : ""
              };
              onChange?.({ ...v, ...patch });
            }}
          >
            <SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger>
            <SelectContent>
              {AUTHORITY_OPTIONS.map(op => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1 block">שם הגוף</Label>
          <Select
            value={v.kashrut_authority_name || ""}
            onValueChange={(val) => onChange?.({ ...v, kashrut_authority_name: val })}
          >
            <SelectTrigger><SelectValue placeholder="בחר מרשימת הגופים" /></SelectTrigger>
            <SelectContent>
              {filteredByType.map(r => (
                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-slate-500 mt-1">לא מצאת? אפשר לרשום ידנית:</div>
          <Input
            className="mt-1"
            placeholder="שם גוף כשרות (ידני)"
            value={v.kashrut_authority_name || ""}
            onChange={(e) => onChange?.({ ...v, kashrut_authority_name: e.target.value })}
          />
        </div>

        {(v.kashrut_authority_type === "רבנות" || v.kashrut_authority_type === "רבנות מהדרין") && (
          <div>
            <Label className="mb-1 block">עיר / מועצה אזורית</Label>
            <Input
              placeholder="למשל: ירושלים / ביתר עילית / אשדוד"
              value={v.kashrut_rabbinate_city || ""}
              onChange={(e) => onChange?.({ ...v, kashrut_rabbinate_city: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <Label>לוגו גוף הכשרות</Label>
          {v.kashrut_logo_url ? (
            <div className="flex items-center gap-3">
              <img src={v.kashrut_logo_url} alt="לוגו כשרות" className="w-16 h-16 object-contain rounded border" />
              <Button variant="outline" size="sm" onClick={() => onChange?.({ ...v, kashrut_logo_url: "" })}>
                <Trash2 className="w-4 h-4 ml-1" /> הסר
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => handleUpload("logo")} className="gap-2">
              <Upload className="w-4 h-4" /> העלה לוגו
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>תעודות כשרות (ניתן להעלות כמה)</Label>
          <div className="flex flex-wrap gap-2">
            {(v.kashrut_certificate_urls || []).map((u, idx) => (
              <div key={u + idx} className="flex items-center gap-2 border rounded-lg p-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <a href={u} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">פתיחה</a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const arr = (v.kashrut_certificate_urls || []).filter((x, i) => i !== idx);
                    onChange?.({ ...v, kashrut_certificate_urls: arr });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => handleUpload("cert")} className="gap-2">
            <Upload className="w-4 h-4" /> העלה תעודות
          </Button>
        </div>
      </div>

      {(v.kashrut_authority_type || v.kashrut_authority_name || v.kashrut_rabbinate_city) && (
        <div className="pt-2">
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
            {v.kashrut_authority_type || "כשרות"} • {v.kashrut_authority_name || "—"} {v.kashrut_rabbinate_city ? `• ${v.kashrut_rabbinate_city}` : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}
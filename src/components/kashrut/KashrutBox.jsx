import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search as SearchIcon, Upload, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ImageGallery from "@/components/ImageGallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TYPES = ["בד\"צ", "רבנות מהדרין", "רבנות", "אחר"];

export default function KashrutBox({
  businessPage, // object with current values
  canEdit = false, // show editor if true
  mode = "entity", // "entity" -> update BusinessPage in DB, "local" -> update parent form only
  onUpdated // optional callback(patch) after update
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Local editable fields (derive from businessPage)
  const selectedType = businessPage?.kashrut_authority_type || "";
  const selectedName = businessPage?.kashrut_authority_name || "";
  const selectedLogo = businessPage?.kashrut_logo_url || "";
  const rabbinateCity = businessPage?.kashrut_rabbinate_city || "";

  // FIX: memoize certificateUrls so useMemo dependencies remain stable
  const certificateUrls = React.useMemo(() => {
    const raw = businessPage?.kashrut_certificate_urls;
    return Array.isArray(raw) ? raw : [];
  }, [businessPage?.kashrut_certificate_urls]);

  // תצוגה במסך מלא
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const [previewPdfUrl, setPreviewPdfUrl] = React.useState(null);

  const imageUrls = React.useMemo(() => {
    const r = Array.isArray(certificateUrls) ? certificateUrls : [];
    return r.filter((u) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(String(u)));
  }, [certificateUrls]);

  const openPreview = (url) => {
    const isImg = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(String(url));
    if (isImg) {
      const idx = imageUrls.indexOf(url);
      setGalleryIndex(Math.max(0, idx));
      setIsGalleryOpen(true);
    } else if (/\.pdf$/i.test(String(url))) {
      setPreviewPdfUrl(url);
    }
  };

  useEffect(() => {
    if (!canEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await base44.entities.Kashrut.list("name");
        setList(rows || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canEdit]);

  const filtered = useMemo(() => {
    if (!search?.trim()) return list;
    const s = search.trim().toLowerCase();
    return (list || []).filter((it) =>
    (it.name || "").toLowerCase().includes(s) ||
    (it.authority_type || "").toLowerCase().includes(s)
    );
  }, [list, search]);

  const pushPatch = async (patch) => {
    if (mode === "entity") {
      await base44.entities.BusinessPage.update(businessPage.id, patch);
    }
    onUpdated?.(patch);
  };

  const selectItem = async (item) => {
    const patch = {
      kashrut_authority_type: item.authority_type || "",
      kashrut_authority_name: item.name || "",
      kashrut_logo_url: item.logo_url || ""
    };
    await pushPatch(patch);
  };

  const setCity = async (value) => {
    await pushPatch({ kashrut_rabbinate_city: value || null });
  };

  const uploadCertificate = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      setLoading(true);
      try {
        const uploaded = [];
        for (const f of files) {
          const res = await base44.integrations.Core.UploadFile({ file: f });
          const url = res?.file_url;
          if (url) uploaded.push(url);
        }
        if (uploaded.length) {
          const next = [...certificateUrls, ...uploaded];
          await pushPatch({ kashrut_certificate_urls: next });
        }
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const removeCertificate = async (url) => {
    const next = certificateUrls.filter((u) => u !== url);
    await pushPatch({ kashrut_certificate_urls: next });
  };

  const showCityField = selectedType === "רבנות" || selectedType === "רבנות מהדרין";

  return (
    <Card className="border-slate-200 shadow-sm w-full max-w-3xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Shield className="w-6 h-6 text-emerald-600" aria-hidden="true" />
          <span className="text-xl font-bold">הכשר</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5" dir="rtl">
        {/* View mode */}
        {!canEdit &&
        <section aria-label="פרטי הכשר" className="w-full">
            {selectedName ?
          <div className="flex items-start justify-between gap-6 w-full">
                {/* פרטי הכשר + לוגו גדול - מימין */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {selectedLogo ?
                        <img
                          src={selectedLogo}
                          alt={`לוגו ${selectedName}`}
                          className="my-8 w-[180px] md:w-[200px] h-[160px] md:h-[180px] rounded-xl border bg-white shadow-sm overflow-hidden object-cover object-center scale-[1.28] -translate-y-1"
                        />
                      :
                        <div className="w-[180px] md:w-[200px] h-[160px] md:h-[180px] rounded-xl border bg-slate-50 flex items-center justify-center" role="img" aria-label="ללא לוגו">
                          <Shield className="w-10 h-10 text-slate-400" aria-hidden="true" />
                        </div>
                      }
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-slate-900 text-2xl leading-tight">{selectedName}</h3>
                      {selectedType && <p className="text-lg text-slate-700 mt-1">{selectedType}</p>}
                      {showCityField && rabbinateCity &&
                        <p className="text-base text-slate-700 mt-1">עיר/מועצה: {rabbinateCity}</p>
                      }
                    </div>
                  </div>
                </div>

                {/* תעודות - משמאל */}
                <div className="w-[180px] md:w-[200px] shrink-0">
                  <h4 className="text-base font-semibold text-slate-800 mb-2">תעודת כשרות</h4>
                  {certificateUrls?.length ?
              <div className="space-y-2">
                      {imageUrls.length > 0 ?
                <button
                  type="button"
                  onClick={() => openPreview(imageUrls[0])}
                  className="block w-full rounded-xl overflow-hidden border bg-white hover:shadow-md transition"
                  aria-label="הגדלת תעודת כשרות">

                          <img
                    src={imageUrls[0]}
                    alt="תעודת כשרות"
                    className="w-full h-[160px] md:h-[180px] object-cover" />

                        </button> :

                Array.isArray(certificateUrls) && certificateUrls.some((u) => /\.pdf$/i.test(String(u))) &&
                <button
                  type="button"
                  onClick={() => {
                    const firstPdf = certificateUrls.find((u) => /\.pdf$/i.test(String(u)));
                    if (firstPdf) openPreview(firstPdf);
                  }}
                  className="w-full h-[160px] md:h-[180px] rounded-xl border bg-slate-50 flex items-center justify-center hover:shadow-md transition"
                  aria-label="פתיחת תעודת כשרות PDF">

                            <Badge variant="outline" className="text-sm">PDF</Badge>
                          </button>

                }

                      {imageUrls.length > 1 &&
                <ul className="flex gap-2" role="list" aria-label="תעודות נוספות">
                          {imageUrls.slice(1, 4).map((u, i) =>
                  <li key={u + i}>
                              <button
                    type="button"
                    onClick={() => openPreview(u)}
                    className="w-14 h-14 rounded-lg overflow-hidden border bg-white hover:shadow transition"
                    aria-label={`תעודה ${i + 2}`}>

                                  <img src={u} alt={`תעודה ${i + 2}`} className="w-full h-full object-cover" />
                                </button>
                            </li>
                  )}
                        </ul>
                }
                    </div> :

              <p className="text-sm text-slate-500">לא הועלו תעודות</p>
              }
                </div>
              </div> :

          <p className="text-base text-slate-600">לא צוין גוף כשרות</p>
          }
          </section>
        }

        {/* Edit mode */}
        {canEdit &&
        <form className="space-y-4" aria-label="עריכת הכשר">
            {/* Search and list */}
            <div className="flex flex-col gap-2">
              <label htmlFor="kashrut-search" className="sr-only">חיפוש גוף כשרות</label>
              <div className="relative">
                <Input
                id="kashrut-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={'חיפוש: בד"צ / רבנות / שם הגוף...'}
                className="pr-9 text-right"
                aria-label="חיפוש גוף כשרות" />

                <SearchIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>

              <div className="max-h-64 overflow-auto rounded border bg-white" role="listbox" aria-label="רשימת גופי כשרות">
                {loading ?
              <p className="p-3 text-sm text-slate-500" role="status">טוען...</p> :
              filtered?.length ?
              filtered.map((it) =>
              <button
                key={it.id}
                type="button"
                onClick={() => selectItem(it)}
                className={`w-full text-right px-4 py-3 flex items-center gap-4 hover:bg-slate-50 border-b last:border-b-0 ${
                it.name === selectedName ? "bg-emerald-50" : ""}`
                }
                role="option"
                aria-selected={it.name === selectedName}
                aria-label={`${it.name} - ${it.authority_type || 'ללא סוג'}`}>

                      {it.logo_url ?
                <img
                  src={it.logo_url}
                  alt={`לוגו ${it.name}`}
                  className="w-12 h-12 object-contain rounded border bg-white" /> :


                <div className="w-12 h-12 rounded border bg-slate-50 flex items-center justify-center" role="img" aria-label="ללא לוגו">
                          <Shield className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        </div>
                }
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-800 truncate">{it.name}</p>
                        <p className="text-sm text-slate-600">{it.authority_type || "—"}</p>
                      </div>
                      {it.name === selectedName &&
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">נבחר</Badge>
                }
                    </button>
              ) :

              <p className="p-3 text-sm text-slate-500" role="status">אין תוצאות</p>
              }
              </div>
            </div>

            {/* Current selection summary */}
            {(selectedName || selectedType || selectedLogo) &&
          <div className="flex items-center gap-4">
                {selectedLogo ?
            <img src={selectedLogo} alt={selectedName} className="w-16 h-16 object-contain rounded-lg border bg-white" /> :

            <div className="w-16 h-16 rounded-lg border bg-slate-50 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-slate-400" />
                  </div>
            }
                <div className="flex flex-col">
                  <div className="font-bold text-slate-900 text-lg">{selectedName || "—"}</div>
                  {selectedType && <div className="text-base text-slate-700">{selectedType}</div>}
                </div>
              </div>
          }

            {/* City field for Rabbinate */}
            {showCityField &&
          <div>
                <div className="text-sm font-medium mb-1">עיר / מועצה אזורית</div>
                <Input
              value={rabbinateCity || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (mode === "local") {
                  onUpdated?.({ kashrut_rabbinate_city: v || null });
                } else {
                  setCity(v);
                }
              }}
              placeholder="לדוגמה: ירושלים / ביתר עילית" />

              </div>
          }

            {/* Certificates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-800">תעודות כשרות</div>
                <Button size="sm" variant="outline" className="gap-2" onClick={uploadCertificate} disabled={loading}>
                  <Upload className="w-4 h-4" /> העלאת תעודה
                </Button>
              </div>
              {certificateUrls?.length ?
            <div className="flex flex-wrap gap-4">
                  {certificateUrls.map((u, i) =>
              <div key={u} className="relative">
                      <button
                  type="button"
                  className="block"
                  onClick={() => openPreview(u)}
                  title="תצוגה">

                        {/\.(pdf)$/i.test(u) ?
                  <div className="w-28 h-28 rounded-xl border bg-slate-50 flex items-center justify-center text-xs">PDF</div> :

                  <img src={u} alt={`תעודה ${i + 1}`} className="w-28 h-28 object-cover rounded-xl border" />
                  }
                      </button>
                      <button
                  className="absolute -top-2 -left-2 bg-white/90 border rounded-full p-1 hover:bg-white"
                  onClick={() => removeCertificate(u)}
                  title="הסר">

                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
              )}
                </div> :

            <div className="text-sm text-slate-500">לא הועלו תעודות</div>
            }
            </div>
          </form>
        }
      </CardContent>

      {/* גלריה לתמונות תעודה */}
      {isGalleryOpen &&
      <ImageGallery
        images={imageUrls}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialIndex={galleryIndex}
        alt="תעודת כשרות" />

      }

      {/* תצוגת PDF במסך מלא */}
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => {if (!open) setPreviewPdfUrl(null);}}>
        <DialogContent className="max-w-5xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>תצוגת תעודת כשרות (PDF)</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[75vh]">
            {previewPdfUrl &&
            <iframe src={previewPdfUrl} className="w-full h-full rounded-lg border" />
            }
          </div>
        </DialogContent>
      </Dialog>
    </Card>);

}
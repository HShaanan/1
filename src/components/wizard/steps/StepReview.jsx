
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, Globe, Share2, MapPin, Image as ImageIcon, Clock, Tag } from "lucide-react";
import { geocodeAddress } from "@/functions/geocodeAddress";

const dayNames = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'מוצ"ש'
};
const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];


export default function StepReview({ value = {}, onSubmit = () => {}, isSubmitting = false }) {
  const [coords, setCoords] = React.useState(null);
  const [geoLoading, setGeoLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function run() {
      if (!value?.address) { setCoords(null); return; }
      setGeoLoading(true);
      try {
        const { data } = await geocodeAddress({ address: value.address });
        if (!mounted) return;
        if (data && data.lat && data.lng) setCoords({ lat: data.lat, lng: data.lng });
      } finally {
        if (mounted) setGeoLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [value?.address]);

  // NEW: support showing a custom-category request summary (compatible with both payload styles)
  const isCustom = Boolean(
    value?.special_fields?.is_custom_category ||
    value?.special_fields?.is_custom_category_request ||
    value?.subcategory_id === "custom_request" ||
    value?.subsubcategory_id === "custom_request_subsub"
  );
  const customReq =
    value?.special_fields?.custom_request ||
    value?.special_fields?.custom_request_details || {
      desired_category: value?.custom_category_name,
      desired_subcategory: value?.custom_subcategory_name,
      desired_subsubcategory: value?.custom_subsubcategory_name,
      user_notes: value?.custom_notes,
    };

  const mainImage = (value.images || [])[0] || "";
  const extraImages = (value.images || []).slice(1);

  const tags = Array.isArray(value.special_fields?.tags) ? value.special_fields.tags : [];
  const priceList = Array.isArray(value.special_fields?.price_list) ? value.special_fields.price_list : [];

  const formatPhone = (p) => String(p || "").replace(/\s+/g, "");
  const whatsappLink = () => {
    const raw = String(value.contact_phone || "").replace(/\D/g, "");
    const intl = raw.startsWith("0") ? "972" + raw.slice(1) : raw;
    return `https://wa.me/${intl}`;
  };

  // שעות פעילות: תומך בטקסט או JSON
  const renderHours = () => {
    const schedule = value?.hours?.schedule;
    if (!schedule || Object.keys(schedule).length === 0) {
        return <div className="text-xs text-slate-500">לא הוגדרו שעות פעילות</div>;
    }

    return (
        <ul className="text-sm text-slate-700 space-y-1.5">
            {dayOrder.map(dayKey => {
                const dayData = schedule[dayKey];
                
                const timeText = (!dayData || !dayData.isOpen)
                    ? <span className="text-slate-500">סגור</span>
                    : dayData.is24Hours 
                    ? <span className="font-semibold text-indigo-600">24 שעות</span>
                    : (dayData.timeRanges || [])
                        .map(range => `${range.open} - ${range.close}`)
                        .join(', ');

                return (
                    <li key={dayKey} className="flex justify-between items-center">
                        <span>{dayNames[dayKey]}</span>
                        <span className="font-medium text-slate-800 dir-ltr text-right">{timeText}</span>
                    </li>
                );
            })}
        </ul>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* NEW: כרטיסון תאמה אישית אם קיים */}
      {isCustom && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="text-sm font-bold text-indigo-800 mb-1">בקשת תאמה אישית</div>
          <div className="text-sm text-indigo-900">
            קטגוריה: <span className="font-semibold">{customReq?.desired_category || "—"}</span>
            {customReq?.desired_subcategory ? (
              <> | תת־קטגוריה: <span className="font-semibold">{customReq.desired_subcategory}</span></>
            ) : null}
            {customReq?.desired_subsubcategory ? (
              <> | תת־תת: <span className="font-semibold">{customReq.desired_subsubcategory}</span></>
            ) : null}
            {customReq?.user_notes ? (
              <>
                <br />
                הערות: {customReq.user_notes}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* כרטיס ראשי – כמו עמוד עסק */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* תמונת שער */}
        <div className="relative h-48 sm:h-64 bg-slate-100">
          {mainImage ? (
            <img src={mainImage} alt="main" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          {/* מיני־מפה */}
          <div className="absolute bottom-3 left-3 w-40 h-28 rounded-xl overflow-hidden border border-white shadow-md bg-white">
            {coords ? (
              <iframe
                title="map"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&hl=he&ie=UTF8&output=embed`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <MapPin className="w-4 h-4 mb-1" />
                {geoLoading ? "טוען..." : "מיקום לא זמין"}
              </div>
            )}
          </div>
        </div>

        {/* תוכן עליון: שם העסק + פעולות */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{value.title || "ללא כותרת"}</h2>
              {value.business_name && (
                <div className="text-sm text-slate-600 mt-0.5">{value.business_name}</div>
              )}
              {value.address && (
                <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{value.address}</span>
                </div>
              )}
              {/* תגיות */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* פעולות */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!value.contact_phone}
                onClick={() => value.contact_phone && window.open(`tel:${formatPhone(value.contact_phone)}`, "_blank")}
              >
                <Phone className="w-4 h-4 ml-2" /> התקשר
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!value.contact_phone}
                onClick={() => value.contact_phone && window.open(whatsappLink(), "_blank")}
              >
                <ImageIcon className="w-4 h-4 ml-2" /> ווצאפ
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!value.website_url}
                onClick={() => value.website_url && window.open(value.website_url, "_blank")}
              >
                <Globe className="w-4 h-4 ml-2" /> אתר
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                <Share2 className="w-4 h-4 ml-2" /> שתף
              </Button>
            </div>
          </div>

          {/* גלריה קטנה לתמונות נוספות */}
          {extraImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {extraImages.map((src, i) => (
                <div key={i} className="h-20 sm:h-24 rounded-lg overflow-hidden border bg-slate-50">
                  <img src={src} alt={`extra_${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* תיאור, שעות ומחירון */}
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-800 mb-2">אודות</h3>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{value.description || "—"}</p>
            </div>

            <div className="md:col-span-1 bg-slate-50/70 p-4 rounded-xl border">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> שעות פעילות</h3>
              {renderHours()}
            </div>
          </div>

          {/* מחירון */}
          {priceList.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" /> מחירון
              </h3>
              <div className="space-y-4">
                {priceList.map((cat, catIdx) => (
                    <div key={catIdx}>
                        <h4 className="font-semibold text-slate-700 mb-2">{cat.category || "ללא קטגוריה"}</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(cat.items || []).map((it, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border flex items-center justify-center">
                                  {it.image_url ? <img src={it.image_url} alt={"p_"+i} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-800 truncate">{it.name || "—"}</div>
                                  <div className="text-xs text-slate-600 truncate">{it.note || ""}</div>
                                </div>
                                <div className="ml-auto font-bold text-indigo-700">{it.price ? `₪${it.price}` : ""}</div>
                              </div>
                            ))}
                        </div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

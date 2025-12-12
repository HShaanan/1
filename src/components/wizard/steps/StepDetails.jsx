import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import InlineImageEditor from "@/components/images/InlineImageEditor";
import BusinessHoursComponent from "../fields/BusinessHoursComponent";
import MenuBuilder from "../fields/MenuBuilder";
import TagsInput from "@/components/fields/TagsInput";
import AddressInput from "@/components/fields/AddressInput";
import KashrutSection from "@/components/fields/KashrutSection";

export default function StepDetails({ value = {}, onChange }) {
  const [uploading, setUploading] = useState(false);

  // וידוא שיש לנו אובייקט value תקין
  const safeValue = value || {};

  return (
    <div className="space-y-6" dir="rtl">
      {/* שם העסק */}
      <div>
        <Label htmlFor="business_name" className="text-slate-800 font-semibold">
          שם העסק *
        </Label>
        <Input
          id="business_name"
          type="text"
          value={safeValue.business_name || ""}
          onChange={(e) => onChange({ ...safeValue, business_name: e.target.value })}
          placeholder="למשל: פרויטוסט"
          className="mt-1"
          required
        />
      </div>

      {/* כותרת תצוגה */}
      <div>
        <Label htmlFor="display_title" className="text-slate-800 font-semibold">
          כותרת תצוגה (אופציונלי)
        </Label>
        <Input
          id="display_title"
          type="text"
          value={safeValue.display_title || safeValue.title || ""}
          onChange={(e) => onChange({ ...safeValue, display_title: e.target.value, title: e.target.value })}
          placeholder="כותרת מושכת לעמוד העסק"
          className="mt-1"
          maxLength={80}
        />
        <p className="text-xs text-slate-500 mt-1">
          {(safeValue.display_title || safeValue.title || "").length}/80 תווים
        </p>
      </div>

      {/* תיאור */}
      <div>
        <Label htmlFor="description" className="text-slate-800 font-semibold">
          תיאור העסק *
        </Label>
        <Textarea
          id="description"
          value={safeValue.description || ""}
          onChange={(e) => onChange({ ...safeValue, description: e.target.value })}
          placeholder="ספר על העסק שלך, מה מיוחד בו, מה אתה מציע ללקוחות..."
          className="mt-1 min-h-[120px]"
          required
        />
      </div>

      {/* כתובת */}
      <AddressInput
        value={{
          address: safeValue.address || "",
          lat: safeValue.lat,
          lng: safeValue.lng
        }}
        onChange={(data) => onChange({ ...safeValue, ...data })}
      />

      {/* טלפון */}
      <div>
        <Label htmlFor="contact_phone" className="text-slate-800 font-semibold">
          טלפון *
        </Label>
        <Input
          id="contact_phone"
          type="tel"
          value={safeValue.contact_phone || ""}
          onChange={(e) => onChange({ ...safeValue, contact_phone: e.target.value })}
          placeholder="050-1234567"
          className="mt-1"
          required
        />
      </div>

      {/* אתר אינטרנט */}
      <div>
        <Label htmlFor="website_url" className="text-slate-800 font-semibold">
          אתר אינטרנט (אופציונלי)
        </Label>
        <Input
          id="website_url"
          type="url"
          value={safeValue.website_url || ""}
          onChange={(e) => onChange({ ...safeValue, website_url: e.target.value })}
          placeholder="https://www.example.com"
          className="mt-1"
        />
      </div>

      {/* תמונות - עד 30! */}
      <InlineImageEditor
        images={safeValue.images || []}
        onChange={(imgs) => onChange({ ...safeValue, images: imgs })}
        maxImages={30}
        className="bg-white"
      />

      {/* שעות פעילות */}
      <Card className="p-4 bg-white">
        <Label className="text-slate-800 font-semibold mb-3 block">
          שעות פעילות
        </Label>
        <BusinessHoursComponent
          value={safeValue.hours || {}}
          onChange={(hours) => onChange({ ...safeValue, hours })}
        />
      </Card>

      {/* כשרות */}
      <KashrutSection
        value={{
          kashrut_authority_type: safeValue.kashrut_authority_type || "",
          kashrut_authority_name: safeValue.kashrut_authority_name || "",
          kashrut_rabbinate_city: safeValue.kashrut_rabbinate_city || "",
          kashrut_logo_url: safeValue.kashrut_logo_url || "",
          kashrut_certificate_urls: safeValue.kashrut_certificate_urls || []
        }}
        onChange={(data) => onChange({ ...safeValue, ...data })}
      />

      {/* תגיות */}
      <div>
        <Label className="text-slate-800 font-semibold mb-2 block">
          תגיות (לחיפוש ומיון)
        </Label>
        <TagsInput
          value={safeValue.special_fields?.tags || []}
          onChange={(tags) => onChange({
            ...safeValue,
            special_fields: {
              ...(safeValue.special_fields || {}),
              tags
            }
          })}
          placeholder="הוסף תגיות..."
        />
      </div>

      {/* תפריט/מחירון */}
      <Card className="p-4 bg-white">
        <Label className="text-slate-800 font-semibold mb-3 block">
          תפריט / מחירון (אופציונלי)
        </Label>
        <MenuBuilder
          value={safeValue.special_fields?.menu || []}
          onChange={(menu) => onChange({
            ...safeValue,
            special_fields: {
              ...(safeValue.special_fields || {}),
              menu
            }
          })}
        />
      </Card>

      {/* הודעת וואטסאפ */}
      <div>
        <Label htmlFor="whatsapp_message" className="text-slate-800 font-semibold">
          הודעת ברירת מחדל לוואטסאפ (אופציונלי)
        </Label>
        <Textarea
          id="whatsapp_message"
          value={safeValue.whatsapp_message || ""}
          onChange={(e) => onChange({ ...safeValue, whatsapp_message: e.target.value })}
          placeholder="שלום! אשמח לקבל מידע נוסף על..."
          className="mt-1"
          rows={3}
        />
      </div>

      {/* טקסט כפתור וואטסאפ */}
      <div>
        <Label htmlFor="whatsapp_button_text" className="text-slate-800 font-semibold">
          טקסט כפתור וואטסאפ (אופציונלי)
        </Label>
        <Input
          id="whatsapp_button_text"
          type="text"
          value={safeValue.whatsapp_button_text || ""}
          onChange={(e) => onChange({ ...safeValue, whatsapp_button_text: e.target.value })}
          placeholder="בואו נדבר :)"
          className="mt-1"
        />
      </div>
    </div>
  );
}
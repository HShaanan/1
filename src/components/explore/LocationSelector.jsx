import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, LocateFixed, Keyboard } from "lucide-react";
import AddressInput from "@/components/fields/AddressInput";

export default function LocationSelector({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [manual, setManual] = React.useState(false);

  const handleGeo = () => {
    if (!navigator.geolocation) {
      alert("הדפדפן לא תומך בזיהוי מיקום");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "המיקום שלי" };
        onChange?.(loc);
        setOpen(false);
      },
      () => alert("לא ניתן היה לקבל את מיקומך. ניתן להזין ידנית"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <MapPin className="w-4 h-4 ml-2" />
          {value?.label ? value.label : "בחר מיקום"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="bottom">
        {!manual ? (
          <div className="space-y-2" dir="rtl">
            <Button variant="outline" className="w-full justify-center" onClick={handleGeo}>
              <LocateFixed className="w-4 h-4 ml-2" />
              השתמש במיקום הנוכחי שלי
            </Button>
            <Button variant="ghost" className="w-full justify-center" onClick={() => setManual(true)}>
              <Keyboard className="w-4 h-4 ml-2" />
              הזן מיקום ידנית
            </Button>
          </div>
        ) : (
          <div dir="rtl">
            <AddressInput
              label="חיפוש כתובת"
              placeholder="לדוגמה: ביתר עילית"
              value={value?.label || ""}
              onChange={(text) => onChange?.({ ...(value || {}), label: text })}
              onLocationChange={(loc) => {
                onChange?.({ lat: loc.lat, lng: loc.lng, label: loc.formatted_address || "מיקום נבחר" });
                setOpen(false);
                setManual(false);
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
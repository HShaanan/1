import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, LocateFixed, Keyboard, Building2 } from "lucide-react";
import AddressInput from "@/components/fields/AddressInput";
import { base44 } from "@/api/base44Client";

export default function LocationSelector({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const [cities, setCities] = React.useState([]);

  React.useEffect(() => {
    const loadCities = async () => {
      try {
        const businesses = await base44.entities.BusinessPage.filter({ 
          is_active: true, 
          approval_status: 'approved',
          is_frozen: false
        });
        
        const uniqueCities = [...new Set(
          businesses
            .map(b => b.city?.trim())
            .filter(Boolean)
        )].sort();
        
        setCities(uniqueCities);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    
    if (open) loadCities();
  }, [open]);

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
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                <Building2 className="w-4 h-4" />
                בחר עיר מהרשימה:
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2 bg-slate-50">
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => {
                      onChange?.({ city });
                      setOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                      value?.city === city
                        ? 'bg-blue-600 text-white font-medium'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
                {cities.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-3">
                    טוען ערים...
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-2 space-y-1">
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleGeo}>
                <LocateFixed className="w-4 h-4 ml-2" />
                השתמש במיקום הנוכחי שלי
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setManual(true)}>
                <Keyboard className="w-4 h-4 ml-2" />
                הזן מיקום ידנית
              </Button>
            </div>
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
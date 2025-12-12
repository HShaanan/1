
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import debounce from "lodash/debounce";

export default function MobileTopBar({
  selectedCategoryName,
  allowSearch,
  searchTerm,
  onSearchChange,
  onBackToCategories,
  onClearAll
}) {
  const [localTerm, setLocalTerm] = React.useState(searchTerm || "");

  React.useEffect(() => {
    // סנכרון חיצוני -> פנימי אם הערך הוחלף מבחוץ
    setLocalTerm(searchTerm || "");
  }, [searchTerm]);

  const debouncedNotify = React.useMemo(
    () => debounce((val) => onSearchChange?.(val), 300),
    [onSearchChange]
  );

  React.useEffect(() => {
    return () => debouncedNotify.cancel();
  }, [debouncedNotify]);

  return (
    <div className="lg:hidden sticky top-16 z-20 bg-white/90 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-3 py-2" dir="rtl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm font-bold text-slate-900">
            {selectedCategoryName ? selectedCategoryName : "בחרו קטגוריה"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={onBackToCategories}
            >
              חזרה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={onClearAll}
              title="ניקוי סינונים"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            value={localTerm}
            onChange={(e) => {
              const val = e.target.value;
              setLocalTerm(val);
              if (allowSearch) debouncedNotify(val);
            }}
            disabled={!allowSearch}
            placeholder={allowSearch ? "חפש בתוך התוצאות..." : "בחר תת־קטגוריה כדי לחפש"}
            className="pr-9 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

const DAYS_HE = [
  { id: 'sunday', name: 'ראשון' },
  { id: 'monday', name: 'שני' },
  { id: 'tuesday', name: 'שלישי' },
  { id: 'wednesday', name: 'רביעי' },
  { id: 'thursday', name: 'חמישי' },
  { id: 'friday', name: 'שישי' },
  { id: 'saturday', name: 'שבת' }
];

export default function HoursSelector({ value = "", onChange = () => {} }) {
  const parseHours = (hoursString) => {
    if (!hoursString) return [];
    try {
      // It might be an array already if passed directly from state
      if (typeof hoursString === 'object' && Array.isArray(hoursString)) return hoursString;
      return JSON.parse(hoursString);
    } catch {
      return [];
    }
  };

  // useMemo ensures that we only re-parse when the value prop changes.
  const hours = React.useMemo(() => parseHours(value), [value]);

  const commitChange = (newHours) => {
    const hoursString = newHours.length > 0 ? JSON.stringify(newHours) : "";
    onChange(hoursString);
  };

  const addHours = () => {
    commitChange([...hours, { day: 'sunday', from: '09:00', to: '17:00' }]);
  };

  const removeHours = (index) => {
    commitChange(hours.filter((_, i) => i !== index));
  };

  const updateHour = (index, field, newValue) => {
    const updated = hours.map((h, i) => 
      i === index ? { ...h, [field]: newValue } : h
    );
    commitChange(updated);
  };

  return (
    <div className="space-y-3">
      {hours.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-4">
          אין שעות פעילות מוגדרות
        </div>
      )}
      
      {hours.map((hour, index) => (
        <div key={index} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg bg-white">
          <select
            value={hour.day}
            onChange={(e) => updateHour(index, 'day', e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            {DAYS_HE.map(day => (
              <option key={day.id} value={day.id}>{day.name}</option>
            ))}
          </select>
          
          <Input
            type="time"
            value={hour.from || ""}
            onChange={(e) => updateHour(index, 'from', e.target.value)}
            className="w-24 text-sm"
          />
          
          <span className="text-slate-500">עד</span>
          
          <Input
            type="time"
            value={hour.to || ""}
            onChange={(e) => updateHour(index, 'to', e.target.value)}
            className="w-24 text-sm"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeHours(index)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addHours}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 ml-2" />
        הוסף שעות פעילות
      </Button>
    </div>
  );
}
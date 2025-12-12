
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Moon } from 'lucide-react';

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

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
};
const timeOptions = generateTimeOptions();

export default function BusinessHoursComponent({ value, onChange }) {
  const schedule = value?.schedule || {};

  const setDayValue = (day, patch) => {
    const newSchedule = { ...schedule, [day]: { ...(schedule[day] || {}), ...patch } };
    onChange({ ...value, schedule: newSchedule });
  };

  const addRange = (day) => {
    const ranges = schedule[day]?.timeRanges || [];
    setDayValue(day, { timeRanges: [...ranges, { open: '09:00', close: '17:00' }] });
  };

  const removeRange = (day, rangeIndex) => {
    const ranges = (schedule[day]?.timeRanges || []).filter((_, i) => i !== rangeIndex);
    setDayValue(day, { timeRanges: ranges });
  };

  const setRangeTime = (day, rangeIndex, type, time) => {
    const ranges = (schedule[day]?.timeRanges || []).map((r, i) => i === rangeIndex ? { ...r, [type]: time } : r);
    setDayValue(day, { timeRanges: ranges });
  };

  return (
    <div className="space-y-4" dir="rtl">
      {dayOrder.map(day => (
        <div key={day} className="p-3 rounded-lg border bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`switch-${day}`} className="font-bold text-slate-800 capitalize">{dayNames[day]}</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id={`24h-${day}`}
                  checked={!!schedule[day]?.is24Hours}
                  onCheckedChange={checked => setDayValue(day, { is24Hours: checked, isOpen: checked || schedule[day]?.isOpen })}
                  disabled={!schedule[day]?.isOpen}
                />
                <Label htmlFor={`24h-${day}`} className="text-sm text-slate-600 flex items-center gap-1"><Moon className="w-3 h-3" /> 24 שעות</Label>
              </div>
              <Switch 
                id={`switch-${day}`}
                checked={!!schedule[day]?.isOpen}
                onCheckedChange={checked => setDayValue(day, { isOpen: checked, ...(checked && !schedule[day]?.timeRanges?.length && { timeRanges: [{ open: '09:00', close: '17:00' }] }) })}
              />
            </div>
          </div>
          {schedule[day]?.isOpen && !schedule[day]?.is24Hours && (
            <div className="pl-4 border-r-2 border-orange-200 pr-4 space-y-2">
              {(schedule[day].timeRanges || []).map((range, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={range.open} onValueChange={time => setRangeTime(day, i, 'open', time)}>
                    <SelectTrigger className="w-full bg-white"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(t => <SelectItem key={`open-${t}`} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-600">-</span>
                  <Select value={range.close} onValueChange={time => setRangeTime(day, i, 'close', time)}>
                    <SelectTrigger className="w-full bg-white"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(t => <SelectItem key={`close-${t}`} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeRange(day, i)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addRange(day)} className="border-dashed">
                <PlusCircle className="w-4 h-4 ml-2" />הוסף טווח שעות
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

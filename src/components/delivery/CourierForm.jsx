import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'ראשון' },
  { value: 'monday', label: 'שני' },
  { value: 'tuesday', label: 'שלישי' },
  { value: 'wednesday', label: 'רביעי' },
  { value: 'thursday', label: 'חמישי' },
  { value: 'friday', label: 'שישי' },
  { value: 'saturday', label: 'שבת' }
];

const VEHICLE_TYPES = {
  scooter: { label: 'קטנוע' },
  electric_bike: { label: 'אופניים חשמליים' },
  bicycle: { label: 'אופניים' },
  car: { label: 'רכב' }
};

export default function CourierForm({ 
  courier, 
  onFieldChange, 
  onShiftUpdate,
  onShiftDayToggle,
  onAddShift,
  onRemoveShift,
  onFileUpload,
  isEdit = false,
  isUploading = false
}) {
  return (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`name-${isEdit ? 'edit' : 'new'}`}>שם מלא *</Label>
          <Input 
            id={`name-${isEdit ? 'edit' : 'new'}`}
            value={courier.name || ''} 
            onChange={e => onFieldChange('name', e.target.value)}
            placeholder="ישראל ישראלי"
            dir="rtl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`phone-${isEdit ? 'edit' : 'new'}`}>טלפון *</Label>
          <Input 
            id={`phone-${isEdit ? 'edit' : 'new'}`}
            value={courier.phone || ''} 
            onChange={e => onFieldChange('phone', e.target.value)}
            placeholder="050-0000000"
            dir="ltr"
            className="text-left"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`email-${isEdit ? 'edit' : 'new'}`}>אימייל (לקישור חשבון משתמש)</Label>
        <Input 
          id={`email-${isEdit ? 'edit' : 'new'}`}
          type="email"
          value={courier.email || ''} 
          onChange={e => onFieldChange('email', e.target.value)}
          placeholder="courier@example.com"
          dir="ltr"
          className="text-left"
        />
        <p className="text-xs text-slate-500">האימייל ישמש לגישת השליח לאיזור האישי שלו</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>כלי רכב</Label>
          <Select 
            value={courier.vehicle_type || 'scooter'} 
            onValueChange={v => onFieldChange('vehicle_type', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VEHICLE_TYPES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
          <div className="grid gap-2">
            <Label>סטטוס</Label>
            <Select 
              value={courier.status || 'offline'} 
              onValueChange={v => onFieldChange('status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">פנוי</SelectItem>
                <SelectItem value="busy">עסוק</SelectItem>
                <SelectItem value="offline">לא זמין</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>סוג עוסק</Label>
          <Select 
            value={courier.dealer_type || 'authorized'} 
            onValueChange={v => onFieldChange('dealer_type', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="authorized">מורשה</SelectItem>
              <SelectItem value="exempt">פטור</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`dealer-${isEdit ? 'edit' : 'new'}`}>מספר עוסק</Label>
          <Input 
            id={`dealer-${isEdit ? 'edit' : 'new'}`}
            value={courier.dealer_number || ''} 
            onChange={e => onFieldChange('dealer_number', e.target.value)}
            dir="ltr"
            className="text-left"
          />
        </div>
      </div>

      {/* Shifts Section */}
      <div className="border-t pt-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">משמרות</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddShift}
            className="gap-1 text-xs"
          >
            <Plus size={14} />
            הוסף משמרת
          </Button>
        </div>
        
        {(courier.shifts || []).map((shift, shiftIndex) => (
          <div key={shiftIndex} className="p-3 bg-slate-50 rounded-lg mb-3 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">משמרת {shiftIndex + 1}</span>
              {(courier.shifts?.length || 0) > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveShift(shiftIndex)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="grid gap-1">
                <Label className="text-xs text-slate-500">משעה</Label>
                <Input 
                  type="time"
                  value={shift.start || '08:00'} 
                  onChange={e => onShiftUpdate(shiftIndex, 'start', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-slate-500">עד שעה</Label>
                <Input 
                  type="time"
                  value={shift.end || '22:00'} 
                  onChange={e => onShiftUpdate(shiftIndex, 'end', e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label className="text-xs text-slate-500">ימי עבודה</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => onShiftDayToggle(shiftIndex, day.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      shift.days?.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement File */}
      <div className="grid gap-2 border-t pt-4">
        <Label>הסכם חתום (PDF/Word)</Label>
        <div className="flex items-center gap-2">
          <Input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={onFileUpload}
            className="cursor-pointer"
          />
          {isUploading && <span className="text-xs text-blue-500">מעלה...</span>}
        </div>
        {courier.agreement_file_url && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <FileText size={12} />
            קובץ קיים
          </span>
        )}
      </div>

      {isEdit && (
        <div className="flex items-center gap-2 border-t pt-4">
          <Checkbox 
            id={`is_active-${isEdit ? 'edit' : 'new'}`}
            checked={courier.is_active !== false}
            onCheckedChange={(checked) => onFieldChange('is_active', checked)}
          />
          <Label htmlFor={`is_active-${isEdit ? 'edit' : 'new'}`} className="text-sm">שליח פעיל במערכת</Label>
        </div>
      )}
    </div>
  );
}
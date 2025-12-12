import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import WorldClockPanel from "@/components/admin/WorldClockPanel";

const TIMEZONES = [
  { value: '-12', label: 'UTC-12:00' },
  { value: '-11', label: 'UTC-11:00' },
  { value: '-10', label: 'UTC-10:00' },
  { value: '-9', label: 'UTC-9:00' },
  { value: '-8', label: 'UTC-8:00 (Pacific)' },
  { value: '-7', label: 'UTC-7:00 (Mountain)' },
  { value: '-6', label: 'UTC-6:00 (Central)' },
  { value: '-5', label: 'UTC-5:00 (Eastern)' },
  { value: '-4', label: 'UTC-4:00' },
  { value: '-3', label: 'UTC-3:00' },
  { value: '-2', label: 'UTC-2:00' },
  { value: '-1', label: 'UTC-1:00' },
  { value: '0', label: 'UTC+0:00 (London)' },
  { value: '1', label: 'UTC+1:00 (Paris)' },
  { value: '2', label: 'UTC+2:00 (ישראל)' },
  { value: '3', label: 'UTC+3:00 (Moscow)' },
  { value: '4', label: 'UTC+4:00 (Dubai)' },
  { value: '5', label: 'UTC+5:00' },
  { value: '5.5', label: 'UTC+5:30 (India)' },
  { value: '6', label: 'UTC+6:00' },
  { value: '7', label: 'UTC+7:00 (Bangkok)' },
  { value: '8', label: 'UTC+8:00 (Singapore)' },
  { value: '9', label: 'UTC+9:00 (Tokyo)' },
  { value: '10', label: 'UTC+10:00 (Sydney)' },
  { value: '11', label: 'UTC+11:00' },
  { value: '12', label: 'UTC+12:00 (Auckland)' }
];

export default function AdminTimezonePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('2');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser.role !== 'admin') {
          setError('אין לך הרשאת אדמין');
          setIsLoading(false);
          return;
        }

        const settings = await base44.entities.AppSettings.filter({ 
          setting_key: 'timezone_offset' 
        });

        if (settings && settings.length > 0) {
          setSelectedTimezone(settings[0].setting_value);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('שגיאה בטעינת ההגדרות');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const settings = await base44.entities.AppSettings.filter({ 
        setting_key: 'timezone_offset' 
      });

      if (settings && settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          setting_value: selectedTimezone,
          updated_by: user.email
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'timezone_offset',
          setting_value: selectedTimezone,
          setting_type: 'string',
          category: 'general',
          display_name: 'איזור זמן',
          description: 'הפרש שעות מ-UTC למערכת',
          is_active: true,
          updated_by: user.email
        });
      }

      setSuccessMessage('איזור הזמן נשמר בהצלחה!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving timezone:', err);
      setError('שגיאה בשמירת איזור הזמן');
    } finally {
      setIsSaving(false);
    }
  };

  const getAdjustedTime = () => {
    const offset = parseFloat(selectedTimezone);
    const utcTime = new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60000);
    const adjustedTime = new Date(utcTime.getTime() + offset * 3600000);
    return adjustedTime.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = createPageUrl('AdminStats')}
            className="mb-4"
          >
            ← חזור לניהול
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600" />
            הגדרות איזור זמן
          </h1>
          <p className="text-gray-600 mt-2">
            בחר את איזור הזמן למערכת - ישפיע על הזמנים בהודעות והתראות
          </p>
        </div>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {error && user && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>בחירת איזור זמן</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                איזור זמן מועדף
              </label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר איזור זמן" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-indigo-900">תצוגה מקדימה:</span>
              </div>
              <div className="text-2xl font-mono text-indigo-900">
                {getAdjustedTime()}
              </div>
              <p className="text-sm text-indigo-700 mt-2">
                זמן שיוצג במערכת עם איזור הזמן שנבחר
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור הגדרות
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <WorldClockPanel />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ מידע חשוב</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• השינוי ישפיע על כל ההודעות וההתראות במערכת</li>
            <li>• הזמן יוצג בהתאם לאיזור הזמן שנבחר</li>
            <li>• מומלץ לבחור את איזור הזמן המקומי שלך</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
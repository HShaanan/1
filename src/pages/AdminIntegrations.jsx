import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppSettings } from '@/entities/AppSettings';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export default function AdminIntegrations() {
  const [googleClientId, setGoogleClientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await AppSettings.filter({ setting_key: 'google_client_id' });
        if (settings.length > 0) {
          setGoogleClientId(settings[0].setting_value);
        }
      } catch (error) {
        toast.error("שגיאה בטעינת הגדרות.");
      }
    };
    fetchSettings();
  }, []);

  const handleSaveGoogleClientId = async () => {
    setIsLoading(true);
    try {
      const existing = await AppSettings.filter({ setting_key: 'google_client_id' });
      if (existing.length > 0) {
        await AppSettings.update(existing[0].id, { setting_value: googleClientId });
      } else {
        await AppSettings.create({
          setting_key: 'google_client_id',
          setting_value: googleClientId,
          setting_type: 'string',
          category: 'integration',
          display_name: 'Google Client ID for One-Tap',
          description: 'Used for the Google One-Tap Sign-In feature.'
        });
      }
      toast.success("Google Client ID נשמר בהצלחה!");
    } catch (error) {
      toast.error("שגיאה בשמירת ה-Client ID.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto" dir="rtl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ניהול אינטגרציות</h1>
        <p className="mt-2 text-slate-600">
          הגדרת חיבורים לשירותים חיצוניים כמו Google One-Tap.
        </p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Google One-Tap Sign-In</CardTitle>
            <CardDescription>
              הזן את ה-Client ID שלך מפרויקט Google Cloud כדי להפעיל התחברות מהירה עם Google One-Tap.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-client-id">Google Client ID</Label>
              <Input
                id="google-client-id"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="XXXXX-YYYYY.apps.googleusercontent.com"
              />
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border flex gap-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                ודא שהוספת את כתובת האפליקציה שלך (`{window.location.origin}`) לרשימת ה-Authorized JavaScript origins בפרויקט Google Cloud שלך.
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveGoogleClientId} disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור Client ID'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
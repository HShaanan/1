import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Settings, BellRing } from "lucide-react";

export default function AdminSettings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [telegramToken, setTelegramToken] = useState("");
    const [telegramChatId, setTelegramChatId] = useState("");
    const [zapierWebhook, setZapierWebhook] = useState("");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await base44.entities.AppSettings.list();
            setSettings(data);
            
            const emailSetting = data.find(s => s.setting_key === 'admin_notification_email');
            if (emailSetting) setEmail(emailSetting.setting_value);
            
            const tgToken = data.find(s => s.setting_key === 'telegram_bot_token');
            if (tgToken) setTelegramToken(tgToken.setting_value);

            const tgChatId = data.find(s => s.setting_key === 'telegram_chat_id');
            if (tgChatId) setTelegramChatId(tgChatId.setting_value);

            const zapierSetting = data.find(s => s.setting_key === 'ZAPIER_WHATSAPP_URL');
            if (zapierSetting) setZapierWebhook(zapierSetting.setting_value);

        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const testTelegram = async () => {
        if (!telegramToken || !telegramChatId) {
            setMessage({ type: 'error', text: 'חסרים פרטי טלגרם לבדיקה' });
            return;
        }
        setTesting(true);
        setMessage(null);
        try {
            const response = await base44.functions.invoke('sendAdminAlert', {
                title: 'בדיקת חיבור 🤖',
                message: 'אם קיבלת את ההודעה הזו - הבוט מוגדר תקין! 🎉\n\n(נשלח מדף ההגדרות)',
                type: 'success',
                force_telegram_token: telegramToken,     // Send current input value
                force_telegram_chat_id: telegramChatId   // Send current input value
            });

            // Check inner results
            const telegramResult = response.data?.results?.telegram;
            
            if (telegramResult === 'sent') {
                setMessage({ type: 'success', text: 'הודעת בדיקה נשלחה בהצלחה! בדוק את הטלגרם.' });
            } else {
                // Parse error if possible
                const errorMsg = telegramResult?.replace('failed: ', '') || 'שגיאה לא ידועה';
                setMessage({ 
                    type: 'error', 
                    text: `שגיאה בשליחה: ${errorMsg}. וודא שלחצת Start בבוט!` 
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'שגיאה בתקשורת עם השרת' });
        } finally {
            setTesting(false);
        }
    };

    const sendTestOrder = async () => {
        if (!telegramToken || !telegramChatId) {
            setMessage({ type: 'error', text: 'חסרים פרטי טלגרם לבדיקה' });
            return;
        }
        setTesting(true);
        setMessage(null);

        const demoMessage = `
🏪 <b>הזמנה חדשה מעסק: פיצה משלנו (הדגמה)</b>
מספר הזמנה: #1001

👤 <b>פרטי לקוח:</b>
שם: ישראל ישראלי
טלפון: 050-1234567
כתובת: רחוב הרצל 1, תל אביב

🛒 <b>סיכום הזמנה:</b>
• 2x פיצה משפחתית
• 1x קולה גדול

💰 <b>סה"כ לתשלום: 132 ₪</b>

📝 <b>הערות:</b> בלי זיתים בבקשה, להשאיר ליד הדלת.

<a href="https://waze.com/ul?ll=32.0853,34.7818&navigate=yes">🚗 נווט ללקוח</a>
`.trim();

        try {
            const response = await base44.functions.invoke('sendAdminAlert', {
                title: 'הזמנה חדשה #1001',
                message: demoMessage,
                type: 'success',
                force_telegram_token: telegramToken,
                force_telegram_chat_id: telegramChatId
            });

            const telegramResult = response.data?.results?.telegram;
            
            if (telegramResult === 'sent') {
                setMessage({ type: 'success', text: 'הזמנת דמה נשלחה בהצלחה! בדוק את הטלגרם.' });
            } else {
                setMessage({ type: 'error', text: 'שגיאה בשליחה. וודא שלחצת Start בבוט!' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'שגיאה בתקשורת' });
        } finally {
            setTesting(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Helper to save or update a setting
            const saveOne = async (key, value, name, category) => {
                if (!value) return;
                const existing = settings.find(s => s.setting_key === key);
                if (existing) {
                    await base44.entities.AppSettings.update(existing.id, { setting_value: value });
                } else {
                    await base44.entities.AppSettings.create({
                        setting_key: key,
                        setting_value: value,
                        setting_type: 'string',
                        category: category,
                        display_name: name,
                        is_active: true
                    });
                }
            };

            await Promise.all([
                saveOne('admin_notification_email', email, 'אימייל להתראות', 'general'),
                saveOne('telegram_bot_token', telegramToken, 'Telegram Bot Token', 'integrations'),
                saveOne('telegram_chat_id', telegramChatId, 'Telegram Chat ID', 'integrations'),
                saveOne('ZAPIER_WHATSAPP_URL', zapierWebhook, 'Zapier WhatsApp Webhook', 'integrations')
            ]);

            await loadSettings();
            setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה!' });
            
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'שגיאה בשמירת ההגדרות' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">הגדרות מערכת</h1>
                        <p className="text-slate-500">ניהול הגדרות כלליות והתראות</p>
                    </div>
                </header>
                
                <Card className="border-0 shadow-md">
                    <CardHeader className="border-b bg-white/50">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                            <BellRing className="w-5 h-5" />
                            <span className="font-bold">התראות מנהל</span>
                        </div>
                        <CardTitle>מערכת התראות מנהל</CardTitle>
                        <CardDescription>הגדרת ערוצי תקשורת לקבלת עדכונים בזמן אמת על הזמנות ודיווחים</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                        <div className="space-y-8 max-w-xl">

                            {/* Telegram Section */}
                            <div className="space-y-4 border-b pb-6">
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="bg-blue-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">TG</div>
                                  <h3 className="font-semibold text-slate-800">התראות לטלגרם (מומלץ 🚀)</h3>
                              </div>
                              <div className="space-y-3">
                                  <div>
                                      <Label htmlFor="tg_token">Bot Token</Label>
                                      <Input 
                                          id="tg_token"
                                          value={telegramToken}
                                          onChange={e => setTelegramToken(e.target.value)}
                                          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                          className="ltr font-mono text-sm"
                                      />
                                      <p className="text-xs text-slate-500 mt-1">
                                          צור בוט חדש דרך <a href="https://t.me/BotFather" target="_blank" className="text-blue-600 underline">BotFather</a> וקבל את הטוקן.
                                      </p>
                                  </div>
                                  <div>
                                      <Label htmlFor="tg_chat">Chat ID</Label>
                                      <Input 
                                          id="tg_chat"
                                          value={telegramChatId}
                                          onChange={e => setTelegramChatId(e.target.value)}
                                          placeholder="123456789"
                                          className="ltr font-mono text-sm"
                                      />
                                      <p className="text-xs text-slate-500 mt-1">
                                          שלח הודעה לבוט שיצרת, ואז בדוק את ה-Chat ID שלך (למשל דרך <a href="https://t.me/userinfobot" target="_blank" className="text-blue-600 underline">@userinfobot</a>).
                                      </p>
                                      </div>

                                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex flex-col gap-2">
                                      <p>⚠️ <strong>חשוב מאוד:</strong> חובה להיכנס לבוט החדש בטלגרם וללחוץ על <strong>Start</strong> לפני שהמערכת תוכל לשלוח הודעות.</p>
                                      <div className="flex gap-2 flex-wrap">
                                          <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={testTelegram}
                                              disabled={testing || !telegramToken || !telegramChatId}
                                              className="bg-white hover:bg-yellow-100 border-yellow-200 text-yellow-900 w-fit"
                                          >
                                              {testing ? <Loader2 className="w-3 h-3 animate-spin ml-2" /> : '🚀'}
                                              שלח הודעת בדיקה רגילה
                                          </Button>

                                          <Button 
                                               variant="outline" 
                                               size="sm"
                                               onClick={sendTestOrder}
                                               disabled={testing || !telegramToken || !telegramChatId}
                                               className="bg-white hover:bg-blue-100 border-blue-200 text-blue-900 w-fit"
                                           >
                                               {testing ? <Loader2 className="w-3 h-3 animate-spin ml-2" /> : '🍕'}
                                               שלח הזמנת דמה (סימולציה)
                                           </Button>
                                          </div>
                                          </div>
                                          </div>

                                          {/* WhatsApp Business Section */}
                                          <div className="space-y-4 border-b pb-6">
                                          <div className="flex items-center gap-2 mb-2">
                                          <div className="bg-green-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">WA</div>
                                          <h3 className="font-semibold text-slate-800">WhatsApp Business (דרך Zapier)</h3>
                                          </div>
                                          
                                          <div>
                                              <Label htmlFor="zapier_webhook">Zapier Webhook URL</Label>
                                              <Input 
                                                  id="zapier_webhook"
                                                  value={zapierWebhook}
                                                  onChange={e => setZapierWebhook(e.target.value)}
                                                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                                                  className="ltr font-mono text-sm"
                                              />
                                              <p className="text-xs text-slate-500 mt-1">
                                                  השאר ריק כדי להשתמש ב-Twilio WhatsApp (fallback אוטומטי)
                                              </p>
                                          </div>
                                          
                                          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                          <p className="text-sm text-green-800 mb-3">
                                          <strong>בדיקת WhatsApp:</strong> שלח הודעת בדיקה דרך Zapier למספר 0505196963
                                          </p>
                                          <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={async () => {
                                          setTesting(true);
                                          setMessage(null);
                                          try {
                                             if (!zapierWebhook) {
                                                 setMessage({ type: 'error', text: 'נא להזין Webhook URL קודם' });
                                                 setTesting(false);
                                                 return;
                                             }
                                             
                                             const response = await base44.functions.invoke('testZapierWhatsapp', {
                                                 webhookUrl: zapierWebhook
                                             });

                                             if (response.data?.success) {
                                                 setMessage({ type: 'success', text: response.data.message });
                                             } else {
                                                 setMessage({ type: 'error', text: response.data?.error || 'שגיאה בשליחה' });
                                             }
                                          } catch (error) {
                                             console.error(error);
                                             setMessage({ type: 'error', text: 'שגיאה בתקשורת: ' + error.message });
                                          } finally {
                                             setTesting(false);
                                          }
                                          }}
                                          disabled={testing}
                                          className="bg-white hover:bg-green-100 border-green-200 text-green-900 w-fit"
                                          >
                                          {testing ? <Loader2 className="w-3 h-3 animate-spin ml-2" /> : '📱'}
                                          שלח הודעת בדיקה ל-WhatsApp
                                          </Button>
                                          </div>
                                          </div>
                                          </div>

                            {/* Email Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-slate-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">@</div>
                                    <h3 className="font-semibold text-slate-800">התראות למייל (גיבוי)</h3>
                                </div>
                                <div>
                                    <Label htmlFor="email">כתובת אימייל</Label>
                                    <Input 
                                        id="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        className="ltr font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <Button 
                                    onClick={saveSettings} 
                                    disabled={saving}
                                    className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                                    שמור הגדרות
                                </Button>

                                {message && (
                                    <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-right-2 ${
                                        message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        {message.text}
                                    </div>
                                )}
                            </div>
                        </div>
                        </CardContent>
                </Card>
            </div>
        </div>
    );
}
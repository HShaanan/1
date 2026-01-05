import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { ArrowRight, FileSpreadsheet, Loader2, CheckCircle2, ExternalLink, Download, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSheetsSync() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('https://docs.google.com/spreadsheets/d/1QPym2hFwmc-55sfswzYU4SB9_0M0cdu-xTb8T3iQPFw/edit?gid=1235836669#gid=1235836669');
  const [sheetName, setSheetName] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const response = await base44.functions.invoke('syncBusinessToSheets', {});
      
      if (response.data.success) {
        setExportResult(response.data);
      } else {
        setError(response.data.error || 'Failed to export');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const extractSpreadsheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      
      if (!spreadsheetId) {
        setError('כתובת URL של הגיליון לא תקינה. נא להזין כתובת מלאה מ-Google Sheets');
        setIsImporting(false);
        return;
      }

      const response = await base44.functions.invoke('importBusinessesFromSheets', {
        spreadsheetId,
        sheetName: sheetName.trim() || undefined
      });
      
      if (response.data.success) {
        setImportResult(response.data);
      } else {
        setError(response.data.error || 'Failed to import');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            סנכרון Google Sheets
          </h1>
          <p className="text-slate-600">
            ייצא עסקים לגיליון או ייבא עסקים מגיליון קיים
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="text-right">
              <strong>שגיאה:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              ייצוא
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              ייבוא
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export">
            <Card className="p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    ייצוא נתוני עסקים
                  </h2>
                  <p className="text-slate-600 text-sm">
                    יוצר גיליון חדש עם כל המידע העדכני
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">מה כולל הגיליון?</h3>
                <ul className="text-sm text-blue-800 space-y-1 mr-4 list-disc">
                  <li>שם העסק</li>
                  <li>קטגוריה ותת-קטגוריה</li>
                  <li>עיר וכתובת מלאה</li>
                  <li>טלפון, אימייל ואתר</li>
                  <li>סטטוס וכשרות</li>
                  <li>תאריך יצירה ובעלים</li>
                </ul>
              </div>

              {exportResult && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-right">
                    <div className="space-y-2">
                      <p className="font-semibold text-green-900">
                        הייצוא הושלם בהצלחה! 🎉
                      </p>
                      <p className="text-sm text-green-800">
                        {exportResult.totalBusinesses} עסקים יוצאו לגיליון
                      </p>
                      <a
                        href={exportResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        פתח את הגיליון ב-Google Sheets
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg h-14"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מייצא לגיליון...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 ml-2" />
                    ייצא עכשיו ל-Google Sheets
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-4">
                הגיליון ייווצר בחשבון Google Sheets שלך
              </p>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <Card className="p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    ייבוא עסקים מגיליון
                  </h2>
                  <p className="text-slate-600 text-sm">
                    קרא נתונים מגיליון Google Sheets קיים ויצור עסקים חדשים
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-amber-900 mb-2">דרישות לגיליון:</h3>
                <ul className="text-sm text-amber-800 space-y-1 mr-4 list-disc">
                  <li>השורה הראשונה חייבת להכיל כותרות עמודות</li>
                  <li>חובה: עמודת "שם" או "Business Name"</li>
                  <li>מומלץ: קטגוריה, עיר, טלפון, כתובת</li>
                  <li>הגיליון חייב להיות משותף או ציבורי</li>
                </ul>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="spreadsheet-url" className="text-sm font-medium mb-2 block">
                    כתובת הגיליון (URL) *
                  </Label>
                  <Input
                    id="spreadsheet-url"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    העתק את הכתובת המלאה של הגיליון מהדפדפן
                  </p>
                </div>

                <div>
                  <Label htmlFor="sheet-name" className="text-sm font-medium mb-2 block">
                    שם הגיליון (Sheet) - אופציונלי
                  </Label>
                  <Input
                    id="sheet-name"
                    type="text"
                    placeholder="השאר ריק לגיליון הראשון"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    אם הקובץ מכיל מספר גיליונות, ציין את שם הגיליון הרלוונטי
                  </p>
                </div>
              </div>

              {importResult && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-right">
                    <div className="space-y-3">
                      <p className="font-semibold text-green-900">
                        הייבוא הושלם! 🎉
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-slate-600">סה"כ שורות</p>
                          <p className="text-2xl font-bold text-slate-900">{importResult.summary.total}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-slate-600">יובאו בהצלחה</p>
                          <p className="text-2xl font-bold text-green-600">{importResult.summary.imported}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-slate-600">שגיאות</p>
                          <p className="text-2xl font-bold text-red-600">{importResult.summary.errors}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-slate-600">דולגו</p>
                          <p className="text-2xl font-bold text-slate-600">{importResult.summary.skipped}</p>
                        </div>
                      </div>

                      {importResult.details.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                          <p className="font-semibold text-red-900 mb-2 text-sm">שגיאות:</p>
                          <ul className="text-xs text-red-800 space-y-1">
                            {importResult.details.errors.map((err, idx) => (
                              <li key={idx}>שורה {err.row}: {err.name} - {err.error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleImport}
                disabled={isImporting || !spreadsheetUrl}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg h-14"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מייבא עסקים...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 ml-2" />
                    התחל ייבוא
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-4">
                העסקים ייווצרו בסטטוס "ממתין לאישור" ויחכו לסקירה
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
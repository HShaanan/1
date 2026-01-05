import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminImportCSV() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResults(null);

    try {
      // Convert file to base64 for backend function
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await base44.functions.invoke('importBusinessesFromCSV', {
        fileData: base64,
        fileName: file.name
      });

      if (response.data?.success) {
        setResults(response.data.results);
      } else {
        setResults({
          total: 0,
          success: 0,
          failed: 0,
          errors: [response.data?.error || 'Import failed']
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResults({
        total: 0,
        success: 0,
        failed: 0,
        errors: [error.message || 'Upload failed']
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              ייבוא עסקים מ-Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Instructions */}
            <Alert>
              <AlertDescription>
                <strong>פורמט נדרש:</strong>
                <br />
                קובץ Excel (.xls/.xlsx/.csv) עם 4 עמודות בדיוק:
                <div className="mt-2 space-y-1 text-sm">
                  <div>1. <strong>שם העסק</strong></div>
                  <div>2. <strong>כתובת</strong></div>
                  <div>3. <strong>טלפון</strong></div>
                  <div>4. <strong>מפקח</strong> (רשות כשרות)</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'לחץ לבחירת קובץ Excel או CSV'}
                  </p>
                </div>
              </label>

              {file && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? 'מייבא...' : 'התחל ייבוא'}
                </Button>
              )}
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.total}
                      </div>
                      <div className="text-sm text-gray-600">סה"כ שורות</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {results.success}
                      </div>
                      <div className="text-sm text-gray-600">הצליח</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50">
                    <CardContent className="p-4 text-center">
                      <XCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {results.failed}
                      </div>
                      <div className="text-sm text-gray-600">נכשל</div>
                    </CardContent>
                  </Card>
                </div>

                {results.errors?.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">שגיאות:</div>
                      <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                        {results.errors.map((err, i) => (
                          <div key={i}>• {err}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {results.success > 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {results.success} עסקים יובאו בהצלחה ומחכים לאישור באדמין
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
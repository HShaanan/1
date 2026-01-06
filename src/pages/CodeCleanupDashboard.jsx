import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Trash2, FileText, AlertTriangle, CheckCircle, 
  XCircle, Package, TrendingDown, Zap, RefreshCw 
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CodeCleanupDashboard() {
  const [deadCodeResults, setDeadCodeResults] = useState(null);
  const [redundancyResults, setRedundancyResults] = useState(null);
  const [isAnalyzingDead, setIsAnalyzingDead] = useState(false);
  const [isAnalyzingRedundancy, setIsAnalyzingRedundancy] = useState(false);
  const [error, setError] = useState("");

  const analyzeDeadCode = async () => {
    setIsAnalyzingDead(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke('analyzeDeadCode', { action: 'analyze' });
      if (data.ok) {
        setDeadCodeResults(data.analysis);
      } else {
        setError(data.error || 'ניתוח נכשל');
      }
    } catch (err) {
      setError("שגיאה בניתוח: " + err.message);
    } finally {
      setIsAnalyzingDead(false);
    }
  };

  const analyzeRedundancy = async () => {
    setIsAnalyzingRedundancy(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke('analyzeRedundancy', {});
      if (data.ok) {
        setRedundancyResults(data.analysis);
      } else {
        setError(data.error || 'ניתוח כפילויות נכשל');
      }
    } catch (err) {
      setError("שגיאה בניתוח כפילויות: " + err.message);
    } finally {
      setIsAnalyzingRedundancy(false);
    }
  };

  const runFullAnalysis = async () => {
    await analyzeDeadCode();
    await analyzeRedundancy();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-600" />
              ניקוי קוד ואופטימיזציה
            </h1>
            <p className="text-gray-600 mt-1">
              זיהוי ומחיקה של קוד מיותר לשיפור ביצועים
            </p>
          </div>
          <Button
            onClick={runFullAnalysis}
            disabled={isAnalyzingDead || isAnalyzingRedundancy}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {(isAnalyzingDead || isAnalyzingRedundancy) ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 ml-2" />
                הרץ ניתוח מלא
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <FileText className="w-5 h-5" />
                קוד מת (Dead Code)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                מזהה קבצים, קומפוננטות ופונקציות שלא בשימוש
              </p>
              <Button
                onClick={analyzeDeadCode}
                disabled={isAnalyzingDead}
                variant="outline"
                className="w-full"
              >
                {isAnalyzingDead ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מנתח קוד מת...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 ml-2" />
                    נתח קוד מת
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Package className="w-5 h-5" />
                קוד כפול (Redundancy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                מוצא קבצים דומים או כפולים שניתן לאחד
              </p>
              <Button
                onClick={analyzeRedundancy}
                disabled={isAnalyzingRedundancy}
                variant="outline"
                className="w-full"
              >
                {isAnalyzingRedundancy ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מנתח כפילויות...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 ml-2" />
                    נתח קוד כפול
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dead Code Results */}
        {deadCodeResults && (
          <Card className="border-2 border-orange-300">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-orange-600" />
                  תוצאות ניתוח קוד מת
                </div>
                <Badge className="bg-orange-600 text-white">
                  {deadCodeResults.deadCodeFiles} קבצים מיותרים
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {deadCodeResults.totalFilesScanned}
                    </div>
                    <div className="text-xs text-gray-600">קבצים נסרקו</div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {deadCodeResults.deadCodeFiles}
                    </div>
                    <div className="text-xs text-gray-600">קבצים מיותרים</div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {deadCodeResults.unusedImportsCount}
                    </div>
                    <div className="text-xs text-gray-600">imports מיותרים</div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {deadCodeResults.potentialSavings} KB
                    </div>
                    <div className="text-xs text-gray-600">חיסכון פוטנציאלי</div>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {deadCodeResults.warnings?.length > 0 && (
                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <ul className="text-sm space-y-1">
                      {deadCodeResults.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Dead Files List */}
              {deadCodeResults.files?.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    קבצים שלא בשימוש ({deadCodeResults.files.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {deadCodeResults.files.map((file, idx) => (
                      <Card key={idx} className="border border-gray-200">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-mono text-sm text-blue-600">
                                {file.path}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {file.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {file.size}
                                </Badge>
                                <Badge 
                                  className={`text-xs ${
                                    file.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                    file.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  סיכון: {file.riskLevel}
                                </Badge>
                              </div>
                              {file.exports?.length > 0 && (
                                <div className="text-xs text-gray-600 mt-2">
                                  Exports: {file.exports.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Unused Imports */}
              {deadCodeResults.unusedImports?.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-yellow-600" />
                    Imports מיותרים ({deadCodeResults.unusedImports.length} קבצים)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {deadCodeResults.unusedImports.slice(0, 10).map((item, idx) => (
                      <Card key={idx} className="border border-yellow-200 bg-yellow-50/30">
                        <CardContent className="p-3">
                          <div className="font-mono text-xs text-gray-700">
                            {item.file}
                          </div>
                          <div className="text-xs text-yellow-700 mt-1">
                            {item.line}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Redundancy Results */}
        {redundancyResults && redundancyResults.length > 0 && (
          <Card className="border-2 border-purple-300">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-purple-600" />
                  קוד כפול שזוהה
                </div>
                <Badge className="bg-purple-600 text-white">
                  {redundancyResults.length} זוגות כפולים
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {redundancyResults.map((item, idx) => (
                <Card key={idx} className="border-2 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="font-mono text-sm space-y-1">
                          <div className="text-blue-600">📄 {item.files[0]}</div>
                          <div className="text-blue-600">📄 {item.files[1]}</div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm font-semibold text-purple-900 mb-1">
                            💡 המלצה:
                          </div>
                          <div className="text-sm text-purple-800">
                            {item.recommendation}
                          </div>
                        </div>

                        <div className="text-sm text-gray-700">
                          <strong>סיבה:</strong> {item.reason}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Results Message */}
        {!deadCodeResults && !redundancyResults && !isAnalyzingDead && !isAnalyzingRedundancy && (
          <Card className="border-2 border-blue-200">
            <CardContent className="p-12 text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                מוכן לניקוי קוד!
              </h3>
              <p className="text-gray-600 mb-6">
                לחץ על "הרץ ניתוח מלא" כדי לזהות קוד מיותר ולשפר ביצועים
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={analyzeDeadCode}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  קוד מת בלבד
                </Button>
                <Button
                  onClick={analyzeRedundancy}
                  variant="outline"
                  className="gap-2"
                >
                  <Package className="w-4 h-4" />
                  כפילויות בלבד
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {(deadCodeResults || redundancyResults) && (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingDown className="w-6 h-6" />
                סיכום ופעולות מומלצות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadCodeResults && (
                  <Alert className="bg-white border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>קוד מת:</strong> נמצאו {deadCodeResults.deadCodeFiles} קבצים שלא בשימוש.
                      <br />
                      חיסכון פוטנציאלי: <strong>{deadCodeResults.potentialSavings} KB</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {redundancyResults && redundancyResults.length > 0 && (
                  <Alert className="bg-white border-purple-200">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription>
                      <strong>קוד כפול:</strong> זוהו {redundancyResults.length} זוגות קבצים עם פונקציונליות דומה
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="space-y-2">
                    <div className="font-bold">⚠️ לפני שמוחקים:</div>
                    <ul className="text-sm space-y-1 mr-4 list-disc">
                      <li>בדוק כל קובץ ידנית - ייתכנו תלויות דינמיות</li>
                      <li>התחל ממחיקת קבצים עם סיכון נמוך</li>
                      <li>בדוק שהאתר עובד אחרי כל מחיקה</li>
                      <li>שמור גיבוי לפני מחיקה המונית</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, CheckCircle, XCircle, AlertTriangle, 
  Play, RefreshCw, Bug, Zap, Server, Globe
} from "lucide-react";

export default function AdminPaymentDebugPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configData, setConfigData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [paymentSystemReady, setPaymentSystemReady] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [tokenTestResult, setTokenTestResult] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.role !== 'admin') {
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (name, status, details, data = null) => {
    setTestResults(prev => [...prev, { 
      name, 
      status, 
      details, 
      data,
      timestamp: new Date().toLocaleTimeString('he-IL') 
    }]);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Test 1: Config API
    addTestResult("בדיקת תצורה", "running", "טוען הגדרות תשלום...");
    try {
      const { data } = await base44.functions.invoke('getPaymentConfig');
      if (data && data.publicKey && data.companyId) {
        setConfigData(data);
        setTestResults(prev => prev.map(t => 
          t.name === "בדיקת תצורה" 
            ? { ...t, status: "success", details: `CompanyID: ${data.companyId}, Key: ${data.publicKey.substring(0,20)}...`, data } 
            : t
        ));
      } else {
        setTestResults(prev => prev.map(t => 
          t.name === "בדיקת תצורה" 
            ? { ...t, status: "error", details: "תצורה חסרה או לא תקינה", data } 
            : t
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(t => 
        t.name === "בדיקת תצורה" 
          ? { ...t, status: "error", details: error.message } 
          : t
      ));
    }

    // Test 2: jQuery loaded
    addTestResult("jQuery", "running", "בודק טעינת jQuery...");
    setTimeout(() => {
      if (window.jQuery) {
        setTestResults(prev => prev.map(t => 
          t.name === "jQuery" 
            ? { ...t, status: "success", details: `גרסה: ${window.jQuery.fn.jquery}` } 
            : t
        ));
      } else {
        setTestResults(prev => prev.map(t => 
          t.name === "jQuery" 
            ? { ...t, status: "error", details: "jQuery לא נטען" } 
            : t
        ));
      }
    }, 1000);

    // Test 3: Sumit SDK loaded
    addTestResult("Sumit SDK", "running", "בודק טעינת ספריית Sumit...");
    setTimeout(() => {
      if (window.OfficeGuy && window.OfficeGuy.Payments) {
        setTestResults(prev => prev.map(t => 
          t.name === "Sumit SDK" 
            ? { ...t, status: "success", details: "ספריית Sumit נטענה בהצלחה" } 
            : t
        ));
      } else {
        setTestResults(prev => prev.map(t => 
          t.name === "Sumit SDK" 
            ? { ...t, status: "error", details: "ספריית Sumit לא נטענה - window.OfficeGuy לא קיים" } 
            : t
        ));
      }
    }, 2000);

    // Test 4: processPayment function
    addTestResult("פונקציית תשלום", "running", "בודק זמינות פונקציית processPayment...");
    try {
      // Just check if function exists by calling with invalid token (should return error, not crash)
      const { data } = await base44.functions.invoke('processPayment', { token: "test_invalid_token", amount: 1 });
      // If we get here, function exists
      setTestResults(prev => prev.map(t => 
        t.name === "פונקציית תשלום" 
          ? { ...t, status: "success", details: `פונקציה זמינה. תשובה: ${JSON.stringify(data).substring(0,100)}...`, data } 
          : t
      ));
    } catch (error) {
      setTestResults(prev => prev.map(t => 
        t.name === "פונקציית תשלום" 
          ? { ...t, status: "warning", details: `שגיאה: ${error.message}` } 
          : t
      ));
    }

    setIsRunningTests(false);
  };

  const testTokenCharge = async () => {
    if (!manualToken.trim()) {
      alert("נא להזין טוקן לבדיקה");
      return;
    }

    setTokenTestResult({ status: "running", message: "מבצע חיוב בדיקה..." });

    try {
      const { data } = await base44.functions.invoke('processPayment', {
        token: manualToken.trim(),
        amount: 1, // 1 שקל לבדיקה
        currency: 'ILS',
        description: 'בדיקת מערכת תשלומים - Admin Debug',
        customer: { name: 'Test Admin', phone: '0500000000' }
      });

      console.log("Token test result:", data);

      if (data?.success) {
        setTokenTestResult({ 
          status: "success", 
          message: `חיוב הצליח! Transaction ID: ${data.transactionId}`,
          data 
        });
      } else {
        setTokenTestResult({ 
          status: "error", 
          message: `חיוב נכשל: ${data?.error || 'שגיאה לא ידועה'}`,
          data 
        });
      }
    } catch (error) {
      setTokenTestResult({ 
        status: "error", 
        message: `שגיאה: ${error.message}`,
        error 
      });
    }
  };

  // Load scripts
  useEffect(() => {
    const jqueryScript = document.createElement('script');
    jqueryScript.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    jqueryScript.async = true;
    
    const sumitScript = document.createElement('script');
    sumitScript.src = "https://app.sumit.co.il/scripts/payments.js";
    sumitScript.async = true;

    jqueryScript.onload = () => {
      document.body.appendChild(sumitScript);
    };

    document.body.appendChild(jqueryScript);
  }, []);

  // Bind Sumit for live test
  useEffect(() => {
    if (!configData) return;

    const bindSumit = () => {
      if (window.jQuery && window.OfficeGuy && window.OfficeGuy.Payments && formRef.current) {
        window.jQuery(function() {
          window.OfficeGuy.Payments.BindFormSubmit({
            CompanyID: configData.companyId,
            APIPublicKey: configData.publicKey,
            ResponseCallback: function(response) {
              console.log("🎉 DEBUG PAGE - ResponseCallback FIRED!");
              console.log("Response:", response);
              console.log("Response type:", typeof response);
              
              let data = response;
              if (typeof response === 'string') {
                try { data = JSON.parse(response); } catch (e) { console.log("Parse error", e); }
              }
              
              console.log("Parsed data:", data);
              console.log("Available keys:", Object.keys(data || {}));
              
              const token = data.SingleUseToken || data.Token || data.token || data.singleUseToken;
              console.log("Extracted token:", token);
              
              if (token && token.length > 5) {
                setManualToken(token);
                addTestResult("קבלת טוקן", "success", `טוקן התקבל: ${token.substring(0,30)}...`, { token, fullResponse: data });
              } else {
                addTestResult("קבלת טוקן", "error", "לא התקבל טוקן בתשובה. בדוק Console.", data);
              }
              return false;
            },
            SuccessCallback: function(response) {
              console.log("🎉 DEBUG PAGE - SuccessCallback FIRED!");
              console.log("Response:", response);
              console.log("Response type:", typeof response);
              
              let data = response;
              if (typeof response === 'string') {
                try { data = JSON.parse(response); } catch (e) { console.log("Parse error", e); }
              }
              
              console.log("Parsed data:", data);
              console.log("Available keys:", Object.keys(data || {}));
              
              const token = data.SingleUseToken || data.Token || data.token || data.singleUseToken;
              console.log("Extracted token:", token);
              
              if (token && token.length > 5) {
                setManualToken(token);
                addTestResult("קבלת טוקן (Success)", "success", `טוקן התקבל: ${token.substring(0,30)}...`, { token, fullResponse: data });
              } else {
                addTestResult("קבלת טוקן (Success)", "warning", "Callback נקרא אבל לא נמצא טוקן", data);
              }
              return false;
            },
            ErrorCallback: function(response) {
              console.error("💥 DEBUG PAGE - ErrorCallback FIRED!");
              console.error("Response:", response);
              addTestResult("שגיאת Sumit", "error", JSON.stringify(response), response);
              return false;
            }
          });
          setPaymentSystemReady(true);
        });
        return true;
      }
      return false;
    };

    const checkInterval = setInterval(() => {
      if (bindSumit()) clearInterval(checkInterval);
    }, 500);

    return () => clearInterval(checkInterval);
  }, [configData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">גישה נדחתה</h2>
            <p className="text-gray-600">עמוד זה זמין למנהלים בלבד</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "running": return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Bug className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bug className="text-purple-600" />
              אבחון מערכת תשלומים
            </h1>
            <p className="text-gray-500 mt-1">כלי דיבאג לבדיקת אינטגרציית Sumit</p>
          </div>
          <Button onClick={runAllTests} disabled={isRunningTests} className="gap-2">
            {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            הרץ בדיקות
          </Button>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              תוצאות בדיקות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">לחץ על "הרץ בדיקות" כדי להתחיל</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{result.name}</span>
                        <Badge variant="outline" className="text-xs">{result.timestamp}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">הצג נתונים מלאים</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40" dir="ltr">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Card Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              בדיקת כרטיס חיה
              {paymentSystemReady && <Badge className="bg-green-100 text-green-700">מוכן</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} id="debug-checkout-form" data-og="form" action="javascript:void(0);" className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>מספר כרטיס (לבדיקה: 4580 0000 0000 0000)</Label>
                  <Input type="text" maxLength="20" data-og="cardnumber" className="text-left ltr" placeholder="XXXX XXXX XXXX XXXX" />
                </div>
                
                <div>
                  <Label>תוקף</Label>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Input type="text" size="2" maxLength="2" data-og="expirationmonth" placeholder="MM" className="text-center" />
                    <span>/</span>
                    <Input type="text" size="4" maxLength="4" data-og="expirationyear" placeholder="YYYY" className="text-center" />
                  </div>
                </div>

                <div>
                  <Label>CVV</Label>
                  <Input type="text" size="4" maxLength="4" data-og="cvv" className="text-center" placeholder="123" />
                </div>

                <div className="col-span-2">
                  <Label>ת.ז.</Label>
                  <Input type="text" data-og="citizenid" placeholder="תעודת זהות" />
                </div>
              </div>

              <Button type="submit" disabled={!paymentSystemReady} className="w-full gap-2">
                <Zap className="w-4 h-4" />
                {paymentSystemReady ? "קבל טוקן מ-Sumit" : "ממתין לטעינת מערכת..."}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                לחיצה תשלח את הפרטים ל-Sumit ותחזיר טוקן (ללא חיוב אמיתי בשלב זה)
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Manual Token Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-600" />
              בדיקת חיוב עם טוקן
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              אחרי שקיבלת טוקן מהבדיקה למעלה, הוא יופיע כאן. לחץ לבדוק אם החיוב עובר.
            </p>
            
            <div className="flex gap-2">
              <Input 
                value={manualToken} 
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="הדבק טוקן כאן או קבל מהבדיקה למעלה"
                className="flex-1"
                dir="ltr"
              />
              <Button onClick={testTokenCharge} disabled={!manualToken.trim()} variant="outline" className="gap-2">
                <Play className="w-4 h-4" />
                בדוק חיוב (1₪)
              </Button>
            </div>

            {tokenTestResult && (
              <div className={`p-4 rounded-lg ${
                tokenTestResult.status === 'success' ? 'bg-green-50 border border-green-200' :
                tokenTestResult.status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(tokenTestResult.status)}
                  <span className="font-medium">{tokenTestResult.message}</span>
                </div>
                {tokenTestResult.data && (
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40" dir="ltr">
                    {JSON.stringify(tokenTestResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Console Log */}
        <Card>
          <CardHeader>
            <CardTitle>📋 הנחיות לבדיקה</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-gray-600">
            <p>1. לחץ על "הרץ בדיקות" לבדוק שכל המרכיבים טעונים</p>
            <p>2. מלא פרטי כרטיס בדיקה (4580 0000 0000 0000, תוקף עתידי, CVV כלשהו)</p>
            <p>3. לחץ "קבל טוקן" - הטוקן אמור להופיע בשדה למטה</p>
            <p>4. לחץ "בדוק חיוב" כדי לראות אם החיוב עובר</p>
            <p className="text-orange-600 font-medium">💡 פתח את Console בדפדפן (F12) לראות לוגים מפורטים</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
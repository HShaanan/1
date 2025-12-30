import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  RefreshCw, 
  Link as LinkIcon,
  AlertCircle,
  TrendingUp,
  Zap
} from "lucide-react";

export default function AdminIndexing() {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [customUrls, setCustomUrls] = useState("");
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    success: 0,
    failed: 0
  });

  useEffect(() => {
    loadBusinesses();
    loadSubmissionHistory();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await base44.entities.BusinessPage.filter({
        is_active: true,
        approval_status: "approved"
      }, "-created_date", 50);
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error loading businesses:", error);
    }
  };

  const loadSubmissionHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem("indexing_history") || "[]");
      setSubmissionHistory(history);
      
      // Calculate stats
      const stats = {
        total: history.length,
        pending: history.filter(h => h.status === "pending").length,
        success: history.filter(h => h.status === "success").length,
        failed: history.filter(h => h.status === "failed").length
      };
      setStats(stats);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleSubmitToGoogle = async () => {
    if (selectedUrls.length === 0 && !customUrls.trim()) {
      toast.error("בחר לפחות URL אחד");
      return;
    }

    setLoading(true);
    
    try {
      // Build URLs array
      let urlsToSubmit = [...selectedUrls];
      
      // Add custom URLs
      if (customUrls.trim()) {
        const customUrlsList = customUrls
          .split("\n")
          .map(u => u.trim())
          .filter(u => u.length > 0);
        urlsToSubmit = [...urlsToSubmit, ...customUrlsList];
      }

      // Call the function
      const result = await base44.functions.invoke("submitUrlsToGoogleIndexing", {
        urls: urlsToSubmit
      });

      console.log("Indexing result:", result);

      // Save to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        urls: urlsToSubmit,
        status: result?.data?.success ? "success" : "failed",
        results: result?.data?.results || [],
        message: result?.data?.message || "נשלח בהצלחה"
      };

      const history = JSON.parse(localStorage.getItem("indexing_history") || "[]");
      history.unshift(historyEntry);
      localStorage.setItem("indexing_history", JSON.stringify(history.slice(0, 50)));
      
      loadSubmissionHistory();

      if (result?.data?.success) {
        toast.success(`נשלחו ${urlsToSubmit.length} URLs לאינדוקס בהצלחה`);
        setSelectedUrls([]);
        setCustomUrls("");
      } else {
        toast.error(result?.data?.message || "שגיאה בשליחה");
      }
    } catch (error) {
      console.error("Error submitting to Google:", error);
      toast.error("שגיאה בשליחה לגוגל: " + error.message);
      
      // Save failed attempt
      const historyEntry = {
        timestamp: new Date().toISOString(),
        urls: urlsToSubmit || [],
        status: "failed",
        message: error.message
      };
      const history = JSON.parse(localStorage.getItem("indexing_history") || "[]");
      history.unshift(historyEntry);
      localStorage.setItem("indexing_history", JSON.stringify(history.slice(0, 50)));
      loadSubmissionHistory();
    } finally {
      setLoading(false);
    }
  };

  const toggleUrl = (url) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const selectAll = () => {
    const allUrls = businesses.map(b => 
      `https://meshlanoo.com/BusinessPage?id=${b.id}`
    );
    setSelectedUrls(allUrls);
  };

  const clearSelection = () => {
    setSelectedUrls([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Google Indexing API
          </h1>
          <p className="text-slate-600">
            שלח עמודים לאינדוקס מהיר ב-Google Search Console
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">סה"כ נשלחו</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <LinkIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">ממתינים</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">הצליחו</p>
                  <p className="text-3xl font-bold text-green-600">{stats.success}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">נכשלו</p>
                  <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Pages Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>בחר עמודי עסק ({selectedUrls.length} נבחרו)</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    בחר הכל
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    נקה
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {businesses.map((business) => {
                  const url = `https://meshlanoo.com/BusinessPage?id=${business.id}`;
                  const isSelected = selectedUrls.includes(url);
                  
                  return (
                    <div
                      key={business.id}
                      onClick={() => toggleUrl(url)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {business.business_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {url}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom URLs */}
          <Card>
            <CardHeader>
              <CardTitle>URLs מותאמים אישית</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    הדבק URLs (אחד בכל שורה)
                  </label>
                  <Textarea
                    value={customUrls}
                    onChange={(e) => setCustomUrls(e.target.value)}
                    placeholder="https://meshlanoo.com/page1&#10;https://meshlanoo.com/page2&#10;https://meshlanoo.com/page3"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">חשוב לדעת:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Google מעבדת בקשות תוך 24-48 שעות</li>
                        <li>מגבלה של 200 URLs ליום</li>
                        <li>רק URLs מהדומיין שלך</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitToGoogle}
                  disabled={loading || (selectedUrls.length === 0 && !customUrls.trim())}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      שולח לגוגל...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      שלח {selectedUrls.length + (customUrls.split("\n").filter(u => u.trim()).length || 0)} URLs לאינדוקס
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>היסטוריית שליחות</span>
              <Button size="sm" variant="outline" onClick={loadSubmissionHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                רענן
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissionHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>עדיין לא נשלחו URLs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissionHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {entry.status === "success" && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {entry.status === "failed" && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        {entry.status === "pending" && (
                          <Clock className="w-5 h-5 text-orange-600" />
                        )}
                        <span className="font-semibold text-slate-900">
                          {entry.urls.length} URLs
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {new Date(entry.timestamp).toLocaleString("he-IL")}
                      </span>
                    </div>
                    
                    {entry.message && (
                      <p className="text-sm text-slate-600 mb-2">{entry.message}</p>
                    )}
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        הצג URLs ({entry.urls.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto bg-slate-50 rounded p-2">
                        {entry.urls.map((url, i) => (
                          <div key={i} className="text-xs text-slate-600 truncate">
                            {url}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
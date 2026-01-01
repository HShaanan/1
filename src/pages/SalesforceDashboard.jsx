import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, DollarSign, Target, Calendar, 
  RefreshCw, AlertCircle, CheckCircle, Clock 
} from "lucide-react";
import { motion } from "framer-motion";

const STAGE_COLORS = {
  'Prospecting': 'bg-slate-100 text-slate-700 border-slate-300',
  'Qualification': 'bg-blue-100 text-blue-700 border-blue-300',
  'Needs Analysis': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'Value Proposition': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  'Proposal/Price Quote': 'bg-purple-100 text-purple-700 border-purple-300',
  'Negotiation/Review': 'bg-amber-100 text-amber-700 border-amber-300',
  'Closed Won': 'bg-green-100 text-green-700 border-green-300',
  'Closed Lost': 'bg-red-100 text-red-700 border-red-300'
};

const STAGE_ICONS = {
  'Prospecting': Clock,
  'Qualification': Target,
  'Closed Won': CheckCircle,
  'Closed Lost': AlertCircle
};

export default function SalesforceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getSalesforceOpportunities', {});
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setData(response.data);
      }
    } catch (err) {
      setError('שגיאה בטעינת הנתונים מ-Salesforce');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">טוען נתונים מ-Salesforce...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Card className="max-w-2xl mx-auto border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">שגיאה בחיבור</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={fetchOpportunities} className="bg-blue-600 hover:bg-blue-700">
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { opportunities, stageStats, totalOpportunities, totalValue } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              📊 Salesforce Dashboard
            </h1>
            <p className="text-slate-600">סטטוס Opportunities בזמן אמת</p>
          </div>
          <Button 
            onClick={fetchOpportunities}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן נתונים
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{totalOpportunities}</span>
                </div>
                <p className="text-blue-100 text-sm">סך הכל Opportunities</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    ${(totalValue / 1000000).toFixed(1)}M
                  </span>
                </div>
                <p className="text-green-100 text-sm">ערך כולל</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {stageStats['Closed Won']?.count || 0}
                  </span>
                </div>
                <p className="text-purple-100 text-sm">עסקאות סגורות</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {Object.keys(stageStats).length}
                  </span>
                </div>
                <p className="text-amber-100 text-sm">שלבים פעילים</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stage Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">📈 פילוח לפי שלבים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stageStats).map(([stage, stats], index) => {
                const Icon = STAGE_ICONS[stage] || Target;
                const colorClass = STAGE_COLORS[stage] || 'bg-slate-100 text-slate-700 border-slate-300';
                
                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`${colorClass} border-2`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className="w-6 h-6" />
                          <h3 className="font-bold text-lg">{stage}</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm opacity-80">עסקאות:</span>
                            <span className="font-bold text-xl">{stats.count}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm opacity-80">ערך:</span>
                            <span className="font-bold">
                              ${(stats.totalAmount / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🎯 Opportunities אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunities.slice(0, 10).map((opp, index) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{opp.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>👤 {opp.accountName}</span>
                      <span>💼 {opp.ownerName}</span>
                      {opp.closeDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(opp.closeDate).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={STAGE_COLORS[opp.stage] || 'bg-slate-100 text-slate-700'}>
                      {opp.stage}
                    </Badge>
                    {opp.amount && (
                      <span className="font-bold text-green-600">
                        ${(opp.amount / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Smart Insights */}
        <Card className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              💡 תובנות חכמות
            </h3>
            <div className="space-y-3 text-slate-700">
              <p>✅ <strong>יעילות:</strong> הנתונים מתעדכנים בזמן אמת ישירות מ-Salesforce</p>
              <p>⚡ <strong>אוטומציה:</strong> אפשר להוסיף Webhooks לעדכון אוטומטי כשיש שינוי</p>
              <p>📊 <strong>דאטה מרוכז:</strong> כל המידע במקום אחד - אין צורך לעבור בין מערכות</p>
              <p>🎯 <strong>החלטות מהירות:</strong> רואה את התמונה המלאה בהצגה ויזואלית</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
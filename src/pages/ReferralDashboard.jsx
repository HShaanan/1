import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, Copy, Users, TrendingUp, Award, 
  CheckCircle, AlertTriangle, Zap, Trophy 
} from "lucide-react";
import { toast } from "sonner";

export default function ReferralDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Initialize or get ref_id
      const { data: initData } = await base44.functions.invoke('initializeReferralUser', {});
      setStats(initData.stats);

      // Load recent activity
      const logs = await base44.entities.ReferralLog.filter({
        ref_id: initData.ref_id
      }, '-created_date', 10);
      setRecentActivity(logs);

      // Load leaderboard
      const allStats = await base44.entities.ReferralStats.list('-total_points', 10);
      setLeaderboard(allStats);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    return `${window.location.origin}?ref=${stats?.ref_id}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getReferralUrl());
    setCopied(true);
    toast.success('הקישור הועתק!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const url = getReferralUrl();
    const text = encodeURIComponent(`הצטרף למשלנו והרווח! 🎁\n\n`);
    window.open(`https://wa.me/?text=${text}${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            מערכת ההפניות שלי
          </h1>
          <p className="text-slate-600">
            הפנה חברים והרווח נקודות לתחרות!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">סך נקודות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_points || 0}</div>
              <p className="text-xs opacity-80 mt-1">
                {stats?.points_today || 0} נקודות היום
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                <Users className="w-4 h-4 inline ml-1" />
                מבקרים ייחודיים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.unique_visitors || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                <Zap className="w-4 h-4 inline ml-1" />
                מבקרים מעורבים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.engaged_visitors || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                <CheckCircle className="w-4 h-4 inline ml-1" />
                הרשמות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.conversions || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              הקישור שלי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <code className="text-sm break-all">{getReferralUrl()}</code>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={copyToClipboard}
                variant="secondary"
                className="flex-1"
              >
                <Copy className="w-4 h-4 ml-2" />
                {copied ? 'הועתק!' : 'העתק קישור'}
              </Button>
              
              <Button 
                onClick={shareToWhatsApp}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                שתף בוואטסאפ
              </Button>
            </div>

            <div className="bg-white/10 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold">איך זה עובד?</p>
              <ul className="space-y-1 text-xs opacity-90">
                <li>✓ 1 נקודה על כל 5 מבקרים ייחודיים</li>
                <li>✓ 2 נקודות למבקר שנשאר מעל 30 שניות</li>
                <li>✓ 5 נקודות בונוס על כל הרשמה!</li>
                <li>⚠️ מגבלה: עד 50 נקודות ליום</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                טבלת המובילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.user_email === stats?.user_email 
                        ? 'bg-blue-50 border-2 border-blue-300' 
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {entry.user_email === stats?.user_email ? 'אתה!' : '052-***-' + entry.ref_id.slice(-4)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.conversions} הרשמות
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {entry.total_points} נקודות
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    עדיין אין פעילות. שתף את הקישור שלך!
                  </p>
                ) : (
                  recentActivity.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      {log.conversion_completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : log.quality_flag === 'low' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {log.conversion_completed ? (
                            '🎉 הרשמה חדשה!'
                          ) : log.session_duration >= 30 ? (
                            '👀 מבקר מעורב'
                          ) : (
                            '👋 מבקר חדש'
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(log.created_date).toLocaleString('he-IL')}
                        </div>
                      </div>
                      
                      {log.points_awarded > 0 && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          +{log.points_awarded}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
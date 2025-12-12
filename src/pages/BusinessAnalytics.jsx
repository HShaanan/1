
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, Phone, Navigation, Globe, MessageCircle, Heart, 
  Share2, TrendingUp, Users, Calendar, ChevronLeft, BarChart3, Clock, Edit
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { formatIsraeliDateTime } from "@/components/utils/dateUtils";

export default function BusinessAnalyticsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [businessPage, setBusinessPage] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [impressions, setImpressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("7days");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [pageId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!pageId) {
        setLoading(false);
        return;
      }

      const [pageData, analyticsData, impressionsData] = await Promise.all([
        base44.entities.BusinessPage.filter({ id: pageId }),
        base44.entities.BusinessPageAnalytics.filter({ business_page_id: pageId }, "-created_date"),
        base44.entities.BusinessPageImpression.filter({ business_page_id: pageId }, "-created_date")
      ]);

      const page = Array.isArray(pageData) ? pageData[0] : pageData;
      
      if (page) {
        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';
        
        if (!isOwner && !isAdmin) {
          window.location.href = createPageUrl("Browse");
          return;
        }
        
        setBusinessPage(page);
      }
      
      setAnalytics(analyticsData || []);
      setImpressions(impressionsData || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = (data) => {
    if (dateFilter === "all") return data;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch(dateFilter) {
      case "today":
        cutoff.setHours(0, 0, 0, 0);
        break;
      case "7days":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "30days":
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.created_date) >= cutoff);
  };

  const filteredAnalytics = getFilteredData(analytics);
  const filteredImpressions = getFilteredData(impressions);

  const getEventStats = () => {
    const stats = {
      total_views: filteredImpressions.length,
      unique_views: new Set(filteredImpressions.map(i => i.session_id)).size,
      phone_clicks: 0,
      navigation_clicks: 0,
      website_clicks: 0,
      whatsapp_clicks: 0,
      share_clicks: 0,
      favorite_clicks: 0
    };

    filteredAnalytics.forEach(event => {
      switch(event.event_type) {
        case "phone_click":
          stats.phone_clicks++;
          break;
        case "navigation_click":
          stats.navigation_clicks++;
          break;
        case "website_click":
          stats.website_clicks++;
          break;
        case "whatsapp_click":
          stats.whatsapp_clicks++;
          break;
        case "share_click":
          stats.share_clicks++;
          break;
        case "favorite_click":
          stats.favorite_clicks++;
          break;
      }
    });

    return stats;
  };

  const getTopReferrers = () => {
    const referrers = {};
    filteredImpressions.forEach(imp => {
      const ref = imp.referrer || 'ישיר';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });

    return Object.entries(referrers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getHourlyDistribution = () => {
    const hours = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = 0;
    }

    filteredImpressions.forEach(imp => {
      // המרה לשעון ישראל לפני חילוץ השעה
      const utcDate = new Date(imp.created_date);
      const israelHour = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jerusalem',
        hour: 'numeric',
        hour12: false
      }).format(utcDate);
      
      const hour = parseInt(israelHour);
      hours[hour]++;
    });

    return hours;
  };

  const theme = businessPage?.theme_settings?.custom_colors || {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#e0e7ff'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})` }}
        >
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const stats = getEventStats();
  const topReferrers = getTopReferrers();
  const hourlyData = getHourlyDistribution();

  const eventButtons = [
    { icon: Phone, label: "שיחות טלפון", count: stats.phone_clicks, color: "from-blue-500 to-blue-600" },
    { icon: MessageCircle, label: "הודעות וואטסאפ", count: stats.whatsapp_clicks, color: "from-green-500 to-green-600" },
    { icon: Navigation, label: "ניווט", count: stats.navigation_clicks, color: "from-purple-500 to-purple-600" },
    { icon: Globe, label: "אתר אינטרנט", count: stats.website_clicks, color: "from-indigo-500 to-indigo-600" },
    { icon: Share2, label: "שיתופים", count: stats.share_clicks, color: "from-pink-500 to-pink-600" },
    { icon: Heart, label: "מועדפים", count: stats.favorite_clicks, color: "from-red-500 to-red-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = createPageUrl(`BusinessManage?id=${pageId}`)}
                  className="hover:bg-gray-100 rounded-xl"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8" style={{ color: theme.primary }} />
                    סטטיסטיקות וחשיפה
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {businessPage?.business_name}
                  </p>
                </div>
              </div>

              {/* Date Filters */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "today", label: "היום" },
                  { value: "7days", label: "7 ימים" },
                  { value: "30days", label: "30 ימים" },
                  { value: "all", label: "הכל" }
                ].map(filter => (
                  <Button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    variant={dateFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    style={dateFilter === filter.value ? { backgroundColor: theme.primary } : {}}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card 
            className="shadow-lg border-0 bg-white/95 backdrop-blur overflow-hidden"
            style={{ borderTop: `4px solid ${theme.primary}` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Eye className="w-8 h-8" style={{ color: theme.primary }} />
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  צפיות
                </Badge>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: theme.primary }}>
                {stats.total_views.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                {stats.unique_views.toLocaleString()} צפיות ייחודיות
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur overflow-hidden border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  אינטראקציות
                </Badge>
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {(stats.phone_clicks + stats.whatsapp_clicks + stats.navigation_clicks + stats.website_clicks).toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                סה"כ פעולות שבוצעו
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur overflow-hidden border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                  המרה
                </Badge>
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {stats.unique_views > 0 
                  ? ((stats.phone_clicks + stats.whatsapp_clicks) / stats.unique_views * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-slate-600">
                שיעור המרה ללידים
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons Stats */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" style={{ color: theme.primary }} />
              לחיצות על כפתורים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {eventButtons.map((btn, index) => {
                const Icon = btn.icon;
                return (
                  <div
                    key={index}
                    className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 hover:shadow-lg transition-all"
                  >
                    <div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${btn.color} flex items-center justify-center mb-3 mx-auto`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">
                        {btn.count}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {btn.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Referrers */}
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                מקורות תעבורה מובילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topReferrers.length > 0 ? (
                <div className="space-y-3">
                  {topReferrers.map(([referrer, count], index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                          {referrer === 'ישיר' ? '🔗 ישיר' : referrer}
                        </span>
                      </div>
                      <Badge variant="secondary">{count} צפיות</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  אין נתוני מקורות עדיין
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                התפלגות לפי שעות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(hourlyData)
                  .filter(([, count]) => count > 0)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([hour, count]) => {
                    const maxCount = Math.max(...Object.values(hourlyData));
                    const percentage = (count / maxCount) * 100;
                    
                    return (
                      <div key={hour} className="flex items-center gap-3">
                        <div className="text-sm font-medium text-slate-600 w-16">
                          {hour}:00-{hour}:59
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                          <div 
                            className="h-full rounded-full flex items-center justify-end px-2"
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryHover})`
                            }}
                          >
                            <span className="text-white text-xs font-bold">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {Object.values(hourlyData).every(v => v === 0) && (
                <div className="text-center py-8 text-slate-500">
                  אין נתונים זמינים
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: theme.primary }} />
              פעילות אחרונה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAnalytics.length > 0 ? (
                filteredAnalytics.slice(0, 20).map((event, index) => {
                  const eventConfig = {
                    phone_click: { icon: Phone, label: "שיחת טלפון", color: "bg-blue-100 text-blue-800" },
                    whatsapp_click: { icon: MessageCircle, label: "הודעת וואטסאפ", color: "bg-green-100 text-green-800" },
                    navigation_click: { icon: Navigation, label: "ניווט", color: "bg-purple-100 text-purple-800" },
                    website_click: { icon: Globe, label: "כניסה לאתר", color: "bg-indigo-100 text-indigo-800" },
                    share_click: { icon: Share2, label: "שיתוף", color: "bg-pink-100 text-pink-800" },
                    favorite_click: { icon: Heart, label: "הוספה למועדפים", color: "bg-red-100 text-red-800" }
                  };

                  const config = eventConfig[event.event_type] || { 
                    icon: Eye, 
                    label: event.event_type, 
                    color: "bg-gray-100 text-gray-800" 
                  };
                  const Icon = config.icon;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{config.label}</div>
                          <div className="text-xs text-slate-500">
                            {event.created_date && formatIsraeliDateTime(event.created_date)}
                          </div>
                        </div>
                      </div>
                      {event.user_email && (
                        <Badge variant="outline" className="text-xs">
                          {event.user_email}
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">אין פעילות להצגה</p>
                  <p className="text-sm text-slate-400 mt-2">
                    הסטטיסטיקות יתחילו להיאסף כשמשתמשים יבקרו בעמוד
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.location.href = createPageUrl(`BusinessPage?id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              צפה בעמוד
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl(`EditBusinessPage?id=${pageId}`)}
              variant="outline"
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              ערוך עמוד
            </Button>
            <Button
              onClick={loadData}
              variant="outline"
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              רענן נתונים
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

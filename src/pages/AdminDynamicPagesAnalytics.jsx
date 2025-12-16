import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Eye, Target, Clock, ChevronLeft, Filter,
  BarChart3, MapPin, Store, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDynamicPagesAnalytics() {
  const [pageViews, setPageViews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7days');

  useEffect(() => {
    const loadData = async () => {
      try {
        const views = await base44.entities.DynamicPageView.list("-created_date", 1000);
        setPageViews(views || []);
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredViews = useMemo(() => {
    const now = Date.now();
    const cutoff = {
      '24hours': now - 24 * 60 * 60 * 1000,
      '7days': now - 7 * 24 * 60 * 60 * 1000,
      '30days': now - 30 * 24 * 60 * 60 * 1000,
      'all': 0
    }[dateFilter];

    return pageViews.filter(v => new Date(v.created_date).getTime() > cutoff);
  }, [pageViews, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredViews.length;
    const withResults = filteredViews.filter(v => v.has_results).length;
    const withoutResults = total - withResults;
    const converted = filteredViews.filter(v => v.converted).length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;
    const avgTime = filteredViews.length > 0 
      ? (filteredViews.reduce((sum, v) => sum + (v.time_on_page || 0), 0) / filteredViews.length).toFixed(0)
      : 0;

    // Top searches
    const cityCounts = {};
    const categoryCounts = {};
    const noResultsCombos = {};

    filteredViews.forEach(v => {
      cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
      const catName = v.category_name || v.category;
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      
      if (!v.has_results) {
        const key = `${v.city} - ${catName}${v.subcategory ? ` - ${v.subcategory}` : ''}`;
        noResultsCombos[key] = (noResultsCombos[key] || 0) + 1;
      }
    });

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topNoResults = Object.entries(noResultsCombos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      withResults,
      withoutResults,
      converted,
      conversionRate,
      avgTime,
      topCities,
      topCategories,
      topNoResults
    };
  }, [filteredViews]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                ניתוח דפים דינמיים
              </h1>
              <p className="text-slate-600">
                מעקב אחר כל הדפים שנפתחים ושיעורי המרה
              </p>
            </div>
            <div className="flex gap-2">
              {['24hours', '7days', '30days', 'all'].map(filter => (
                <Button
                  key={filter}
                  variant={dateFilter === filter ? 'default' : 'outline'}
                  onClick={() => setDateFilter(filter)}
                  size="sm"
                >
                  {filter === '24hours' && '24 שעות'}
                  {filter === '7days' && '7 ימים'}
                  {filter === '30days' && '30 ימים'}
                  {filter === 'all' && 'הכל'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                סך צפיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                שיעור המרה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.conversionRate}%</div>
              <p className="text-sm text-slate-500 mt-1">{stats.converted} המרות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Store className="w-4 h-4" />
                דפים עם תוצאות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.withResults}</div>
              <p className="text-sm text-slate-500 mt-1">
                {((stats.withResults / stats.total) * 100).toFixed(0)}% מהצפיות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                זמן ממוצע בדף
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.avgTime}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                ערים פופולריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCities.map(([city, count], idx) => (
                  <div key={city} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <span className="font-medium text-slate-900">{city}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(count / stats.topCities[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-12 text-left">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                קטגוריות פופולריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCategories.map(([category, count], idx) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <span className="font-medium text-slate-900">{category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500"
                          style={{ width: `${(count / stats.topCategories[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-12 text-left">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* No Results - High Priority */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <TrendingUp className="w-5 h-5" />
              הזדמנויות זהב - חיפושים ללא תוצאות (לידים פוטנציאליים!)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800 mb-4">
              אלו הצירופים הפופולריים שאנשים מחפשים אבל אין להם עסקים - הזדמנות מושלמת לגיוס עסקים חדשים!
            </p>
            <div className="space-y-2">
              {stats.topNoResults.length > 0 ? (
                stats.topNoResults.map(([combo, count], idx) => (
                  <div 
                    key={combo}
                    className="bg-white rounded-lg p-3 flex items-center justify-between border border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-500">{idx + 1}</Badge>
                      <span className="font-medium text-slate-900">{combo}</span>
                    </div>
                    <Badge variant="destructive">{count} חיפושים</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4">
                  🎉 מעולה! כל החיפושים מצאו תוצאות
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
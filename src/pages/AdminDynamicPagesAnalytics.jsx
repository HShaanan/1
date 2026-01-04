import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Eye, Target, Clock, ChevronLeft, Filter,
  BarChart3, MapPin, Store, Users, ExternalLink, FileCode, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDynamicPagesAnalytics() {
  const [pageViews, setPageViews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [sitemapContent, setSitemapContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSitemapLoading, setIsSitemapLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('7days');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [views, cats, biz] = await Promise.all([
          base44.entities.DynamicPageView.list("-created_date", 1000),
          base44.entities.Category.list(),
          base44.entities.BusinessPage.filter({ 
            is_active: true, 
            approval_status: 'approved',
            is_frozen: false 
          })
        ]);
        setPageViews(views || []);
        setCategories(cats || []);
        setBusinesses(biz || []);
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

  // חישוב דפים קיימים במערכת - כל הדפים שב-sitemap
  const existingPages = useMemo(() => {
    if (categories.length === 0 || businesses.length === 0) return [];

    const baseUrl = 'https://meshelanu.co.il';
    const cities = [...new Set(businesses.map(b => b.city))].filter(Boolean);
    
    // כל הקטגוריות הראשיות הפעילות - בלי סינון!
    const relevantCategories = categories.filter(c => !c.parent_id && c.is_active);
    
    const allSubcategories = categories.filter(c => c.parent_id);
    
    const pages = [];
    
    // דפי קטגוריה ראשית
    cities.forEach(city => {
      relevantCategories.forEach(category => {
        const businessCount = businesses.filter(b => 
          b.city === city && b.category_id === category.id
        ).length;
        
        const viewCount = pageViews.filter(v => 
          v.city === city && v.category === category.slug
        ).length;
        
        pages.push({
          city,
          category: category.name,
          categorySlug: category.slug,
          subcategory: null,
          businessCount,
          viewCount,
          url: `${baseUrl}/page/DynamicCategoryPage?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category.slug)}`,
          type: 'main'
        });
        
        // דפי תת-קטגוריה
        const subcats = allSubcategories.filter(s => s.parent_id === category.id);
        subcats.forEach(subcat => {
          const subcatBusinessCount = businesses.filter(b => 
            b.city === city && 
            (b.subcategory_ids?.includes(subcat.id) || b.subcategory_id === subcat.id)
          ).length;
          
          const subcatViewCount = pageViews.filter(v => 
            v.city === city && 
            v.category === category.slug && 
            v.subcategory === subcat.slug
          ).length;
          
          pages.push({
            city,
            category: category.name,
            categorySlug: category.slug,
            subcategory: subcat.name,
            subcategorySlug: subcat.slug,
            businessCount: subcatBusinessCount,
            viewCount: subcatViewCount,
            url: `${baseUrl}/page/DynamicCategoryPage?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category.slug)}&subcategory=${encodeURIComponent(subcat.slug)}`,
            type: 'sub'
          });
        });
      });
    });
    
    return pages.sort((a, b) => b.viewCount - a.viewCount);
  }, [categories, businesses, pageViews]);

  const loadSitemap = async () => {
    setIsSitemapLoading(true);
    try {
      const response = await base44.functions.invoke('generateExpandedSitemap', {});
      setSitemapContent(response.data || "");
    } catch (error) {
      console.error("Error loading sitemap:", error);
      setSitemapContent("שגיאה בטעינת ה-sitemap");
    } finally {
      setIsSitemapLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = filteredViews.length;
    
    if (total === 0) {
      return {
        total: 0,
        withResults: 0,
        withoutResults: 0,
        converted: 0,
        conversionRate: 0,
        avgTime: 0,
        topCities: [],
        topCategories: [],
        topNoResults: []
      };
    }

    const withResults = filteredViews.filter(v => v.has_results).length;
    const withoutResults = total - withResults;
    const converted = filteredViews.filter(v => v.converted).length;
    const conversionRate = ((converted / total) * 100).toFixed(1);
    const avgTime = (filteredViews.reduce((sum, v) => sum + (v.time_on_page || 0), 0) / filteredViews.length).toFixed(0);

    // Top searches
    const cityCounts = {};
    const categoryCounts = {};
    const noResultsCombos = {};

    filteredViews.forEach(v => {
      cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
      const catName = v.category_name || v.category || 'לא צוין';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;

      if (!v.has_results) {
        const key = `${v.city || 'לא צוין'} - ${catName}${v.subcategory ? ` - ${v.subcategory}` : ''}`;
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
                {stats.total > 0 ? ((stats.withResults / stats.total) * 100).toFixed(0) : 0}% מהצפיות
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
                          style={{ width: `${stats.topCities[0] ? (count / stats.topCities[0][1]) * 100 : 0}%` }}
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
                          style={{ width: `${stats.topCategories[0] ? (count / stats.topCategories[0][1]) * 100 : 0}%` }}
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

        {/* כל הדפים הדינמיים הקיימים */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              כל דפי הנחיתה הדינמיים ב-Sitemap ({existingPages.length} דפים)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              כל הצירופים של עיר + קטגוריה/תת-קטגוריה שנמצאים ב-sitemap (אוכל וקניות בלבד), מסודרים לפי צפיות
            </p>
            <div className="mb-4 flex gap-2">
              <Badge variant="outline">
                דפים עם עסקים: {existingPages.filter(p => p.businessCount > 0).length}
              </Badge>
              <Badge variant="destructive">
                דפים ללא עסקים (לידים): {existingPages.filter(p => p.businessCount === 0).length}
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="text-right p-3 font-semibold text-slate-700">עיר</th>
                    <th className="text-right p-3 font-semibold text-slate-700">קטגוריה</th>
                    <th className="text-right p-3 font-semibold text-slate-700">תת-קטגוריה</th>
                    <th className="text-center p-3 font-semibold text-slate-700">עסקים</th>
                    <th className="text-center p-3 font-semibold text-slate-700">צפיות</th>
                    <th className="text-center p-3 font-semibold text-slate-700">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {existingPages.map((page, idx) => (
                    <tr 
                      key={`${page.city}-${page.categorySlug}-${page.subcategorySlug || 'main'}`}
                      className={`border-b hover:bg-slate-50 transition-colors ${
                        page.businessCount === 0 ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="p-3">{page.city}</td>
                      <td className="p-3">{page.category}</td>
                      <td className="p-3 text-slate-500 text-xs">
                        {page.subcategory || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant={page.businessCount > 0 ? 'default' : 'destructive'}
                          className={page.businessCount === 0 ? 'bg-red-500' : ''}
                        >
                          {page.businessCount}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{page.viewCount}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            פתח
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Google Search Console URL */}
        <Card className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <ExternalLink className="w-5 h-5" />
              הוספת Sitemap ל-Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-green-800 mb-2 font-semibold">כתובת ה-Sitemap שלך:</p>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 font-mono text-sm select-all">
                  https://meshelanu.co.il/api/functions/generateExpandedSitemap
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="font-semibold text-green-900 mb-2">📝 הוראות הוספה ל-Google Search Console:</p>
                <ol className="text-sm text-slate-700 space-y-2 mr-6 list-decimal">
                  <li>היכנס ל-<a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Search Console</a></li>
                  <li>בחר את האתר שלך (meshelanu.co.il)</li>
                  <li>לחץ על "Sitemaps" בתפריט השמאלי</li>
                  <li>הדבק את הכתובת: <code className="bg-slate-100 px-2 py-1 rounded text-xs">https://meshelanu.co.il/api/functions/generateExpandedSitemap</code></li>
                  <li>לחץ "Submit"</li>
                </ol>
              </div>

              <a
                href="https://search.google.com/search-console/sitemaps"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <ExternalLink className="w-4 h-4 ml-2" />
                  פתח Google Search Console
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Google Search Console URL */}
        <Card className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <ExternalLink className="w-5 h-5" />
              הוספת Sitemap ל-Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-green-800 mb-2 font-semibold">כתובת ה-Sitemap שלך:</p>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 font-mono text-sm select-all">
                  https://meshelanu.co.il/api/functions/generateExpandedSitemap
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="font-semibold text-green-900 mb-2">📝 הוראות הוספה ל-Google Search Console:</p>
                <ol className="text-sm text-slate-700 space-y-2 mr-6 list-decimal">
                  <li>היכנס ל-<a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Search Console</a></li>
                  <li>בחר את האתר שלך (meshelanu.co.il)</li>
                  <li>לחץ על "Sitemaps" בתפריט השמאלי</li>
                  <li>הדבק את הכתובת: <code className="bg-slate-100 px-2 py-1 rounded text-xs">api/functions/generateExpandedSitemap</code></li>
                  <li>לחץ "Submit"</li>
                </ol>
              </div>

              <a
                href="https://search.google.com/search-console/sitemaps"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <ExternalLink className="w-4 h-4 ml-2" />
                  פתח Google Search Console
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Sitemap Viewer */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                קובץ Sitemap המלא
              </CardTitle>
              <Button
                onClick={loadSitemap}
                disabled={isSitemapLoading}
                variant="outline"
              >
                {isSitemapLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    טוען...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 ml-2" />
                    טען Sitemap
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sitemapContent ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(sitemapContent);
                      alert('ה-Sitemap הועתק ללוח');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    העתק
                  </Button>
                </div>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  {sitemapContent}
                </pre>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">
                לחץ על "טען Sitemap" כדי לראות את קובץ ה-XML המלא
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
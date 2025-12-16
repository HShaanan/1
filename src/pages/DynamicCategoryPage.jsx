import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Store, MapPin, Plus, ArrowRight, Sparkles, 
  Search, TrendingUp, Loader2, ChevronLeft 
} from "lucide-react";
import ListingPreviewCard from "@/components/explore/ListingPreviewCard";
import SeoMeta from "@/components/SeoMeta";

export default function DynamicCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get("city") || "ביתר-עילית";
  const category = urlParams.get("category") || "";
  const subcategory = urlParams.get("subcategory") || "";
  
  const [businesses, setBusinesses] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedCategories, setRelatedCategories] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load category data
        const cats = await base44.entities.Category.filter({
          slug: category,
          is_active: true
        });
        setCategoryData(cats[0] || null);

        // Build filter for businesses
        const filter = {
          is_active: true,
          approval_status: 'approved',
          is_frozen: false,
          city: city
        };

        if (subcategory) {
          filter.subcategory_slugs = { $contains: subcategory };
        } else if (category) {
          filter.category_slug = category;
        }

        // Load businesses
        const results = await base44.entities.BusinessPage.filter(filter, "-is_promoted,-created_date", 50);
        setBusinesses(results || []);

        // Load related categories for suggestions
        if (cats[0]) {
          const related = await base44.entities.Category.filter({
            parent_id: cats[0].id,
            is_active: true
          }, "sort_order", 10);
          setRelatedCategories(related || []);
        }

      } catch (error) {
        console.error("Error loading dynamic page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [city, category, subcategory]);

  const displayTitle = useMemo(() => {
    if (subcategory) return subcategory.replace(/-/g, ' ');
    if (categoryData) return categoryData.name;
    return category.replace(/-/g, ' ');
  }, [category, subcategory, categoryData]);

  const seoDescription = `מחפשים ${displayTitle} ב${city}? גלו עסקים מובילים, מסעדות כשרות וחנויות מומלצות ב${city}. משלנו - המדריך השלם לעסקים מקומיים בקהילה החרדית.`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-700">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4" dir="rtl">
      <SeoMeta
        category={displayTitle}
        city={city}
        description={seoDescription}
      />

      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.location.href = createPageUrl("Browse")}
          className="mb-6 hover:bg-white/80"
        >
          <ChevronLeft className="w-4 h-4 ml-2" />
          חזרה לעמוד הראשי
        </Button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900">
                  {displayTitle}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-lg">{city}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {businesses.length > 0 
                  ? `נמצאו ${businesses.length} עסקים פעילים בקטגוריה זו`
                  : 'גלה עסקים, מסעדות כשרות וחנויות מקומיות באזור'}
              </p>
            </div>
            
            <Button
              onClick={() => window.location.href = createPageUrl("Add")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 ml-2" />
              הוסיפו עסק
            </Button>
          </div>
        </div>

        {businesses.length === 0 ? (
          /* No Results - Lead Capture */
          <div className="space-y-6">
            <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-lg">
                <strong>עדיין אין {displayTitle} ב{city}!</strong>
                <br />
                היו הראשונים להצטרף למשלנו ולהגיע לאלפי לקוחות פוטנציאליים.
              </AlertDescription>
            </Alert>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-2xl">
              <CardContent className="p-10 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-200" />
                <h2 className="text-3xl font-bold mb-4">
                  הצטרפו למהפכת העסקים המקומיים
                </h2>
                <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                  משלנו מחברת עסקים מקומיים עם אלפי משפחות בקהילה החרדית. 
                  קבלו נראות מקסימלית, לידים איכותיים ואפשרות להציג את העסק שלכם בצורה המקצועית ביותר.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => window.location.href = createPageUrl("Add")}
                    className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl text-lg px-8 py-6 h-auto"
                  >
                    <Plus className="w-6 h-6 ml-2" />
                    הוסיפו עסק חינם
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl("Browse")}
                    className="bg-white/10 border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6 h-auto backdrop-blur-sm"
                  >
                    <Search className="w-6 h-6 ml-2" />
                    חפשו עסקים אחרים
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Categories */}
            {relatedCategories.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                    קטגוריות קשורות ב{city}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {relatedCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant="outline"
                        onClick={() => {
                          const params = new URLSearchParams({
                            city: city,
                            category: category,
                            subcategory: cat.slug || cat.id
                          });
                          window.location.href = createPageUrl(`DynamicCategoryPage?${params.toString()}`);
                        }}
                        className="justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <span className="text-2xl ml-2">{cat.icon || '🏪'}</span>
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Content */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  למה לבחור ב{displayTitle} ב{city}?
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed mb-3">
                    משלנו היא הפלטפורמה המובילה לגילוי עסקים מקומיים בקהילה החרדית. 
                    אנחנו מחברים בין אלפי משפחות לבין העסקים, המסעדות והחנויות הטובות ביותר באזור.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    בין אם אתם מחפשים מסעדה כשרה למהדרין, חנות ביגוד איכותית, או כל שירות אחר - 
                    משלנו כאן כדי לעזור לכם למצוא בדיוק מה שאתם צריכים, בקלות ובמהירות.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results Found */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    נמצאו {businesses.length} עסקים
                  </h2>
                  <p className="text-slate-600 mt-1">
                    מציג {displayTitle} ב{city}
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = createPageUrl("Add")}
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף עסק חדש
                </Button>
              </div>
            </div>

            {/* Business Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <ListingPreviewCard key={business.id} businessPage={business} />
              ))}
            </div>

            {/* Related Subcategories */}
            {relatedCategories.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                    קטגוריות נוספות ב{city}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams({
                            city: city,
                            category: category,
                            subcategory: cat.slug || cat.id
                          });
                          window.location.href = createPageUrl(`DynamicCategoryPage?${params.toString()}`);
                        }}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <span className="ml-1">{cat.icon || '📍'}</span>
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Footer Content */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed">
                  מחפשים <strong>{displayTitle}</strong> ב<strong>{city}</strong>? 
                  משלנו מחבר אותך עם העסקים והשירותים הטובים ביותר בקהילה החרדית. 
                  מצא עוד עסקים איכותיים ב{city} היום בפלטפורמה שלנו.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
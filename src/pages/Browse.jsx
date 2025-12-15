import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import ListingGrid from "@/components/explore/ListingGrid";
import CategoryGallery from "@/components/explore/CategoryGallery";
import SubcategoryChips from "@/components/explore/SubcategoryChips";
import ProfessionalsGrouping from "@/components/explore/ProfessionalsGrouping";
import MobileTopBar from "@/components/explore/MobileTopBar";
import StickyChips from "@/components/explore/StickyChips";
import { dataCache } from "@/components/PerformanceOptimizations";
import { buildProfessionalsGroups } from "@/components/explore/ProfessionalsGrouping";

// New imports
import TopTabs from "@/components/explore/TopTabs";
import LocationSelector from "@/components/explore/LocationSelector";
import BannerDuo from "@/components/banners/BannerDuo";
import FoodSubcategoryGallery from "@/components/explore/FoodSubcategoryGallery";
import ShoppingSubcategoryGallery from "@/components/explore/ShoppingSubcategoryGallery";

export default function BrowsePage() {
  const [activeListings, setActiveListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [professionalsGroups, setProfessionalsGroups] = useState([]);
  const [selectedProfGroup, setSelectedProfGroup] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // New state variables
  const [activeTab, setActiveTab] = useState("food");
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const raw = localStorage.getItem("meshlanoo_browse_location");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // איפוס בחירות כשעוברים בין טאבים
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedProfGroup(null);
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect for userLocation persistence
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem("meshlanoo_browse_location", JSON.stringify(userLocation));
    }
  }, [userLocation]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = "browse_data_v2";
      let cached = dataCache.get(cacheKey);

      if (cached) {
        setCategories(cached.categories);
        setActiveListings(cached.listings);
        setProfessionalsGroups(cached.profGroups);
        
        console.log('📦 [Browse] Loaded from cache');
        console.log('📊 Total listings:', cached.listings.length);
      } else {
        const [cats, pages] = await Promise.all([
          base44.entities.Category.list("sort_order"),
          base44.entities.BusinessPage.filter({ 
            is_active: true, 
            approval_status: 'approved',
            is_frozen: false
          }, "-created_date", 200)
        ]);
        
        console.log('🔍 [Browse] Loaded fresh data');
        console.log('📊 Total active pages (not frozen):', pages.length);
        console.log('📋 Pages breakdown:', pages.map(p => ({
          id: p.id,
          name: p.business_name,
          is_frozen: p.is_frozen || false,
          is_active: p.is_active,
          approval_status: p.approval_status
        })));
        
        const profGroups = buildProfessionalsGroups(cats);

        setCategories(cats);
        setActiveListings(pages);
        setProfessionalsGroups(profGroups);
        dataCache.set(cacheKey, { categories: cats, listings: pages, profGroups }, 600);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.filter(c => c.parent_id === selectedCategory.id);
  }, [selectedCategory, categories]);

  const foodRegex = useMemo(() => /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|שווארמה|קפה|קונדיטור|מאפים)/i, []);
  const shopRegex = useMemo(() => /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר)/i, []);

  const idToName = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, c.name || ""));
    return map;
  }, [categories]);

  const isFoodCatId = useCallback((id) => {
    if (!id) return false;
    const name = idToName.get(id) || "";
    return foodRegex.test(name);
  }, [idToName, foodRegex]);

  const isShopCatId = useCallback((id) => {
    if (!id) return false;
    const name = idToName.get(id) || "";
    return shopRegex.test(name);
  }, [idToName, shopRegex]);

  const categoryFilterPredicate = useCallback((cat) => {
    if (!cat || cat.parent_id) return false;
    if (activeTab === "food") return foodRegex.test(cat.name || "");
    if (activeTab === "shopping") return shopRegex.test(cat.name || "");
    return true;
  }, [activeTab, foodRegex, shopRegex]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedProfGroup(null);
  };
  
  const handleSubcategorySelect = (subcategory) => {
    if (!subcategory) {
      setSelectedSubcategory(null);
      setSelectedProfGroup(null);
      return;
    }
    const obj = (typeof subcategory === "string" || typeof subcategory === "number")
      ? categories.find(c => c.id === subcategory)
      : subcategory;
    setSelectedSubcategory(obj || null);
    setSelectedProfGroup(null);
  };

  const handleProfGroupSelect = (group) => {
    setSelectedProfGroup(group);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const filteredListings = useMemo(() => {
    let base = activeListings;

    if (activeTab === "food") {
      base = base.filter(l => 
        isFoodCatId(l.category_id) || 
        (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(id => isFoodCatId(id))) ||
        isFoodCatId(l.subcategory_id)
      );
    } else if (activeTab === "shopping") {
      base = base.filter(l => 
        isShopCatId(l.category_id) || 
        (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(id => isShopCatId(id))) ||
        isShopCatId(l.subcategory_id)
      );
    }

    if (selectedProfGroup) {
      const subCatIdsInGroup = selectedProfGroup.items.map(item => item.id);
      base = base.filter(l => {
        if (Array.isArray(l.subcategory_ids)) {
          return l.subcategory_ids.some(id => subCatIdsInGroup.includes(id));
        }
        return subCatIdsInGroup.includes(l.subcategory_id);
      });
    } else if (selectedSubcategory) {
      base = base.filter(l => {
        if (Array.isArray(l.subcategory_ids)) {
          return l.subcategory_ids.includes(selectedSubcategory.id);
        }
        return l.subcategory_id === selectedSubcategory.id;
      });
    } else if (selectedCategory) {
      const allSubcategoryIds = categories
        .filter(c => c.parent_id === selectedCategory.id)
        .map(c => c.id);
      base = base.filter(l => {
        if (l.category_id === selectedCategory.id) return true;
        
        if (Array.isArray(l.subcategory_ids)) {
          return l.subcategory_ids.some(id => allSubcategoryIds.includes(id));
        }
        return allSubcategoryIds.includes(l.subcategory_id);
      });
    }

    return base;
  }, [activeListings, activeTab, selectedCategory, selectedSubcategory, selectedProfGroup, categories, isFoodCatId, isShopCatId]);

  return (
    <div dir="rtl" className="min-h-screen relative">
      {/* רקע כחלחל-לבן בהיר מואר עם אנימציות */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* גרדיאנט כחלחל-לבן חלק */}
        <div className="absolute inset-0 animate-gradient-smooth"></div>
        
        {/* עיגולים מרחפים כחלחלים */}
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        <div className="bubble bubble-5"></div>
        <div className="bubble bubble-6"></div>
        <div className="bubble bubble-7"></div>
        <div className="bubble bubble-8"></div>
      </div>

      <style>{`
        .animate-gradient-smooth {
          background: linear-gradient(
            -45deg, 
            #FFFFFF,  /* לבן טהור */
            #F0F9FF,  /* שמיים בהיר מאוד */
            #E0F2FE,  /* כחול שמיים */
            #BAE6FD,  /* כחלחל עדין */
            #FFFFFF,  /* לבן טהור */
            #F8FAFC,  /* לבן-אפור עדין */
            #E0F2FE,  /* כחול שמיים */
            #F0F9FF   /* שמיים בהיר מאוד */
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        @keyframes gradient-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            rgba(186, 230, 253, 0.25), 
            rgba(240, 249, 255, 0.1)
          );
          box-shadow: 0 8px 32px rgba(186, 230, 253, 0.1);
          backdrop-filter: blur(3px);
          animation: float-up linear infinite;
        }

        .bubble-1 {
          width: 80px;
          height: 80px;
          left: 10%;
          animation-duration: 12s;
          animation-delay: 0s;
        }

        .bubble-2 {
          width: 60px;
          height: 60px;
          left: 25%;
          animation-duration: 15s;
          animation-delay: 2s;
        }

        .bubble-3 {
          width: 100px;
          height: 100px;
          left: 45%;
          animation-duration: 18s;
          animation-delay: 4s;
        }

        .bubble-4 {
          width: 70px;
          height: 70px;
          left: 65%;
          animation-duration: 13s;
          animation-delay: 1s;
        }

        .bubble-5 {
          width: 90px;
          height: 90px;
          left: 80%;
          animation-duration: 16s;
          animation-delay: 3s;
        }

        .bubble-6 {
          width: 50px;
          height: 50px;
          left: 15%;
          animation-duration: 14s;
          animation-delay: 5s;
        }

        .bubble-7 {
          width: 110px;
          height: 110px;
          left: 55%;
          animation-duration: 20s;
          animation-delay: 6s;
        }

        .bubble-8 {
          width: 65px;
          height: 65px;
          left: 90%;
          animation-duration: 17s;
          animation-delay: 2.5s;
        }
      `}</style>

      <MobileTopBar 
          onCategoryClick={handleCategorySelect} 
          categories={categories.filter(c => !c.parent_id)} 
          selectedCategoryName={selectedCategory?.name || selectedProfGroup?.label}
          onBackToCategories={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedProfGroup(null); }}
          onClearAll={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedProfGroup(null); }}
          allowSearch={!!selectedSubcategory || !!selectedProfGroup}
      />
      
      <nav className="bg-white/80 border-b sticky top-[64px] z-30" aria-label="ניווט עליון - לשוניות וסינון">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <TopTabs active={activeTab} onChange={setActiveTab} />
          <LocationSelector
            value={userLocation}
            onChange={(loc) => setUserLocation(loc)}
          />
        </div>
      </nav>

      <StickyChips>
         <SubcategoryChips 
              categories={categories}
              parentId={selectedCategory?.id}
              selectedSubId={selectedSubcategory?.id}
              onSelect={handleSubcategorySelect}
              showAllTile={true}
          />
      </StickyChips>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="main-content" role="main" aria-label="תוכן ראשי - רשימת עסקים">
        <div className="space-y-8">
          {activeTab === "food" ? (
            <section aria-labelledby="food-subcategories-heading">
              <h2 id="food-subcategories-heading" className="sr-only">קטגוריות אוכל</h2>
              <FoodSubcategoryGallery
                categories={categories}
                onSelect={(id) => handleSubcategorySelect(id)}
                selectedId={selectedSubcategory?.id}
                loading={loading}
              />
            </section>
          ) : (
            <section aria-labelledby="shopping-subcategories-heading">
              <h2 id="shopping-subcategories-heading" className="sr-only">קטגוריות קניות</h2>
              <ShoppingSubcategoryGallery
                categories={categories}
                onSelect={(id) => handleSubcategorySelect(id)}
                selectedId={selectedSubcategory?.id}
                loading={loading}
              />
            </section>
          )}

          <section aria-label="באנרים פרסומיים">
            <BannerDuo />
          </section>

          {!selectedCategory && !selectedSubcategory && !selectedProfGroup && (
            <section aria-labelledby="professionals-heading">
              <h2 id="professionals-heading" className="sr-only">קבוצות מקצועיות</h2>
              <ProfessionalsGrouping 
                groups={professionalsGroups}
                onSelect={handleProfGroupSelect}
                loading={loading}
              />
            </section>
          )}

          {(selectedCategory || selectedProfGroup || activeTab) && (
            <section aria-labelledby="listings-heading">
              <h2 id="listings-heading" className="sr-only">
                {selectedSubcategory 
                  ? `עסקים בקטגוריית ${selectedSubcategory.name}` 
                  : selectedCategory 
                    ? `עסקים בקטגוריית ${selectedCategory.name}`
                    : selectedProfGroup
                      ? `עסקים ב${selectedProfGroup.label}`
                      : activeTab === "food" 
                        ? "עסקי אוכל"
                        : "עסקי קניות"
                }
              </h2>
              <ListingGrid 
                listings={filteredListings} 
                loading={loading} 
                categories={categories}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
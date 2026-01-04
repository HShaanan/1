import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { dataCache, useDebounce } from "@/components/PerformanceOptimizations";
import { buildProfessionalsGroups } from "@/components/explore/ProfessionalsGrouping";
import SeoMeta from "@/components/SeoMeta";
import { useFuse } from "@/components/hooks/useFuse";
import { WebsiteSchema, LocalBusinessListSchema } from "@/components/seo/SchemaOrg";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { isOpenNow } from "@/components/utils/businessTime";

// Lazy load heavy components
const ListingGrid = lazy(() => import("@/components/explore/ListingGrid"));
const ProfessionalsGrouping = lazy(() => import("@/components/explore/ProfessionalsGrouping"));
const MobileTopBar = lazy(() => import("@/components/explore/MobileTopBar"));
const TopTabs = lazy(() => import("@/components/explore/TopTabs"));
const LocationSelector = lazy(() => import("@/components/explore/LocationSelector"));
const BannerDuo = lazy(() => import("@/components/banners/BannerDuo"));
const FoodSubcategoryGallery = lazy(() => import("@/components/explore/FoodSubcategoryGallery"));
const ShoppingSubcategoryGallery = lazy(() => import("@/components/explore/ShoppingSubcategoryGallery"));
const FilterBar = lazy(() => import("@/components/explore/FilterBar"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
  </div>
);

export default function BrowsePage({ preSelectedState }) {
  const [activeListings, setActiveListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [professionalsGroups, setProfessionalsGroups] = useState([]);
  const [selectedProfGroup, setSelectedProfGroup] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasAppliedPreselection, setHasAppliedPreselection] = useState(false);

  // New state variables
  const [activeTab, setActiveTab] = useState("food");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300); // Debounce search for better performance
  const [kashrutList, setKashrutList] = useState([]);
  const [kashrutData, setKashrutData] = useState([]);
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const raw = localStorage.getItem("meshlanoo_browse_location");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Handle URL params
  useEffect(() => {
    if (categories.length === 0 || activeListings.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const subcategoryParam = params.get("subcategory");
    const kashrutParam = params.get("kashrut");
    const cityParam = params.get("city");

    if (q) {
      setSearchQuery(q);
    }

    if (subcategoryParam) {
      // Find subcategory by name (case-insensitive and trim)
      const subcat = categories.find(c => 
        c.name && c.name.trim().toLowerCase() === subcategoryParam.trim().toLowerCase()
      );
      if (subcat) {
        setSelectedSubcategory(subcat);
        
        // Auto-switch to correct tab based on subcategory
        const parentCat = categories.find(cat => cat.id === subcat.parent_id);
        if (parentCat) {
          const foodPattern = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|שווארמה|קפה|קונדיטור|מאפים)/i;
          const shopPattern = /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר)/i;
          
          const isFoodCategory = foodPattern.test(parentCat.name || "");
          const isShopCategory = shopPattern.test(parentCat.name || "");
          
          if (isFoodCategory) setActiveTab("food");
          else if (isShopCategory) setActiveTab("shopping");
        }
        
        console.log('Selected subcategory from URL:', subcat);
      } else {
        console.warn('Subcategory not found:', subcategoryParam);
      }
    }

    if (kashrutParam) {
      setFilters(prev => ({
        ...prev,
        kashrut: [kashrutParam]
      }));
      console.log('Applied kashrut filter:', kashrutParam);
    }

    if (cityParam) {
      setUserLocation({ city: cityParam });
      console.log('Applied city filter:', cityParam);
    }
  }, [categories, activeListings]);

  // Advanced Filters State
  const [filters, setFilters] = useState({
    kashrut: [],
    price: [],
    delivery: false,
    pickup: false,
    openNow: false,
  });

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        kashrut: [],
        price: [],
        delivery: false,
        pickup: false,
        openNow: false,
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  // Handle Pre-Selection from Props (e.g., when embedded in StorePage)
  useEffect(() => {
    if (!loading && categories.length > 0 && preSelectedState && !hasAppliedPreselection) {
        // 1. Set Tab
        if (preSelectedState.activeTab && preSelectedState.activeTab !== 'all') {
            setActiveTab(preSelectedState.activeTab);
        }

        // 2. Set Category
        if (preSelectedState.categoryId && preSelectedState.categoryId !== 'all') {
            const cat = categories.find(c => c.id === preSelectedState.categoryId);
            if (cat) setSelectedCategory(cat);
        }

        // 3. Set Subcategory (single)
        if (preSelectedState.subcategoryId) {
             const sub = categories.find(c => c.id === preSelectedState.subcategoryId);
             if (sub) setSelectedSubcategory(sub);
        }
        
        // 4. Set Subcategories (multiple from store pages)
        if (preSelectedState.subcategoryIds && preSelectedState.subcategoryIds.length > 0) {
             setSelectedSubcategories(preSelectedState.subcategoryIds);
        }

        // 5. Set Filters
        setFilters(prev => ({
            ...prev,
            kashrut: preSelectedState.kashrut || [],
            delivery: preSelectedState.delivery || false,
            pickup: preSelectedState.pickup || false,
            openNow: preSelectedState.openNow || false,
            // Add other filters as needed
        }));

        setHasAppliedPreselection(true);
    }
  }, [loading, categories, preSelectedState, hasAppliedPreselection]);

  // איפוס בחירות כשעוברים בין טאבים - Only if NOT triggered by preselection initially
  useEffect(() => {
    if (hasAppliedPreselection) return; // Don't wipe state if we just applied it
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

  const stickyChipsItems = useMemo(() => {
    if (selectedCategory) {
       // Deep hierarchy mode
       return categories.filter(c => c.parent_id === selectedCategory.id && (c.is_active ?? true));
    }
    
    // Flat / Tab mode - Show subcategories (children) of the matching top-level categories
    let rootRegex = null;
    if (activeTab === 'food') {
       rootRegex = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|שווארמה|קפה|קונדיטור|מאפים)/i;
    } else if (activeTab === 'shopping') {
       rootRegex = /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר)/i;
    }

    if (rootRegex) {
        const rootIds = categories
            .filter(c => !c.parent_id && rootRegex.test(c.name || ""))
            .map(c => c.id);
        return categories.filter(c => rootIds.includes(c.parent_id) && (c.is_active ?? true));
    }
    return [];
  }, [selectedCategory, activeTab, categories]);

  // Fuzzy Search Integration with debounced query
  const fuseKeys = useMemo(() => [
    'business_name', 
    'description', 
    'special_fields.tags', 
    'category_name', 
    'subcategory_names'
  ], []);
  
  const searchResults = useFuse(activeListings, debouncedSearch, fuseKeys);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = "browse_data_v3";
      let cached = dataCache.get(cacheKey);

      if (cached) {
        setCategories(cached.categories);
        setActiveListings(cached.listings);
        setProfessionalsGroups(cached.profGroups);
        setKashrutList(cached.kashrut || []);
        setKashrutData(cached.kashrut || []);
        
        console.log('📦 [Browse] Loaded from cache');
        console.log('📊 Total listings:', cached.listings.length);
      } else {
        const [cats, pages, kashrut] = await Promise.all([
          base44.entities.Category.list("sort_order"),
          base44.entities.BusinessPage.filter({ 
            is_active: true, 
            approval_status: 'approved',
            is_frozen: false
          }, "-created_date", 200),
          base44.entities.Kashrut.filter({ is_active: true })
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
        setKashrutList(kashrut || []);
        setKashrutData(kashrut || []);
        dataCache.set(cacheKey, { categories: cats, listings: pages, profGroups, kashrut }, 600);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication before loading data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          await base44.auth.redirectToLogin(window.location.href);
          return;
        }
        setAuthLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        await base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [loadData, authLoading]);

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
    const cat = categories.find(c => c.id === id);
    if (!cat) return false;
    
    // אם זו קטגוריה ראשית - בדוק את שמה
    if (!cat.parent_id) {
      return foodRegex.test(cat.name || "");
    }
    
    // אם זו תת-קטגוריה - בדוק את שם ה-PARENT שלה
    const parentName = idToName.get(cat.parent_id) || "";
    return foodRegex.test(parentName);
  }, [categories, idToName, foodRegex]);

  const isShopCatId = useCallback((id) => {
    if (!id) return false;
    const cat = categories.find(c => c.id === id);
    if (!cat) return false;
    
    // אם זו קטגוריה ראשית - בדוק את שמה
    if (!cat.parent_id) {
      return shopRegex.test(cat.name || "");
    }
    
    // אם זו תת-קטגוריה - בדוק את שם ה-PARENT שלה
    const parentName = idToName.get(cat.parent_id) || "";
    return shopRegex.test(parentName);
  }, [categories, idToName, shopRegex]);

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

  // Auto-switch tab if empty and other tab has results (only on initial load or search)
  useEffect(() => {
    if (loading || activeListings.length === 0) return;

    // Helper to check counts
    const countFood = activeListings.filter(l => 
      isFoodCatId(l.category_id) || (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(isFoodCatId))
    ).length;
    const countShop = activeListings.filter(l => 
      isShopCatId(l.category_id) || (Array.isArray(l.subcategory_ids) && l.subcategory_ids.some(isShopCatId))
    ).length;

    if (activeTab === "food" && countFood === 0 && countShop > 0) {
      setActiveTab("shopping");
    } else if (activeTab === "shopping" && countShop === 0 && countFood > 0) {
      setActiveTab("food");
    }
  }, [loading, activeListings, isFoodCatId, isShopCatId]); // Run once when data loads

  const filteredListings = useMemo(() => {
    // Start with fuse results instead of raw list if searching (using debounced search)
    let base = debouncedSearch ? searchResults : activeListings;

    // Category Tabs (Only if NOT searching, or force tab even when searching? 
    // Usually better to search globally if query exists, but UI has tabs. 
    // Let's relax tabs if searching, OR keep tabs but show badge counts. 
    // For now, respect tabs to keep UI consistent, but maybe auto-switch tab logic above handles it.)
    
    // Note: If we want search to be global, we should ignore activeTab when searchQuery is present.
    // However, the UI structure is rigid. Let's stick to tab filtering but rely on the useEffect above to switch tabs if needed.
    // Actually, if I search "shoes" and I'm on Food, I want to see results. 
    // Let's DISABLE tab filtering if there is a search query, OR show "Results in Shopping" if current tab is empty.
    // Simplest approach: Search overrides tabs? No, tabs are top level.
    // Compromise: We keep filtering by tab. The user can switch tabs. The useEffect above helps initial state.
    
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
    } else if (selectedSubcategories.length > 0) {
      // Filter by multiple subcategories (from store pages)
      base = base.filter(l => {
        const listingSubcats = Array.isArray(l.subcategory_ids) 
          ? l.subcategory_ids 
          : (l.subcategory_id ? [l.subcategory_id] : []);
        return selectedSubcategories.some(subId => listingSubcats.includes(subId));
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

    // Apply Advanced Filters
    if (filters.kashrut.length > 0) {
      // Filter primarily by name (dynamic), fallback to type if needed for backward compatibility
      base = base.filter(l => 
        filters.kashrut.includes(l.kashrut_authority_name) || 
        filters.kashrut.includes(l.kashrut_authority_type)
      );
    }

    if (filters.price.length > 0) {
      base = base.filter(l => filters.price.includes(l.price_range));
    }

    if (filters.delivery) {
      base = base.filter(l => l.has_delivery);
    }

    if (filters.pickup) {
      base = base.filter(l => l.has_pickup);
    }

    if (filters.openNow) {
      base = base.filter(l => isOpenNow(l.hours));
    }

    // Filter by city/location
    if (userLocation?.city) {
      base = base.filter(l => 
        l.city && l.city.trim().toLowerCase() === userLocation.city.trim().toLowerCase()
      );
    }

    return base;
  }, [activeListings, searchResults, activeTab, selectedCategory, selectedSubcategory, selectedSubcategories, selectedProfGroup, categories, isFoodCatId, isShopCatId, filters, debouncedSearch, userLocation]);

  // Dynamic SEO based on selected filters
  const seoTitle = selectedSubcategory 
    ? selectedSubcategory.name 
    : selectedCategory 
      ? selectedCategory.name 
      : activeTab === "food" 
        ? "אוכל ומסעדות" 
        : "קניות ושירותים";
  
  const seoCity = userLocation?.city || "ביתר עילית";

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 animate-gradient-smooth"></div>
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
        </div>
        <style>{`
          .animate-gradient-smooth { background: linear-gradient(-45deg, #FFFFFF, #F0F9FF, #E0F2FE, #BAE6FD); background-size: 400% 400%; animation: gradient-flow 20s ease infinite; }
          @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(186, 230, 253, 0.25), rgba(240, 249, 255, 0.1)); backdrop-filter: blur(3px); }
          .bubble-1 { width: 80px; height: 80px; left: 10%; animation: float-up 12s linear infinite; }
          .bubble-2 { width: 60px; height: 60px; left: 25%; animation: float-up 15s linear infinite 2s; }
          @keyframes float-up { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }
        `}</style>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen relative">
      {/* Google Analytics / Google Ads Tracking */}
      <Helmet>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-M5SP53RELQ"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-M5SP53RELQ');
          `}
        </script>
      </Helmet>

      {/* Dynamic SEO Meta Tags */}
      <SeoMeta
        category={seoTitle}
        city={seoCity}
        description={`מצא ${seoTitle} ב${seoCity} | משלנו - פלטפורמת העסקים והשירותים המקומיים`}
      />
      <WebsiteSchema 
        name={`משלנו - ${seoTitle}`}
        description={`מצא ${seoTitle} ב${seoCity} | משלנו - פלטפורמת העסקים והשירותים המקומיים`}
      />
      <LocalBusinessListSchema businesses={filteredListings} />

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

      <Suspense fallback={<LoadingFallback />}>
        <MobileTopBar 
            onCategoryClick={handleCategorySelect} 
            categories={categories.filter(c => !c.parent_id)} 
            selectedCategoryName={selectedCategory?.name || selectedProfGroup?.label}
            onBackToCategories={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedProfGroup(null); }}
            onClearAll={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedProfGroup(null); setSearchQuery(""); }}
            allowSearch={true}
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
        />
      </Suspense>
      
      <Suspense fallback={<LoadingFallback />}>
        <nav className="bg-white/90 backdrop-blur-sm border-b shadow-sm" aria-label="ניווט עליון - לשוניות וסינון">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <TopTabs active={activeTab} onChange={setActiveTab} />
            
            <div className="hidden lg:block relative flex-1 max-w-2xl mx-8">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש עסקים, שירותים או תגיות..."
                className="pr-12 bg-white border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all rounded-2xl h-12 placeholder:text-slate-500 text-slate-900 font-medium text-base shadow-sm"
              />
            </div>

            <LocationSelector
              value={userLocation}
              onChange={(loc) => setUserLocation(loc)}
            />
          </div>
        </nav>

        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          kashrutList={kashrutList} 
        />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
        <div className="space-y-8">
          {/* Active Filters Display */}
          {(selectedSubcategories.length > 0 || selectedSubcategory || userLocation?.city || filters.kashrut.length > 0) && (
            <div className="mb-8 flex flex-wrap gap-3">
              {/* Subcategory from URL */}
              {selectedSubcategory && (
                <button 
                  onClick={() => setSelectedSubcategory(null)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {selectedSubcategory.icon} {selectedSubcategory.name}
                  <span className="text-blue-500">✕</span>
                </button>
              )}

              {/* City Filter */}
              {userLocation?.city && (
                <button 
                  onClick={() => setUserLocation(null)}
                  className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  📍 {userLocation.city}
                  <span className="text-green-500">✕</span>
                </button>
              )}

              {/* Kashrut Filters */}
              {filters.kashrut.map(k => (
                <button 
                  key={k}
                  onClick={() => setFilters(prev => ({ ...prev, kashrut: prev.kashrut.filter(item => item !== k) }))}
                  className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  ✨ {k}
                  <span className="text-purple-500">✕</span>
                </button>
              ))}

              {/* Pre-selected Subcategories (from store pages) */}
              {selectedSubcategories.map(subId => {
                const subcat = categories.find(c => c.id === subId);
                if (!subcat) return null;
                return (
                  <button 
                    key={subId} 
                    onClick={() => setSelectedSubcategories(prev => prev.filter(id => id !== subId))}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {subcat.icon} {subcat.name} 
                    <span className="text-indigo-500">✕</span>
                  </button>
                );
              })}
            </div>
          )}
          
          <Suspense fallback={<LoadingFallback />}>
            {!selectedCategory && !selectedSubcategory && !selectedProfGroup && selectedSubcategories.length === 0 && (
              <>
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
              </>
            )}
          </Suspense>

          <Suspense fallback={<LoadingFallback />}>
            <section aria-label="באנרים פרסומיים">
              <BannerDuo />
            </section>
          </Suspense>

          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>

          <Suspense fallback={<LoadingFallback />}>
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
                  kashrutData={kashrutData}
                />
              </section>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
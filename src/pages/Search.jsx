import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, ExternalLink, Navigation, Star, Search, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import InteractiveMap from "../components/InteractiveMap";
import AdvancedSearchBar from "../components/search/AdvancedSearchBar";
import { useDebounce, dataCache, LazyImage } from "@/components/PerformanceOptimizations";

export default function SearchPage() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState("best");
  const [selectedRadius, setSelectedRadius] = useState("10");
  const [priceRange, setPriceRange] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [autoRadiusApplied, setAutoRadiusApplied] = useState(false);
  const DEFAULT_CITY_RADIUS_KM = 10;
  const mapRef = useRef(null);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);


  useEffect(() => {
    // קלט פרמטרים מה-URL כדי לתמוך בחיפוש מהעמוד נחיתה
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const sub = params.get("subcategory");

    if (q) setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
    if (sub) setSelectedSubcategory(sub);
  }, []);

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  // לאחר שקיבלנו מיקום – קבע אוטומטית רדיוס עירוני אם עוד לא נקבע אוטומטית
  useEffect(() => {
    if (userLocation && !autoRadiusApplied) {
      setSelectedRadius(String(DEFAULT_CITY_RADIUS_KM));
      setAutoRadiusApplied(true);
    }
  }, [userLocation, autoRadiusApplied]);

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return Infinity;
    const valid = (p) => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng);
    if (!valid(pos1) || !valid(pos2)) return Infinity;

    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(pos2.lat - pos1.lat);
    const dLng = toRad(pos2.lng - pos1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Memoize filtered and sorted results
  const searchResults = useMemo(() => {
    if (!listings || listings.length === 0) return [];

    let results = listings.map(listing => {
      if (userLocation && listing.lat != null && listing.lng != null && !isNaN(listing.lat) && !isNaN(listing.lng)) {
        return {
          ...listing,
          distance: calculateDistance(userLocation, { lat: listing.lat, lng: listing.lng })
        };
      }
      return { ...listing, distance: Infinity };
    });

    // Filter by search query (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(listing =>
        listing.business_name?.toLowerCase().includes(query) ||
        listing.display_title?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query) ||
        listing.address?.toLowerCase().includes(query)
      );
    }

    // Filter by category/subcategory
    if (selectedSubcategory) {
      results = results.filter(listing =>
        listing.subcategory_id === selectedSubcategory ||
        (Array.isArray(listing.subcategory_ids) && listing.subcategory_ids.includes(selectedSubcategory))
      );
    } else if (selectedCategory) {
      results = results.filter(listing => listing.category_id === selectedCategory);
    }

    // Filter by price range
    if (priceRange !== "all") {
      switch (priceRange) {
        case "free":
          results = results.filter(listing => !listing.price || listing.price === 0);
          break;
        case "low":
          results = results.filter(listing => (listing.price || 0) > 0 && (listing.price || 0) <= 100);
          break;
        case "medium":
          results = results.filter(listing => (listing.price || 0) > 100 && (listing.price || 0) <= 500);
          break;
        case "high":
          results = results.filter(listing => (listing.price || 0) > 500);
          break;
      }
    }

    // Filter by radius
    if (userLocation && selectedRadius !== "all") {
      const radiusInKm = parseInt(selectedRadius, 10);
      results = results.filter(listing => listing.distance !== Infinity && listing.distance <= radiusInKm);
    }

    // Sort results
    if (sortBy === "newest") {
      results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "price_low") {
      results.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_high") {
      results.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      // Best: promoted first, then by distance
      results.sort((a, b) => {
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;

        if (userLocation) {
          if (a.distance !== Infinity && b.distance !== Infinity) {
            return a.distance - b.distance;
          }
          if (a.distance !== Infinity) return -1;
          if (b.distance !== Infinity) return 1;
        }
        
        return new Date(b.created_date) - new Date(a.created_date);
      });
    }

    return results;
  }, [listings, debouncedSearchQuery, selectedCategory, selectedSubcategory, sortBy, priceRange, userLocation, selectedRadius, calculateDistance]);

  const loadData = async () => {
    try {
      setLocationError("");

      // Check cache first
      const cachedListings = dataCache.get('active_business_pages');
      const cachedCategories = dataCache.get('categories_list');

      if (cachedListings && cachedCategories) {
        setListings(cachedListings);
        setCategories(cachedCategories);
        setIsLoading(false);
        // Continue to fetch fresh data in background
      }

      const [listingsData, categoriesData] = await Promise.all([
        base44.entities.BusinessPage.filter({ 
          is_active: true, 
          approval_status: "approved",
          is_frozen: false 
        }),
        base44.entities.Category.list()
      ]);

      // Cache the results
      dataCache.set('active_business_pages', listingsData || []);
      dataCache.set('categories_list', categoriesData || []);

      setListings(listingsData || []);
      setCategories(categoriesData || []);
      
    } catch (err) {
      console.error("Error loading data:", err);
      setLocationError("שגיאה בטעינת הנתונים");
      
      // Fallback to emergency cache
      const emergency = dataCache.getEmergency('active_business_pages');
      if (emergency) {
        setListings(emergency);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = useCallback(() => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("שירותי מיקום אינם נתמכים");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError("");
      },
      (error) => {
        setLocationError("לא ניתן לקבל מיקום");
        setUserLocation(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      }
    );
  }, []);

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '972' + cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  const openNavigation = (address) => {
    if (!address) return;

    const encodedAddress = encodeURIComponent(`${address}, ביתר עילית`);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;
      window.open(wazeUrl, '_blank');
    } else {
      const googleMapsUrl = `https://maps.google.com/maps?q=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSortBy("best");
    setPriceRange("all");
    setSelectedRadius("10");
    setAutoRadiusApplied(false);
  }, []);

  // Memoize filtered map markers
  const mapMarkers = useMemo(() => 
    searchResults.filter(l => l.lat != null && l.lng != null && !isNaN(l.lat) && !isNaN(l.lng)),
    [searchResults]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-700 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4" dir="rtl">
      {/* Search Panel & Results */}
      <div className="w-full md:w-96 lg:w-[450px] space-y-4 order-2 md:order-1">
        <AdvancedSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={setSelectedSubcategory}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          selectedRadius={selectedRadius}
          onSelectedRadiusChange={setSelectedRadius}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          userLocation={userLocation}
          onGetUserLocation={getUserLocation}
          locationError={locationError}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900">
            נמצאו {searchResults.length} תוצאות
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">לא נמצאו תוצאות</h3>
              <p className="text-sm text-gray-500">נסה להרחיב את החיפוש</p>
            </div>
          ) : (
            searchResults.map((listing) => {
              const category = categories.find(c => c.id === listing.category_id);
              const imageUrl = listing.preview_image || listing.images?.[0];
              
              return (
                <Card 
                  key={listing.id} 
                  id={`listing-${listing.id}`}
                  className="transition-all hover:shadow-lg cursor-pointer border-2 hover:border-blue-300"
                  onClick={() => {
                    if (listing.lat && listing.lng && mapRef.current) {
                      mapRef.current.panTo({ lat: listing.lat, lng: listing.lng });
                      mapRef.current.setZoom(16);
                    }
                  }}
                  onDoubleClick={() => {
                    window.location.href = createPageUrl(`BusinessPage?slug=${listing.url_slug || listing.id}`);
                  }}
                >
                  <CardContent className="p-3 flex gap-3">
                    <div className="w-20 h-20 flex-shrink-0">
                      {imageUrl ? (
                        <LazyImage
                          src={imageUrl}
                          alt={listing.business_name}
                          className="w-full h-full rounded-lg"
                          imgClassName="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{category?.icon || '📷'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{listing.business_name}</h3>
                      {category && (
                        <p className="text-xs text-gray-500 mt-0.5">{category.name}</p>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{listing.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {listing.smart_rating > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {listing.smart_rating.toFixed(1)}
                          </Badge>
                        )}
                        {typeof listing.distance === 'number' && listing.distance !== Infinity && (
                          <Badge variant="outline" className="text-xs">
                            {listing.distance.toFixed(1)} ק"מ
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-96 md:h-[calc(100vh-120px)] order-1 md:order-2">
         <div className="sticky top-24 h-full w-full rounded-2xl overflow-hidden shadow-lg relative">
            <InteractiveMap
               listings={mapMarkers}
               userLocation={userLocation}
               mapRef={mapRef}
               onMarkerClick={(listing) => {
                 const element = document.getElementById(`listing-${listing.id}`);
                 if (element) {
                   element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   element.classList.add('ring-2', 'ring-blue-500');
                   setTimeout(() => {
                       element.classList.remove('ring-2', 'ring-blue-500');
                   }, 2000);
                 }
               }}
               className="w-full h-full border-0"
             />
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 z-[1000] pointer-events-none">
               Map data © OpenStreetMap contributors
             </div>
         </div>
      </div>
    </div>
  );
}
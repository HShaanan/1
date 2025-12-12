import React, { useState, useEffect } from "react";
import { BusinessPage } from "@/entities/BusinessPage";
import { Category } from "@/entities/Category";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { createPageUrl } from "@/utils";
import InteractiveMap from "../components/InteractiveMap";
import AdvancedSearchBar from "../components/search/AdvancedSearchBar";

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState("best");
  // עדכון ברירת מחדל לרדיוס עירוני
  const [selectedRadius, setSelectedRadius] = useState("10");
  const [priceRange, setPriceRange] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  // דגל כדי לא לבצע אוטומציה יותר מפעם אחת
  const [autoRadiusApplied, setAutoRadiusApplied] = useState(false);
  const DEFAULT_CITY_RADIUS_KM = 10;


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
    // שליפת מיקום אוטומטית כאשר נכנסים למסך
    getUserLocation();
  }, []);

  // לאחר שקיבלנו מיקום – קבע אוטומטית רדיוס עירוני אם עוד לא נקבע אוטומטית
  useEffect(() => {
    if (userLocation && !autoRadiusApplied) {
      setSelectedRadius(String(DEFAULT_CITY_RADIUS_KM));
      setAutoRadiusApplied(true);
    }
  }, [userLocation, autoRadiusApplied]);

  const filterAndSortResults = React.useCallback(() => {
    if (!listings) return;

    let results = [...listings];

    if (userLocation) {
      results = results.map(listing => {
        if (listing.lat != null && listing.lng != null && !isNaN(listing.lat) && !isNaN(listing.lng)) {
          return {
            ...listing,
            distance: calculateDistance(userLocation, { lat: listing.lat, lng: listing.lng })
          };
        }
        return { ...listing, distance: Infinity };
      });
    } else {
      results = results.map(listing => ({ ...listing, distance: Infinity }));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(listing =>
        listing.title?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query) ||
        listing.address?.toLowerCase().includes(query) ||
        listing.display_title?.toLowerCase().includes(query) || // New: search by display_title
        listing.business_name?.toLowerCase().includes(query) // New: search by business_name
      );
    }

    if (selectedSubcategory) {
      results = results.filter(listing =>
        listing.subcategory_id === selectedSubcategory ||
        (Array.isArray(listing.subcategory_ids) && listing.subcategory_ids.includes(selectedSubcategory))
      );
    } else if (selectedCategory) {
      results = results.filter(listing => listing.category_id === selectedCategory);
    }

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

    if (userLocation && selectedRadius !== "all") {
        const radiusInKm = parseInt(selectedRadius, 10);
        results = results.filter(listing => {
            return listing.distance !== Infinity && listing.distance <= radiusInKm;
        });
    }

    if (sortBy === "newest") {
      results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "price_low") {
      results.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_high") {
      results.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      results.sort((a, b) => {
        if (a.is_paid && !b.is_paid) return -1;
        if (!a.is_paid && b.is_paid) return 1;

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

    setSearchResults(results);
  }, [searchQuery, selectedCategory, selectedSubcategory, sortBy, priceRange, listings, userLocation, selectedRadius]);

  useEffect(() => {
    filterAndSortResults();
  }, [filterAndSortResults]);

  const loadData = async () => {
    try {
      setLocationError("");
      const [listingsData, categoriesData] = await Promise.all([
        BusinessPage.filter({ is_active: true, approval_status: "approved" }),
        Category.list("sort_order")
      ]);

      setListings(listingsData || []);
      setCategories(categoriesData || []);

      setSearchResults(listingsData || []); 
      
    } catch (err) {
      console.error("Error loading data:", err);
      setLocationError("שגיאה בטעינת הנתונים: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("שירותי מיקום אינם נתמכים בדפדפן זה.");
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
        let errorMessage = "לא ניתן היה לקבל את מיקומך. אנא אשר הרשאות מיקום.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "נדרשת הרשאת מיקום. אנא אפשר גישה למיקום בהגדרות הדפדפן.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "מידע מיקום אינו זמין.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "פסק זמן בקבלת מיקום.";
        }
        setLocationError(errorMessage);
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // חישוב מרחק – עם גיבוי Haversine אם Google לא זמין
  const calculateDistance = (pos1, pos2) => {
      if (!pos1 || !pos2) return Infinity;
      const valid = (p) => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng);
      if (!valid(pos1) || !valid(pos2)) return Infinity;

      // אם יש Google Geometry – השתמש בו
      if (window.google && window.google.maps && window.google.maps.geometry) {
        const point1 = new window.google.maps.LatLng(pos1.lat, pos1.lng);
        const point2 = new window.google.maps.LatLng(pos2.lat, pos2.lng);
        return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000;
      }

      // גיבוי: Haversine בק״מ
      const toRad = (val) => (val * Math.PI) / 180;
      const R = 6371; // רדיוס כדוה״א בק״מ
      const dLat = toRad(pos2.lat - pos1.lat);
      const dLng = toRad(pos2.lng - pos1.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
  };

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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSortBy("best");
    setPriceRange("all");
    setSelectedRadius("10"); // Reset to default "10"
    setAutoRadiusApplied(false); // Allow re-application if user location changes/refreshes
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full animate-pulse"></div>
          <p className="text-white text-lg">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
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

        {/* Results List */}
        <div className="space-y-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">לא נמצאו תוצאות</h3>
              <p className="text-sm text-gray-500">נסה להרחיב את החיפוש או לשנות את המסננים</p>
            </div>
          ) : (
            searchResults.map((listing) => {
              const category = categories.find(c => c.id === listing.category_id);
              const subcategory = categories.find(c => c.id === listing.subcategory_id);
              return (
                <Card 
                  key={listing.id} 
                  id={`listing-${listing.id}`}
                  className="transition-all duration-300 hover:shadow-xl cursor-pointer"
                  onClick={() => {
                    // Updated to BusinessPage
                    window.location.href = createPageUrl(`BusinessPage?id=${listing.id}`);
                  }}
                >
                  <CardContent className="p-4 flex gap-4">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.display_title || listing.business_name} className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-3xl">{category?.icon || '📷'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{listing.display_title || listing.business_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                         <span>{category?.name}</span>
                         {subcategory && <span>&gt; {subcategory.name}</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{listing.description}</p>
                      <div className="flex items-center justify-between mt-2">
                         <div className="font-bold text-blue-600">
                            {listing.price ? `₪${listing.price.toLocaleString()}` : "מחיר לפי פניה"}
                         </div>
                         {typeof listing.distance === 'number' && listing.distance !== Infinity && (
                            <Badge variant="outline" className="text-xs">{listing.distance.toFixed(1)} ק"מ</Badge>
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
         <div className="sticky top-[96px] h-full w-full rounded-2xl overflow-hidden shadow-lg">
            <InteractiveMap
                listings={searchResults.filter(l => l.lat != null && l.lng != null && !isNaN(l.lat) && !isNaN(l.lng))}
                userLocation={userLocation}
                onMarkerClick={(listing) => {
                  const element = document.getElementById(`listing-${listing.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('animate-pulse-once', 'ring-2', 'ring-blue-500');
                    setTimeout(() => {
                        element.classList.remove('animate-pulse-once', 'ring-2', 'ring-blue-500');
                    }, 2000);
                  }
                }}
                className="w-full h-full border-0"
              />
         </div>
      </div>
    </div>
  );
}
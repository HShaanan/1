import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import BusinessCard from "@/components/explore/BusinessCard";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewBrowse() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kashrutList, setKashrutList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bizData, catData, kashData] = await Promise.all([
          base44.entities.BusinessPage.filter({
            is_active: true,
            approval_status: "approved",
          }),
          base44.entities.Category.list(),
          base44.entities.Kashrut.list(),
        ]);

        // Filter out professional listings client-side (graceful if field missing)
        const filtered = (bizData || []).filter((b) => {
          try {
            return b.listing_type !== "professional";
          } catch {
            return true;
          }
        });

        setBusinesses(filtered);
        setCategories(catData || []);
        setKashrutList(kashData || []);
      } catch (err) {
        console.error("Error fetching browse data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredBusinesses = useMemo(() => {
    let result = [...businesses];

    // Text search — filter by title and description
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((b) => {
        const title = (b.title || "").toLowerCase();
        const description = (b.description || "").toLowerCase();
        const city = (b.city || "").toLowerCase();
        return title.includes(q) || description.includes(q) || city.includes(q);
      });
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((b) => {
        const cat = (b.category || "").toLowerCase();
        const subcat = (b.subcategory || "").toLowerCase();
        const selected = selectedCategory.toLowerCase();
        return cat === selected || subcat === selected;
      });
    }

    // Sort promoted businesses first
    result.sort((a, b) => {
      const aPromoted = a.is_promoted ? 1 : 0;
      const bPromoted = b.is_promoted ? 1 : 0;
      return bPromoted - aPromoted;
    });

    return result;
  }, [businesses, searchQuery, selectedCategory]);

  // Derive unique category names for chips
  const categoryNames = useMemo(() => {
    return categories.map((c) => c.name || c.title).filter(Boolean);
  }, [categories]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            משלנו ביזנעס
          </h1>
          <p className="text-lg text-gray-500">
            מצאו את העסקים הכי טובים בקהילה
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="חיפוש לפי שם עסק, תיאור או עיר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 pl-4 h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips — sticky */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer shrink-0 px-4 py-2 text-sm rounded-full select-none transition-colors"
              onClick={() => setSelectedCategory(null)}
            >
              הכל
            </Badge>
            {categoryNames.map((name) => (
              <Badge
                key={name}
                variant={selectedCategory === name ? "default" : "outline"}
                className="cursor-pointer shrink-0 px-4 py-2 text-sm rounded-full select-none transition-colors"
                onClick={() =>
                  setSelectedCategory(selectedCategory === name ? null : name)
                }
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Business Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          /* Loading skeleton grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-500">
              לא נמצאו עסקים
            </p>
            <p className="text-gray-400 mt-2">
              נסו לשנות את החיפוש או לבחור קטגוריה אחרת
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                נקו סינון
              </Button>
            )}
          </div>
        ) : (
          /* Business cards grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                categories={categories}
                kashrutList={kashrutList}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

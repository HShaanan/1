import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import BusinessCard from "@/components/explore/BusinessCard";
import { buildProfessionalsGroups } from "@/components/explore/ProfessionalsGrouping";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpertsBrowse() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Build professional groups from categories
  const professionalsGroups = useMemo(
    () => buildProfessionalsGroups(categories),
    [categories]
  );

  // Collect all professional sub-category IDs across all groups
  const allProfessionalSubIds = useMemo(
    () => professionalsGroups.flatMap((g) => g.subIds),
    [professionalsGroups]
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bizResult, catResult] = await Promise.all([
          base44.entities.BusinessPage.filter({
            is_active: true,
            approval_status: "approved",
          }),
          base44.entities.Category.list(),
        ]);
        setBusinesses(bizResult || []);
        setCategories(catResult || []);
      } catch (err) {
        console.error("ExpertsBrowse: failed to load data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter to professional listings, with fallback to category-based matching
  const professionals = useMemo(() => {
    const byType = businesses.filter((b) => b.listing_type === "professional");

    if (byType.length > 0) return byType;

    // Fallback: match businesses whose category_id belongs to any professional group
    if (allProfessionalSubIds.length === 0) return [];
    return businesses.filter(
      (b) =>
        allProfessionalSubIds.includes(b.category_id) ||
        allProfessionalSubIds.includes(b.category)
    );
  }, [businesses, allProfessionalSubIds]);

  // Apply group filter
  const groupFiltered = useMemo(() => {
    if (!selectedGroup) return professionals;
    return professionals.filter(
      (b) =>
        selectedGroup.subIds.includes(b.category_id) ||
        selectedGroup.subIds.includes(b.category)
    );
  }, [professionals, selectedGroup]);

  // Apply search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return groupFiltered;
    const q = searchQuery.trim().toLowerCase();
    return groupFiltered.filter((b) => {
      const name = (b.name || b.title || "").toLowerCase();
      const title = (b.professional_title || "").toLowerCase();
      const specialties = Array.isArray(b.specialties)
        ? b.specialties.join(" ").toLowerCase()
        : (b.specialties || "").toLowerCase();
      return name.includes(q) || title.includes(q) || specialties.includes(q);
    });
  }, [groupFiltered, searchQuery]);

  const handleGroupClick = (group) => {
    setSelectedGroup((prev) => (prev?.id === group.id ? null : group));
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-bl from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">מומחים משלנו</h1>
          </div>
          <p className="text-lg text-blue-100">
            מצאו את המומחים הטובים ביותר בקהילה
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Group Chips */}
        {professionalsGroups.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {professionalsGroups.map((group) => (
                <Badge
                  key={group.id}
                  variant={
                    selectedGroup?.id === group.id ? "default" : "outline"
                  }
                  className={`shrink-0 cursor-pointer text-sm px-3 py-1.5 rounded-full transition-all select-none ${
                    selectedGroup?.id === group.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                  onClick={() => handleGroupClick(group)}
                >
                  <span className="ml-1">{group.icon}</span>
                  {group.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8 max-w-xl mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="חיפוש לפי שם, תחום או התמחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 pl-4 py-2 rounded-full bg-white border-gray-300 shadow-sm text-right"
          />
          {(searchQuery || selectedGroup) && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSearchQuery("");
                setSelectedGroup(null);
              }}
            >
              נקה
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Professionals Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                variant="professional"
                categories={categories}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              לא נמצאו מומחים
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              נסו להרחיב את החיפוש או לבחור קבוצה אחרת כדי למצוא את המומחה
              המתאים לכם
            </p>
            {(searchQuery || selectedGroup) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGroup(null);
                }}
              >
                נקה סינון
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

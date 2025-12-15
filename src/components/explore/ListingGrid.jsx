import React from "react";
import ListingPreviewCard from "./ListingPreviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import BannerCarousel from "@/components/banners/BannerCarousel";

export default function ListingGrid({ listings = [], loading, onOpen, categories = [] }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full h-40 rounded-xl" />
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-full h-3" />
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(listings) || listings.length === 0) {
    return (
      <div className="text-center py-16 bg-white/60 rounded-2xl border">
        <p className="text-lg font-semibold text-slate-700 mb-2">אין מודעות להצגה</p>
        <p className="text-slate-500">בחר קטגוריה ותת־קטגוריה כדי לראות מודעות רלוונטיות</p>
      </div>
    );
  }

  // מיון - עסקים מקודמים ראשונים
  const sortedListings = [...listings].sort((a, b) => {
    if (a.is_promoted && !b.is_promoted) return -1;
    if (!a.is_promoted && b.is_promoted) return 1;
    return 0;
  });

  const insertAfter = 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {sortedListings.map((page, i) => (
        <React.Fragment key={page.id}>
          <ListingPreviewCard
            businessPage={page}
            onClick={onOpen}
            categories={categories}
          />
          {i === insertAfter - 1 && (
            <div className="col-span-full">
              <BannerCarousel placement="browse_interstitial" size="tall" fit="contain" cropBars={true} zoom={1.36} loopVideo={false} fadeEffect={true} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
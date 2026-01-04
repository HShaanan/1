import React, { useMemo } from 'react';
import ListingPreviewCard from "./ListingPreviewCard";
import BannerCarousel from "@/components/banners/BannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useWindowSize } from "@/components/hooks/useWindowSize";

const GAP = 20;

export default function ListingGrid({ listings = [], loading, onOpen, categories = [], kashrutData = [] }) {
  const { width } = useWindowSize();

  // Determine columns based on screen width
  const numColumns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  
  // Sort listings (Promoted first)
  const sortedListings = useMemo(() => {
    if (!listings) return [];
    return [...listings].sort((a, b) => {
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;
        return 0;
    });
  }, [listings]);

  // Chunk data into rows for display
  const rows = useMemo(() => {
    const r = [];
    let currentRow = [];
    
    sortedListings.forEach((item) => {
        currentRow.push(item);
        if (currentRow.length === numColumns) {
            r.push(currentRow);
            currentRow = [];
        }
    });
    
    // Add remaining partial row
    if (currentRow.length > 0) {
        r.push(currentRow);
    }
    
    return r;
  }, [sortedListings, numColumns]);

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
        <p className="text-slate-500">נסה לשנות את מסנני החיפוש</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row, rowIndex) => (
        <div 
          key={rowIndex}
          className="grid gap-5"
          style={{ gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }}
        >
          {row.map(page => (
            <ListingPreviewCard
              key={page.id}
              businessPage={page}
              onClick={onOpen}
              categories={categories}
              kashrutData={kashrutData}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
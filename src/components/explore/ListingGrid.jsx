import React, { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import ListingPreviewCard from "./ListingPreviewCard";
import BannerCarousel from "@/components/banners/BannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useWindowSize } from "@/components/hooks/useWindowSize";

const GAP = 20;
const ITEM_HEIGHT = 350; // Reduced height to fix whitespace gap
const BANNER_HEIGHT = 320; // Banner height + gap

export default function ListingGrid({ listings = [], loading, onOpen, categories = [] }) {
  const { width, height } = useWindowSize();

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

  // Chunk data into rows for virtualization
  const rows = useMemo(() => {
    const r = [];
    let currentRow = [];
    
    // Flatten with Banner injected
    const flatItems = [];
    sortedListings.forEach((item, index) => {
        flatItems.push({ type: 'item', data: item });
        // Banner injection removed to prevent gaps
    });

    // Group into rows
    flatItems.forEach(item => {
        if (item.type === 'banner') {
            if (currentRow.length > 0) {
                r.push({ type: 'items', items: currentRow });
                currentRow = [];
            }
            r.push({ type: 'banner' });
        } else {
            currentRow.push(item.data);
            if (currentRow.length === numColumns) {
                r.push({ type: 'items', items: currentRow });
                currentRow = [];
            }
        }
    });
    
    // Add remaining partial row
    if (currentRow.length > 0) {
        r.push({ type: 'items', items: currentRow });
    }
    
    return r;
  }, [sortedListings, numColumns]);

  // Row Renderer
  const Row = ({ index, style }) => {
    const row = rows[index];
    
    // Adjust style for gap/padding
    const rowStyle = {
        ...style,
        width: '100%',
        paddingBottom: `${GAP}px`,
        boxSizing: 'border-box'
    };

    if (row.type === 'banner') {
        return (
            <div style={rowStyle} className="px-1">
                 <div className="h-full w-full">
                     <BannerCarousel placement="browse_interstitial" size="tall" fit="contain" cropBars={true} zoom={1.36} loopVideo={false} fadeEffect={true} />
                 </div>
            </div>
        );
    }

    return (
        <div 
             style={{ 
                 ...rowStyle,
                 display: 'grid', 
                 gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`, 
                 gap: `${GAP}px` 
             }}
             className="px-1"
        >
            {row.items.map(page => (
                <ListingPreviewCard
                    key={page.id}
                    businessPage={page}
                    onClick={onOpen}
                    categories={categories}
                />
            ))}
        </div>
    );
  };

  const getItemSize = (index) => {
      const row = rows[index];
      // Banner row gets banner height, items row gets item height
      return row.type === 'banner' ? BANNER_HEIGHT : ITEM_HEIGHT;
  };

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

  // Calculate dynamic list height (screen height - offset for headers)
  // Fallback to 600 if calculation fails
  const listHeight = height > 0 ? Math.max(400, height - 280) : 600;

  return (
    <List
        height={listHeight}
        itemCount={rows.length}
        itemSize={getItemSize}
        width={'100%'}
        className="hide-scrollbar"
        direction="rtl"
    >
        {Row}
    </List>
  );
}
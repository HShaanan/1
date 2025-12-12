import React, { useState, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function CategorySelector({
  categories = [],
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  onClose
}) {
  // Local state for the category being hovered/viewed to show its subcategories
  const [activeMainCategory, setActiveMainCategory] = useState(selectedCategory);

  // Memoize category lists to avoid re-computation
  const mainCategories = useMemo(() => 
    categories.filter(c => !c.parent_id && (c.is_active ?? true)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!activeMainCategory) return [];
    return categories.filter(c => c.parent_id === activeMainCategory && (c.is_active ?? true)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, activeMainCategory]);

  const handleMainCategoryClick = (categoryId) => {
    onCategoryChange(categoryId);
    onSubcategoryChange(null); // Reset subcategory when main category changes
    setActiveMainCategory(categoryId);
  };
  
  const handleSubCategoryClick = (subcategoryId) => {
    onSubcategoryChange(subcategoryId);
    if (onClose) onClose(); // Close popover after selection
  };
  
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'קטגוריה';

  return (
    <div className="flex h-[400px] w-full" dir="rtl">
      {/* Main Categories Panel */}
      <ScrollArea className="w-1/2 border-l p-2">
        <div className="space-y-1">
          <Button
            variant={!activeMainCategory ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              onCategoryChange(null);
              onSubcategoryChange(null);
              setActiveMainCategory(null);
              if (onClose) onClose();
            }}
          >
            כל הקטגוריות
          </Button>
          {mainCategories.map(cat => (
            <Button
              key={cat.id}
              variant={activeMainCategory === cat.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onMouseEnter={() => setActiveMainCategory(cat.id)}
              onClick={() => handleMainCategoryClick(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Subcategories Panel */}
      <ScrollArea className="w-1/2 p-2">
        {activeMainCategory && subCategories.length > 0 ? (
          <div className="space-y-1">
            <div className="font-semibold text-sm p-2 text-slate-800">
              {getCategoryName(activeMainCategory)}
            </div>
            <Button
              variant={selectedCategory === activeMainCategory && !selectedSubcategory ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                  onCategoryChange(activeMainCategory);
                  onSubcategoryChange(null);
                  if (onClose) onClose();
              }}
            >
              הכל ב"{getCategoryName(activeMainCategory)}"
            </Button>
            {subCategories.map(sub => (
              <Button
                key={sub.id}
                variant={selectedSubcategory === sub.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleSubCategoryClick(sub.id)}
              >
                {sub.name}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            {activeMainCategory ? "אין תתי-קטגוריות" : "בחר קטגוריה ראשית"}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
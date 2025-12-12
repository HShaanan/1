
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, MapPin, Tag, DollarSign, X } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';

export default function AdvancedSearchBar({
  searchQuery, onSearchQueryChange,
  categories, selectedCategory, onCategoryChange,
  selectedSubcategory, onSubcategoryChange,
  sortBy, onSortByChange,
  selectedRadius, onSelectedRadiusChange,
  priceRange, onPriceRangeChange,
  userLocation, onGetUserLocation,
  onClearFilters,
  locationError
}) {
  const [activePopover, setActivePopover] = useState(null);

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '';
  const getPriceRangeLabel = (key) => {
    switch (key) {
      case "all": return "הכל";
      case "free": return "חינם";
      case "low": return "עד ₪100";
      case "high": return "מעל ₪500";
      default: return key;
    }
  };

  return (
    <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 space-y-4">
      {/* Main Search Input */}
      <form onSubmit={(e) => { e.preventDefault(); /* Handle search submission here if needed */ }} role="search" aria-label="חיפוש מתקדם">
        <div className="relative">
          <label htmlFor="advanced-search" className="sr-only">חיפוש עסקים</label>
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
          <Button 
            type="submit"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-10 px-4 bg-blue-600 hover:bg-blue-700"
            aria-label="ביצוע חיפוש"
          >
            חיפוש
          </Button>
          <Input
            id="advanced-search"
            type="search"
            placeholder="מה לחפש? (לדוגמה: 'פיצה כשרה' או 'תיקון מזגנים')..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full h-14 pl-4 pr-12 rounded-xl text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            aria-label="שדה חיפוש עסקים"
          />
        </div>
      </form>

      {/* Filter Triggers */}
      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="מסננים">
        <Popover open={activePopover === 'category'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'category' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full" aria-label={`בחר קטגוריה: ${selectedSubcategory ? getCategoryName(selectedSubcategory) : (selectedCategory ? getCategoryName(selectedCategory) : 'לא נבחרה קטגוריה')}`}>
              <Tag className="w-4 h-4 ml-2" aria-hidden="true" />
              {selectedSubcategory ? getCategoryName(selectedSubcategory) : (selectedCategory ? getCategoryName(selectedCategory) : 'קטגוריה')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="center">
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={onSubcategoryChange}
              onClose={() => setActivePopover(null)} />
          </PopoverContent>
        </Popover>

        <Popover open={activePopover === 'location'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'location' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full" aria-label={`בחר מיקום ורדיוס: ${userLocation ? 'מיקום נמצא' : 'לא נמצא מיקום'} ${selectedRadius} קילומטרים`}>
              <MapPin className="w-4 h-4 ml-2" aria-hidden="true" />
              מיקום ורדיוס
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="center">
            <div className="space-y-4">
              <h4 className="font-medium text-center">סינון לפי מרחק</h4>
              <Button 
                onClick={onGetUserLocation} 
                className="bg-slate-100 text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 w-full"
                aria-label="מצא את המיקום הנוכחי שלי"
              >
                מצא את המיקום הנוכחי שלי
              </Button>
              {userLocation && <p className="text-xs text-green-600 text-center">המיקום שלך נמצא!</p>}
              {locationError && <p className="text-xs text-red-600 text-center">{locationError}</p>}
              <div>
                <Label htmlFor="radius-slider">רדיוס חיפוש: {selectedRadius} ק"מ</Label>
                <Slider
                  id="radius-slider"
                  value={[parseInt(selectedRadius, 10)]}
                  onValueChange={([val]) => onSelectedRadiusChange(String(val))}
                  min={1} max={50} step={1}
                  disabled={!userLocation} className="bg-blue-300 text-indigo-700 relative flex w-full touch-none select-none items-center"
                  aria-label={`בחר רדיוס חיפוש בקילומטרים, כרגע ${selectedRadius} קילומטרים`}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={activePopover === 'price'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'price' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full" aria-label={`בחר טווח מחירים: ${getPriceRangeLabel(priceRange)}`}>
              <DollarSign className="w-4 h-4 ml-2" aria-hidden="true" />
              טווח מחירים
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="center">
            <div className="grid grid-cols-2 gap-2">
                {[
              { key: "all", label: "הכל" },
              { key: "free", label: "חינם" },
              { key: "low", label: "עד ₪100" },
              { key: "high", label: "מעל ₪500" }].
              map((price) =>
              <Button
                key={price.key}
                variant={priceRange === price.key ? "default" : "outline"}
                size="sm"
                onClick={() => {onPriceRangeChange(price.key);setActivePopover(null);}}
                aria-label={`בחר טווח מחירים ${price.label}`}
              >
                    {price.label}
                  </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={activePopover === 'sort'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'sort' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full" aria-label={`בחר אפשרות מיון: ${sortBy === 'best' ? 'הטוב ביותר' : sortBy === 'newest' ? 'החדש ביותר' : sortBy === 'price_low' ? 'מחיר נמוך' : 'מחיר גבוה'}`}>
              <SlidersHorizontal className="w-4 h-4 ml-2" aria-hidden="true" />
              מיון
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="center">
             <div className="grid grid-cols-2 gap-2">
                {[
              { key: "best", label: "הטוב ביותר" },
              { key: "newest", label: "החדש ביותר" },
              { key: "price_low", label: "מחיר נמוך" },
              { key: "price_high", label: "מחיר גבוה" }].
              map((sort) =>
              <Button
                key={sort.key}
                variant={sortBy === sort.key ? "default" : "outline"}
                size="sm"
                onClick={() => {onSortByChange(sort.key);setActivePopover(null);}}
                aria-label={`מיין לפי ${sort.label}`}
              >
                    {sort.label}
                  </Button>
              )}
              </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200/80 min-h-[40px]" role="region" aria-label="מסננים פעילים">
        {(selectedCategory || sortBy !== 'best' || priceRange !== 'all') && (
          <span className="text-sm font-medium text-gray-600">מסננים פעילים:</span>
        )}

        {selectedCategory && (
          <Badge variant="secondary" className="pl-2">
            {getCategoryName(selectedCategory)} 
            <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" onClick={() => onCategoryChange(null)} aria-label={`הסר סינון קטגוריה: ${getCategoryName(selectedCategory)}`}>
              <X className="w-3 h-3" aria-hidden="true" />
            </Button>
          </Badge>
        )}
        {selectedSubcategory && (
          <Badge variant="secondary" className="pl-2">
            {getCategoryName(selectedSubcategory)} 
            <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" onClick={() => onSubcategoryChange(null)} aria-label={`הסר סינון תת-קטגוריה: ${getCategoryName(selectedSubcategory)}`}>
              <X className="w-3 h-3" aria-hidden="true" />
            </Button>
          </Badge>
        )}
        {priceRange !== 'all' && (
          <Badge variant="secondary" className="pl-2">
            מחיר: {getPriceRangeLabel(priceRange)} 
            <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" onClick={() => onPriceRangeChange('all')} aria-label={`הסר סינון טווח מחירים: ${getPriceRangeLabel(priceRange)}`}>
              <X className="w-3 h-3" aria-hidden="true" />
            </Button>
          </Badge>
        )}

        {(selectedCategory || sortBy !== 'best' || priceRange !== 'all') &&
        <Button variant="link" size="sm" onClick={onClearFilters} className="text-red-500 mr-auto" aria-label="נקה את כל המסננים">
                נקה הכל
            </Button>
        }
      </div>
    </div>
  );
}

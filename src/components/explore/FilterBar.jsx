import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, X, Check, Truck, Clock, DollarSign, 
  Utensils, ShoppingBag, ChevronDown 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function FilterBar({ 
  filters, 
  onFilterChange, 
  activeCounts,
  kashrutList = []
}) {
  const [openPopover, setOpenPopover] = useState(null);

  // Use dynamic kashrut list if available, otherwise empty (or fallback)
  const kashrutOptions = kashrutList.length > 0 
    ? kashrutList.map(k => ({ id: k.name, label: k.name }))
    : [
        { id: 'בד"ץ', label: 'בד"ץ' },
        { id: 'רבנות מהדרין', label: 'רבנות מהדרין' },
        { id: 'רבנות', label: 'רבנות' },
        { id: 'אחר', label: 'אחר' }
      ];

  const priceOptions = [
    { id: '$', label: 'זול ($)' },
    { id: '$$', label: 'ממוצע ($$)' },
    { id: '$$$', label: 'יקר ($$$)' },
    { id: '$$$$', label: 'יוקרתי ($$$$)' }
  ];

  const handleToggleFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFilterChange(key, updated);
  };

  const handleBoolToggle = (key) => {
    onFilterChange(key, !filters[key]);
  };

  const clearFilters = () => {
    onFilterChange('reset', null);
  };

  const activeFilterCount = (
    (filters.kashrut?.length || 0) + 
    (filters.price?.length || 0) + 
    (filters.delivery ? 1 : 0) + 
    (filters.pickup ? 1 : 0) + 
    (filters.openNow ? 1 : 0)
  );

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          
          {/* Main Filter Icon / Clear */}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-2 shrink-0 h-8"
            >
              <X className="w-4 h-4 ml-1" />
              נקה הכל ({activeFilterCount})
            </Button>
          )}

          {/* Open Now Toggle */}
          <Button
            variant={filters.openNow ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleBoolToggle('openNow')}
            className={`rounded-full border-dashed shrink-0 h-8 ${filters.openNow ? 'bg-green-100 text-green-700 border-green-200' : 'border-slate-300 text-slate-600'}`}
          >
            <Clock className="w-3.5 h-3.5 ml-1.5" />
            פתוח עכשיו
          </Button>

          {/* Delivery Toggle */}
          <Button
            variant={filters.delivery ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleBoolToggle('delivery')}
            className={`rounded-full shrink-0 h-8 ${filters.delivery ? 'bg-blue-100 text-blue-700 border-blue-200' : 'border-slate-300 text-slate-600'}`}
          >
            <Truck className="w-3.5 h-3.5 ml-1.5" />
            משלוח
          </Button>

          {/* Pickup Toggle */}
          <Button
            variant={filters.pickup ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleBoolToggle('pickup')}
            className={`rounded-full shrink-0 h-8 ${filters.pickup ? 'bg-orange-100 text-orange-700 border-orange-200' : 'border-slate-300 text-slate-600'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 ml-1.5" />
            איסוף עצמי
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

          {/* Kashrut Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={filters.kashrut?.length > 0 ? "secondary" : "outline"} 
                size="sm"
                className={`rounded-full shrink-0 h-8 ${filters.kashrut?.length > 0 ? 'bg-purple-100 text-purple-700 border-purple-200' : 'border-slate-300 text-slate-600'}`}
              >
                <Utensils className="w-3.5 h-3.5 ml-1.5" />
                כשרות
                {filters.kashrut?.length > 0 && <span className="mr-1 bg-purple-200 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-full">{filters.kashrut.length}</span>}
                <ChevronDown className="w-3 h-3 mr-1 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2" dir="rtl">
                <h4 className="font-medium text-sm text-slate-900 mb-2">סוג כשרות</h4>
                {kashrutOptions.map(option => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`kashrut-${option.id}`} 
                      checked={filters.kashrut?.includes(option.id)}
                      onCheckedChange={() => handleToggleFilter('kashrut', option.id)}
                    />
                    <Label htmlFor={`kashrut-${option.id}`} className="text-sm cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Price Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={filters.price?.length > 0 ? "secondary" : "outline"} 
                size="sm"
                className={`rounded-full shrink-0 h-8 ${filters.price?.length > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'border-slate-300 text-slate-600'}`}
              >
                <DollarSign className="w-3.5 h-3.5 ml-1.5" />
                מחיר
                {filters.price?.length > 0 && <span className="mr-1 bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full">{filters.price.length}</span>}
                <ChevronDown className="w-3 h-3 mr-1 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2" dir="rtl">
                <h4 className="font-medium text-sm text-slate-900 mb-2">רמת מחיר</h4>
                {priceOptions.map(option => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`price-${option.id}`} 
                      checked={filters.price?.includes(option.id)}
                      onCheckedChange={() => handleToggleFilter('price', option.id)}
                    />
                    <Label htmlFor={`price-${option.id}`} className="text-sm cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

        </div>
      </div>
    </div>
  );
}
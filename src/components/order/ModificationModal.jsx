import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Minus, ShoppingCart } from "lucide-react";

export default function ModificationModal({ item, isOpen, onClose, onAddToCart, theme }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMods, setSelectedMods] = useState([]); // For legacy addons (flat list)
  const [selectedGroupOptions, setSelectedGroupOptions] = useState({}); // For new modifier groups: { groupId: [optionId, optionId] }

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedMods([]);
      
      // Initialize required defaults for single-choice groups if possible
      const initialGroupSelections = {};
      if (item?.modifierGroups) {
        item.modifierGroups.forEach(group => {
          if (group.type === 'single' && group.required && group.options.length > 0) {
            // Pre-select first option for required single choice groups? 
            // Better to let user choose, but maybe for UX pre-select is better. 
            // Let's NOT pre-select to force conscious choice unless specified otherwise.
            // initialGroupSelections[group.id] = [group.options[0].id];
          } else {
            initialGroupSelections[group.id] = [];
          }
        });
      }
      setSelectedGroupOptions(initialGroupSelections);
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handleModChange = (mod, isChecked) => {
    if (isChecked) {
      setSelectedMods(prev => [...prev, mod]);
    } else {
      setSelectedMods(prev => prev.filter(m => m.name !== mod.name));
    }
  };

  const handleGroupOptionChange = (group, option, isChecked) => {
    setSelectedGroupOptions(prev => {
      const currentSelections = prev[group.id] || [];
      let newSelections;

      if (group.type === 'single') {
        // Radio behavior
        newSelections = isChecked ? [option.id] : [];
      } else {
        // Checkbox behavior
        if (isChecked) {
          // Check max selection limit
          if (group.max_selection > 0 && currentSelections.length >= group.max_selection) {
            return prev; // Prevent selection
          }
          newSelections = [...currentSelections, option.id];
        } else {
          newSelections = currentSelections.filter(id => id !== option.id);
        }
      }

      return { ...prev, [group.id]: newSelections };
    });
  };

  const getGroupValidationErrors = () => {
    const errors = [];
    if (item.modifierGroups) {
      item.modifierGroups.forEach(group => {
        const selections = selectedGroupOptions[group.id] || [];
        if (group.required && selections.length === 0) {
          errors.push(`חובה לבחור: ${group.name}`);
        }
        if (group.min_selection > 0 && selections.length < group.min_selection) {
          errors.push(`${group.name}: יש לבחור לפחות ${group.min_selection} אפשרויות`);
        }
      });
    }
    return errors;
  };

  const calculateTotalPrice = () => {
    // Legacy addons price
    const legacyModsPrice = selectedMods.reduce((sum, mod) => sum + (parseFloat(String(mod.price || 0).replace(/[^\d.]/g, '')) || 0), 0);
    
    // New groups price
    let groupsPrice = 0;
    if (item.modifierGroups) {
      item.modifierGroups.forEach(group => {
        const selections = selectedGroupOptions[group.id] || [];
        selections.forEach(optId => {
          const option = group.options.find(o => o.id === optId);
          if (option) {
            groupsPrice += (parseFloat(String(option.price || 0).replace(/[^\d.]/g, '')) || 0);
          }
        });
      });
    }

    const basePrice = parseFloat(String(item.price || 0).replace(/[^\d.]/g, '')) || 0;
    return (basePrice + legacyModsPrice + groupsPrice) * quantity;
  };

  const handleAddToCartClick = () => {
    const errors = getGroupValidationErrors();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const basePrice = parseFloat(String(item.price || 0).replace(/[^\d.]/g, '')) || 0;
    
    // Combine legacy and new mods for the cart
    const legacyModsPrice = selectedMods.reduce((sum, mod) => sum + (parseFloat(String(mod.price || 0).replace(/[^\d.]/g, '')) || 0), 0);
    
    let groupsPrice = 0;
    const formattedGroupSelections = [];
    
    if (item.modifierGroups) {
      item.modifierGroups.forEach(group => {
        const selections = selectedGroupOptions[group.id] || [];
        selections.forEach(optId => {
          const option = group.options.find(o => o.id === optId);
          if (option) {
            groupsPrice += (parseFloat(String(option.price || 0).replace(/[^\d.]/g, '')) || 0);
            formattedGroupSelections.push({
              name: `${group.name}: ${option.name}`,
              price: option.price,
              groupName: group.name,
              optionName: option.name
            });
          }
        });
      });
    }

    const finalPricePerItem = basePrice + legacyModsPrice + groupsPrice;
    const allModifications = [...selectedMods, ...formattedGroupSelections];
    
    onAddToCart({
      ...item,
      cartItemId: Date.now() + Math.random(),
      quantity,
      selected_modifications: allModifications,
      item_final_price: finalPricePerItem,
      basePrice: basePrice,
    });
    onClose();
  };

  const availableMods = (item.addons || []).filter(mod => mod.is_available !== false);
  const modifierGroups = item.modifierGroups || [];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] mx-4" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-right">{item.name}</DialogTitle>
          {item.note && (
            <p className="text-gray-500 pt-2 text-right text-sm md:text-base">{item.note}</p>
          )}
        </DialogHeader>
        <div className="py-4 space-y-6 overflow-y-auto max-h-[60vh] px-1">
          
          {/* New Modifier Groups */}
          {modifierGroups.map(group => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                  {group.name}
                  {group.required && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">חובה</span>}
                </h3>
                {group.max_selection > 0 && (
                  <span className="text-xs text-gray-500">
                    (עד {group.max_selection})
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {group.options.map(option => {
                  const isSelected = (selectedGroupOptions[group.id] || []).includes(option.id);
                  return (
                    <div 
                      key={option.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                      onClick={() => handleGroupOptionChange(group, option, !isSelected)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`text-sm md:text-base ${isSelected ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                          {option.name}
                        </span>
                      </div>
                      {option.price && parseFloat(option.price) > 0 && (
                        <span className="font-medium text-indigo-600 text-sm">+{option.price} ₪</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legacy Addons */}
          {availableMods.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-dashed">
              <h3 className="font-semibold text-base md:text-lg">תוספות נוספות</h3>
              <div className="space-y-2">
                {availableMods.map((mod) => (
                  <div key={mod.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`mod-${mod.name}`}
                        onCheckedChange={(checked) => handleModChange(mod, checked)}
                      />
                      <Label htmlFor={`mod-${mod.name}`} className="text-sm md:text-base cursor-pointer">
                        {mod.name}
                      </Label>
                    </div>
                    {mod.price && (
                      <span className="font-medium text-green-600 text-sm md:text-base">{mod.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <h3 className="font-semibold text-base md:text-lg">כמות</h3>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full"
              >
                <Minus className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <span className="w-10 text-center font-bold text-xl md:text-2xl">
                {quantity}
              </span>
              <Button
                size="icon"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 text-white rounded-full hover:opacity-90"
                style={{ backgroundColor: theme?.colors?.primary || '#6366f1' }}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            size="lg"
            onClick={handleAddToCartClick}
            className="w-full text-white py-4 md:py-6 text-base md:text-lg hover:opacity-90"
            style={{ backgroundColor: theme?.colors?.primary || '#6366f1' }}
          >
            <ShoppingCart className="w-5 h-5 ml-2 md:ml-3" />
            הוסף להזמנה - ₪{calculateTotalPrice().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
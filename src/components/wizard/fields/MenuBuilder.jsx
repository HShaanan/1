import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, Trash2, GripVertical, X, ChevronDown, ChevronUp, 
  Image as ImageIcon, MoreVertical, Sparkles, Loader2, Wand2, Settings2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ModifierGroupsBuilder from "./ModifierGroupsBuilder";

export default function MenuBuilder({ value = [], onChange }) {
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState({ catId: null, itemId: null });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [generatingImages, setGeneratingImages] = useState({});

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const isCategoryOpen = (catId) => {
    return expandedCategories[catId] !== false; // Default open
  };

  const addCategory = () => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: '',
      items: []
    };
    onChange([...value, newCategory]);
    // Scroll to bottom logic could be added here
  };

  const updateCategory = (categoryId, field, val) => {
    const updated = value.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: val } : cat
    );
    onChange(updated);
  };

  const removeCategory = (categoryId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה וכל הפריטים שבה?')) {
      onChange(value.filter(cat => cat.id !== categoryId));
    }
  };

  const addItem = (categoryId) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        const newItem = {
          id: `item-${Date.now()}`,
          name: '',
          price: '',
          note: '',
          image: '',
          addons: []
        };
        return { ...cat, items: [...(cat.items || []), newItem] };
      }
      return cat;
    });
    onChange(updated);
    setExpandedCategories(prev => ({ ...prev, [categoryId]: true }));
  };

  const updateItem = (categoryId, itemId, field, val) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.map(item =>
          item.id === itemId ? { ...item, [field]: val } : item
        );
        return { ...cat, items };
      }
      return cat;
    });
    onChange(updated);
  };

  const removeItem = (categoryId, itemId) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
      }
      return cat;
    });
    onChange(updated);
  };

  // AI Image Generation
  const generateItemImage = async (categoryId, itemId, itemName, itemNote) => {
    if (!itemName) {
      alert('נא להזין שם פריט לפני יצירת תמונה');
      return;
    }

    setGeneratingImages(prev => ({ ...prev, [itemId]: true }));

    try {
      // Construct a prompt for food photography
      const prompt = `Professional food photography of ${itemName}${itemNote ? `, ${itemNote}` : ''}. High resolution, delicious, appetizing, restaurant menu style, photorealistic, studio lighting, sharp focus, 4k.`;
      
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      
      if (res && res.url) {
        updateItem(categoryId, itemId, 'image', res.url);
      }
    } catch (error) {
      console.error("AI Image Generation Error:", error);
      alert("אירעה שגיאה בעת יצירת התמונה. נסה שנית.");
    } finally {
      setGeneratingImages(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Addons
  const addAddon = (categoryId, itemId) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.map(item => {
          if (item.id === itemId) {
            const newAddon = {
              id: `addon-${Date.now()}`,
              name: '',
              price: ''
            };
            return { ...item, addons: [...(item.addons || []), newAddon] };
          }
          return item;
        });
        return { ...cat, items };
      }
      return cat;
    });
    onChange(updated);
  };

  const updateAddon = (categoryId, itemId, addonId, field, val) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.map(item => {
          if (item.id === itemId) {
            const addons = item.addons.map(addon =>
              addon.id === addonId ? { ...addon, [field]: val } : addon
            );
            return { ...item, addons };
          }
          return item;
        });
        return { ...cat, items };
      }
      return cat;
    });
    onChange(updated);
  };

  const removeAddon = (categoryId, itemId, addonId) => {
    const updated = value.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.map(item => {
          if (item.id === itemId) {
            return { ...item, addons: item.addons.filter(a => a.id !== addonId) };
          }
          return item;
        });
        return { ...cat, items };
      }
      return cat;
    });
    onChange(updated);
  };

  const uploadItemImage = async (categoryId, itemId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        const imageUrl = data?.file_url;
        if (imageUrl) {
          updateItem(categoryId, itemId, 'image', imageUrl);
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('שגיאה בהעלאת תמונה');
      }
    };
    input.click();
  };

  const toggleItemExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const openModifierModal = (catId, itemId) => {
    setCurrentEditingItem({ catId, itemId });
    setModifierModalOpen(true);
  };

  const updateModifierGroups = (newGroups) => {
    const { catId, itemId } = currentEditingItem;
    
    if (itemId) {
      // Updating specific item
      updateItem(catId, itemId, 'modifierGroups', newGroups);
    } else if (catId) {
      // Updating category template - apply to all items in category
      const updated = value.map(cat => {
        if (cat.id === catId) {
          // Update category template
          const updatedCat = { ...cat, modifierGroups: newGroups };
          // Apply to all items
          updatedCat.items = (cat.items || []).map(item => ({
            ...item,
            modifierGroups: [...newGroups] // Copy to avoid reference issues
          }));
          return updatedCat;
        }
        return cat;
      });
      onChange(updated);
    }
  };

  // Helper to get current modifier groups for the modal
  const getCurrentModifierGroups = () => {
    const { catId, itemId } = currentEditingItem;
    if (!catId) return [];
    
    const category = value.find(c => c.id === catId);
    
    if (itemId) {
      // Return item specific groups
      const item = category?.items?.find(i => i.id === itemId);
      return item?.modifierGroups || [];
    } else {
      // Return category template groups
      return category?.modifierGroups || [];
    }
  };

  const openCategoryModifierModal = (catId) => {
    // If category has no groups yet but items do, maybe pick from first item? 
    // For now, just use category's own template or empty.
    setCurrentEditingItem({ catId, itemId: null });
    setModifierModalOpen(true);
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'CATEGORY') {
      const newCategories = Array.from(value);
      const [removed] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, removed);
      onChange(newCategories);
      return;
    }

    if (type === 'ITEM') {
      const sourceCatId = source.droppableId;
      const destCatId = destination.droppableId;

      const sourceCatIndex = value.findIndex(c => c.id === sourceCatId);
      const destCatIndex = value.findIndex(c => c.id === destCatId);

      if (sourceCatIndex === -1 || destCatIndex === -1) return;

      const newCategories = [...value];
      const sourceItems = [...(newCategories[sourceCatIndex].items || [])];
      
      const [removed] = sourceItems.splice(source.index, 1);

      if (sourceCatId === destCatId) {
        sourceItems.splice(destination.index, 0, removed);
        newCategories[sourceCatIndex] = { ...newCategories[sourceCatIndex], items: sourceItems };
      } else {
        const destItems = [...(newCategories[destCatIndex].items || [])];
        destItems.splice(destination.index, 0, removed);
        newCategories[sourceCatIndex] = { ...newCategories[sourceCatIndex], items: sourceItems };
        newCategories[destCatIndex] = { ...newCategories[destCatIndex], items: destItems };
      }
      
      onChange(newCategories);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-4xl mx-auto" dir="rtl">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/90">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-500" />
              בניית תפריט
            </h2>
            <p className="text-sm text-slate-500">סדר וארגן את המנות שלך בקלות</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={addCategory}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-full px-6"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף קטגוריה חדשה
            </Button>
          </div>
        </div>

        {value.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Plus className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">התפריט שלך ריק</h3>
            <p className="text-slate-500 mb-8 max-w-sm">צור קטגוריות (למשל: ראשונות, עיקריות, קינוחים) והתחל להוסיף מנות משגעות.</p>
            <Button type="button" onClick={addCategory} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              צור קטגוריה ראשונה
            </Button>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-categories" type="CATEGORY">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-6"
              >
                {value.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group transition-all duration-200 ${snapshot.isDragging ? 'scale-105 rotate-1 z-50' : ''}`}
                      >
                        <Collapsible 
                          open={isCategoryOpen(category.id)} 
                          onOpenChange={() => toggleCategoryExpand(category.id)}
                          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                        >
                          <div className="bg-slate-50 p-2 sm:p-4 flex items-center gap-3 border-b border-slate-100">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-200 text-slate-500">
                                {isCategoryOpen(category.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </Button>
                            </CollapsibleTrigger>

                            <div className="flex-1">
                              <Input
                                value={category.name}
                                onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                                placeholder="שם קטגוריה (לדוגמה: המבורגרים)"
                                className="bg-transparent border-transparent hover:border-slate-300 focus:bg-white focus:border-indigo-300 font-bold text-lg h-11 px-3 transition-all"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    onClick={() => openCategoryModifierModal(category.id)}
                                    variant="outline"
                                    size="icon"
                                    className={`h-9 w-9 rounded-full border-dashed ${category.modifierGroups?.length > 0 ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-slate-400 border-slate-200 hover:text-purple-600'}`}
                                  >
                                    <Settings2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>הגדרות הרכבה לכל הקטגוריה (יחול על כל המוצרים)</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    onClick={() => addItem(category.id)}
                                    variant="outline"
                                    size="icon"
                                    className="bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 h-9 w-9 rounded-full"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>הוסף מוצר לקטגוריה</TooltipContent>
                              </Tooltip>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500">
                                    <MoreVertical className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => removeCategory(category.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    מחק קטגוריה
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <CollapsibleContent>
                            <Droppable droppableId={category.id} type="ITEM">
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="p-3 sm:p-5 space-y-4 bg-white min-h-[100px]"
                                >
                                  {category.items?.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                                      <p className="text-sm text-slate-400 mb-2">הקטגוריה ריקה</p>
                                      <Button variant="link" onClick={() => addItem(category.id)} className="text-indigo-600 hover:text-indigo-700">
                                        + הוסף מוצר ראשון
                                      </Button>
                                    </div>
                                  )}

                                  {category.items?.map((item, itemIndex) => (
                                    <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex flex-col sm:flex-row gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all group/item ${
                                            snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/20 rotate-1' : 'hover:border-indigo-200 hover:shadow-md'
                                          }`}
                                        >
                                          <div className="flex items-start gap-4 flex-1 w-full">
                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-3 text-slate-300 hover:text-slate-500 transition-colors">
                                              <GripVertical className="w-5 h-5" />
                                            </div>

                                            {/* Image Area */}
                                            <div className="relative shrink-0 group/image">
                                              {item.image ? (
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-slate-50 shadow-inner">
                                                  <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => updateItem(category.id, item.id, 'image', '')}
                                                      className="text-white hover:text-red-400 transition-colors"
                                                      title="מחק תמונה"
                                                    >
                                                      <Trash2 className="w-5 h-5" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex flex-col gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => uploadItemImage(category.id, item.id)}
                                                    className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                                  >
                                                    <ImageIcon className="w-6 h-6 mb-1" />
                                                    <span className="text-[10px]">העלאה</span>
                                                  </button>
                                                </div>
                                              )}
                                              
                                              {/* AI Generator Button */}
                                              {!item.image && (
                                                <button
                                                  type="button"
                                                  onClick={() => generateItemImage(category.id, item.id, item.name, item.note)}
                                                  disabled={generatingImages[item.id] || !item.name}
                                                  className="mt-2 w-24 flex items-center justify-center gap-1 text-[10px] py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:shadow-md transition-all disabled:opacity-50"
                                                >
                                                  {generatingImages[item.id] ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <Sparkles className="w-3 h-3" />
                                                  )}
                                                  <span>צור ב-AI</span>
                                                </button>
                                              )}
                                            </div>

                                            <div className="flex-1 space-y-3 w-full">
                                              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                                                <div className="flex-1 min-w-[140px]">
                                                  <Label className="text-xs text-slate-500 mb-1 block">שם המנה</Label>
                                                  <Input
                                                    value={item.name}
                                                    onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)}
                                                    placeholder="המבורגר קלאסי"
                                                    className="font-medium focus:ring-indigo-500/20 h-10"
                                                  />
                                                </div>
                                                <div className="w-28 shrink-0">
                                                  <Label className="text-xs text-slate-500 mb-1 block">מחיר (₪)</Label>
                                                  <Input
                                                    value={item.price}
                                                    onChange={(e) => updateItem(category.id, item.id, 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="text-left focus:ring-indigo-500/20 h-10"
                                                  />
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <Input
                                                  value={item.note || ''}
                                                  onChange={(e) => updateItem(category.id, item.id, 'note', e.target.value)}
                                                  placeholder="תיאור המנה (מרכיבים, אלרגנים, המלצות)"
                                                  className="text-sm text-slate-600 bg-slate-50 border-slate-200 focus:bg-white transition-colors h-9"
                                                />
                                              </div>

                                              {/* Addons & Modifiers Section */}
                                              <div className="pt-3 flex flex-wrap items-center gap-2">
                                                {/* Legacy Addons Toggle */}
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => toggleItemExpand(item.id)}
                                                  className={`text-xs h-8 rounded-full px-3 border ${expandedItems[item.id] ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                  {expandedItems[item.id] ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                                                  תוספות פשוטות ({ (item.addons || []).length })
                                                </Button>

                                                {/* Advanced Modifiers Button */}
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => openModifierModal(category.id, item.id)}
                                                  className={`text-xs h-8 rounded-full px-3 border-dashed ${item.modifierGroups?.length > 0 ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-slate-300 text-slate-600'}`}
                                                >
                                                  <Settings2 className="w-3 h-3 mr-1" />
                                                  {item.modifierGroups?.length > 0 ? `הרכבה מתקדמת (${item.modifierGroups.length})` : 'הגדר הרכבה מתקדמת'}
                                                </Button>
                                              </div>

                                              {/* Legacy Addons Content */}
                                              {expandedItems[item.id] && (
                                                <div className="mt-3 pl-2 border-r-2 border-indigo-100 space-y-2 animate-fadeIn">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-indigo-900">תוספות פשוטות (צ'קבוקס)</span>
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => addAddon(category.id, item.id)}
                                                      className="text-xs h-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2"
                                                    >
                                                      <Plus className="w-3 h-3 mr-1" />
                                                      הוסף
                                                    </Button>
                                                  </div>
                                                  
                                                  {(item.addons || []).length === 0 && (
                                                    <div className="text-xs text-slate-400 pr-2 italic py-1">
                                                      אין תוספות. לחץ על "הוסף" כדי ליצור.
                                                    </div>
                                                  )}
                                                  {(item.addons || []).map((addon) => (
                                                    <div key={addon.id} className="flex items-center gap-2 group/addon">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 shrink-0"></div>
                                                      <Input
                                                        value={addon.name}
                                                        onChange={(e) => updateAddon(category.id, item.id, addon.id, 'name', e.target.value)}
                                                        placeholder="שם התוספת"
                                                        className="h-8 text-xs flex-1 border-slate-200 focus:border-indigo-300"
                                                      />
                                                      <Input
                                                        value={addon.price}
                                                        onChange={(e) => updateAddon(category.id, item.id, addon.id, 'price', e.target.value)}
                                                        placeholder="מחיר"
                                                        className="h-8 text-xs w-20 border-slate-200 focus:border-indigo-300"
                                                      />
                                                      <Button
                                                        type="button"
                                                        onClick={() => removeAddon(category.id, item.id, addon.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/addon:opacity-100 transition-opacity"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </Button>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex sm:flex-col justify-end gap-2 mt-2 sm:mt-0 border-t sm:border-t-0 sm:border-r sm:pr-2 pt-2 sm:pt-0 border-slate-100">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  type="button"
                                                  onClick={() => removeItem(category.id, item.id)}
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="left" className="bg-red-50 text-red-600 border-red-100">מחק מוצר</TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      {/* Modifiers Modal */}
      <Dialog open={modifierModalOpen} onOpenChange={setModifierModalOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              {currentEditingItem.itemId ? 'הרכבה מתקדמת למוצר' : 'הרכבה מתקדמת לקטגוריה'}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              {currentEditingItem.itemId 
                ? 'הגדרות אלו יחולו על המוצר הספציפי הזה בלבד.'
                : 'הגדרות אלו יועתקו לכל המוצרים בקטגוריה זו (וידרסו הגדרות קיימות).'
              }
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <ModifierGroupsBuilder 
              groups={getCurrentModifierGroups()} 
              onChange={updateModifierGroups} 
            />
          </div>
          
          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button onClick={() => setModifierModalOpen(false)}>
              סגור ושמור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
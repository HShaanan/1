import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, X, ChevronDown, ChevronUp, Settings2, Download } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ModifierGroupsBuilder({ groups = [], onChange, allMenuCategories = [] }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showImportDialog, setShowImportDialog] = useState(false);

  const toggleGroupExpand = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const addGroup = () => {
    const newGroup = {
      id: `mod-group-${Date.now()}`,
      name: '',
      type: 'single', // 'single' (radio) or 'multiple' (checkbox)
      required: true,
      min_selection: 1,
      max_selection: 1,
      options: [
        { id: `opt-${Date.now()}-1`, name: '', price: '' },
        { id: `opt-${Date.now()}-2`, name: '', price: '' }
      ]
    };
    onChange([...groups, newGroup]);
    setExpandedGroups(prev => ({ ...prev, [newGroup.id]: true }));
  };

  const updateGroup = (groupId, field, val) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        // Auto-adjust min/max based on type/required changes logic could go here
        let updatedGroup = { ...g, [field]: val };
        
        // Smart defaults
        if (field === 'type') {
          if (val === 'single') {
            updatedGroup.max_selection = 1;
            updatedGroup.min_selection = updatedGroup.required ? 1 : 0;
          } else {
            updatedGroup.max_selection = 0; // 0 means unlimited
          }
        }
        if (field === 'required') {
          if (updatedGroup.type === 'single') {
            updatedGroup.min_selection = val ? 1 : 0;
          }
        }

        return updatedGroup;
      }
      return g;
    });
    onChange(updated);
  };

  const removeGroup = (groupId) => {
    onChange(groups.filter(g => g.id !== groupId));
  };

  const addOption = (groupId) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [...g.options, { id: `opt-${Date.now()}`, name: '', price: '' }]
        };
      }
      return g;
    });
    onChange(updated);
  };

  const updateOption = (groupId, optionId, field, val) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(opt => 
            opt.id === optionId ? { ...opt, [field]: val } : opt
          )
        };
      }
      return g;
    });
    onChange(updated);
  };

  const removeOption = (groupId, optionId) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.filter(opt => opt.id !== optionId)
        };
      }
      return g;
    });
    onChange(updated);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const newGroups = Array.from(groups);
    const [reorderedItem] = newGroups.splice(result.source.index, 1);
    newGroups.splice(result.destination.index, 0, reorderedItem);
    
    onChange(newGroups);
  };

  // Import existing modifier groups from categories or items
  const importGroupsFrom = (source) => {
    const sourceGroups = source.modifierGroups;
    if (!sourceGroups || sourceGroups.length === 0) return;
    
    // Clone groups with new IDs to avoid conflicts
    const importedGroups = sourceGroups.map(grp => ({
      ...grp,
      id: `mod-group-${Date.now()}-${Math.random()}`,
      options: grp.options.map(opt => ({
        ...opt,
        id: `opt-${Date.now()}-${Math.random()}`
      }))
    }));
    
    onChange([...groups, ...importedGroups]);
    setShowImportDialog(false);
  };

  // Get all available modifier groups from categories and items
  const availableGroupSources = [];
  allMenuCategories.forEach(cat => {
    // Add category itself if it has modifierGroups
    if (cat.modifierGroups && cat.modifierGroups.length > 0) {
      availableGroupSources.push({
        type: 'category',
        id: cat.id,
        name: cat.name,
        modifierGroups: cat.modifierGroups
      });
    }
    
    // Add each item that has modifierGroups
    if (cat.items && cat.items.length > 0) {
      cat.items.forEach(item => {
        if (item.modifierGroups && item.modifierGroups.length > 0) {
          availableGroupSources.push({
            type: 'item',
            id: item.id,
            name: item.name,
            categoryName: cat.name,
            modifierGroups: item.modifierGroups
          });
        }
      });
    }
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">קבוצות הרכבה (Modifiers)</h3>
          <p className="text-sm text-slate-500">הגדר אפשרויות בחירה ללקוח (למשל: סוג לחם, תוספות, הסרה)</p>
        </div>
        <div className="flex gap-2">
          {availableGroupSources.length > 0 && (
            <Button onClick={() => setShowImportDialog(true)} size="sm" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
              <Download className="w-4 h-4 ml-2" />
              שלב קבוצה קיימת
            </Button>
          )}
          <Button onClick={addGroup} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 ml-2" />
            הוסף קבוצה
          </Button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Settings2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 mb-4">אין קבוצות הרכבה לפריט זה</p>
          <Button variant="outline" onClick={addGroup}>התחל להוסיף</Button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="modifier-groups">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {groups.map((group, index) => (
                <Draggable key={group.id} draggableId={group.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="group"
                    >
                      <Collapsible 
                        open={expandedGroups[group.id]} 
                        onOpenChange={() => toggleGroupExpand(group.id)}
                        className="border rounded-xl bg-white shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border-b">
                          <div {...provided.dragHandleProps} className="cursor-move text-slate-400 hover:text-slate-600">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200">
                              {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </CollapsibleTrigger>

                          <div className="flex-1 font-medium">
                            {group.name || '(קבוצה ללא שם)'}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                            <span>{group.type === 'single' ? 'בחירה יחידה' : 'בחירה מרובה'}</span>
                            <span className="mx-1">•</span>
                            <span>{group.required ? 'חובה' : 'רשות'}</span>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeGroup(group.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <CollapsibleContent className="p-4 space-y-4">
                          {/* Group Settings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-lg border">
                            <div className="space-y-2">
                              <Label>שם הקבוצה (למשל: "בחר סוג לחם")</Label>
                              <Input 
                                value={group.name} 
                                onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                                placeholder="כותרת הקבוצה"
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>סוג בחירה</Label>
                              <Select 
                                value={group.type} 
                                onValueChange={(val) => updateGroup(group.id, 'type', val)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">בחירה יחידה (Radio)</SelectItem>
                                  <SelectItem value="multiple">בחירה מרובה (Checkbox)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between md:col-span-2 bg-white p-3 rounded border">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={group.required}
                                  onCheckedChange={(checked) => updateGroup(group.id, 'required', checked)}
                                  id={`req-${group.id}`}
                                />
                                <Label htmlFor={`req-${group.id}`} className="cursor-pointer">חובת בחירה?</Label>
                              </div>

                              {group.type === 'multiple' && (
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap">מינימום:</Label>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      value={group.min_selection}
                                      onChange={(e) => updateGroup(group.id, 'min_selection', parseInt(e.target.value) || 0)}
                                      className="w-16 h-8"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs whitespace-nowrap">מקסימום (0=ללא):</Label>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      value={group.max_selection}
                                      onChange={(e) => updateGroup(group.id, 'max_selection', parseInt(e.target.value) || 0)}
                                      className="w-16 h-8"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-slate-600">אפשרויות</Label>
                              <Button variant="ghost" size="sm" onClick={() => addOption(group.id)} className="text-indigo-600 h-8">
                                <Plus className="w-3 h-3 ml-1" /> הוסף אפשרות
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {group.options.map((option) => (
                                <div key={option.id} className="flex items-center gap-2 animate-fadeIn">
                                  <Input
                                    value={option.name}
                                    onChange={(e) => updateOption(group.id, option.id, 'name', e.target.value)}
                                    placeholder="שם האפשרות (לדוגמה: לחם מלא)"
                                    className="flex-1 h-9"
                                  />
                                  <div className="relative w-24">
                                    <Input
                                      value={option.price}
                                      onChange={(e) => updateOption(group.id, option.id, 'price', e.target.value)}
                                      placeholder="0"
                                      className="h-9 pl-6"
                                    />
                                    <span className="absolute left-2 top-2.5 text-xs text-slate-400">₪</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(group.id, option.id)}
                                    className="h-9 w-9 text-slate-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
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

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>שלב קבוצות הרכבה קיימות</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {availableGroupSources.map(source => (
              <Card key={source.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => importGroupsFrom(source)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{source.name || 'ללא שם'}</h4>
                        {source.type === 'item' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            מוצר
                          </span>
                        )}
                        {source.type === 'category' && (
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                            קטגוריה
                          </span>
                        )}
                      </div>
                      {source.categoryName && (
                        <p className="text-xs text-slate-400 mt-0.5">מתוך: {source.categoryName}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {source.modifierGroups.length} קבוצות הרכבה
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-purple-600">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {source.modifierGroups.map((grp, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                        {grp.name || `קבוצה ${idx + 1}`}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {availableGroupSources.length === 0 && (
              <p className="text-center text-slate-400 py-8">אין קבוצות הרכבה זמינות לייבוא</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
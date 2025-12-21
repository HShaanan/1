import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, ExternalLink, Save, Filter, Check, X, Store, Sparkles, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminStoresPage() {
        const navigate = useNavigate();
        const [pages, setPages] = useState([]);
        const [loading, setLoading] = useState(true);
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [categories, setCategories] = useState([]);
        const [kashrutList, setKashrutList] = useState([]);
        const [allBusinesses, setAllBusinesses] = useState([]);
        const [selectedBusinesses, setSelectedBusinesses] = useState([]);
        const [businessSearch, setBusinessSearch] = useState("");
        const [isGenerating, setIsGenerating] = useState(false);
        const [bulkGenerating, setBulkGenerating] = useState(false);
        const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
        const [bulkPreview, setBulkPreview] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    id: null,
    title: "",
    slug: "",
    description: "",
    meta_title: "",
    meta_description: "",
    is_active: true,
    filters: {
        category_id: "all",
        subcategory_ids: [],
        kashrut: [],
        active_tab: "all",
        delivery: false,
        pickup: false,
        open_now: false
    }
  });

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagesData, cats, kashrut, businesses] = await Promise.all([
        base44.entities.StorePage.list("-view_count"),
        base44.entities.Category.list("sort_order"),
        base44.entities.Kashrut.list("name"),
        base44.entities.BusinessPage.filter({ is_active: true }, "business_name")
      ]);
      setPages(pagesData);
      setCategories(cats);
      setKashrutList(kashrut);
      setAllBusinesses(businesses.map(b => ({ id: b.id, name: b.business_name })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (page) => {
    if (page) {
        setFormState({
            id: page.id,
            title: page.title,
            slug: page.slug,
            description: page.description || "",
            meta_title: page.meta_title || "",
            meta_description: page.meta_description || "",
            is_active: page.is_active,
            filters: {
                category_id: page.filters?.category_id || "all",
                subcategory_ids: page.filters?.subcategory_ids || [],
                kashrut: page.filters?.kashrut || [],
                active_tab: page.filters?.active_tab || "all",
                delivery: page.filters?.delivery || false,
                pickup: page.filters?.pickup || false,
                open_now: page.filters?.open_now || false
            }
        });
        setSelectedBusinesses(page.specific_business_ids || []);
    } else {
        setFormState({
            id: null,
            title: "",
            slug: "",
            description: "",
            meta_title: "",
            meta_description: "",
            is_active: true,
            filters: {
                category_id: "all",
                subcategory_ids: [],
                kashrut: [],
                active_tab: "all",
                delivery: false,
                pickup: false,
                open_now: false
            }
        });
        setSelectedBusinesses([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const filtersToSave = {
        category_id: formState.filters.category_id === "all" ? null : formState.filters.category_id,
        subcategory_ids: formState.filters.subcategory_ids.length > 0 ? formState.filters.subcategory_ids : null,
        kashrut: formState.filters.kashrut.length > 0 ? formState.filters.kashrut : null,
        active_tab: formState.filters.active_tab === "all" ? null : formState.filters.active_tab,
        delivery: formState.filters.delivery,
        pickup: formState.filters.pickup,
        open_now: formState.filters.open_now,
    };

    // Clean slug logic: lowercase, trim, replace spaces/plus with dashes
    const cleanSlug = formState.slug.trim().toLowerCase().replace(/[\s+]+/g, '-');
    
    const data = {
      title: formState.title,
      slug: cleanSlug,
      description: formState.description,
      meta_title: formState.meta_title,
      meta_description: formState.meta_description,
      is_active: formState.is_active,
      specific_business_ids: selectedBusinesses.length > 0 ? selectedBusinesses : null,
      filters: filtersToSave
    };

    try {
      if (formState.id) {
        await base44.entities.StorePage.update(formState.id, data);
      } else {
        await base44.entities.StorePage.create(data);
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      alert("שגיאה בשמירה: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק דף זה?")) return;
    try {
      await base44.entities.StorePage.delete(id);
      fetchData();
    } catch (error) {
      alert("שגיאה במחיקה");
    }
  };

  const toggleBusinessSelection = (id) => {
    setSelectedBusinesses(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        return [...prev, id];
    });
  };

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(b => b.name.toLowerCase().includes(businessSearch.toLowerCase()));
  }, [allBusinesses, businessSearch]);

  const availableSubcategories = useMemo(() => {
    if (formState.filters.category_id === "all") return [];
    return categories.filter(c => c.parent_id === formState.filters.category_id);
  }, [categories, formState.filters.category_id]);

  const toggleSubcategory = (id) => {
    setFormState(prev => {
        const current = prev.filters.subcategory_ids || [];
        const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        return { ...prev, filters: { ...prev.filters, subcategory_ids: updated } };
    });
  };

  const toggleKashrut = (name) => {
    setFormState(prev => {
        const current = prev.filters.kashrut || [];
        const updated = current.includes(name) ? current.filter(x => x !== name) : [...current, name];
        return { ...prev, filters: { ...prev.filters, kashrut: updated } };
    });
  };

  const generateAiDescription = async () => {
    if (!formState.title) {
        alert("נא להזין כותרת לפני יצירת תוכן");
        return;
    }
    setIsGenerating(true);
    try {
        const res = await base44.functions.invoke('generateAiContent', {
            type: 'store_seo',
            data: {
                title: formState.title,
                filters: formState.filters
            }
        });
        if (res.data?.success) {
            setFormState(prev => ({ ...prev, description: res.data.data.content }));
        }
    } catch (e) {
        console.error(e);
        alert("שגיאה ביצירת תוכן");
    } finally {
        setIsGenerating(false);
    }
  };

  const optimizeSeo = async () => {
    if (!formState.title) {
        alert("נא להזין כותרת לפני אופטימיזציה");
        return;
    }
    setIsGenerating(true);
    try {
        const res = await base44.functions.invoke('generateAiContent', {
            type: 'optimize_store_meta',
            data: {
                title: formState.title,
                current_description: formState.description
            }
        });
        if (res.data?.success) {
            const { h1, meta_title, meta_description } = res.data.data;
            setFormState(prev => ({
                ...prev,
                title: h1 || prev.title,
                meta_title: meta_title || prev.meta_title,
                meta_description: meta_description || prev.meta_description
            }));
        }
    } catch (e) {
        console.error(e);
        alert("שגיאה באופטימיזציה");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    setBulkDialogOpen(true);
    setBulkGenerating(true);
    try {
        const res = await base44.functions.invoke('generateStorePagesAtScale', {
            mode: 'preview'
        });
        if (res.data?.success) {
            setBulkPreview(res.data);
        }
    } catch (e) {
        console.error(e);
        alert("שגיאה בטעינת תצוגה מקדימה");
    } finally {
        setBulkGenerating(false);
    }
  };

  const executeBulkGeneration = async (selectedFilters) => {
    setBulkGenerating(true);
    try {
        const res = await base44.functions.invoke('generateStorePagesAtScale', {
            mode: 'create',
            batchSize: 10,
            filters: selectedFilters
        });
        if (res.data?.success) {
            alert(`נוצרו בהצלחה ${res.data.stats.created} דפי נחיתה!`);
            setBulkDialogOpen(false);
            fetchData();
        }
    } catch (e) {
        console.error(e);
        alert("שגיאה ביצירת דפים: " + e.message);
    } finally {
        setBulkGenerating(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ניהול דפי SEO (Stores)</h1>
            <p className="text-slate-600">צור ונהל דפי נחיתה מקודמים עם סינונים מותאמים</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(createPageUrl('AdminSeoAgent'))} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 hover:from-purple-600 hover:to-indigo-700">
                <Sparkles className="w-4 h-4 ml-2" /> AI Agent
              </Button>
              <Button variant="default" onClick={handleBulkGenerate} disabled={bulkGenerating} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700">
                {bulkGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Wand2 className="w-4 h-4 ml-2" />}
                {bulkGenerating ? 'יוצר...' : 'יצירה מאסיבית'}
              </Button>
              <Button onClick={() => openEditDialog(null)}>
                <Plus className="w-4 h-4 ml-2" /> דף חדש
              </Button>
            </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">כותרת</TableHead>
                  <TableHead className="text-right">Slug</TableHead>
                  <TableHead className="text-right">סוג</TableHead>
                  <TableHead className="text-right">צפיות</TableHead>
                  <TableHead className="text-center">פעיל</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{page.slug}</TableCell>
                    <TableCell>
                        {page.specific_business_ids?.length > 0 ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">רשימה ידנית ({page.specific_business_ids.length})</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">סינון אוטומטי</Badge>
                        )}
                    </TableCell>
                    <TableCell>{page.view_count || 0}</TableCell>
                    <TableCell className="text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${page.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Stores') + `?slug=${page.slug}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(page)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(page.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pages.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            אין דפים להצגה
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formState.id ? "עריכת דף" : "יצירת דף חדש"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <Label>כותרת הדף (H1)</Label>
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={optimizeSeo}
                          disabled={isGenerating}
                          className="h-6 text-xs text-indigo-600"
                      >
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          אופטימיזציה ל-SEO
                      </Button>
                  </div>
                  <Input 
                    value={formState.title} 
                    onChange={(e) => setFormState({...formState, title: e.target.value})} 
                    required 
                    placeholder="למשל: הפיצריות הכי טובות בביתר" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input 
                    value={formState.slug} 
                    onChange={(e) => setFormState({...formState, slug: e.target.value})}
                    required 
                    placeholder="best-pizza-beitar" 
                    className="font-mono text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>תוכן (SEO Text)</Label>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={generateAiDescription}
                        disabled={isGenerating}
                        className="h-7 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                        כתוב לי תיאור עשיר ב-AI
                    </Button>
                </div>
                <Textarea 
                    value={formState.description} 
                    onChange={(e) => setFormState({...formState, description: e.target.value})}
                    rows={8} 
                    placeholder="טקסט עשיר שיופיע בראש הדף..." 
                    className="font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input 
                    value={formState.meta_title} 
                    onChange={(e) => setFormState({...formState, meta_title: e.target.value})}
                    placeholder="כותרת לגוגל" 
                   />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Input 
                    value={formState.meta_description} 
                    onChange={(e) => setFormState({...formState, meta_description: e.target.value})}
                    placeholder="תיאור לגוגל" 
                   />
                </div>
              </div>

              {/* Business Selection */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-purple-600" /> בחירת עסקים ספציפיים (אופציונלי)
                </h3>
                <p className="text-xs text-slate-500">אם נבחרו עסקים כאן, הגדרות הסינון למטה יתעלמו ויוצגו רק העסקים שנבחרו.</p>
                
                <div className="space-y-2">
                    <Input 
                        placeholder="חפש עסק..." 
                        value={businessSearch} 
                        onChange={(e) => setBusinessSearch(e.target.value)} 
                        className="bg-white"
                    />
                    <div className="border rounded-md bg-white h-48 overflow-y-auto p-2 space-y-1">
                        {filteredBusinesses.map(b => (
                            <div 
                                key={b.id} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-50 ${selectedBusinesses.includes(b.id) ? 'bg-purple-50 border border-purple-200' : ''}`}
                                onClick={() => toggleBusinessSelection(b.id)}
                            >
                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedBusinesses.includes(b.id) ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                                    {selectedBusinesses.includes(b.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm">{b.name}</span>
                            </div>
                        ))}
                    </div>
                    {selectedBusinesses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBusinesses.map(id => {
                                const business = allBusinesses.find(b => b.id === id);
                                return (
                                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                        {business?.name || id}
                                        <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => toggleBusinessSelection(id)} />
                                    </Badge>
                                );
                            })}
                            <Button type="button" variant="link" size="sm" onClick={() => setSelectedBusinesses([])} className="text-xs text-red-500 h-auto p-0">
                                נקה הכל
                            </Button>
                        </div>
                    )}
                </div>
              </div>

              {/* Automatic Filters */}
              <div className={`bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200 ${selectedBusinesses.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" /> הגדרות סינון אוטומטי
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>קטגוריה</Label>
                        <Select 
                            value={formState.filters.category_id} 
                            onValueChange={(val) => setFormState({...formState, filters: {...formState.filters, category_id: val}})}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="כל הקטגוריות" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">הכל</SelectItem>
                                {categories.filter(c => !c.parent_id).map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>סוג (טאב)</Label>
                        <Select 
                            value={formState.filters.active_tab}
                            onValueChange={(val) => setFormState({...formState, filters: {...formState.filters, active_tab: val}})}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="הכל" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">הכל</SelectItem>
                                <SelectItem value="food">אוכל ומסעדות</SelectItem>
                                <SelectItem value="shopping">קניות ושירותים</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {availableSubcategories.length > 0 && (
                    <div className="space-y-2">
                        <Label>תתי קטגוריה</Label>
                        <div className="flex flex-wrap gap-2 p-2 bg-white border rounded-md">
                            {availableSubcategories.map(sub => (
                                <Badge 
                                    key={sub.id} 
                                    variant={formState.filters.subcategory_ids?.includes(sub.id) ? "default" : "outline"}
                                    className="cursor-pointer select-none"
                                    onClick={() => toggleSubcategory(sub.id)}
                                >
                                    {sub.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>סינון כשרות</Label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white border rounded-md max-h-32 overflow-y-auto">
                        {kashrutList.map(k => (
                            <Badge 
                                key={k.id} 
                                variant={formState.filters.kashrut?.includes(k.name) ? "default" : "outline"}
                                className="cursor-pointer select-none"
                                onClick={() => toggleKashrut(k.name)}
                            >
                                {k.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={formState.filters.delivery} 
                            onCheckedChange={(val) => setFormState({...formState, filters: {...formState.filters, delivery: val}})}
                            id="delivery" 
                        />
                        <Label htmlFor="delivery">משלוחים בלבד</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={formState.filters.pickup}
                            onCheckedChange={(val) => setFormState({...formState, filters: {...formState.filters, pickup: val}})}
                            id="pickup" 
                        />
                        <Label htmlFor="pickup">איסוף עצמי בלבד</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={formState.filters.open_now}
                            onCheckedChange={(val) => setFormState({...formState, filters: {...formState.filters, open_now: val}})}
                            id="open_now" 
                        />
                        <Label htmlFor="open_now">פתוח עכשיו בלבד</Label>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch 
                    checked={formState.is_active}
                    onCheckedChange={(val) => setFormState({...formState, is_active: val})}
                    id="is_active" 
                />
                <Label htmlFor="is_active">דף פעיל</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
                <Button type="submit">
                    <Save className="w-4 h-4 ml-2" /> שמור דף
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
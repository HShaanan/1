import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, ExternalLink, Save, Filter, Check, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminStoresPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [businessSearch, setBusinessSearch] = useState("");

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagesData, cats, businesses] = await Promise.all([
        base44.entities.StorePage.list("-view_count"),
        base44.entities.Category.list("sort_order"),
        base44.entities.BusinessPage.filter({ is_active: true }, "business_name") // Load lightweight list
      ]);
      setPages(pagesData);
      setCategories(cats);
      setAllBusinesses(businesses.map(b => ({ id: b.id, name: b.business_name })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // When opening edit dialog, sync selected businesses
  useEffect(() => {
    if (editingPage) {
        setSelectedBusinesses(editingPage.specific_business_ids || []);
    } else {
        setSelectedBusinesses([]);
    }
  }, [editingPage]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = {
        category_id: formData.get("category_id") || undefined,
        active_tab: formData.get("active_tab") || undefined,
        delivery: formData.get("delivery") === "on",
        pickup: formData.get("pickup") === "on",
        open_now: formData.get("open_now") === "on",
    };

    const data = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      meta_title: formData.get("meta_title"),
      meta_description: formData.get("meta_description"),
      is_active: formData.get("is_active") === "on",
      specific_business_ids: selectedBusinesses.length > 0 ? selectedBusinesses : null,
      filters: filters
    };

    try {
      if (editingPage) {
        await base44.entities.StorePage.update(editingPage.id, data);
      } else {
        await base44.entities.StorePage.create(data);
      }
      setIsDialogOpen(false);
      setEditingPage(null);
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

  return (
    <div className="p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ניהול דפי SEO (Stores)</h1>
            <p className="text-slate-600">צור ונהל דפי נחיתה מקודמים עם סינונים מותאמים</p>
          </div>
          <Button onClick={() => { setEditingPage(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 ml-2" /> דף חדש
          </Button>
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
                        <Button variant="ghost" size="sm" onClick={() => window.open(createPageUrl(`Stores?slug=${page.slug}`), '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingPage(page); setIsDialogOpen(true); }}>
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
              <DialogTitle>{editingPage ? "עריכת דף" : "יצירת דף חדש"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>כותרת הדף (H1)</Label>
                  <Input name="title" defaultValue={editingPage?.title} required placeholder="למשל: הפיצריות הכי טובות בביתר" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input name="slug" defaultValue={editingPage?.slug} required placeholder="best-pizza-beitar" className="font-mono text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>תוכן (SEO Text)</Label>
                <Textarea name="description" defaultValue={editingPage?.description} rows={5} placeholder="טקסט עשיר שיופיע בראש הדף..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input name="meta_title" defaultValue={editingPage?.meta_title} placeholder="כותרת לגוגל" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Input name="meta_description" defaultValue={editingPage?.meta_description} placeholder="תיאור לגוגל" />
                </div>
              </div>

              {/* Business Selection Section */}
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

              {/* Automatic Filters (Fallback) */}
              <div className={`bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200 ${selectedBusinesses.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" /> הגדרות סינון אוטומטי
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>קטגוריה</Label>
                        <Select name="category_id" defaultValue={editingPage?.filters?.category_id || "all"}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="כל הקטגוריות" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">הכל</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>סוג (טאב)</Label>
                        <Select name="active_tab" defaultValue={editingPage?.filters?.active_tab || "all"}>
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

                <div className="flex gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <Switch name="delivery" defaultChecked={editingPage?.filters?.delivery} id="delivery" />
                        <Label htmlFor="delivery">משלוחים בלבד</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch name="pickup" defaultChecked={editingPage?.filters?.pickup} id="pickup" />
                        <Label htmlFor="pickup">איסוף עצמי בלבד</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch name="open_now" defaultChecked={editingPage?.filters?.open_now} id="open_now" />
                        <Label htmlFor="open_now">פתוח עכשיו בלבד</Label>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch name="is_active" defaultChecked={editingPage?.is_active ?? true} id="is_active" />
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
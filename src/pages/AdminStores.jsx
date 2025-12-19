import React, { useState, useEffect } from "react";
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
import { Loader2, Plus, Edit, Trash2, ExternalLink, Save, Filter } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function AdminStoresPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [kashrutOptions, setKashrutOptions] = useState([]);

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagesData, cats, kashrut] = await Promise.all([
        base44.entities.StorePage.list("-view_count"),
        base44.entities.Category.list("sort_order"),
        base44.entities.Kashrut.list("name")
      ]);
      setPages(pagesData);
      setCategories(cats);
      setKashrutOptions(kashrut);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = {
        category_id: formData.get("category_id") || undefined,
        active_tab: formData.get("active_tab") || undefined,
        delivery: formData.get("delivery") === "on",
        pickup: formData.get("pickup") === "on",
        open_now: formData.get("open_now") === "on",
        // Multi-selects logic would go here if UI supports it, simple for now
    };

    const data = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      meta_title: formData.get("meta_title"),
      meta_description: formData.get("meta_description"),
      is_active: formData.get("is_active") === "on",
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
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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

              <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> הגדרות סינון עסקים
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
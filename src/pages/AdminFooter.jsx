import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminFooter() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [kashrutList, setKashrutList] = useState([]);
  const [formData, setFormData] = useState({
    column_type: "city",
    column_title: "",
    subcategory_name: "",
    city: "ביתר עילית",
    kashrut: "",
    link_text: "",
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksData, catsData, kashrutData] = await Promise.all([
        base44.entities.FooterLink.list("sort_order"),
        base44.entities.Category.list("name"),
        base44.entities.Kashrut.list("name")
      ]);
      
      setLinks(linksData || []);
      setCategories(catsData || []);
      setSubcategories((catsData || []).filter(c => c.parent_id));
      setKashrutList(kashrutData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await base44.entities.FooterLink.update(editingLink.id, formData);
        toast.success("הקישור עודכן בהצלחה");
      } else {
        await base44.entities.FooterLink.create(formData);
        toast.success("הקישור נוסף בהצלחה");
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("שגיאה בשמירת הקישור");
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData(link);
  };

  const handleDelete = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק קישור זה?")) return;
    
    try {
      await base44.entities.FooterLink.delete(id);
      toast.success("הקישור נמחק בהצלחה");
      loadData();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("שגיאה במחיקת הקישור");
    }
  };

  const resetForm = () => {
    setEditingLink(null);
    setFormData({
      column_type: "city",
      column_title: "",
      subcategory_name: "",
      city: "ביתר עילית",
      kashrut: "",
      link_text: "",
      sort_order: 0,
      is_active: true
    });
  };

  const changeSortOrder = async (link, direction) => {
    const newOrder = link.sort_order + (direction === 'up' ? -1 : 1);
    try {
      await base44.entities.FooterLink.update(link.id, { sort_order: newOrder });
      loadData();
    } catch (error) {
      toast.error("שגיאה בשינוי הסדר");
    }
  };

  const groupedLinks = links.reduce((acc, link) => {
    const key = `${link.column_type}-${link.column_title}`;
    if (!acc[key]) {
      acc[key] = {
        type: link.column_type,
        title: link.column_title,
        links: []
      };
    }
    acc[key].links.push(link);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">ניהול Footer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingLink ? "ערוך קישור" : "הוסף קישור חדש"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">סוג עמודה</label>
                  <Select 
                    value={formData.column_type}
                    onValueChange={(value) => setFormData({...formData, column_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">לפי עיר</SelectItem>
                      <SelectItem value="kashrut">לפי כשרות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">כותרת העמודה</label>
                  <Input
                    value={formData.column_title}
                    onChange={(e) => setFormData({...formData, column_title: e.target.value})}
                    placeholder="מתמלא אוטומטית לפי העיר/כשרות"
                    required
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">הכותרת מתמלאת אוטומטית בהתאם לבחירה שלך</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">תת קטגוריה</label>
                  <Select 
                    value={formData.subcategory_name}
                    onValueChange={(value) => setFormData({...formData, subcategory_name: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר תת קטגוריה..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.icon} {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.column_type === "city" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">עיר</label>
                    <Select 
                      value={formData.city}
                      onValueChange={(value) => setFormData({...formData, city: value, column_title: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר עיר..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ביתר עילית">ביתר עילית</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.column_type === "kashrut" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">כשרות</label>
                    <Select 
                      value={formData.kashrut}
                      onValueChange={(value) => setFormData({...formData, kashrut: value, column_title: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר כשרות..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kashrutList.map((k) => (
                          <SelectItem key={k.id} value={k.name}>
                            {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">טקסט הקישור</label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData({...formData, link_text: e.target.value})}
                    placeholder="למשל: 'פיצה בביתר עילית'"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">סדר הצגה</label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">פעיל</label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 ml-2" />
                    {editingLink ? "עדכן" : "הוסף"}
                  </Button>
                  {editingLink && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      ביטול
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>תצוגה מקדימה - עמודות Footer</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">טוען...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.entries(groupedLinks).map(([key, column]) => (
                    <div key={key}>
                      <h3 className="font-bold text-lg mb-4 text-slate-900">
                        {column.type === "city" ? "🏙️" : "✨"} {column.title}
                      </h3>
                      <div className="space-y-2">
                        {column.links.map((link) => (
                          <div 
                            key={link.id}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              link.is_active ? 'bg-white border-slate-200' : 'bg-gray-100 border-gray-300 opacity-60'
                            }`}
                          >
                            <div className="flex-1">
                              <a
                                href={`/Browse?q=${encodeURIComponent(link.subcategory_name)}${
                                  link.city ? `&city=${encodeURIComponent(link.city)}` : ''
                                }${
                                  link.kashrut ? `&kashrut=${encodeURIComponent(link.kashrut)}` : ''
                                }`}
                                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                                target="_blank"
                              >
                                {link.link_text}
                              </a>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => changeSortOrder(link, 'up')}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => changeSortOrder(link, 'down')}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleEdit(link)}
                              >
                                ✏️
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-600"
                                onClick={() => handleDelete(link.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Bike, Car, Zap, Phone, Plus, FileText, Pencil, Trash2, 
  RefreshCw, Users, Clock, Calendar, CheckCircle, XCircle, Search
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'ראשון' },
  { value: 'monday', label: 'שני' },
  { value: 'tuesday', label: 'שלישי' },
  { value: 'wednesday', label: 'רביעי' },
  { value: 'thursday', label: 'חמישי' },
  { value: 'friday', label: 'שישי' },
  { value: 'saturday', label: 'שבת' },
];

const VEHICLE_TYPES = {
  scooter: { label: 'קטנוע', icon: Bike },
  electric_bike: { label: 'אופניים חשמליים', icon: Zap },
  bicycle: { label: 'אופניים', icon: Bike },
  car: { label: 'רכב', icon: Car },
};

export default function CourierFleetManagementPage() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'scooter',
    dealer_type: 'authorized',
    dealer_number: '',
    agreement_file_url: '',
    availability_start: '08:00',
    availability_end: '22:00',
    working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    is_active: true
  });

  useEffect(() => {
    loadCouriers();
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadCouriers = async () => {
    try {
      const data = await base44.entities.Courier.list();
      setCouriers(data || []);
    } catch (error) {
      console.error("Error loading couriers:", error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyAvailable = (courier) => {
    if (!courier.is_active) return false;
    if (!courier.availability_start || !courier.availability_end) return true;

    const now = currentTime;
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    // Check working day
    if (courier.working_days && courier.working_days.length > 0) {
      if (!courier.working_days.includes(currentDay)) return false;
    }

    // Check time range
    const [startH, startM] = courier.availability_start.split(':').map(Number);
    const [endH, endM] = courier.availability_end.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      vehicle_type: 'scooter',
      dealer_type: 'authorized',
      dealer_number: '',
      agreement_file_url: '',
      availability_start: '08:00',
      availability_end: '22:00',
      working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      is_active: true
    });
    setEditingCourier(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name || '',
      phone: courier.phone || '',
      vehicle_type: courier.vehicle_type || 'scooter',
      dealer_type: courier.dealer_type || 'authorized',
      dealer_number: courier.dealer_number || '',
      agreement_file_url: courier.agreement_file_url || '',
      availability_start: courier.availability_start || '08:00',
      availability_end: courier.availability_end || '22:00',
      working_days: courier.working_days || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      is_active: courier.is_active !== false
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("הקובץ גדול מדי. נא להעלות קובץ עד 2MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result && result.file_url) {
        setFormData(prev => ({ ...prev, agreement_file_url: result.file_url }));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("שגיאה בהעלאת הקובץ");
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert("נא למלא שם וטלפון");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCourier) {
        await base44.entities.Courier.update(editingCourier.id, formData);
      } else {
        await base44.entities.Courier.create({
          ...formData,
          status: 'offline',
          battery_level: 100
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadCouriers();
    } catch (error) {
      console.error("Save failed:", error);
      alert("שגיאה בשמירת השליח");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courierId) => {
    try {
      await base44.entities.Courier.delete(courierId);
      setDeleteConfirm(null);
      loadCouriers();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("שגיאה במחיקת השליח");
    }
  };

  const toggleWorkingDay = (day) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const filteredCouriers = couriers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const stats = {
    total: couriers.length,
    active: couriers.filter(c => c.is_active !== false).length,
    available: couriers.filter(c => isCurrentlyAvailable(c)).length,
    busy: couriers.filter(c => c.status === 'busy').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">טוען נתוני שליחים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" />
              ניהול צי שליחים
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} • 
              {currentTime.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadCouriers} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              רענן
            </Button>
            <Button onClick={openAddDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              הוסף שליח
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-500">סה"כ שליחים</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-slate-500">זמינים כעת</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.busy}</div>
              <div className="text-sm text-slate-500">במשלוח</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-slate-500">פעילים במערכת</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="חפש שליח לפי שם או טלפון..."
            className="pr-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Couriers List */}
        <div className="grid gap-4">
          {filteredCouriers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">אין שליחים להצגה</p>
                <Button onClick={openAddDialog} className="mt-4 gap-2">
                  <Plus size={16} />
                  הוסף שליח ראשון
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCouriers.map((courier) => {
              const VehicleIcon = VEHICLE_TYPES[courier.vehicle_type]?.icon || Bike;
              const isAvailable = isCurrentlyAvailable(courier);
              
              return (
                <Card key={courier.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Status Indicator */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            courier.status === 'busy' ? 'bg-orange-100 text-orange-600' :
                            isAvailable ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <VehicleIcon size={24} />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            courier.status === 'busy' ? 'bg-orange-500' :
                            isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800">{courier.name}</h3>
                            {courier.is_active === false && (
                              <Badge variant="secondary" className="text-xs">לא פעיל</Badge>
                            )}
                            {courier.status === 'busy' && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs">במשלוח</Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {courier.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <VehicleIcon size={14} />
                              {VEHICLE_TYPES[courier.vehicle_type]?.label}
                            </span>
                          </div>

                          {/* Availability Info */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {courier.availability_start && courier.availability_end && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Clock size={12} />
                                {courier.availability_start} - {courier.availability_end}
                              </Badge>
                            )}
                            {courier.working_days && courier.working_days.length > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Calendar size={12} />
                                {courier.working_days.length} ימים בשבוע
                              </Badge>
                            )}
                            {isAvailable ? (
                              <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                                <CheckCircle size={12} />
                                זמין כעת
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                                <XCircle size={12} />
                                לא זמין
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {courier.agreement_file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <a href={courier.agreement_file_url} target="_blank" rel="noopener noreferrer">
                              <FileText size={18} />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(courier)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(courier)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourier ? 'עריכת שליח' : 'הוספת שליח חדש'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="050-0000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>כלי רכב</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={v => setFormData({...formData, vehicle_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLE_TYPES).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>סטטוס פעילות</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={v => setFormData({...formData, is_active: v === 'active'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">פעיל</SelectItem>
                    <SelectItem value="inactive">לא פעיל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">זמינות</Label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-time">שעת התחלה</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.availability_start}
                    onChange={e => setFormData({...formData, availability_start: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-time">שעת סיום</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.availability_end}
                    onChange={e => setFormData({...formData, availability_end: e.target.value})}
                  />
                </div>
              </div>
              
              <Label className="mb-2 block">ימי עבודה</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.working_days.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleWorkingDay(day.value)}
                    className={formData.working_days.includes(day.value) ? 'bg-blue-600' : ''}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Business Info */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">פרטי עוסק</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>סוג עוסק</Label>
                  <Select
                    value={formData.dealer_type}
                    onValueChange={v => setFormData({...formData, dealer_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authorized">מורשה</SelectItem>
                      <SelectItem value="exempt">פטור</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dealer-number">מספר עוסק</Label>
                  <Input
                    id="dealer-number"
                    value={formData.dealer_number}
                    onChange={e => setFormData({...formData, dealer_number: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label>הסכם חתום (PDF/Word)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {isUploading && <span className="text-xs text-blue-500">מעלה...</span>}
              {formData.agreement_file_url && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <FileText size={12} />
                  קובץ הועלה בהצלחה
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? 'שומר...' : editingCourier ? 'שמור שינויים' : 'הוסף שליח'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שליח</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את השליח "{deleteConfirm?.name}"? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDelete(deleteConfirm.id)}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
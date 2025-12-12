import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bike, Car, Zap, 
  Phone, Plus, Clock, 
  Briefcase, Pencil, Trash2, Search,
  CheckCircle, XCircle, Users, ExternalLink, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CourierForm from './CourierForm';

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'ראשון' },
  { value: 'monday', label: 'שני' },
  { value: 'tuesday', label: 'שלישי' },
  { value: 'wednesday', label: 'רביעי' },
  { value: 'thursday', label: 'חמישי' },
  { value: 'friday', label: 'שישי' },
  { value: 'saturday', label: 'שבת' }
];

const VEHICLE_TYPES = {
  scooter: { label: 'קטנוע', icon: Bike },
  electric_bike: { label: 'אופניים חשמליים', icon: Zap },
  bicycle: { label: 'אופניים', icon: Bike },
  car: { label: 'רכב', icon: Car }
};

const DEFAULT_SHIFT = { start: '08:00', end: '22:00', days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] };

export default function CourierFleetManagementContent({ couriers, onRefresh, isCurrentlyAvailable }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getInitialCourier = () => ({
    name: '',
    phone: '',
    email: '',
    vehicle_type: 'scooter',
    dealer_type: 'authorized',
    dealer_number: '',
    agreement_file_url: '',
    default_payment_per_delivery: 0,
    shifts: [{ ...DEFAULT_SHIFT }]
  });

  const [newCourier, setNewCourier] = useState(getInitialCourier());

  const filteredCouriers = couriers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const stats = {
    total: couriers.length,
    active: couriers.filter(c => c.is_active !== false).length,
    availableNow: couriers.filter(c => isCurrentlyAvailable?.(c)).length,
    busy: couriers.filter(c => c.status === 'busy').length
  };

  const handleFileUpload = async (e, isEdit = false) => {
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
        if (isEdit) {
          setEditingCourier(prev => ({ ...prev, agreement_file_url: result.file_url }));
        } else {
          setNewCourier(prev => ({ ...prev, agreement_file_url: result.file_url }));
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("שגיאה בהעלאת הקובץ");
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  // Convert shifts array to legacy format for saving
  const shiftsToLegacy = (shifts) => {
    if (!shifts || shifts.length === 0) return { availability_start: '08:00', availability_end: '22:00', working_days: [] };
    // Use first shift as primary
    const primary = shifts[0];
    // Merge all days from all shifts
    const allDays = [...new Set(shifts.flatMap(s => s.days || []))];
    return {
      availability_start: primary.start || '08:00',
      availability_end: primary.end || '22:00',
      working_days: allDays
    };
  };

  // Convert legacy format to shifts array
  const legacyToShifts = (courier) => {
    if (courier.shifts && courier.shifts.length > 0) return courier.shifts;
    return [{
      start: courier.availability_start || '08:00',
      end: courier.availability_end || '22:00',
      days: courier.working_days || []
    }];
  };

  const handleSubmit = async () => {
    if (!newCourier.name || !newCourier.phone) {
      alert("נא למלא שם וטלפון");
      return;
    }
    setIsSaving(true);
    try {
      const legacyData = shiftsToLegacy(newCourier.shifts);
      await base44.entities.Courier.create({
        name: newCourier.name,
        phone: newCourier.phone,
        email: newCourier.email || '',
        vehicle_type: newCourier.vehicle_type,
        dealer_type: newCourier.dealer_type,
        dealer_number: newCourier.dealer_number,
        agreement_file_url: newCourier.agreement_file_url,
        default_payment_per_delivery: newCourier.default_payment_per_delivery || 0,
        ...legacyData,
        status: 'offline',
        battery_level: 100,
        is_active: true
      });
      setIsAddOpen(false);
      setNewCourier(getInitialCourier());
      onRefresh();
    } catch (error) {
      console.error("Create failed:", error);
      alert("שגיאה ביצירת השליח");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourier = (courier) => {
    setEditingCourier({ 
      ...courier,
      shifts: legacyToShifts(courier)
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCourier) return;
    setIsSaving(true);
    try {
      const legacyData = shiftsToLegacy(editingCourier.shifts);
      await base44.entities.Courier.update(editingCourier.id, {
        name: editingCourier.name,
        phone: editingCourier.phone,
        email: editingCourier.email || '',
        vehicle_type: editingCourier.vehicle_type,
        dealer_type: editingCourier.dealer_type,
        dealer_number: editingCourier.dealer_number,
        agreement_file_url: editingCourier.agreement_file_url,
        default_payment_per_delivery: editingCourier.default_payment_per_delivery || 0,
        status: editingCourier.status,
        is_active: editingCourier.is_active,
        ...legacyData
      });
      setIsEditOpen(false);
      setEditingCourier(null);
      onRefresh();
    } catch (error) {
      console.error("Update failed:", error);
      alert("שגיאה בעדכון השליח");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourier = async (courierId) => {
    try {
      await base44.entities.Courier.delete(courierId);
      onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("שגיאה במחיקת השליח");
    }
  };

  const updateShift = useCallback((shiftIndex, field, value, isEdit = false) => {
    const setter = isEdit ? setEditingCourier : setNewCourier;
    setter(prev => ({
      ...prev,
      shifts: prev.shifts.map((s, i) => i === shiftIndex ? { ...s, [field]: value } : s)
    }));
  }, []);

  const toggleShiftDay = useCallback((shiftIndex, day, isEdit = false) => {
    const setter = isEdit ? setEditingCourier : setNewCourier;
    setter(prev => ({
      ...prev,
      shifts: prev.shifts.map((s, i) => {
        if (i !== shiftIndex) return s;
        const days = s.days || [];
        return {
          ...s,
          days: days.includes(day) ? days.filter(d => d !== day) : [...days, day]
        };
      })
    }));
  }, []);

  const addShift = useCallback((isEdit = false) => {
    const setter = isEdit ? setEditingCourier : setNewCourier;
    setter(prev => ({
      ...prev,
      shifts: [...(prev.shifts || []), { start: '08:00', end: '22:00', days: [] }]
    }));
  }, []);

  const removeShift = useCallback((shiftIndex, isEdit = false) => {
    const setter = isEdit ? setEditingCourier : setNewCourier;
    setter(prev => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== shiftIndex)
    }));
  }, []);

  const getVehicleIcon = (type) => {
    const VehicleIcon = VEHICLE_TYPES[type]?.icon || Bike;
    return <VehicleIcon className="w-5 h-5" />;
  };

  // Handlers for CourierForm
  const handleNewCourierFieldChange = useCallback((field, value) => {
    setNewCourier(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditCourierFieldChange = useCallback((field, value) => {
    setEditingCourier(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNewShiftUpdate = useCallback((shiftIndex, field, value) => {
    updateShift(shiftIndex, field, value, false);
  }, [updateShift]);

  const handleEditShiftUpdate = useCallback((shiftIndex, field, value) => {
    updateShift(shiftIndex, field, value, true);
  }, [updateShift]);

  const handleNewShiftDayToggle = useCallback((shiftIndex, day) => {
    toggleShiftDay(shiftIndex, day, false);
  }, [toggleShiftDay]);

  const handleEditShiftDayToggle = useCallback((shiftIndex, day) => {
    toggleShiftDay(shiftIndex, day, true);
  }, [toggleShiftDay]);

  const handleNewAddShift = useCallback(() => {
    addShift(false);
  }, [addShift]);

  const handleEditAddShift = useCallback(() => {
    addShift(true);
  }, [addShift]);

  const handleNewRemoveShift = useCallback((shiftIndex) => {
    removeShift(shiftIndex, false);
  }, [removeShift]);

  const handleEditRemoveShift = useCallback((shiftIndex) => {
    removeShift(shiftIndex, true);
  }, [removeShift]);

  const handleNewFileUpload = useCallback((e) => {
    handleFileUpload(e, false);
  }, []);

  const handleEditFileUpload = useCallback((e) => {
    handleFileUpload(e, true);
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">סה"כ שליחים</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.availableNow}</p>
              <p className="text-xs text-slate-500">זמינים כעת</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Bike size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.busy}</p>
              <p className="text-xs text-slate-500">במשלוח</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">{stats.total - stats.active}</p>
              <p className="text-xs text-slate-500">לא פעילים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="חפש שליח לפי שם או טלפון..." 
            className="pl-4 pr-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              הוסף שליח
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת שליח חדש</DialogTitle>
            </DialogHeader>
            <CourierForm 
              courier={newCourier} 
              onFieldChange={handleNewCourierFieldChange}
              onShiftUpdate={handleNewShiftUpdate}
              onShiftDayToggle={handleNewShiftDayToggle}
              onAddShift={handleNewAddShift}
              onRemoveShift={handleNewRemoveShift}
              onFileUpload={handleNewFileUpload}
              isUploading={isUploading}
            />
            <DialogFooter className="flex-row-reverse gap-2">
              <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
                {isSaving ? 'שומר...' : 'שמור שליח'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>ביטול</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Couriers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCouriers.map((courier) => {
          const isAvailable = isCurrentlyAvailable?.(courier);
          const isBusy = courier.status === 'busy';
          
          return (
            <Card key={courier.id} className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${
                        courier.status === 'offline' ? 'bg-slate-300' : 'bg-slate-800'
                      }`}>
                        {getVehicleIcon(courier.vehicle_type)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                        isBusy ? 'bg-orange-500' : isAvailable ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{courier.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={10} />
                        {courier.phone}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={`text-[10px] ${
                    isBusy ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {isBusy ? 'במשלוח' : isAvailable ? 'זמין' : 'לא בטווח'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 mb-3">
                  {courier.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-400" />
                      <span dir="ltr">{courier.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span dir="ltr">
                      {courier.availability_start || '08:00'} - {courier.availability_end || '22:00'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} className="text-slate-400" />
                    <span>{courier.dealer_type === 'exempt' ? 'עוסק פטור' : 'עוסק מורשה'}</span>
                    {courier.dealer_number && <span className="text-slate-400" dir="ltr">#{courier.dealer_number}</span>}
                  </div>
                  {courier.working_days?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {DAYS_OF_WEEK.filter(d => courier.working_days.includes(d.value)).map(d => (
                        <span key={d.value} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                          {d.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Link 
                    to={createPageUrl('CourierProfile') + `?id=${courier.id}`}
                    className="flex-1"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-1 text-xs"
                    >
                      <ExternalLink size={12} />
                      דוח משלוחים
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-xs"
                    onClick={() => handleEditCourier(courier)}
                  >
                    <Pencil size={12} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת שליח</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתה בטוח שברצונך למחוק את השליח "{courier.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteCourier(courier.id)}
                        >
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCouriers.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p>{searchTerm ? 'לא נמצאו שליחים התואמים לחיפוש' : 'אין שליחים רשומים במערכת'}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת פרטי שליח</DialogTitle>
          </DialogHeader>
          {editingCourier && (
            <CourierForm 
              courier={editingCourier} 
              onFieldChange={handleEditCourierFieldChange}
              onShiftUpdate={handleEditShiftUpdate}
              onShiftDayToggle={handleEditShiftDayToggle}
              onAddShift={handleEditAddShift}
              onRemoveShift={handleEditRemoveShift}
              onFileUpload={handleEditFileUpload}
              isEdit
              isUploading={isUploading}
            />
          )}
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleSaveEdit} disabled={isSaving || isUploading}>
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
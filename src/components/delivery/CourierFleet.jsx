import React, { useState } from 'react';
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
  DialogTrigger,
  DialogFooter
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bike, Car, Zap, 
  Phone, Plus, FileText,
  Briefcase, Hash, Pencil, Trash2, Clock
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'א' },
  { value: 'monday', label: 'ב' },
  { value: 'tuesday', label: 'ג' },
  { value: 'wednesday', label: 'ד' },
  { value: 'thursday', label: 'ה' },
  { value: 'friday', label: 'ו' },
  { value: 'saturday', label: 'ש' }
];

export default function CourierFleet({ couriers, onRefresh, isCurrentlyAvailable }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedCourierId, setExpandedCourierId] = useState(null);
  const [editingCourier, setEditingCourier] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newCourier, setNewCourier] = useState({
    name: '',
    phone: '',
    vehicle_type: 'scooter',
    dealer_type: 'authorized',
    dealer_number: '',
    agreement_file_url: ''
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // הגבלת גודל ל-2MB למניעת שגיאות רשת
    if (file.size > 2 * 1024 * 1024) {
      alert("הקובץ גדול מדי. נא להעלות קובץ עד 2MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (result && result.file_url) {
          setNewCourier(prev => ({ ...prev, agreement_file_url: result.file_url }));
      } else {
          throw new Error("התקבל מענה לא תקין מהשרת");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      let msg = "שגיאה בהעלאת הקובץ.";
      if (error.message === "Network Error" || error.name === "AxiosError") {
          msg += " בעיית תקשורת. נא לבדוק את החיבור ולנסות שוב.";
      }
      alert(msg);
      e.target.value = ""; // איפוס השדה כדי לאפשר בחירה מחדש
      setNewCourier(prev => ({ ...prev, agreement_file_url: '' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await base44.entities.Courier.create({
        ...newCourier,
        status: 'offline',
        battery_level: 100
      });
      setIsAddOpen(false);
      setNewCourier({
        name: '',
        phone: '',
        vehicle_type: 'scooter',
        dealer_type: 'authorized',
        dealer_number: '',
        agreement_file_url: ''
      });
      onRefresh();
    } catch (error) {
      console.error("Create failed:", error);
      alert("שגיאה ביצירת השליח");
    }
  };

  const handleEditCourier = (courier) => {
    setEditingCourier({ ...courier });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCourier) return;
    setIsSaving(true);
    try {
      await base44.entities.Courier.update(editingCourier.id, {
        name: editingCourier.name,
        phone: editingCourier.phone,
        vehicle_type: editingCourier.vehicle_type,
        dealer_type: editingCourier.dealer_type,
        dealer_number: editingCourier.dealer_number,
        agreement_file_url: editingCourier.agreement_file_url,
        status: editingCourier.status,
        is_active: editingCourier.is_active
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
      setExpandedCourierId(null);
      onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("שגיאה במחיקת השליח");
    }
  };

  const handleEditFileUpload = async (e) => {
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
        setEditingCourier(prev => ({ ...prev, agreement_file_url: result.file_url }));
      } else {
        throw new Error("התקבל מענה לא תקין מהשרת");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("שגיאה בהעלאת הקובץ");
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'scooter': return <Bike className="w-5 h-5" />;
      case 'electric_bike': return <Zap className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'bicycle': return <Bike className="w-5 h-5" />;
      default: return <Bike className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status, courier) => {
    // If we have availability checker, use it for more accurate status
    if (isCurrentlyAvailable) {
      const isAvailable = isCurrentlyAvailable(courier);
      if (status === 'busy') return 'bg-orange-500';
      // Schedule-based availability takes priority over status field
      if (isAvailable) return 'bg-emerald-500';
      return 'bg-red-500';
    }
    
    // Fallback to simple status check
    switch(status) {
      case 'idle': return 'bg-emerald-500';
      case 'busy': return 'bg-orange-500';
      case 'offline': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status, courier) => {
    // If we have availability checker, use it for more accurate label
    if (isCurrentlyAvailable) {
      const isAvailable = isCurrentlyAvailable(courier);
      if (status === 'busy') return 'במשלוח כעת';
      // Schedule-based availability takes priority over status field
      if (isAvailable) return 'זמין כעת';
      return 'לא בטווח שעות';
    }
    
    switch(status) {
      case 'idle': return 'פנוי למשלוח';
      case 'busy': return 'במשלוח כעת';
      case 'offline': return 'לא זמין';
      default: return status;
    }
  };

  return (
    <Card className="h-full border-0 shadow-md bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Bike size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">צי שליחים</h3>
            <div className="text-xs text-slate-500">
              {couriers.filter(c => c.status === 'idle').length} פנויים מתוך {couriers.length}
            </div>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>הוספת שליח חדש</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input 
                  id="name" 
                  value={newCourier.name} 
                  onChange={e => setNewCourier({...newCourier, name: e.target.value})}
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input 
                  id="phone" 
                  value={newCourier.phone} 
                  onChange={e => setNewCourier({...newCourier, phone: e.target.value})}
                  placeholder="050-0000000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle">כלי רכב</Label>
                <Select 
                  value={newCourier.vehicle_type} 
                  onValueChange={v => setNewCourier({...newCourier, vehicle_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר כלי רכב" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scooter">קטנוע</SelectItem>
                    <SelectItem value="electric_bike">אופניים חשמליים</SelectItem>
                    <SelectItem value="bicycle">אופניים</SelectItem>
                    <SelectItem value="car">רכב</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dealer_type">סוג עוסק</Label>
                  <Select 
                    value={newCourier.dealer_type} 
                    onValueChange={v => setNewCourier({...newCourier, dealer_type: v})}
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
                  <Label htmlFor="dealer_number">מספר עוסק</Label>
                  <Input 
                    id="dealer_number" 
                    value={newCourier.dealer_number} 
                    onChange={e => setNewCourier({...newCourier, dealer_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>הסכם חתום (PDF/Word)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  {isUploading && <span className="text-xs text-blue-500">מעלה...</span>}
                </div>
                {newCourier.agreement_file_url && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FileText size={12} />
                    הקובץ הועלה בהצלחה
                  </span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!newCourier.name || !newCourier.phone || isUploading}>
                שמור שליח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <CardContent className="p-0 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        {couriers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>אין שליחים רשומים במערכת</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {couriers.map((courier) => (
              <div 
                key={courier.id} 
                className="hover:bg-slate-50 transition-colors group"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedCourierId(expandedCourierId === courier.id ? null : courier.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${
                          courier.status === 'offline' ? 'bg-slate-300' : 'bg-slate-800'
                        }`}>
                          {getVehicleIcon(courier.vehicle_type)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${getStatusColor(courier.status, courier)}`} />
                      </div>
                      
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {courier.name}
                          {courier.active_order_id && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200">
                              במשלוח
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {courier.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {(() => {
                        const isAvailable = isCurrentlyAvailable ? isCurrentlyAvailable(courier) : true;
                        const isBusy = courier.status === 'busy';

                        return (
                          <Badge variant="outline" className={`
                            ${isBusy ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                            ${!isBusy && isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                            ${!isBusy && !isAvailable ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}>
                            {getStatusLabel(courier.status, courier)}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Basic Stats Bar */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-slate-100">
                    <div className="flex gap-2 flex-wrap">
                      {(courier.availability_start || courier.availability_end) && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded" dir="ltr">
                          <Clock size={10} className="text-slate-400" />
                          {courier.availability_start || '08:00'} - {courier.availability_end || '22:00'}
                        </div>
                      )}
                      {courier.working_days?.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          {DAYS_OF_WEEK.map(d => (
                            <span 
                              key={d.value} 
                              className={`w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-medium ${
                                courier.working_days.includes(d.value) 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              {d.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">
                      {expandedCourierId === courier.id ? 'סגור פרטים' : 'הצג פרטים'}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCourierId === courier.id && (
                  <div className="px-4 pb-4 pt-0 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">סוג עוסק</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <Briefcase size={14} className="text-slate-400" />
                          {courier.dealer_type === 'exempt' ? 'עוסק פטור' : 'עוסק מורשה'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs mb-1">מספר עוסק</span>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <Hash size={14} className="text-slate-400" />
                          {courier.dealer_number || '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                       <span className="text-slate-500 block text-xs mb-2">מסמכים</span>
                       {courier.agreement_file_url ? (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           asChild
                           className="w-full justify-start gap-2 bg-white"
                         >
                           <a href={courier.agreement_file_url} target="_blank" rel="noopener noreferrer">
                             <FileText size={14} className="text-blue-500" />
                             צפה בהסכם חתום
                           </a>
                         </Button>
                       ) : (
                         <span className="text-slate-400 text-xs italic">לא הועלה הסכם</span>
                       )}
                            </div>

                             {/* Action Buttons */}
                             <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="flex-1 gap-1"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleEditCourier(courier);
                                 }}
                               >
                                 <Pencil size={14} />
                                 עריכה
                               </Button>

                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                     <Trash2 size={14} />
                                     מחיקה
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>מחיקת שליח</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       האם אתה בטוח שברצונך למחוק את השליח "{courier.name}"? פעולה זו לא ניתנת לביטול.
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
                         </div>
                       )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Courier Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עריכת פרטי שליח</DialogTitle>
          </DialogHeader>
          {editingCourier && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">שם מלא</Label>
                <Input 
                  id="edit-name" 
                  value={editingCourier.name} 
                  onChange={e => setEditingCourier({...editingCourier, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">טלפון</Label>
                <Input 
                  id="edit-phone" 
                  value={editingCourier.phone} 
                  onChange={e => setEditingCourier({...editingCourier, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-vehicle">כלי רכב</Label>
                  <Select 
                    value={editingCourier.vehicle_type} 
                    onValueChange={v => setEditingCourier({...editingCourier, vehicle_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scooter">קטנוע</SelectItem>
                      <SelectItem value="electric_bike">אופניים חשמליים</SelectItem>
                      <SelectItem value="bicycle">אופניים</SelectItem>
                      <SelectItem value="car">רכב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">סטטוס</Label>
                  <Select 
                    value={editingCourier.status} 
                    onValueChange={v => setEditingCourier({...editingCourier, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idle">פנוי</SelectItem>
                      <SelectItem value="busy">עסוק</SelectItem>
                      <SelectItem value="offline">לא זמין</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-dealer-type">סוג עוסק</Label>
                  <Select 
                    value={editingCourier.dealer_type} 
                    onValueChange={v => setEditingCourier({...editingCourier, dealer_type: v})}
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
                  <Label htmlFor="edit-dealer-number">מספר עוסק</Label>
                  <Input 
                    id="edit-dealer-number" 
                    value={editingCourier.dealer_number || ''} 
                    onChange={e => setEditingCourier({...editingCourier, dealer_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>הסכם חתום (PDF/Word)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleEditFileUpload}
                    className="cursor-pointer"
                  />
                  {isUploading && <span className="text-xs text-blue-500">מעלה...</span>}
                </div>
                {editingCourier.agreement_file_url && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FileText size={12} />
                    קובץ קיים
                  </span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || isUploading}>
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </Card>
      );
      }
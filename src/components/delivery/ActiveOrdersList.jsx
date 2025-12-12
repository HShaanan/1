import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, MapPin, User, Phone, Package, 
  Bike, AlertCircle, Search, MessageCircle 
} from 'lucide-react';
import { formatDateTimeWithOffset } from '@/components/utils/dateUtils';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export default function ActiveOrdersList({ orders, couriers, businessPages = {}, onAssign, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(order => {
    if (order.status === 'completed' || order.status === 'cancelled') return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.order_number?.toString().includes(searchLower) ||
      order.customer_address?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssignClick = (order) => {
    setSelectedOrder(order);
  };

  const handleConfirmAssign = async (courierId) => {
    if (selectedOrder) {
      await onAssign(selectedOrder.id, courierId);
      setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'new': return <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] px-2">חדשה</Badge>;
      case 'preparing': return <Badge className="bg-purple-500 hover:bg-purple-600 text-[10px] px-2">בהכנה</Badge>;
      case 'ready': return <Badge className="bg-green-500 hover:bg-green-600 text-[10px] px-2">מוכנה</Badge>;
      case 'assigned': return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] px-2">שליח בדרך</Badge>;
      case 'picked_up': return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-[10px] px-2">בשינוע</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-2">{status}</Badge>;
    }
  };

  const getWhatsAppUrl = (phone) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '972');
    return `https://wa.me/${cleanPhone}`;
  };

  // Reusable Courier Selection List
  const CourierSelectionList = ({ order }) => (
    <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
      {couriers.filter(c => c.status === 'idle').length === 0 && (
        <div className="text-center p-4 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-orange-400" />
          <p>אין שליחים פנויים כרגע</p>
          <p className="text-xs mt-1">ניתן לשבץ גם שליחים לא פנויים במידת הצורך</p>
        </div>
      )}
      
      {couriers.sort((a,b) => (a.status === 'idle' ? -1 : 1)).map((courier) => (
        <div 
          key={courier.id}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
            courier.status === 'idle' ? 'border-slate-200' : 'border-slate-100 bg-slate-50 opacity-75'
          }`}
          onClick={() => handleConfirmAssign(courier.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
              courier.status === 'idle' ? 'bg-emerald-500' : 'bg-slate-400'
            }`}>
              {courier.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm">{courier.name}</div>
              <div className="text-xs text-slate-500">{courier.vehicle_type}</div>
            </div>
          </div>
          <Badge variant={courier.status === 'idle' ? 'default' : 'secondary'} className={courier.status === 'idle' ? 'bg-emerald-500' : ''}>
            {courier.status === 'idle' ? 'פנוי' : 'עסוק'}
          </Badge>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="h-full border-0 shadow-md bg-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">הזמנות פעילות</h3>
              <div className="text-xs text-slate-500">
                {filteredOrders.length} הזמנות ממתינות לטיפול
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="חפש הזמנה לפי שם, מספר או כתובת..." 
            className="pl-4 pr-9 h-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-2"></div>
            <p>טוען נתונים...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Package size={48} className="mb-2 opacity-20" />
            <p>אין הזמנות פעילות כרגע</p>
          </div>
        ) : (
          <div className="w-full min-w-[800px]">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium w-[20%]">עסק / מס' הזמנה</th>
                  <th scope="col" className="px-4 py-3 font-medium w-[20%]">פרטי לקוח</th>
                  <th scope="col" className="px-4 py-3 font-medium w-[10%]">סטטוס</th>
                  <th scope="col" className="px-4 py-3 font-medium w-[10%]">הכנה</th>
                  <th scope="col" className="px-4 py-3 font-medium w-[20%]">שליח מוקצה</th>
                  <th scope="col" className="px-4 py-3 font-medium w-[15%]">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isAssigned = !!order.assigned_courier_id;
                  const assignedCourier = couriers.find(c => c.id === order.assigned_courier_id);
                  const businessName = businessPages[order.business_page_id]?.business_name || 'טוען...';

                  return (
                    <tr key={order.id} className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                      {/* Business & Order Number */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 truncate" title={businessName}>{businessName}</span>
                            <Badge variant="outline" className="w-fit font-mono text-[10px] text-slate-500 bg-slate-50">
                              #{order.order_number}
                            </Badge>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <span className="font-medium text-slate-800">{order.customer_name}</span>
                            </div>
                            {order.customer_phone && (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      <a 
                                          href={`tel:${order.customer_phone}`} 
                                          className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                          title="התקשר ללקוח"
                                          aria-label={`התקשר ל${order.customer_name}`}
                                      >
                                          <Phone size={12} />
                                      </a>
                                      <a 
                                          href={getWhatsAppUrl(order.customer_phone)} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                                          title="שלח הודעה ללקוח"
                                          aria-label={`שלח וואטסאפ ל${order.customer_name}`}
                                      >
                                          <MessageCircle size={12} />
                                      </a>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono dir-ltr">{order.customer_phone}</span>
                                </div>
                            )}
                            {order.customer_address && (
                                <div className="flex items-start gap-1 text-xs text-slate-500" title={order.customer_address}>
                                    <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                                    <span className="line-clamp-2">{order.customer_address}</span>
                                </div>
                            )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(order.status)}
                          <span className="text-[10px] text-slate-400">
                            {order.items?.length || 0} פריטים • ₪{order.total_amount}
                          </span>
                        </div>
                      </td>

                      {/* Preparation Status */}
                      <td className="px-4 py-4 align-top">
                        {(() => {
                          const prepStatus = order.preparation_status || 
                            (order.status === 'preparing' ? 'preparing' : 
                             order.status === 'ready' ? 'ready' : 
                             ['new', 'payment'].includes(order.status) ? 'pending' : 'unknown');

                          const badges = {
                            pending: <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">ממתין</Badge>,
                            preparing: <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 border">בהכנה</Badge>,
                            ready: <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-200 border">מוכן</Badge>,
                            unknown: <span className="text-[10px] text-slate-400">-</span>
                          };

                          return badges[prepStatus] || badges.unknown;
                        })()}
                      </td>

                      {/* Courier Assignment */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                            {isAssigned ? (
                                <>
                                  <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                          <Bike size={14} className="text-slate-400" />
                                          {assignedCourier?.name || 'לא נמצא'}
                                      </span>
                                      
                                      <Dialog>
                                          <DialogTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                onClick={() => handleAssignClick(order)} 
                                                title="החלף שליח"
                                              >
                                                  <Bike size={14} />
                                              </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>החלפת שליח להזמנה #{order.order_number}</DialogTitle>
                                            </DialogHeader>
                                            <CourierSelectionList order={order} />
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="secondary">ביטול</Button></DialogClose>
                                            </DialogFooter>
                                          </DialogContent>
                                      </Dialog>
                                  </div>
                                  {assignedCourier?.phone && (
                                      <div className="flex items-center gap-2">
                                          <div className="flex gap-1">
                                            <a 
                                                href={`tel:${assignedCourier.phone}`} 
                                                className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                                                title="התקשר לשליח"
                                            >
                                                <Phone size={12} />
                                            </a>
                                            <a 
                                                href={getWhatsAppUrl(assignedCourier.phone)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                                                title="שלח הודעה לשליח"
                                            >
                                                <MessageCircle size={12} />
                                            </a>
                                          </div>
                                          <span className="text-xs text-slate-500 font-mono dir-ltr">{assignedCourier.phone}</span>
                                      </div>
                                  )}
                                </>
                            ) : (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="w-full justify-start h-8 text-xs border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 shadow-sm"
                                            onClick={() => handleAssignClick(order)}
                                        >
                                            <Bike size={14} className="ml-1" />
                                            הקצאת שליח
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>שיבוץ שליח להזמנה #{order.order_number}</DialogTitle>
                                        </DialogHeader>
                                        <CourierSelectionList order={order} />
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="secondary">ביטול</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={12} className="text-slate-400" />
                            {formatDateTimeWithOffset(order.created_date)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
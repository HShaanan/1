import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Package, Truck, User, Phone, MapPin, Clock, 
  Search, RefreshCw, AlertTriangle, CheckCircle, 
  XCircle, Pencil, MessageCircle,
  DollarSign, Store, MoreVertical, Bike, Play, Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DELIVERY_STATUSES = {
  new: { label: 'חדשה', color: 'bg-blue-100 text-blue-700', icon: Package },
  payment: { label: 'ממתין לתשלום', color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
  preparing: { label: 'בהכנה', color: 'bg-purple-100 text-purple-700', icon: Clock },
  ready: { label: 'מוכנה לאיסוף', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  assigned: { label: 'שליח הוקצה', color: 'bg-orange-100 text-orange-700', icon: Bike },
  picked_up: { label: 'נאסף', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  completed: { label: 'הושלם', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function DeliveryOperations() {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [businessPages, setBusinessPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const checkAdminAndLoad = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        setError('אין לך הרשאה לצפות בעמוד זה');
        setLoading(false);
        return;
      }
      await loadData();
    } catch (err) {
      setError('נא להתחבר למערכת');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load delivery orders
      const allOrders = await base44.entities.Order.filter({
        delivery_type: 'delivery'
      }, '-created_date', 200);

      // Load couriers
      const fleet = await base44.entities.Courier.list();

      // Load business pages for order details
      const businessIds = [...new Set((allOrders || []).map(o => o.business_page_id).filter(Boolean))];
      let businessesMap = {};
      
      if (businessIds.length > 0) {
        const businessPromises = businessIds.slice(0, 20).map(id => 
          base44.entities.BusinessPage.filter({ id }).catch(() => [])
        );
        const results = await Promise.all(businessPromises);
        results.flat().forEach(bus => {
          if (bus && bus.id) businessesMap[bus.id] = bus;
        });
      }

      setOrders(allOrders || []);
      setCouriers(fleet || []);
      setBusinessPages(businessesMap);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(o => !['completed', 'cancelled'].includes(o.status));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.customer_name?.toLowerCase().includes(search) ||
        o.order_number?.toString().includes(search) ||
        o.customer_phone?.includes(search) ||
        o.customer_address?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setIsSaving(true);
    try {
      const order = orders.find(o => o.id === orderId);
      const updateData = { status: newStatus };

      // If completing order, create delivery record
      if (newStatus === 'completed' && order?.assigned_courier_id) {
        const courier = couriers.find(c => c.id === order.assigned_courier_id);
        await base44.entities.DeliveryRecord.create({
          courier_id: order.assigned_courier_id,
          order_id: orderId,
          business_page_id: order.business_page_id,
          business_name: businessPages[order.business_page_id]?.business_name || '',
          customer_name: order.customer_name,
          customer_address: order.customer_address,
          delivery_date: new Date().toISOString(),
          status: 'delivered',
          payment_amount: courier?.default_payment_per_delivery || 0
        });

        // Free up the courier
        await base44.entities.Courier.update(order.assigned_courier_id, {
          status: 'idle',
          active_order_id: null
        });
      }

      await base44.entities.Order.update(orderId, updateData);
      await loadData();
    } catch (err) {
      console.error("Status update failed:", err);
      alert("שגיאה בעדכון הסטטוס");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignCourier = async (courierId) => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      await base44.entities.Order.update(selectedOrder.id, {
        assigned_courier_id: courierId,
        status: 'assigned'
      });

      await base44.entities.Courier.update(courierId, {
        status: 'busy',
        active_order_id: selectedOrder.id
      });

      setIsAssignDialogOpen(false);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error("Assignment failed:", err);
      alert("שגיאה בהקצאת השליח");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignCourier = async (orderId) => {
    setIsSaving(true);
    try {
      const order = orders.find(o => o.id === orderId);
      if (order?.assigned_courier_id) {
        await base44.entities.Courier.update(order.assigned_courier_id, {
          status: 'idle',
          active_order_id: null
        });
      }

      await base44.entities.Order.update(orderId, {
        assigned_courier_id: null,
        status: 'ready'
      });

      await loadData();
    } catch (err) {
      console.error("Unassign failed:", err);
      alert("שגיאה בביטול ההקצאה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      // Free courier if assigned
      if (selectedOrder.assigned_courier_id) {
        await base44.entities.Courier.update(selectedOrder.assigned_courier_id, {
          status: 'idle',
          active_order_id: null
        });
      }

      await base44.entities.Order.update(selectedOrder.id, {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        assigned_courier_id: null
      });

      setIsCancelDialogOpen(false);
      setSelectedOrder(null);
      setCancelReason('');
      await loadData();
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("שגיאה בביטול ההזמנה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOrder = async (updatedData) => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      await base44.entities.Order.update(selectedOrder.id, updatedData);
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error("Edit failed:", err);
      alert("שגיאה בעדכון ההזמנה");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWhatsAppUrl = (phone) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '972');
    return `https://wa.me/${cleanPhone}`;
  };

  const filteredOrders = getFilteredOrders();
  const stats = {
    total: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    assigned: orders.filter(o => ['assigned', 'picked_up'].includes(o.status)).length
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-200">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">שגיאה</h1>
          <p className="text-slate-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-blue-600" />
              ניהול משלוחים
            </h1>
            <p className="text-slate-500 text-sm">ניהול הזמנות, הקצאות שליחים ומעקב סטטוסים</p>
          </div>
          <Button onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            רענן
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Package size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">פעילות</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-xs text-slate-500">חדשות</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Store size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.preparing}</p>
                <p className="text-xs text-slate-500">בהכנה</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-xs text-slate-500">מוכנות</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-slate-500">בדרך</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="חיפוש לפי שם, טלפון, מספר הזמנה או כתובת..." 
                  className="pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="סינון לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="active">פעילות בלבד</SelectItem>
                  <SelectItem value="new">חדשות</SelectItem>
                  <SelectItem value="preparing">בהכנה</SelectItem>
                  <SelectItem value="ready">מוכנות</SelectItem>
                  <SelectItem value="assigned">שליח הוקצה</SelectItem>
                  <SelectItem value="picked_up">נאסף</SelectItem>
                  <SelectItem value="completed">הושלמו</SelectItem>
                  <SelectItem value="cancelled">בוטלו</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>הזמנות ({filteredOrders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p>אין הזמנות להצגה</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const status = DELIVERY_STATUSES[order.status] || DELIVERY_STATUSES.new;
                  const StatusIcon = status.icon;
                  const business = businessPages[order.business_page_id];
                  const assignedCourier = couriers.find(c => c.id === order.assigned_courier_id);

                  return (
                    <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        
                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${status.color}`}>
                              <StatusIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800">
                                  #{order.order_number}
                                </span>
                                <Badge className={status.color}>{status.label}</Badge>
                                {order.cancellation_reason && (
                                  <Badge variant="outline" className="text-red-600">
                                    {order.cancellation_reason}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                <Store size={12} className="inline ml-1" />
                                {business?.business_name || 'עסק לא ידוע'}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  {order.customer_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone size={12} />
                                  {order.customer_phone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatDateTime(order.created_date)}
                                </span>
                              </div>
                              {order.customer_address && (
                                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                  <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                  <span className="truncate">{order.customer_address}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Courier Assignment */}
                        <div className="lg:w-48">
                          {assignedCourier ? (
                            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                              <Bike size={16} className="text-orange-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {assignedCourier.name}
                                </p>
                                <p className="text-xs text-slate-500">{assignedCourier.phone}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => handleUnassignCourier(order.id)}
                                title="בטל הקצאה"
                              >
                                <XCircle size={14} />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsAssignDialogOpen(true);
                              }}
                              disabled={['completed', 'cancelled'].includes(order.status)}
                            >
                              <Bike size={14} />
                              הקצה שליח
                            </Button>
                          )}
                        </div>

                        {/* Quick Status Actions */}
                        <div className="flex items-center gap-2 lg:w-auto">
                          {order.status === 'new' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleStatusChange(order.id, 'preparing')}
                            >
                              <Play size={12} />
                              התחל הכנה
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1 text-green-600 border-green-200"
                              onClick={() => handleStatusChange(order.id, 'ready')}
                            >
                              <CheckCircle size={12} />
                              מוכן
                            </Button>
                          )}
                          {order.status === 'assigned' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1 text-indigo-600 border-indigo-200"
                              onClick={() => handleStatusChange(order.id, 'picked_up')}
                            >
                              <Truck size={12} />
                              נאסף
                            </Button>
                          )}
                          {order.status === 'picked_up' && (
                            <Button 
                              size="sm" 
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleStatusChange(order.id, 'completed')}
                            >
                              <Check size={12} />
                              הושלם
                            </Button>
                          )}

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedOrder(order);
                                setIsEditDialogOpen(true);
                              }}>
                                <Pencil size={14} className="ml-2" />
                                עריכה
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={getWhatsAppUrl(order.customer_phone)} target="_blank" rel="noopener noreferrer">
                                  <MessageCircle size={14} className="ml-2" />
                                  וואטסאפ ללקוח
                                </a>
                              </DropdownMenuItem>
                              {!['completed', 'cancelled'].includes(order.status) && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsCancelDialogOpen(true);
                                  }}
                                >
                                  <XCircle size={14} className="ml-2" />
                                  בטל הזמנה
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      {order.items?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium">{order.items.length} פריטים</span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">₪{order.total_amount}</span>
                            {order.delivery_fee > 0 && (
                              <>
                                <span>•</span>
                                <span>דמי משלוח: ₪{order.delivery_fee}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Courier Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הקצאת שליח להזמנה #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {couriers.filter(c => c.status === 'idle' && c.is_active !== false).length === 0 ? (
              <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-orange-400" />
                <p>אין שליחים פנויים כרגע</p>
              </div>
            ) : (
              couriers
                .filter(c => c.is_active !== false)
                .sort((a, b) => (a.status === 'idle' ? -1 : 1))
                .map((courier) => (
                  <div 
                    key={courier.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      courier.status === 'idle' 
                        ? 'hover:bg-blue-50 border-slate-200' 
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                    onClick={() => courier.status === 'idle' && handleAssignCourier(courier.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        courier.status === 'idle' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}>
                        <Bike size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{courier.name}</p>
                        <p className="text-xs text-slate-500">{courier.phone}</p>
                      </div>
                    </div>
                    <Badge variant={courier.status === 'idle' ? 'default' : 'secondary'}>
                      {courier.status === 'idle' ? 'פנוי' : 'עסוק'}
                    </Badge>
                  </div>
                ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת הזמנה #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <EditOrderForm 
              order={selectedOrder} 
              onSave={handleEditOrder}
              onCancel={() => setIsEditDialogOpen(false)}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>ביטול הזמנה #{selectedOrder?.order_number}</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">סיבת הביטול</Label>
            <Textarea 
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="נא לציין את סיבת הביטול..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>חזור</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelOrder}
              disabled={isSaving}
            >
              {isSaving ? 'מבטל...' : 'בטל הזמנה'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Edit Order Form Component
function EditOrderForm({ order, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    customer_address: order.customer_address || '',
    notes: order.notes || '',
    delivery_fee: order.delivery_fee || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="customer_name">שם הלקוח</Label>
        <Input 
          id="customer_name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customer_phone">טלפון</Label>
        <Input 
          id="customer_phone"
          value={formData.customer_phone}
          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
          dir="ltr"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customer_address">כתובת למשלוח</Label>
        <Textarea 
          id="customer_address"
          value={formData.customer_address}
          onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="delivery_fee">דמי משלוח (₪)</Label>
        <Input 
          id="delivery_fee"
          type="number"
          value={formData.delivery_fee}
          onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
          dir="ltr"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">הערות</Label>
        <Textarea 
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </DialogFooter>
    </form>
  );
}
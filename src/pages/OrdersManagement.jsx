import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardList, Clock, CheckCircle, User, Phone, MessageCircle, Calendar, BarChart3, Edit, X, Save, RefreshCcw, Truck, Store, DollarSign, Wallet, Info } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const createStrongBeep = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

function EditOrderForm({ order, onChange, onSave, onCancel }) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium">שם לקוח</label>
          <Input
            value={order.customer_name}
            onChange={(e) => onChange({ ...order, customer_name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium">טלפון</label>
          <Input
            value={order.customer_phone}
            onChange={(e) => onChange({ ...order, customer_phone: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">הערות</label>
        <Textarea
          value={order.notes || ''}
          onChange={(e) => onChange({ ...order, notes: e.target.value })}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} size="sm" className="bg-green-600 hover:bg-green-700">
          <Save className="w-3 h-3 ml-1" />
          שמור
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline">
          <X className="w-3 h-3 ml-1" />
          בטל
        </Button>
      </div>
    </div>
  );
}

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState([]);
  const [businessPage, setBusinessPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("orders");
  const [editingOrder, setEditingOrder] = useState(null);
  
  const [settings, setSettings] = useState({
    refresh_interval_seconds: 15,
    new_order_alert_interval_seconds: 60,
  });

  const newOrderCountRef = useRef(0);
  const soundAlertIntervalRef = useRef(null);
  
  // זיהוי עמוד העסק - מה-URL או מהמשתמש המחובר
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let page = null;
        const urlParams = new URLSearchParams(window.location.search);
        const urlPageId = urlParams.get('business_page_id');

        if (urlPageId) {
          const pages = await base44.entities.BusinessPage.filter({ id: urlPageId });
          if (pages && pages.length > 0) page = pages[0];
        } else {
          // ניסיון לזהות לפי משתמש מחובר
          const user = await base44.auth.me();
          if (user) {
            const pages = await base44.entities.BusinessPage.filter({ business_owner_email: user.email });
            if (pages && pages.length > 0) page = pages[0];
          }
        }

        if (page) {
          setBusinessPage(page);
          // טעינת הגדרות והזמנות תתבצע ב-useEffect נפרד שתלוי ב-businessPage
        }
      } catch (error) {
        console.error("Error initializing orders page:", error);
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      if (soundAlertIntervalRef.current) {
        clearInterval(soundAlertIntervalRef.current);
      }
    };
  }, []);

  // טעינת נתונים כשיש businessPage
  useEffect(() => {
    if (businessPage) {
      loadSettings();
      loadOrders();
      
      const refreshIntervalId = setInterval(loadOrders, settings.refresh_interval_seconds * 1000);
      return () => clearInterval(refreshIntervalId);
    }
  }, [businessPage?.id, settings.refresh_interval_seconds]);

  const loadSettings = async () => {
    if (!businessPage?.id) return;
    try {
      const settingsList = await base44.entities.RestaurantSettings.filter({ business_page_id: businessPage.id });
      if (settingsList.length > 0) {
        setSettings(prev => ({ ...prev, ...settingsList[0] }));
      }
    } catch (e) {
      console.warn("Could not load settings, using default settings.");
    }
  };

  const loadOrders = async () => {
    if (!businessPage?.id) return;
    
    try {
      const ordersData = await base44.entities.Order.filter({ business_page_id: businessPage.id }, "-created_date", 1000);
      setOrders(ordersData);
      const newOrdersCount = ordersData.filter(o => o.status === 'new').length;
      manageSoundAlerts(newOrdersCount);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };
  
  const playSound = () => {
    try {
      createStrongBeep();
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  };

  const manageSoundAlerts = (newOrdersCount) => {
    if (newOrdersCount > 0 && newOrderCountRef.current === 0) {
      playSound();
      if (soundAlertIntervalRef.current) clearInterval(soundAlertIntervalRef.current);
      soundAlertIntervalRef.current = setInterval(playSound, settings.new_order_alert_interval_seconds * 1000);
    } else if (newOrdersCount === 0 && newOrderCountRef.current > 0) {
      if (soundAlertIntervalRef.current) clearInterval(soundAlertIntervalRef.current);
      soundAlertIntervalRef.current = null;
    }
    newOrderCountRef.current = newOrdersCount;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'preparing') {
        updateData.preparation_status = 'preparing';
      } else if (newStatus === 'ready') {
        updateData.preparation_status = 'ready';
      } else if (newStatus === 'new' || newStatus === 'payment') {
        updateData.preparation_status = 'pending';
      }
      
      await base44.entities.Order.update(orderId, updateData);
      
      if (newStatus === 'ready') {
        try {
          await base44.functions.invoke('notifyOrderReady', { orderId });
        } catch (notifyError) {
          console.warn('Failed to send customer notification:', notifyError);
        }
      }
      
      await loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("שגיאה בעדכון סטטוס ההזמנה");
    }
  };
  
  const cancelOrder = async (orderId) => {
    const reason = prompt("אנא ציין סיבת ביטול (אופציונלי):");
    if (reason !== null) {
      try {
        await base44.entities.Order.update(orderId, { 
          status: "cancelled",
          cancellation_reason: reason.trim() || ""
        });
        await loadOrders();
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert("שגיאה בביטול ההזמנה");
      }
    }
  };
  
  const reopenOrder = async (orderId) => {
    try {
      await base44.entities.Order.update(orderId, { 
        status: "new",
        cancellation_reason: ""
      });
      await loadOrders();
    } catch (error) {
      console.error("Error reopening order:", error);
      alert("שגיאה בפתיחה מחדש של ההזמנה");
    }
  };

  const updateOrder = async (orderId, updatedData) => {
    try {
      await base44.entities.Order.update(orderId, updatedData);
      setEditingOrder(null);
      await loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("שגיאה בעדכון ההזמנה");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: "בוצע הזמנה (שולם)", color: "bg-blue-100 text-blue-800 border-blue-300" },
      payment: { label: "ממתין לתשלום", color: "bg-orange-100 text-orange-800 border-orange-300" },
      preparing: { label: "התקבל בבית העסק", color: "bg-purple-100 text-purple-800 border-purple-300" },
      picked_up: { label: "נשלח", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
      ready: { label: "מוכן לאיסוף", color: "bg-green-100 text-green-800 border-green-300" },
      completed: { label: "הושלם", color: "bg-gray-100 text-gray-800 border-gray-300" },
      cancelled: { label: "בוטל", color: "bg-red-100 text-red-800 border-red-300" }
    };

    const config = statusConfig[status] || statusConfig.new;
    return (
      <Badge className={`${config.color} border font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getNextStatusAction = (currentStatus) => {
    const statusFlow = {
      new: { next: "payment", label: "עבר להמתנה לתשלום", color: "bg-orange-600 hover:bg-orange-700" },
      payment: { next: "preparing", label: "קבל הזמנה", color: "bg-purple-600 hover:bg-purple-700" },
      preparing: { next: "ready", label: "מוכן לאיסוף / משלוח", color: "bg-green-600 hover:bg-green-700" },
      ready: { next: "completed", label: "סיום הזמנה", color: "bg-gray-600 hover:bg-gray-700" },
      picked_up: { next: "completed", label: "סיום הזמנה", color: "bg-gray-600 hover:bg-gray-700" }
    };

    return statusFlow[currentStatus];
  };

  const getFilteredOrdersByDate = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch(dateFilter) {
      case "today":
        return orders.filter(order => order.order_date === today || 
          (order.created_date && order.created_date.startsWith(today)));
      case "custom":
        return orders.filter(order => order.order_date === selectedDate ||
          (order.created_date && order.created_date.startsWith(selectedDate)));
      case "all":
        return orders;
      default:
        return orders;
    }
  };

  const getOrderCounts = () => {
    const filtered = getFilteredOrdersByDate();
    return {
      new: filtered.filter(order => order.status === "new").length,
      payment: filtered.filter(order => order.status === "payment").length,
      preparing: filtered.filter(order => order.status === "preparing").length,
      picked_up: filtered.filter(order => order.status === "picked_up").length,
      ready: filtered.filter(order => order.status === "ready").length,
      completed: filtered.filter(order => order.status === "completed").length,
      cancelled: filtered.filter(order => order.status === "cancelled").length
    };
  };

  const getReportsData = () => {
    const filtered = getFilteredOrdersByDate();
    
    const activeOrders = filtered.filter(order => order.status !== "cancelled");
    const totalOrders = activeOrders.length;
    
    let totalRevenue = 0; // GTV
    let businessProfit = 0;
    let platformCommission = 0;
    let totalDeliveryFees = 0;

    activeOrders.forEach(order => {
        const total = Number(order.total_amount || 0);
        const delivery = Number(order.delivery_fee || 0);
        const net = Math.max(0, total - delivery);
        
        totalRevenue += total;
        totalDeliveryFees += delivery;
        
        // חישוב עמלה: 14.16% מהנטו
        platformCommission += net * 0.1416;
        
        // חישוב רווח לעסק: 85.84% מהנטו + משלוח
        businessProfit += (net * 0.8584) + delivery;
    });
    
    const itemsCount = {};
    activeOrders.forEach(order => {
      order.items?.forEach(item => {
        itemsCount[item.menu_item_name] = (itemsCount[item.menu_item_name] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(itemsCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      totalOrders,
      totalRevenue,
      businessProfit,
      platformCommission,
      topItems,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      cancelledOrders: filtered.filter(order => order.status === "cancelled").length,
      vatAmount: businessProfit * 0.18,
      totalDeliveryFees
      };
      };

  const theme = businessPage?.theme_settings?.custom_colors || {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#e0e7ff'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})` }}
          >
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="font-medium" style={{ color: theme.primary }}>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!businessPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">לא נמצא עסק מקושר</h2>
            <p className="text-slate-600 mb-4">
              לא נמצא עמוד עסק המקושר לחשבון שלך.
              <br/>
              אם יש לך עסק, ודא שאתה מחובר עם החשבון הנכון.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              חזרה לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const counts = getOrderCounts();
  const reportsData = getReportsData();
  const filteredOrders = getFilteredOrdersByDate();

  return (
    <div className="min-h-screen py-4 md:py-8 bg-slate-50" dir="rtl">
      <style>{`
        @keyframes blink {
          50% { background-color: #fefcbf; }
        }
        .blinking-tab {
          animation: blink 1.5s linear infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
        {/* כותרת */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ClipboardList className="w-8 h-8" style={{ color: theme.primary }} />
                דאשבורד הזמנות - {businessPage?.business_name}
              </h1>
              <p className="text-slate-600 mt-1">ניהול מעקב אחר הזמנות בזמן אמת</p>
            </div>
            <div className="flex gap-2">
                <Button
                  onClick={loadOrders}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  רענן
                </Button>
            </div>
          </div>

          {/* סינון תאריכים */}
          <div className="flex gap-2 items-center bg-white p-3 rounded-lg border">
            <Button
              onClick={() => setDateFilter("today")}
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              style={dateFilter === "today" ? { backgroundColor: theme.primary } : {}}
            >
              היום
            </Button>
            <Button
              onClick={() => setDateFilter("all")}
              variant={dateFilter === "all" ? "default" : "outline"}
              size="sm"
              style={dateFilter === "all" ? { backgroundColor: theme.primary } : {}}
            >
              הכל
            </Button>
            <Button
              onClick={() => setDateFilter("custom")}
              variant={dateFilter === "custom" ? "default" : "outline"}
              size="sm"
              style={dateFilter === "custom" ? { backgroundColor: theme.primary } : {}}
            >
              תאריך מותאם
            </Button>
            {dateFilter === "custom" && (
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            )}
          </div>
        </div>

        {/* טאבים */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger 
              value="orders" 
              className={counts.new > 0 ? 'blinking-tab' : ''}
            >
              <ClipboardList className="w-4 h-4 ml-2" />
              הזמנות {counts.new > 0 && <Badge className="mr-2 bg-red-500">{counts.new}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 ml-2" />
              דוחות כספיים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {/* סטטיסטיקות מהירות */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { status: 'new', label: 'בוצע הזמנה', icon: Clock, color: 'bg-blue-500' },
                { status: 'payment', label: 'ממתין לתשלום', icon: Phone, color: 'bg-orange-500' },
                { status: 'preparing', label: 'התקבל בעסק', icon: User, color: 'bg-purple-500' },
                { status: 'picked_up', label: 'נשלח', icon: Truck, color: 'bg-indigo-500' },
                { status: 'ready', label: 'מוכן לאיסוף', icon: CheckCircle, color: 'bg-green-500' },
                { status: 'completed', label: 'הושלם', icon: CheckCircle, color: 'bg-gray-500' },
                { status: 'cancelled', label: 'בוטל', icon: X, color: 'bg-red-500' }
              ].map(({ status, label, icon: Icon, color }) => (
                <Card key={status} className="border-0 shadow">
                  <CardContent className="p-3 text-center">
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${color} text-white rounded-full p-1`} />
                    <div className="text-2xl font-bold">{counts[status]}</div>
                    <div className="text-xs text-slate-600">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* רשימת הזמנות */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">אין הזמנות להצגה</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader 
                      className="pb-3"
                      style={{ 
                        background: order.status === 'new' 
                          ? `linear-gradient(135deg, ${theme.primaryLight}, white)` 
                          : undefined 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="text-2xl font-bold text-white w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme.primary }}
                          >
                            {order.order_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <span className="text-xs text-slate-500">
                                {order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-sm">{order.customer_name}</span>
                              <Phone className="w-3 h-3 text-slate-400 mr-2" />
                              <span className="text-sm text-slate-600">{order.customer_phone}</span>
                            </div>
                            
                            {/* חיווי סטטוס אינטגרציה */}
                            {order.delivery_type === 'delivery' && (
                              <div className="mt-1 flex items-center gap-1 text-xs">
                                <Truck className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500">שידור לוגיסטיקה:</span>
                                {order.delivery_integration_status === 'success' && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-1.5 py-0 h-5">
                                    <CheckCircle className="w-3 h-3" />
                                    נשלח
                                  </Badge>
                                )}
                                {order.delivery_integration_status === 'failed' && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 px-1.5 py-0 h-5">
                                    <X className="w-3 h-3" />
                                    נכשל
                                  </Badge>
                                )}
                                {(!order.delivery_integration_status || order.delivery_integration_status === 'pending') && (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-1.5 py-0 h-5">
                                    ממתין
                                  </Badge>
                                )}
                                {order.integration_error && (
                                  <span title={order.integration_error} className="text-red-500 cursor-help ml-1">*</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-bold" style={{ color: theme.primary }}>
                            ₪{order.total_amount?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-3">
                      {editingOrder?.id === order.id ? (
                        <EditOrderForm
                          order={editingOrder}
                          onChange={setEditingOrder}
                          onSave={() => updateOrder(order.id, editingOrder)}
                          onCancel={() => setEditingOrder(null)}
                        />
                      ) : (
                        <>
                          {/* פריטים */}
                          <div className="space-y-2 mb-4">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start text-sm bg-slate-50 p-2 rounded">
                                <div className="flex-1">
                                  <span className="font-semibold">{item.menu_item_name}</span>
                                  {item.selected_modifications && item.selected_modifications.length > 0 && (
                                    <div className="text-xs text-slate-600 mt-1">
                                      תוספות: {item.selected_modifications.map(m => m.name).join(', ')}
                                    </div>
                                  )}
                                </div>
                                <div className="text-left mr-4">
                                  <div>× {item.quantity}</div>
                                  <div className="text-xs text-slate-500">
                                    ₪{(item.item_final_price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* הערות */}
                          {order.notes && (
                            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                              <MessageCircle className="w-3 h-3 inline ml-1" />
                              <strong>הערות:</strong> {order.notes}
                            </div>
                          )}

                          {/* כפתורי פעולה */}
                          <div className="flex gap-2 flex-wrap">
                            {getNextStatusAction(order.status) && (
                              <Button
                                onClick={() => updateOrderStatus(order.id, getNextStatusAction(order.status).next)}
                                size="sm"
                                className={`${getNextStatusAction(order.status).color} text-white`}
                              >
                                {getNextStatusAction(order.status).label}
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => setEditingOrder({ ...order })}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="w-3 h-3 ml-1" />
                              ערוך
                            </Button>

                            {order.status !== 'cancelled' && (
                              <Button
                                onClick={() => cancelOrder(order.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-3 h-3 ml-1" />
                                בטל
                              </Button>
                            )}

                            {order.status === 'cancelled' && (
                              <Button
                                onClick={() => reopenOrder(order.id)}
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                              >
                                פתח מחדש
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="border-0 shadow-lg" style={{ borderTop: `4px solid ${theme.primary}` }}>
                <CardContent className="p-6">
                  <div className="text-slate-600 text-sm mb-2">סה"כ הזמנות</div>
                  <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                    {reportsData.totalOrders}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg" style={{ borderTop: `4px solid #64748b` }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 text-slate-600 text-sm mb-2">
                    מחזור עסקאות (GTV)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>סך כל ההכנסות מהזמנות (ברוטו)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    ₪{reportsData.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg" style={{ borderTop: `4px solid #f59e0b` }}>
                <CardContent className="p-6">
                  <div className="text-slate-600 text-sm mb-2">עמלת פלטפורמה (הוצאה)</div>
                  <div className="text-3xl font-bold text-amber-600">
                    ₪{reportsData.platformCommission.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">14.16% (כולל מע"מ)</p>
                  </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg" style={{ borderTop: `4px solid #8b5cf6` }}>
                  <CardContent className="p-6">
                  <div className="text-slate-600 text-sm mb-2">מע"מ (18%)</div>
                  <div className="text-3xl font-bold text-violet-600">
                    ₪{reportsData.vatAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">מרווח העסק</p>
                  </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg" style={{ borderTop: `4px solid #10b981` }}>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">סכום למשלוחים</span>
                      <span className="font-semibold text-slate-700">₪{reportsData.totalDeliveryFees.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-slate-500">מע"מ (18%)</span>
                      <span className="text-xs text-slate-600">₪{reportsData.vatAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-sm mb-1 font-medium flex items-center gap-2">
                       <Wallet className="w-4 h-4 text-green-600" />
                       רווח נקי
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      ₪{reportsData.businessProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>פריטים פופולריים</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsData.topItems.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">אין נתונים להצגה</p>
                ) : (
                  <div className="space-y-2">
                    {reportsData.topItems.map(([name, count], idx) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: theme.primary }}
                          >
                            {idx + 1}
                          </div>
                          <span className="font-semibold">{name}</span>
                        </div>
                        <Badge variant="secondary">{count} יח'</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, AlertTriangle, Activity, Truck, Users, Package } from 'lucide-react';
import ActiveOrdersList from '@/components/delivery/ActiveOrdersList';
import CourierFleet from '@/components/delivery/CourierFleet';
import DeliveryMap from '@/components/delivery/DeliveryMap';
import CourierFleetManagementContent from '@/components/delivery/CourierFleetManagementContent';
import { useSystemTimezone } from '@/components/hooks/useSystemTimezone';
import { createPageUrl } from '@/utils';

export default function DeliveryManagementPage() {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [businessPages, setBusinessPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { timezoneOffset } = useSystemTimezone();

  // Update time every minute for availability check
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if courier is currently available based on schedule (ignores status field - only checks is_active + schedule)
  const isCurrentlyAvailable = (courier) => {
    // Only check is_active flag, NOT status (status is for busy/idle state, not availability schedule)
    if (courier.is_active === false) return false;
    
    // If no schedule is set, consider available by default
    if (!courier.availability_start && !courier.availability_end && (!courier.working_days || courier.working_days.length === 0)) {
      return true;
    }

    // Apply timezone offset if available (offset is in hours)
    const offsetMs = (timezoneOffset || 0) * 60 * 60 * 1000;
    const now = new Date(currentTime.getTime() + offsetMs);
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];
    
    // Check working day - if working_days is set and not empty, check if today is included
    if (courier.working_days && courier.working_days.length > 0) {
      if (!courier.working_days.includes(currentDay)) return false;
    }

    // Check time range - only if both start and end are defined
    if (courier.availability_start && courier.availability_end) {
      const [startH, startM] = courier.availability_start.split(':').map(Number);
      const [endH, endM] = courier.availability_end.split(':').map(Number);
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    return true;
  };

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const checkAdminAndLoad = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        setError('אין לך הרשאה לצפות בעמוד זה (נדרש ניהול)');
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      await loadData();
    } catch (err) {
      setError('נא להתחבר למערכת');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Fetch all delivery orders and filter client-side to avoid complex query issues
      let activeOrders = [];
      try {
        const allDeliveryOrders = await base44.entities.Order.filter({
          delivery_type: 'delivery'
        }, '-created_date', 100);
        
        // Filter active statuses client-side
        const activeStatuses = ['new', 'payment', 'preparing', 'ready', 'assigned', 'picked_up'];
        activeOrders = (allDeliveryOrders || []).filter(o => activeStatuses.includes(o.status));
      } catch (orderErr) {
        console.warn("Failed to fetch orders:", orderErr);
        activeOrders = [];
      }

      let fleet = [];
      try {
        fleet = await base44.entities.Courier.list();
      } catch (courierErr) {
        console.warn("Failed to fetch couriers:", courierErr);
        fleet = [];
      }
      
      const businessIds = [...new Set((activeOrders || []).map(o => o.business_page_id).filter(Boolean))];
      let businessesMap = {};
      
      if (businessIds.length > 0) {
        try {
          // Fetch businesses one by one to avoid complex query issues
          const businessPromises = businessIds.slice(0, 10).map(id => 
            base44.entities.BusinessPage.filter({ id }).catch(() => [])
          );
          const results = await Promise.all(businessPromises);
          results.flat().forEach(bus => {
            if (bus && bus.id) businessesMap[bus.id] = bus;
          });
        } catch (e) {
          console.warn("Failed to fetch business pages details:", e);
        }
      }

      setOrders(activeOrders || []);
      setCouriers(fleet || []);
      setBusinessPages(businessesMap);
      
    } catch (err) {
      console.error("Error loading delivery data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourier = async (orderId, courierId) => {
    try {
      // 1. Update Order
      await base44.entities.Order.update(orderId, {
        assigned_courier_id: courierId,
        status: 'assigned' // Move to assigned status
      });

      // 2. Update Courier Status
      await base44.entities.Courier.update(courierId, {
        status: 'busy',
        active_order_id: orderId
      });

      // 3. Refresh Data
      await loadData();
    } catch (err) {
      console.error("Assignment failed:", err);
      alert("שגיאה בהקצאת השליח");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-200 bg-white shadow-lg">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">גישה נדחתה</h1>
          <p className="text-slate-600">{error}</p>
          <Button onClick={() => window.location.href = '/'} className="mt-6 w-full">
            חזור לדף הבית
          </Button>
        </Card>
      </div>
    );
  }

  const stats = {
    new: orders.filter(o => o.status === 'new' || o.status === 'preparing').length,
    assigned: orders.filter(o => o.status === 'assigned' || o.status === 'picked_up').length,
    activeCouriers: couriers.filter(c => c.status !== 'offline').length,
    idleCouriers: couriers.filter(c => c.status === 'idle').length,
    availableNow: couriers.filter(c => isCurrentlyAvailable(c)).length
  };

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
        
        {/* Header with Tabs */}
        <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600" />
                מרכז ניהול משלוחים
              </h1>
              <p className="text-slate-500 text-sm mt-1">ניהול צי שליחים והקצאת משלוחים בזמן אמת</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-center">
                  <span className="block text-xs text-slate-500">הזמנות חדשות</span>
                  <span className="block font-bold text-lg text-blue-600">{stats.new}</span>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="text-center">
                  <span className="block text-xs text-slate-500">בטיפול שליח</span>
                  <span className="block font-bold text-lg text-orange-600">{stats.assigned}</span>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="text-center">
                  <span className="block text-xs text-slate-500">שליחים זמינים</span>
                  <span className="block font-bold text-lg text-emerald-600 flex items-center gap-1 justify-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    {stats.availableNow}
                  </span>
                </div>
              </div>
              <Button onClick={loadData} disabled={loading} className="gap-2">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                רענן
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="deliveries" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
                            <TabsTrigger value="deliveries" className="gap-2">
                              <Truck size={16} />
                              דאשבורד
                            </TabsTrigger>
                            <TabsTrigger value="fleet" className="gap-2">
                              <Users size={16} />
                              ניהול צי שליחים
                            </TabsTrigger>
                            <TabsTrigger value="operations" className="gap-2">
                              <Package size={16} />
                              ניהול משלוחים
                            </TabsTrigger>
                          </TabsList>

            {/* Deliveries Tab Content */}
            <TabsContent value="deliveries" className="mt-6">
              <div className="flex flex-col gap-6 flex-1 min-h-0">
                
                {/* Top Section: Map & Fleet */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0" style={{ height: '450px' }}>

                   {/* Map - Takes 2/3 space (Right in RTL) */}
                   <div className="lg:col-span-2 relative" style={{ height: '450px' }}>
                      <DeliveryMap 
                        orders={orders} 
                        couriers={couriers} 
                        businessPages={businessPages}
                        className="rounded-xl shadow-md border border-slate-200"
                      />
                   </div>

                   {/* Courier Fleet - Takes 1/3 space (Left in RTL) */}
                   <div style={{ height: '450px' }} className="overflow-hidden">
                      <CourierFleet 
                        couriers={couriers} 
                        onRefresh={loadData}
                        isCurrentlyAvailable={isCurrentlyAvailable}
                      />
                   </div>
                </div>

                {/* Bottom Section: Active Orders List - Full Width */}
                <div className="min-h-[600px] flex-1">
                   <ActiveOrdersList 
                     orders={orders} 
                     couriers={couriers} 
                     businessPages={businessPages}
                     onAssign={handleAssignCourier}
                     loading={loading} 
                   />
                </div>
              </div>
            </TabsContent>

            {/* Fleet Management Tab Content */}
            <TabsContent value="fleet" className="mt-6">
              <CourierFleetManagementContent 
                couriers={couriers}
                onRefresh={loadData}
                isCurrentlyAvailable={isCurrentlyAvailable}
              />
            </TabsContent>

            {/* Operations Tab Content - Link to dedicated page */}
            <TabsContent value="operations" className="mt-6">
              <div className="text-center py-12">
                <Package size={64} className="mx-auto mb-4 text-blue-600 opacity-50" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">ניהול משלוחים מתקדם</h3>
                <p className="text-slate-500 mb-6">עמוד ייעודי לניהול מלא של הזמנות, סטטוסים והקצאות</p>
                <a href={createPageUrl('DeliveryOperations')}>
                  <Button className="gap-2">
                    <Package size={16} />
                    פתח ניהול משלוחים
                  </Button>
                </a>
              </div>
            </TabsContent>
            </Tabs>
        </header>
      </div>
    </div>
  );
}
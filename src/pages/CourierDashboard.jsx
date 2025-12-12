import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bike, Package, Calendar, DollarSign, Clock, 
  MapPin, CheckCircle, User, AlertTriangle
} from 'lucide-react';

export default function CourierDashboard() {
  const [user, setUser] = useState(null);
  const [courier, setCourier] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        setError('נא להתחבר למערכת');
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Find courier by email
      const couriers = await base44.entities.Courier.filter({ email: currentUser.email });
      
      if (!couriers || couriers.length === 0) {
        setError('לא נמצא פרופיל שליח מקושר לחשבון שלך');
        setLoading(false);
        return;
      }

      const courierData = couriers[0];
      setCourier(courierData);

      // Load delivery records for this courier
      const allDeliveries = await base44.entities.DeliveryRecord.filter({ 
        courier_id: courierData.id 
      }, '-delivery_date', 200);

      // Filter by period
      const now = new Date();
      let filteredDeliveries = allDeliveries || [];

      if (period === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredDeliveries = filteredDeliveries.filter(d => 
          new Date(d.delivery_date || d.created_date) >= todayStart
        );
      } else if (period === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        filteredDeliveries = filteredDeliveries.filter(d => 
          new Date(d.delivery_date || d.created_date) >= weekStart
        );
      } else if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredDeliveries = filteredDeliveries.filter(d => 
          new Date(d.delivery_date || d.created_date) >= monthStart
        );
      }

      setDeliveries(filteredDeliveries);

    } catch (err) {
      console.error('Error loading courier data:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const completed = deliveries.filter(d => d.status === 'delivered').length;
    const totalEarnings = deliveries
      .filter(d => d.status === 'delivered')
      .reduce((sum, d) => sum + (d.payment_amount || 0), 0);
    const pending = deliveries.filter(d => ['assigned', 'picked_up'].includes(d.status)).length;

    return { completed, totalEarnings, pending, total: deliveries.length };
  };

  const stats = getStats();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      assigned: { label: 'הוקצה', className: 'bg-blue-100 text-blue-700' },
      picked_up: { label: 'נאסף', className: 'bg-orange-100 text-orange-700' },
      delivered: { label: 'נמסר', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'בוטל', className: 'bg-red-100 text-red-700' }
    };
    const cfg = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-200">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">שגיאה</h1>
          <p className="text-slate-600">{error}</p>
          <Button onClick={() => window.location.href = '/'} className="mt-6 w-full">
            חזור לדף הבית
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800">{courier?.name}</h1>
              <p className="text-slate-500">{courier?.phone}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <Bike size={12} />
                  {courier?.vehicle_type === 'scooter' ? 'קטנוע' : 
                   courier?.vehicle_type === 'car' ? 'רכב' : 
                   courier?.vehicle_type === 'bicycle' ? 'אופניים' : 'אופניים חשמליים'}
                </Badge>
                <Badge variant="outline" className={courier?.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                  {courier?.is_active ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="today">היום</TabsTrigger>
            <TabsTrigger value="week">השבוע</TabsTrigger>
            <TabsTrigger value="month">החודש</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
                <p className="text-xs text-slate-500">משלוחים שהושלמו</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">₪{stats.totalEarnings}</p>
                <p className="text-xs text-slate-500">סה"כ הכנסות</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                <p className="text-xs text-slate-500">ממתינים</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Package size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">סה"כ משלוחים</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries List */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-blue-600" />
              היסטוריית משלוחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p>אין משלוחים בתקופה זו</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div 
                    key={delivery.id} 
                    className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-800">{delivery.business_name || 'עסק'}</p>
                        <p className="text-sm text-slate-500">{delivery.customer_name}</p>
                      </div>
                      <div className="text-left">
                        {getStatusBadge(delivery.status)}
                        {delivery.payment_amount > 0 && (
                          <p className="text-sm font-bold text-green-600 mt-1">₪{delivery.payment_amount}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(delivery.delivery_date || delivery.created_date)}
                      </span>
                      {delivery.customer_address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {delivery.customer_address.substring(0, 30)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
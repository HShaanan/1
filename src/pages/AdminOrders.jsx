import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, Search, Filter, ShoppingBag, DollarSign, 
    Calendar, CheckCircle2, XCircle, Clock, Truck, FileText
} from "lucide-react";
import { format } from "date-fns";

export default function AdminOrdersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deliveryFilter, setDeliveryFilter] = useState("all");

    // שליפת הזמנות (נשתמש ב-filter ריק כדי לקבל את כולן, ממוינות לפי תאריך יורד)
    // במערכת גדולה היינו משתמשים בפגינציה בצד שרת, כאן נשלוף 200 אחרונות לצורך הדוגמה
    const { data: orders = [], isLoading, error } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const result = await base44.entities.Order.filter({}, "-created_date", 200);
            
            // העשרת נתונים במידת הצורך (למשל שמות עסקים אם חסר, אבל יש לנו business_page_id)
            // לצורך יעילות נסתמך על הנתונים בהזמנה, או נשלוף עסקים בנפרד אם נצטרך שמות מדויקים
            // רוב הסיכויים שנצטרך את שם העסק. נבצע שליפה מרוכזת של עסקים רלוונטיים או נסתמך על cache
            // כאן נניח שלצורך הדאשבורד נציג את ה-ID או שנבצע שליפה נוספת אם זה קריטי.
            // אופציה ב': נשלוף גם את כל העסקים כדי למפות שמות.
            
            const businessIds = [...new Set(result.map(o => o.business_page_id))];
            let businessMap = {};
            if (businessIds.length > 0) {
                 // שליפה באצווה עשויה להיות כבדה, ננסה לייעל או לוותר אם יש שם עסק בהזמנה?
                 // אין שם עסק בהזמנה, יש רק ID. נשלוף את העסקים.
                 const businesses = await base44.entities.BusinessPage.filter({
                     id: { $in: businessIds }
                 });
                 businesses.forEach(b => {
                     businessMap[b.id] = b.business_name;
                 });
            }
            
            return result.map(order => ({
                ...order,
                business_name: businessMap[order.business_page_id] || 'עסק לא ידוע'
            }));
        },
        refetchInterval: 30000 // רענון כל 30 שניות
    });

    // חישוב סטטיסטיקות
    const stats = useMemo(() => {
        const total = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const pendingOrders = orders.filter(o => ['new', 'payment', 'preparing'].includes(o.status)).length;
        const deliveryFailures = orders.filter(o => o.delivery_integration_status === 'failed').length;

        return { total, totalRevenue, pendingOrders, deliveryFailures };
    }, [orders]);

    // סינון הזמנות
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = 
                (order.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (order.order_number?.toString() || "").includes(searchTerm) ||
                (order.customer_phone || "").includes(searchTerm) ||
                (order.business_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            
            const matchesDelivery = deliveryFilter === "all" || 
                (deliveryFilter === "delivery" && order.delivery_type === "delivery") ||
                (deliveryFilter === "pickup" && order.delivery_type === "pickup");

            return matchesSearch && matchesStatus && matchesDelivery;
        });
    }, [orders, searchTerm, statusFilter, deliveryFilter]);

    const getStatusBadge = (status) => {
        const colors = {
            new: "bg-blue-100 text-blue-800",
            payment: "bg-yellow-100 text-yellow-800",
            preparing: "bg-orange-100 text-orange-800",
            ready: "bg-green-100 text-green-800",
            picked_up: "bg-purple-100 text-purple-800",
            completed: "bg-gray-100 text-gray-800",
            cancelled: "bg-red-100 text-red-800"
        };
        const labels = {
            new: "חדש",
            payment: "ממתין לתשלום",
            preparing: "בהכנה",
            ready: "מוכן",
            picked_up: "נאסף",
            completed: "הושלם",
            cancelled: "בוטל"
        };
        return (
            <Badge className={`${colors[status] || "bg-gray-100"} border-0`}>
                {labels[status] || status}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">טוען נתוני הזמנות...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <p>שגיאה בטעינת ההזמנות: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ניהול הזמנות</h1>
                        <p className="text-gray-500 mt-1">מבט כולל על כל ההזמנות במערכת</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border">
                        <Clock className="w-4 h-4" />
                        עודכן לאחרונה: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white shadow-sm border-blue-100 border-r-4 border-r-blue-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">סה"כ הזמנות (200 אחרונות)</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-green-100 border-r-4 border-r-green-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">הכנסות משוערות</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">₪{stats.totalRevenue.toLocaleString()}</h3>
                                </div>
                                <div className="p-3 bg-green-50 rounded-full">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-orange-100 border-r-4 border-r-orange-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">הזמנות פתוחות</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</h3>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-full">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-red-100 border-r-4 border-r-red-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">כשלי משלוח</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.deliveryFailures}</h3>
                                </div>
                                <div className="p-3 bg-red-50 rounded-full">
                                    <Truck className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card className="bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input 
                                    placeholder="חיפוש לפי מספר הזמנה, שם לקוח, טלפון או עסק..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Filter className="w-4 h-4 ml-2 text-gray-500" />
                                    <SelectValue placeholder="סטטוס הזמנה" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                                    <SelectItem value="new">חדש</SelectItem>
                                    <SelectItem value="preparing">בהכנה</SelectItem>
                                    <SelectItem value="ready">מוכן</SelectItem>
                                    <SelectItem value="completed">הושלם</SelectItem>
                                    <SelectItem value="cancelled">בוטל</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Truck className="w-4 h-4 ml-2 text-gray-500" />
                                    <SelectValue placeholder="סוג משלוח" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">הכל</SelectItem>
                                    <SelectItem value="delivery">משלוח</SelectItem>
                                    <SelectItem value="pickup">איסוף עצמי</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card className="bg-white shadow-lg border-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-right"># הזמנה</TableHead>
                                    <TableHead className="text-right">תאריך ושעה</TableHead>
                                    <TableHead className="text-right">עסק</TableHead>
                                    <TableHead className="text-right">לקוח</TableHead>
                                    <TableHead className="text-right">סוג</TableHead>
                                    <TableHead className="text-right">סכום</TableHead>
                                    <TableHead className="text-center">סטטוס</TableHead>
                                    <TableHead className="text-center">משלוח (חיצוני)</TableHead>
                                    <TableHead className="text-center">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                                            לא נמצאו הזמנות תואמות לחיפוש
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-mono text-xs text-gray-600">
                                                {order.order_number || order.id.slice(-6)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.created_date ? format(new Date(order.created_date), 'dd/MM/yy HH:mm') : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium text-blue-900">
                                                {order.business_name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{order.customer_name}</span>
                                                    <span className="text-xs text-gray-500">{order.customer_phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {order.delivery_type === 'delivery' ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">משלוח</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">איסוף</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900">
                                                ₪{order.total_amount}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {order.delivery_type === 'delivery' ? (
                                                    order.delivery_integration_status === 'success' ? (
                                                        <div className="flex justify-center" title="נשלח בהצלחה למערכת המשלוחים">
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        </div>
                                                    ) : order.delivery_integration_status === 'failed' ? (
                                                        <div className="flex justify-center" title={`נכשל: ${order.integration_error}`}>
                                                            <XCircle className="w-5 h-5 text-red-500" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-gray-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => console.log('View order details', order.id)}
                                                    className="text-gray-500 hover:text-blue-600"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-gray-50 p-3 text-xs text-center text-gray-500 border-t">
                         מציג {filteredOrders.length} מתוך {stats.total} הזמנות אחרונות
                    </div>
                </Card>
            </div>
        </div>
    );
}
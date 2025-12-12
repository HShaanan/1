
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";
import { Report } from "@/entities/Report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList, Filter, AlertTriangle, CheckCircle, Mail, MessageSquare, Bug, Heart, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const reportTypes = {
  inappropriate: { label: "תוכן לא ראוי", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  bug: { label: "תקלה טכנית", icon: Bug, color: "bg-orange-100 text-orange-800" },
  suggestion: { label: "הצעה לשיפור", icon: MessageSquare, color: "bg-blue-100 text-blue-800" },
  compliment: { label: "המלצה חיובית", icon: Heart, color: "bg-pink-100 text-pink-800" },
  other: { label: "אחר", icon: ClipboardList, color: "bg-gray-100 text-gray-800" }
};

const statusTypes = {
  new: { label: "חדש", color: "bg-blue-500" },
  in_progress: { label: "בטיפול", color: "bg-yellow-500" },
  resolved: { label: "טופל", color: "bg-green-500" },
  ignored: { label: "התעלם", color: "bg-gray-500" },
  approved_as_testimonial: { label: "אושר כחוות דעת", color: "bg-purple-500" }
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null); // New state for loading indicator
  
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        const user = await User.me();
        if (user.role !== 'admin') {
          setError("אין לך הרשאות גישה לעמוד זה.");
          setIsLoading(false);
          return;
        }
        await loadReports();
      } catch (err) {
        await User.loginWithRedirect(window.location.href);
      }
    };
    checkAdminAndLoad();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await Report.list("-created_date");
      setReports(data);
    } catch (err) {
      setError("שגיאה בטעינת הדיווחים.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    setIsUpdatingStatus(reportId); // Set loading for this specific report
    try {
      await Report.update(reportId, { status: newStatus });
      
      // אם זו המלצה שאושרה כחוות דעת, צור רשומת חוות דעת
      if (newStatus === 'approved_as_testimonial') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.report_type === 'compliment') {
          const { CustomerTestimonial } = await import("@/entities/CustomerTestimonial");
          
          // יצירת חוות דעת חדשה
          await CustomerTestimonial.create({
            customer_name: report.user_name || "לקוח מרוצה",
            customer_title: report.reviewer_title || "תושב ביתר עילית",
            testimonial_text: report.report_text,
            rating: report.rating || 5, // השתמש בדירוג שנתן המשתמש
            customer_email: report.user_email, // שמירת האימייל לעתיד
            source_report_id: reportId,
            approved_by: (await User.me()).email,
            is_featured: true, // יופיע בעמוד הבית
            is_active: true,
            approved_at: new Date().toISOString()
          });
          
          // עדכון הדיווח שאושר כחוות דעת
          await Report.update(reportId, { 
            approved_as_testimonial: true, 
            testimonial_approved_at: new Date().toISOString() 
          });

          alert('ההמלצה אושרה בהצלחה וצוחדה לחוות הדעת באתר!');
        }
      }
      
      await loadReports();
    } catch (err) {
      setError("שגיאה בעדכון סטטוס.");
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(null); // Clear loading state
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    try {
      await Report.update(selectedReport.id, { admin_notes: adminNotes });
      setIsDetailsModalOpen(false);
      await loadReports();
    } catch (err) {
      setError("שגיאה בשמירת הערות.");
    }
  };
  
  const openDetailsModal = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
    setIsDetailsModalOpen(true);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const typeMatch = typeFilter === "all" || report.report_type === typeFilter;
      const statusMatch = statusFilter === "all" || report.status === statusFilter;
      const searchMatch = !searchTerm ||
        report.report_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_email.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [reports, typeFilter, statusFilter, searchTerm]);

  // סטטיסטיקות מהירות
  const newReportsCount = reports.filter(r => r.status === 'new').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  if (isLoading) {
    return <div className="p-8 text-center">טוען דיווחים...</div>;
  }
  
  if (error) {
    return <Alert variant="destructive" className="m-8">{error}</Alert>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-blue-600 to-purple-500 bg-clip-text text-transparent">ניהול דיווחים</h1>
          <p className="text-gray-600">כלל הדיווחים מהמשתמשים במקום אחד</p>
        </div>
      </div>

      {/* סטטיסטיקות מהירות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">דיווחים חדשים</p>
              <p className="text-2xl font-bold text-orange-600">{newReportsCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">בטיפול</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <Loader2 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">טופל</p>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">סה"כ דיווחים</p>
              <p className="text-2xl font-bold text-gray-700">{reports.length}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/> סינון וחיפוש</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            placeholder="חיפוש לפי תוכן או אימייל..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="סנן לפי סוג" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוגים</SelectItem>
              {Object.entries(reportTypes).map(([key, {label}]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="סנן לפי סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(statusTypes).map(([key, {label}]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <p className="text-sm text-gray-500 mb-4">נמצאו {filteredReports.length} דיווחים.</p>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>סטטוס</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>משתמש</TableHead>
              <TableHead className="hidden md:table-cell">תאריך</TableHead>
              <TableHead className="w-[40%]">תוכן</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map(report => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isUpdatingStatus === report.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <Select onValueChange={(val) => handleStatusChange(report.id, val)} value={report.status}>
                        <SelectTrigger className="w-40">
                           <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${statusTypes[report.status]?.color}`}></div>
                             <span>{statusTypes[report.status]?.label}</span>
                           </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusTypes).map(([key, {label}]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                              {key === 'approved_as_testimonial' && report.report_type !== 'compliment' && (
                                <span className="text-xs text-gray-500 mr-2">(רק להמלצות)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${reportTypes[report.report_type]?.color} flex items-center gap-1`}>
                    {reportTypes[report.report_type]?.icon && React.createElement(reportTypes[report.report_type].icon, { className: "w-3 h-3" })}
                    <span>{reportTypes[report.report_type]?.label}</span>
                    {report.report_type === 'compliment' && report.rating && (
                      <span className="mr-1">
                        {'★'.repeat(report.rating)}
                      </span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="w-3 h-3" /> 
                    {report.user_name ? `${report.user_name} (${report.user_email})` : report.user_email}
                  </div>
                  {report.reviewer_title && (
                    <div className="text-xs text-gray-500 mt-1">{report.reviewer_title}</div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-gray-500">{format(new Date(report.created_date), "d/M/yy HH:mm", { locale: he })}</TableCell>
                <TableCell className="text-sm text-gray-700 truncate max-w-sm">{report.report_text}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openDetailsModal(report)}>
                    צפה ונהל
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredReports.length === 0 && <div className="text-center p-8 text-gray-500">לא נמצאו דיווחים.</div>}
      </Card>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        {selectedReport && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-right text-gray-900 text-xl font-bold">פרטי דיווח</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right text-gray-800">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <strong className="text-gray-900">סוג:</strong>
                  <span className="text-gray-800">{reportTypes[selectedReport.report_type]?.label}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <strong className="text-gray-900">מאת:</strong>
                  <span className="text-gray-800">{selectedReport.user_name ? `${selectedReport.user_name} (${selectedReport.user_email})` : selectedReport.user_email}</span>
                </div>
                {selectedReport.reviewer_title && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <strong className="text-gray-900">כותרת מדרג:</strong>
                    <span className="text-gray-800">{selectedReport.reviewer_title}</span>
                  </div>
                )}
                {selectedReport.report_type === 'compliment' && selectedReport.rating && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <strong className="text-gray-900">דירוג:</strong>
                    <span className="text-gray-800">{'★'.repeat(selectedReport.rating)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <strong className="text-gray-900">תאריך:</strong>
                  <span className="text-gray-800">{format(new Date(selectedReport.created_date), "d MMMM yyyy, HH:mm", { locale: he })}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <strong className="text-gray-900">מתוך עמוד:</strong>
                  <a href={selectedReport.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                    {selectedReport.page_url}
                  </a>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold mb-2 text-gray-900">תוכן הדיווח:</h4>
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{selectedReport.report_text}</p>
              </div>
              
              <div>
                <label className="font-semibold block mb-2 text-right text-gray-900">הערות מנהל:</label>
                <Textarea 
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)} 
                  rows={3} 
                  placeholder="הוסף הערות פנימיות..."
                  className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)} className="border-gray-300 text-gray-800 hover:bg-gray-50">
                סגור
              </Button>
              <Button onClick={handleSaveNotes} className="bg-blue-600 hover:bg-blue-700 text-white">
                שמור הערות
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

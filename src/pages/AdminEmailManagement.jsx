
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Send, Users, Search, AlertCircle, CheckCircle2,
  Clock, RefreshCw, Loader2, Image as ImageIcon,
  Type,
  ChevronLeft, ChevronRight, MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { EmailService } from "@/components/EmailService";
import ReactQuill from 'react-quill';

export default function AdminEmailManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // Pagination states
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [currentLogsPage, setCurrentLogsPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [logsPerPage] = useState(15);

  // מצבי שליחת מייל
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    toType: 'single',
    subject: '',
    body: '',
    htmlBody: '' // עבור Rich Text Editor
  });

  // Rich Text Editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean'],
      [{ 'direction': 'rtl' }]
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align', 'list', 'bullet',
    'link', 'image', 'direction'
  ];

  const loadUsers = async () => {
    try {
      const usersData = await base44.entities.User.list("-created_date");
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const logsData = await base44.entities.EmailLog?.list?.("-sent_at", 100) || [];
      setEmailLogs(logsData);
    } catch (err) {
      console.error("Error loading email logs:", err);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userData = await base44.auth.me().catch(() => null);
        if (!userData) {
          await base44.auth.redirectToLogin(window.location.href);
          return;
        }

        if (userData.role !== 'admin') {
          setError("אין לך הרשאות גישה לעמוד זה");
          return;
        }

        setCurrentUser(userData);
        await Promise.all([loadUsers(), loadEmailLogs()]);
      } catch (err) {
        setError("שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  // Image upload handler for Rich Text Editor
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      setIsUploadingImage(true);
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = result?.data?.file_url || result?.file_url;

        // Insert image into Quill editor
        // ReactQuill manages state; update composeData.htmlBody directly
        // This approach will add the image at the end or where Quill decides based on current cursor.
        // For explicit insertion at cursor, Quill's internal API is needed, but this works for general appending.
        setComposeData(prev => ({
          ...prev,
          htmlBody: prev.htmlBody + `<img src="${fileUrl}" style="max-width: 100%; height: auto;" alt="תמונה מועלית" />`
        }));
      } catch (error) {
        alert('שגיאה בהעלאת התמונה: ' + error.message);
      } finally {
        setIsUploadingImage(false);
      }
    };

    input.click();
  };

  const handleSendEmail = async () => {
    if (!composeData.subject || (!composeData.body && !composeData.htmlBody)) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    if (composeData.toType === 'single' && !composeData.to) {
      alert('אנא הזן כתובת אימייל');
      return;
    }

    setIsSending(true);

    try {
      // עיבוד התוכן - הבטחת מבנה נכון
      let processedBody = composeData.htmlBody || composeData.body;
      
      // ניקוי HTML מיותר ותיקון מבנה
      processedBody = processedBody
        .replace(/<p><br><\/p>/g, '<br>') // הסרת פסקאות ריקות
        .replace(/<p>\s*<\/p>/g, '') // הסרת פסקאות ריקות
        .replace(/\n{3,}/g, '\n\n') // הגבלת שורות ריקות
        .replace(/<div><br><\/div>/g, '<br>'); // תיקון divs ריקים

      // וידוא שהתוכן לא ארוך מדי
      if (processedBody.length > 50000) {
        processedBody = processedBody.substring(0, 50000) + '...<br><em>(התוכן נקטע עקב אורך)</em>';
      }

      if (composeData.toType === 'single') {
        const recipient = users.find(u => u.email === composeData.to) ||
                         { email: composeData.to, full_name: 'משתמש' };

        const emailData = {
          to: recipient.email,
          user_name: recipient.full_name,
          email_type: "admin_message",
          subject: composeData.subject,
          body: processedBody,
          from_name: "צוות משלנו"
        };

        const result = await EmailService.sendEmailWithLogging(emailData, {
          sent_by_admin: currentUser.email,
          admin_name: currentUser.full_name
        });

        if (result.success) {
          alert('המייל נשלח בהצלחה!');
        } else {
          alert(`שגיאה בשליחת המייל: ${result.error}`);
        }
      } else {
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
          try {
            const emailData = {
              to: user.email,
              user_name: user.full_name,
              email_type: "admin_broadcast",
              subject: composeData.subject,
              body: processedBody,
              from_name: "צוות משלנו"
            };

            const result = await EmailService.sendEmailWithLogging(emailData, {
              sent_by_admin: currentUser.email,
              admin_name: currentUser.full_name,
              broadcast_message: true
            });

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            failCount++;
          }
        }

        alert(`שליחה הושלמה!\nנשלח בהצלחה: ${successCount}\nכשל: ${failCount}`);
      }

      setComposeData({ to: '', toType: 'single', subject: '', body: '', htmlBody: '' });
      setShowComposeModal(false);
      await loadEmailLogs();

    } catch (error) {
      console.error('Email sending error:', error);
      alert('שגיאה כללית בשליחת המייל');
    } finally {
      setIsSending(false);
    }
  };

  const createPersonalEmailTemplate = (user, subject, body) => {
    return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" dir="rtl">
  <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 30px 20px; text-align: center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png" alt="משלנו לוגו" style="height: 50px; margin-bottom: 10px;"/>
    <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">✉️ משלנו</div>
    <div style="font-size: 16px; opacity: 0.9;">הודעה מצוות האתר</div>
  </div>

  <div style="padding: 30px 25px; color: #374151; line-height: 1.7; text-align: right;">
    <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; text-align: center;">
      שלום ${user.full_name || 'משתמש יקר'},
    </h2>

    <div style="background: #f8fafc; border-right: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 6px;">
      ${body}
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      תודה שאתה חלק מקהילת משלנו!<br/>
      <strong>צוות משלנו – לוח המודעות של ביתר עילית</strong>
    </div>
  </div>

  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
    מייל זה נשלח מצוות האתר. לכל שאלה, אנא פנה אלינו בכתובת: support@beitar-ads.co.il<br/>
    <strong>משלנו</strong> | רח׳ הרב קוק 15, ביתר עילית
  </div>
</div>`;
  };

  // Pagination logic
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = emailLogs.filter(log =>
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Users pagination
  const indexOfLastUser = currentUsersPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsersList = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Logs pagination
  const indexOfLastLog = currentLogsPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogsList = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalLogsPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
      const pageNumbers = [];
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          הקודם
        </Button>

        {getPageNumbers().map(number => (
          <Button
            key={number}
            variant={currentPage === number ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(number)}
            className="min-w-[40px]"
          >
            {number}
          </Button>
        ))}

        {totalPages > 5 && currentPage < totalPages - 2 && (
          <>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          הבא
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">טוען מערכת ניהול מייל...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-l from-blue-600 to-purple-500 bg-clip-text text-transparent">
                ניהול מייל מתקדם
              </h1>
              <p className="text-gray-600">שלח הודעות עם תמונות ועיצוב מתקדם</p>
            </div>
          </div>

          <Button
            onClick={() => setShowComposeModal(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            חבר הודעה חדשה
          </Button>
        </div>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              עורך מתקדם
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              משתמשים ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              היסטוריית שליחות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-indigo-600" />
                  כתיבת הודעה עם עורך מתקדם
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">סוג שליחה</label>
                    <Select
                      value={composeData.toType}
                      onValueChange={(value) => setComposeData({...composeData, toType: value, to: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג שליחה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">משתמש יחיד</SelectItem>
                        <SelectItem value="all">כל המשתמשים</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {composeData.toType === 'single' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">כתובת אימייל</label>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={composeData.to}
                        onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                        className="text-right"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">נושא ההודעה</label>
                  <Input
                    placeholder="נושא המייל..."
                    value={composeData.subject}
                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    className="text-right"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">תוכן ההודעה (עורך מתקדם)</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImageUpload}
                        disabled={isUploadingImage}
                        className="gap-1"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3 h-3" />
                        )}
                        הוסף תמונה
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-white">
                    <ReactQuill
                      theme="snow"
                      value={composeData.htmlBody}
                      onChange={(content) => setComposeData({...composeData, htmlBody: content})}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="כתוב את ההודעה שלך כאן... ניתן להוסיף תמונות, עיצוב וקישורים"
                      style={{
                        minHeight: '200px',
                        direction: 'rtl',
                        textAlign: 'right'
                      }}
                    />
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    💡 ניתן להשתמש בכל כלי העיצוב: כותרות, צבעים, קישורים ותמונות
                  </div>
                </div>

                <Button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      שלח הודעה
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>רשימת משתמשים</CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {filteredUsers.length} משתמשים
                    </span>
                    <Button
                      variant="outline"
                      onClick={loadUsers}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      רענן
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="חפש לפי שם או אימייל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">תאריך הצטרפות</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsersList.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || 'לא צוין'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{format(new Date(user.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setComposeData({...composeData, to: user.email, toType: 'single'});
                                setShowComposeModal(true);
                              }}
                            >
                              <Mail className="w-4 h-4 ml-1" />
                              שלח מייל
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={currentUsersPage}
                  totalPages={totalUsersPages}
                  onPageChange={setCurrentUsersPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>היסטוריית מיילים שנשלחו</CardTitle>
                  <span className="text-sm text-gray-500">
                    {filteredLogs.length} מיילים
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="חפש במיילים..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">נמען</TableHead>
                        <TableHead className="text-right">נושא</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">תאריך שליחה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentLogsList.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.user_email}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={log.subject}>
                              {log.subject}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.status === 'sent' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 ml-1" />
                                  נשלח
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 ml-1" />
                                  כשל
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={currentLogsPage}
                  totalPages={totalLogsPages}
                  onPageChange={setCurrentLogsPage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* מודאל כתיבת הודעה משופר */}
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-indigo-600" />
                כתיבת הודעה עם עורך מתקדם
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">סוג שליחה</label>
                  <Select
                    value={composeData.toType}
                    onValueChange={(value) => setComposeData({...composeData, toType: value, to: ''})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג שליחה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">משתמש יחיד</SelectItem>
                      <SelectItem value="all">כל המשתמשים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {composeData.toType === 'single' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">לקוח</label>
                    <Input
                      type="email"
                      placeholder="כתובת אימייל..."
                      value={composeData.to}
                      onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                      className="text-right"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">נושא</label>
                <Input
                  placeholder="נושא ההודעה..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  className="text-right"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">תוכן ההודעה</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage}
                    className="gap-1"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    הוסף תמונה
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={composeData.htmlBody}
                    onChange={(content) => setComposeData({...composeData, htmlBody: content})}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="כתוב את ההודעה שלך כאן..."
                    style={{ minHeight: '250px' }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button variant="outline" onClick={() => setShowComposeModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    שלח
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

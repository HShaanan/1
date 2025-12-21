import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search, Shield, Crown, UserCheck, UserX,
  Mail, Calendar, AlertTriangle, RefreshCw,
  MoreHorizontal, Trash2, Edit, UserPlus, Download, X, Check, Users as UsersIcon, Send
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Placeholder for useDebounce if not available from @/components/PerformanceOptimizations
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Placeholder for formatRelativeTime if not available from @/components/utils/dateUtils
const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds} שניות`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} דקות`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} שעות`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} ימים`;
    // For older dates, fallback to a simple Israeli date format
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
};

import { formatIsraeliDateTime } from '@/components/utils/dateUtils';
import { toast } from "sonner";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Helper to determine if a user is "online" (last activity within a recent timeframe)
  const isOnline = (lastActivityDateString) => {
    if (!lastActivityDateString) return false;
    const lastActivity = new Date(lastActivityDateString);
    const now = new Date();
    // Consider online if activity was within the last 5 minutes
    return (now.getTime() - lastActivity.getTime()) < (5 * 60 * 1000);
  };

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      const usersData = await User.list("-created_date");
      
      const enrichedUsers = usersData.map(user => ({
          ...user,
          last_activity: user.last_activity || user.updated_date, // Fallback to updated_date for activity
      }));
      setUsers(enrichedUsers);

    } catch (err) {
      // First attempt failed, try again after a delay
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const usersData = await User.list("-created_date");
        const enrichedUsers = usersData.map(user => ({
            ...user,
            last_activity: user.last_activity || user.updated_date,
        }));
        setUsers(enrichedUsers);
        
      } catch (retryErr) {
        if (retryErr.message && retryErr.message.includes('Network Error')) {
          setError("שגיאת חיבור לשרת. בדוק את החיבור לאינטרנט ונסה לרענן את הדף.");
        } else {
          setError("שגיאה בטעינת רשימת המשתמשים. אנא רענן את הדף.");
        }
      }
    }
  }, []);

  const checkAdminAccess = useCallback(async () => {
    try {
      const userData = await User.me().catch(() => null);
      if (!userData) {
        await User.loginWithRedirect(window.location.href);
        return;
      }

      if (userData.role !== 'admin') {
        setError("אין לך הרשאות גישה לעמוד זה");
        return;
      }

      setCurrentUser(userData);
      await loadUsers();
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  }, [loadUsers]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        loadUsers();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser, loadUsers]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await User.update(userId, { role: newRole });
      await loadUsers();
      toast.success(`תפקיד המשתמש עודכן בהצלחה ל-${newRole === 'admin' ? 'מנהל' : 'משתמש רגיל'}.`);
    } catch (err) {
      setError("שגיאה בעדכון תפקיד המשתמש");
      toast.error("שגיאה בעדכון תפקיד המשתמש.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      // Assuming a User.delete method exists. Placeholder for actual API call.
      // await User.delete(userId); 
      console.log(`Deleting user with ID: ${userId}`); // This is a placeholder for the actual delete operation
      await loadUsers();
      toast.success(`המשתמש '${userName || userId}' נמחק בהצלחה.`);
    } catch (err) {
      setError("שגיאה במחיקת המשתמש");
      toast.error("שגיאה במחיקת המשתמש.");
    }
  };

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    setIsLoading(true);
    setError("");
    
    try {
      await loadUsers();
      toast.success("נתוני המשתמשים רועננו בהצלחה!");
    } catch (err) {
      console.error("Manual refresh failed:", err);
      setError("שגיאה ברענון הנתונים");
      toast.error("שגיאה ברענון הנתונים.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!confirm(`האם אתה בטוח שברצונך לשלוח מייל לכל ${users.length} המשתמשים?`)) {
      return;
    }

    setIsSendingEmails(true);
    try {
      const result = await base44.functions.invoke('sendBulkEmail', {});
      
      if (result.data?.success) {
        toast.success(`המיילים נשלחו בהצלחה! נשלחו: ${result.data.successCount}, נכשלו: ${result.data.failCount}`);
      } else {
        toast.error('שגיאה בשליחת המיילים');
      }
    } catch (err) {
      console.error('Error sending bulk email:', err);
      toast.error('שגיאה בשליחת המיילים');
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Filter and memoize users based on search term and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !debouncedSearchTerm ||
        user.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearchTerm, roleFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-purple-600" />
              ניהול משתמשים
            </h1>
            <Badge variant="secondary" className="text-lg">
              {filteredUsers.length} משתמשים
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendBulkEmail}
              disabled={isSendingEmails || users.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className={`w-4 h-4 ${isSendingEmails ? 'animate-pulse' : ''}`} />
              {isSendingEmails ? 'שולח מיילים...' : 'שלח מייל לכולם'}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              רענן נתונים
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mr-4"
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                נסה שוב
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              חיפוש וסינון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="חפש לפי שם או אימייל..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל התפקידים</SelectItem>
                  <SelectItem value="admin">מנהלים</SelectItem>
                  <SelectItem value="user">משתמשים רגילים</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 text-gray-600">
          <p>
            נמצאו {filteredUsers.length} משתמשים מתוך {users.length} סך הכל
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>משתמש</TableHead>
                    <TableHead>תפקיד</TableHead>
                    <TableHead>פעילות אחרונה</TableHead>
                    <TableHead className="hidden md:table-cell">תאריך הצטרפות</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.full_name || 'לא צוין שם'}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail className="w-3 h-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className={user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}>
                                {user.role === 'admin' ? <Crown className="w-3 h-3 ml-1" /> : <UserCheck className="w-3 h-3 ml-1" />}
                                {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" title={user.last_activity ? formatIsraeliDateTime(user.last_activity) : 'לא זמין'}>
                              <div className={`w-2.5 h-2.5 rounded-full ${isOnline(user.last_activity) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                              <span>{user.last_activity ? formatRelativeTime(user.last_activity) : 'לא ידוע'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell" title={user.created_date ? formatIsraeliDateTime(user.created_date) : ''}>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {user.created_date ? formatIsraeliDateTime(user.created_date).split(' ')[0] : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">פתח תפריט</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                {user.id !== currentUser?.id && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleRoleUpdate(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                      className="cursor-pointer"
                                    >
                                      {user.role === 'admin' ? (
                                        <>
                                          <UserX className="w-4 h-4 ml-2" /> הסר מנהל
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="w-4 h-4 ml-2" /> הפוך למנהל
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem className="text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="w-4 h-4 ml-2" /> מחק משתמש
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                  </>
                                )}
                                {user.id === currentUser?.id && (
                                  <DropdownMenuItem disabled className="text-gray-500">
                                    <Check className="w-4 h-4 ml-2" /> זה אתה
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Delete Confirmation Dialog */}
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>האם אתה בטוח?</DialogTitle>
                                <DialogDescription>
                                  פעולה זו תמחק לצמיתות את המשתמש {user.full_name || user.email}. לא ניתן לבטל פעולה זו.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">ביטול</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}>
                                  מחק
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                        אין משתמשים התואמים את החיפוש.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">לא נמצאו משתמשים</h3>
            <p className="text-gray-500">נסה לשנות את תנאי החיפוש</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, UserCheck, UserX, Activity, RefreshCw, 
  Clock, Monitor, Eye, Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function AdminLiveUsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setError("");
      
      // Get all sessions updated in the last 2 minutes
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      
      const allSessions = await base44.asServiceRole.entities.ActiveSession.list('-last_heartbeat');
      
      // Filter sessions that are active (heartbeat within last 2 minutes)
      const activeSessions = allSessions.filter(session => {
        const lastHeartbeat = new Date(session.last_heartbeat);
        return lastHeartbeat >= twoMinutesAgo;
      });

      setSessions(activeSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('שגיאה בטעינת הנתונים');
    }
  }, []);

  const checkAdminAccess = useCallback(async () => {
    try {
      const userData = await base44.auth.me();
      if (!userData) {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (userData.role !== 'admin') {
        setError("אין לך הרשאות גישה לעמוד זה");
        return;
      }

      setCurrentUser(userData);
      await loadSessions();
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setIsLoading(false);
    }
  }, [loadSessions]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      // Refresh every 10 seconds
      const interval = setInterval(() => {
        loadSessions();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentUser, loadSessions]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadSessions();
      toast.success("הנתונים רועננו בהצלחה!");
    } catch (err) {
      toast.error("שגיאה ברענון הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 30) return 'כרגע';
    if (seconds < 60) return `לפני ${seconds} שניות`;
    if (seconds < 120) return 'לפני דקה';
    return `לפני ${Math.floor(seconds / 60)} דקות`;
  };

  const authenticatedUsers = sessions.filter(s => s.is_authenticated);
  const guestUsers = sessions.filter(s => !s.is_authenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-700 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh}>נסה שוב</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600 animate-pulse" />
              גולשים באתר
            </h1>
            <Badge variant="secondary" className="text-lg">
              {sessions.length} פעילים
            </Badge>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                סה"כ גולשים
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                פעילים כרגע
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                משתמשים מחוברים
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{authenticatedUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                משתמשים רשומים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                אורחים
              </CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{guestUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                לא מחוברים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              פעילות גולשים בזמן אמת
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>סטטוס</TableHead>
                    <TableHead>משתמש</TableHead>
                    <TableHead>עמוד נוכחי</TableHead>
                    <TableHead>פעילות אחרונה</TableHead>
                    <TableHead className="hidden md:table-cell">מזהה סשן</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <Badge variant={session.is_authenticated ? 'default' : 'secondary'}>
                              {session.is_authenticated ? (
                                <>
                                  <UserCheck className="w-3 h-3 ml-1" />
                                  מחובר
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3 ml-1" />
                                  אורח
                                </>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {session.is_authenticated ? (
                              <>
                                <div className="font-medium">{session.user_name || 'משתמש'}</div>
                                <div className="text-sm text-gray-500">{session.user_email}</div>
                              </>
                            ) : (
                              <span className="text-gray-500 italic">אורח</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span className="font-mono text-xs">{session.current_page || '/'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(session.last_heartbeat)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs font-mono text-gray-400">
                            {session.session_id.slice(0, 20)}...
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                        אין גולשים פעילים כרגע
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            הדף מתעדכן אוטומטית כל 10 שניות
          </p>
        </div>
      </div>
    </div>
  );
}
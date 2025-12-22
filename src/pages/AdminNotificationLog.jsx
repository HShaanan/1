import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminNotificationLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.NotificationLog.list("-created_date", 50);
            setLogs(data);
        } catch (error) {
            console.error("Error loading logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = (log) => {
        setSelectedLog(log);
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">לוג הודעות מערכת</h1>
                        <p className="text-slate-600">מעקב אחר כל ההודעות שנשלחו ללקוחות ומנהלים</p>
                    </div>
                    <Button onClick={loadLogs} variant="outline">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        רענן
                    </Button>
                </div>

                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>היסטוריית הודעות ({logs.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">תאריך</TableHead>
                                    <TableHead className="text-right">סוג</TableHead>
                                    <TableHead className="text-right">ערוץ</TableHead>
                                    <TableHead className="text-right">ספק</TableHead>
                                    <TableHead className="text-right">נמען</TableHead>
                                    <TableHead className="text-center">סטטוס</TableHead>
                                    <TableHead className="text-center">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50">
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(log.created_date).toLocaleString('he-IL', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {log.notification_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">{log.channel}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-slate-600">
                                            {log.provider || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-slate-600">
                                            {log.recipient?.substring(0, 20)}...
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {log.status === 'success' ? (
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm">הצלחה</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-red-600">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-sm">כשלון</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => viewDetails(log)}
                                            >
                                                פרטים
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            אין לוגים להצגה
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>פרטי הודעה</DialogTitle>
                        </DialogHeader>
                        
                        {selectedLog && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="text-sm text-slate-600">תאריך:</span>
                                        <p className="font-medium">{new Date(selectedLog.created_date).toLocaleString('he-IL')}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600">סוג:</span>
                                        <p className="font-medium">{selectedLog.notification_type}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600">ערוץ:</span>
                                        <p className="font-medium">{selectedLog.channel}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600">ספק:</span>
                                        <p className="font-medium font-mono">{selectedLog.provider || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm text-slate-600">נמען:</span>
                                        <p className="font-medium font-mono">{selectedLog.recipient}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm text-slate-600">סטטוס:</span>
                                        <Badge className={selectedLog.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                            {selectedLog.status}
                                        </Badge>
                                    </div>
                                </div>

                                {selectedLog.error_message && (
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                            <span className="font-bold text-red-900">שגיאה:</span>
                                        </div>
                                        <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedLog.error_message}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <span className="text-sm text-slate-600">תוכן ההודעה:</span>
                                    <div className="p-4 bg-slate-100 rounded-lg border">
                                        <pre className="text-sm whitespace-pre-wrap text-slate-800 font-sans">
                                            {selectedLog.content}
                                        </pre>
                                    </div>
                                </div>

                                {selectedLog.provider_response && (
                                    <div className="space-y-2">
                                        <span className="text-sm text-slate-600">תגובת הספק:</span>
                                        <div className="p-4 bg-slate-800 rounded-lg border overflow-x-auto">
                                            <pre className="text-xs text-green-400 font-mono">
                                                {JSON.stringify(selectedLog.provider_response, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
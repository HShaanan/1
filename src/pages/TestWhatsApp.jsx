import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TestWhatsAppPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [logData, setLogData] = useState(null);

    const testOrder = {
        orderId: '6943e2cbb36c482f79a04654',
        businessPageId: '6943e2c0b36c482f79a04652'
    };

    const handleTest = async () => {
        setLoading(true);
        setResult(null);
        setLogData(null);
        try {
            console.log("Sending test request...", testOrder);
            const response = await base44.functions.invoke('notifyNewOrder', testOrder);
            console.log("Response:", response);
            
            if (response.data && response.data.success) {
                setResult({ success: true, message: "ההודעה נשלחה בהצלחה! בדוק את הוואטסאפ." });
                
                // Try to fetch log
                try {
                   const logs = await base44.entities.NotificationLog.filter({
                       related_entity_id: testOrder.orderId
                   }, "-created_date", 1);
                   
                   if (logs && logs.length > 0) {
                       setLogData(logs[0]);
                   }
                } catch (e) {
                    console.log("Could not fetch logs (might not be admin)", e);
                }

            } else {
                setResult({ success: false, message: "השליחה נכשלה: " + (response.data?.error || "שגיאה לא ידועה") });
            }
        } catch (error) {
            console.error("Test failed:", error);
            setResult({ success: false, message: "שגיאת תקשורת: " + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">בדיקת שליחת וואטסאפ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p><strong>עסק לבדיקה:</strong> Test Business For WhatsApp</p>
                        <p><strong>טלפון יעד:</strong> 972534553453</p>
                        <p><strong>מספר הזמנה:</strong> 12345</p>
                        <p><strong>סכום:</strong> ₪50</p>
                    </div>

                    <Button 
                        className="w-full h-12 text-lg" 
                        onClick={handleTest} 
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> שולח...</>
                        ) : (
                            "שלח הודעת בדיקה עכשיו"
                        )}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            <span>{result.message}</span>
                        </div>
                    )}

                    {logData && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-xs">
                            <h4 className="font-bold mb-2">תיעוד במערכת (Log):</h4>
                            <p><strong>ID:</strong> {logData.id}</p>
                            <p><strong>סטטוס:</strong> {logData.status}</p>
                            <p><strong>ערוץ:</strong> {logData.channel}</p>
                            <p><strong>ספק:</strong> {logData.provider}</p>
                            <pre className="mt-2 p-2 bg-gray-100 overflow-x-auto rounded">
                                {JSON.stringify(logData.provider_response, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
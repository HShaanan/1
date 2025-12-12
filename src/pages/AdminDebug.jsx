
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investigateListingOwnership } from "@/functions/investigateListingOwnership";
import { manuallyAssignOwner } from "@/functions/manuallyAssignOwner";
import { fixExistingListingsOwnership } from "@/functions/fixExistingListingsOwnership"; // Added import
import { AlertTriangle, Search, FileText, Loader2, CheckCircle, UserPlus, Key } from "lucide-react";

export default function AdminDebugPage() {
  const [investigation, setInvestigation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [assignListingId, setAssignListingId] = useState("8b54bd986e94202225bbd70");
  const [assignOwnerEmail, setAssignOwnerEmail] = useState("seri0534165505@gmail.com");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState({ message: "", type: "" });

  // New state for fixing existing ownership
  const [isFixingOwnership, setIsFixingOwnership] = useState(false);
  const [fixOwnershipResult, setFixOwnershipResult] = useState({ message: "", type: "" });

  const runInvestigation = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await investigateListingOwnership();
      if (data.success) {
        setInvestigation(data.investigation);
      } else {
        setError(data.message || "שגיאה בחקירה");
      }
    } catch (err) {
      setError(err.message || "שגיאה בביצוע החקירה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignOwner = async () => {
    setIsAssigning(true);
    setAssignResult({ message: "", type: "" });
    try {
        const { data } = await manuallyAssignOwner({
            listing_id: assignListingId,
            owner_email: assignOwnerEmail
        });
        if (data.success) {
            setAssignResult({ message: data.message, type: "success" });
        } else {
            setAssignResult({ message: data.message || "שגיאה בביצוע הפעולה", type: "error" });
        }
    } catch (err) {
        setAssignResult({ message: err.message || "שגיאת רשת בביצוע הפעולה", type: "error" });
    } finally {
        setIsAssigning(false);
    }
  };

  // New function to fix existing ownership
  const handleFixExistingOwnership = async () => {
    setIsFixingOwnership(true);
    setFixOwnershipResult({ message: "", type: "" });
    try {
        const { data } = await fixExistingListingsOwnership();
        if (data.success) {
            setFixOwnershipResult({ message: data.message, type: "success" });
        } else {
            setFixOwnershipResult({ message: data.message || "שגיאה בביצוע תיקון הבעלות", type: "error" });
        }
    } catch (err) {
        setFixOwnershipResult({ message: err.message || "שגיאת רשת בביצוע תיקון הבעלות", type: "error" });
    } finally {
        setIsFixingOwnership(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">חקירת בעיות מערכת</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  חקירת בעלות על מודעות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  בדיקה האם יש מודעות שהבעלות עליהן הוחלפה בטעות לאדמין במקום היוצר המקורי
                </p>
                <Button 
                  onClick={runInvestigation} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      בודק...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      הרץ חקירה
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-green-600" />
                        תיקון בעלות ידני למודעה
                    </CardTitle>
                    <CardDescription>
                        הכלי מאפשר לשייך מודעה עם יוצר 'unknown' לכתובת אימייל של משתמש קיים. יש להשתמש בזהירות.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="listingId">מזהה מודעה (Listing ID)</Label>
                        <Input
                            id="listingId"
                            value={assignListingId}
                            onChange={(e) => setAssignListingId(e.target.value)}
                            placeholder="הדבק כאן את מזהה המודעה"
                        />
                    </div>
                    <div>
                        <Label htmlFor="ownerEmail">אימייל בעלים חדש (Created By)</Label>
                        <Input
                            id="ownerEmail"
                            type="email"
                            value={assignOwnerEmail}
                            onChange={(e) => setAssignOwnerEmail(e.target.value)}
                            placeholder="user@example.com"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                    <Button onClick={handleAssignOwner} disabled={isAssigning || !assignListingId || !assignOwnerEmail}>
                        {isAssigning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                מעדכן...
                            </>
                        ) : (
                             <>
                                <Key className="mr-2 h-4 w-4" />
                                הקצה בעלים למודעה
                             </>
                        )}
                    </Button>
                    {assignResult.message && (
                        <Alert variant={assignResult.type === 'error' ? 'destructive' : 'default'} className={assignResult.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
                            {assignResult.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertDescription>{assignResult.message}</AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            </Card>
        </div>

        {/* New Card for fixing existing ownership */}
        <div className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-6 h-6 text-indigo-600" />
                        תיקון בעלות אוטומטי למודעות
                    </CardTitle>
                    <CardDescription>
                        הכלי מנסה לתקן אוטומטית מודעות ששויכו בטעות לאדמין במקום ליוצר המקורי של המודעה.
                        יש להשתמש בכלי זה בזהירות ולאחר בדיקה ראשונית באמצעות כלי "חקירת בעלות על מודעות".
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col items-start gap-4">
                    <Button 
                        onClick={handleFixExistingOwnership} 
                        disabled={isFixingOwnership}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isFixingOwnership ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                מתקן...
                            </>
                        ) : (
                            <>
                                <Key className="mr-2 h-4 w-4" />
                                תקן בעלות מודעות קיימות
                            </>
                        )}
                    </Button>
                    {fixOwnershipResult.message && (
                        <Alert variant={fixOwnershipResult.type === 'error' ? 'destructive' : 'default'} className={fixOwnershipResult.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
                            {fixOwnershipResult.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertDescription>{fixOwnershipResult.message}</AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            </Card>
        </div>

        {investigation && (
          <div className="grid gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>סיכום כללי</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{investigation.totalListings}</div>
                    <div className="text-sm text-gray-600">סה״כ מודעות</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{investigation.totalUsers}</div>
                    <div className="text-sm text-gray-600">סה״כ משתמשים</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{investigation.listingsCreatedByAdmin}</div>
                    <div className="text-sm text-gray-600">מודעות של האדמין</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{investigation.suspiciousPatterns.percentageByAdmin}%</div>
                    <div className="text-sm text-gray-600">אחוז מודעות אדמין</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>התפלגות יוצרי מודעות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(investigation.creatorDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([creator, count]) => (
                      <div key={creator} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-mono text-sm">{creator}</span>
                        <span className="font-bold">{count} מודעות</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {investigation.recentAdminListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">מודעות אחרונות שנוצרו על שם האדמין</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investigation.recentAdminListings.map(listing => (
                      <div key={listing.id} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                        <div className="font-semibold">{listing.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          נוצר: {new Date(listing.created_date).toLocaleString('he-IL')}
                        </div>
                        <div className="text-sm text-gray-600">
                          עודכן: {new Date(listing.updated_date).toLocaleString('he-IL')}
                        </div>
                        <div className="text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            listing.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                            listing.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.approval_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {investigation.recentlyUpdatedListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>מודעות שעודכנו לאחרונה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investigation.recentlyUpdatedListings.map(listing => (
                      <div key={listing.id} className="border p-4 rounded-lg">
                        <div className="font-semibold">{listing.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          יוצר: {listing.created_by}
                        </div>
                        <div className="text-sm text-gray-600">
                          נוצר: {new Date(listing.created_date).toLocaleString('he-IL')}
                        </div>
                        <div className="text-sm text-gray-600">
                          עודכן: {new Date(listing.updated_date).toLocaleString('he-IL')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

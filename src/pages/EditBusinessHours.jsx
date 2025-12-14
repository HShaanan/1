import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save, AlertTriangle, Loader2, Clock, ChevronLeft, Plus
} from "lucide-react";
import { createPageUrl } from "@/utils";
import BusinessHoursComponent from "@/components/wizard/fields/BusinessHoursComponent";

export default function EditBusinessHoursPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [businessPage, setBusinessPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hours, setHours] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      let currentUser;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (!pageId) {
        setError("לא נמצא מזהה עמוד עסק");
        setIsLoading(false);
        return;
      }

      try {
        const pageData = await base44.entities.BusinessPage.filter({ id: pageId });
        const page = Array.isArray(pageData) ? pageData[0] : pageData;

        if (!page) {
          setError("עמוד העסק לא נמצא");
          setIsLoading(false);
          return;
        }

        const isOwner = page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
          setError("אין לך הרשאה לערוך עמוד עסק זה");
          setIsLoading(false);
          return;
        }

        setBusinessPage(page);
        
        // Parse hours and convert old format to new if needed
        let parsedHours = null;
        if (page.hours) {
          if (typeof page.hours === 'string') {
            try {
              parsedHours = JSON.parse(page.hours);
            } catch (e) {
              console.error('Error parsing hours:', e);
            }
          } else {
            parsedHours = page.hours;
          }
          
          // Convert old format to new format if needed
          if (parsedHours) {
            const schedule = parsedHours.schedule || parsedHours;
            
            if (schedule && Object.keys(schedule).length > 0) {
              const firstKey = Object.keys(schedule)[0];
              const firstDay = schedule[firstKey];
              
              // If old format detected (has 'open'/'close' or 'closed' properties)
              if (firstDay && (firstDay.hasOwnProperty('open') || firstDay.hasOwnProperty('closed'))) {
                const newSchedule = {};
                Object.keys(schedule).forEach(day => {
                  const oldDay = schedule[day];
                  if (oldDay.closed) {
                    newSchedule[day] = { isOpen: false };
                  } else if (oldDay.open && oldDay.close) {
                    newSchedule[day] = {
                      isOpen: true,
                      is24Hours: false,
                      timeRanges: [{ open: oldDay.open, close: oldDay.close }]
                    };
                  }
                });
                parsedHours = { schedule: newSchedule };
              }
            }
          }
        }
        
        setHours(parsedHours);

      } catch (err) {
        setError("שגיאה בטעינת הנתונים: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pageId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await base44.entities.BusinessPage.update(pageId, {
        hours: hours ? JSON.stringify(hours) : null
      });
      
      setSuccessMessage("שעות הפעילות נשמרו בהצלחה!");

      setTimeout(() => {
        window.location.href = createPageUrl(`BusinessManage?id=${pageId}`);
      }, 1500);

    } catch (err) {
      setError("שגיאה בשמירה: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !businessPage) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = createPageUrl(`BusinessManage?id=${pageId}`)}
                className="hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
                חזרה
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  שעות פעילות
                </h1>
                <p className="text-gray-500 mt-1">
                  {businessPage?.business_name || "טוען..."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>

          {successMessage && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-900">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {hours ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                שעות פעילות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessHoursComponent
                value={hours}
                onChange={(newHours) => setHours(newHours)}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                שעות פעילות
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                טרם הוגדרו שעות פעילות. ניתן להוסיף שעות פעילות לעסק בלחיצה על הכפתור.
              </p>
              <Button
                variant="outline"
                onClick={() => setHours({ schedule: {} })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שעות פעילות
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
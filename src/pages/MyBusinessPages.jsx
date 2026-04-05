import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus, Edit, Eye, Clock, CheckCircle, XCircle, AlertTriangle,
  MapPin, Phone, Globe, Star, Trash2, Search, Snowflake, Play, Loader2, Crown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ListingGrid from "@/components/explore/ListingGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MyBusinessPagesPage() {
  const [user, setUser] = useState(null);
  const [businessPages, setBusinessPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [freezeDialog, setFreezeDialog] = useState({ open: false, page: null });
  const [unfreezeDialog, setUnfreezeDialog] = useState({ open: false, page: null });
  const [freezeReason, setFreezeReason] = useState("");
  const [processingFreeze, setProcessingFreeze] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (currentUser.user_type !== 'business' && currentUser.role !== 'admin') {
          setError("רק משתמשים עסקיים יכולים לצפות בעמוד זה.");
          setIsLoading(false);
          return;
        }

        setUser(currentUser);

        // טעינת כל העמודים שלי - כולל מוקפאים!
        const pages = await base44.entities.BusinessPage.filter({
          business_owner_email: currentUser.email
        });
        setBusinessPages(pages);

        const cats = await base44.entities.Category.list();
        setCategories(cats);
        
      } catch (err) {
        if (err.message?.includes('not authenticated')) {
          try {
            await base44.auth.loginWithRedirect(window.location.href);
          } catch (redirectErr) {
            setError("שגיאה בהתחברות. אנא נסה שוב.");
          }
        } else {
          setError("שגיאה בטעינת הנתונים: " + err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFreezePage = async () => {
    if (!freezeDialog.page) return;

    setProcessingFreeze(true);
    try {
      await base44.entities.BusinessPage.update(freezeDialog.page.id, {
        is_frozen: true,
        frozen_at: new Date().toISOString(),
        frozen_reason: freezeReason || null
      });

      setBusinessPages(prev =>
        prev.map(p =>
          p.id === freezeDialog.page.id
            ? { ...p, is_frozen: true, frozen_at: new Date().toISOString(), frozen_reason: freezeReason }
            : p
        )
      );

      setFreezeDialog({ open: false, page: null });
      setFreezeReason("");
    } catch (err) {
      alert("שגיאה בהקפאת העמוד: " + err.message);
    } finally {
      setProcessingFreeze(false);
    }
  };

  const handleUnfreezePage = async () => {
    if (!unfreezeDialog.page) return;

    setProcessingFreeze(true);
    try {
      await base44.entities.BusinessPage.update(unfreezeDialog.page.id, {
        is_frozen: false,
        frozen_at: null,
        frozen_reason: null
      });

      setBusinessPages(prev =>
        prev.map(p =>
          p.id === unfreezeDialog.page.id
            ? { ...p, is_frozen: false, frozen_at: null, frozen_reason: null }
            : p
        )
      );

      setUnfreezeDialog({ open: false, page: null });
    } catch (err) {
      alert("שגיאה בהפשרת העמוד: " + err.message);
    } finally {
      setProcessingFreeze(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "קטגוריה לא ידועה";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />מאושר</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />ממתין לאישור</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />נדחה</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 ml-1" />לא ידוע</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">העסקים שלי</h1>
            <p className="text-gray-600 mt-2">נהל את עמודי העסק שלך</p>
          </div>
          <Button 
            onClick={() => window.location.href = createPageUrl("Add")}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-5 h-5 ml-2" />
            צור עמוד עסק חדש
          </Button>
        </div>

        {businessPages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">עדיין אין לך עמודי עסק</h3>
            <p className="text-gray-600 mb-6">צור את עמוד העסק הראשון שלך והתחל להגיע ללקוחות חדשים</p>
            <Button 
              onClick={() => window.location.href = createPageUrl("Add")}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-5 h-5 ml-2" />
              צור עמוד עסק חדש
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessPages.map((page) => (
              <Card key={page.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${page.is_frozen ? 'border-2 border-blue-300 bg-blue-50/30' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                        {page.business_name}
                      </CardTitle>
                      {page.is_frozen && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            <Snowflake className="w-3 h-3 ml-1" />
                            מוקפא
                          </Badge>
                        </div>
                      )}
                      {page.subscription_type && page.subscription_type !== 'basic' && (
                        <Badge className={`mt-1 ${page.subscription_type === 'enterprise' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'}`}>
                          <Crown className="w-3 h-3 ml-1" />
                          {page.subscription_type === 'enterprise' ? 'עסקי פלוס' : 'פרימיום'}
                        </Badge>
                      )}
                    </div>
                    {!page.is_frozen && getStatusBadge(page.approval_status)}
                  </div>
                  <p className="text-sm text-gray-600">{getCategoryName(page.category_id)}</p>
                </CardHeader>
                
                <CardContent>
                  {page.images?.[0] && (
                    <img 
                      src={page.images[0]} 
                      alt={page.business_name}
                      className={`w-full h-32 object-cover rounded-md mb-4 ${page.is_frozen ? 'opacity-60 grayscale' : ''}`}
                    />
                  )}
                  
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                    {page.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {page.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{page.address}</span>
                      </div>
                    )}
                    {page.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{page.contact_phone}</span>
                      </div>
                    )}
                    {page.website_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">אתר אינטרנט</span>
                      </div>
                    )}
                    {page.smart_rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{page.smart_rating.toFixed(1)} ({page.reviews_count} ביקורות)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!page.is_frozen && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = createPageUrl(`BusinessPage?id=${page.id}&preview=true`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          צפה
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = createPageUrl(`EditBusinessPage?id=${page.id}`)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          ערוך
                        </Button>
                      </>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          אפשרויות
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {page.is_frozen ? (
                          <DropdownMenuItem 
                            onClick={() => setUnfreezeDialog({ open: true, page })}
                            className="text-green-600 focus:text-green-700"
                          >
                            <Play className="w-4 h-4 ml-2" />
                            הפשר עמוד
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => setFreezeDialog({ open: true, page })}
                            className="text-blue-600 focus:text-blue-700"
                          >
                            <Snowflake className="w-4 h-4 ml-2" />
                            הקפא עמוד זמנית
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {page.is_frozen && page.frozen_reason && (
                    <Alert className="mt-3 bg-blue-50 border-blue-200">
                      <AlertDescription className="text-xs text-blue-900">
                        <strong>סיבת הקפאה:</strong> {page.frozen_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!page.is_frozen && page.rejection_reason && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>סיבת דחייה:</strong> {page.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Freeze Dialog */}
      <Dialog open={freezeDialog.open} onOpenChange={(open) => setFreezeDialog({ open, page: null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-blue-600" />
              הקפאת עמוד עסק
            </DialogTitle>
            <DialogDescription>
              העמוד לא יופיע באתר בזמן ההקפאה, אבל כל הנתונים יישמרו
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                סיבת הקפאה (אופציונלי)
              </label>
              <Textarea
                placeholder="למשל: שיפוצים, חופשה, עונת השנה..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={3}
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                💡 <strong>טיפ:</strong> הקפאה זמנית מאפשרת לך להסתיר את העמוד מבלי למחוק אותו. תוכל להפשיר אותו בכל עת.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFreezeDialog({ open: false, page: null })}
              disabled={processingFreeze}
            >
              ביטול
            </Button>
            <Button
              onClick={handleFreezePage}
              disabled={processingFreeze}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingFreeze ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מקפיא...
                </>
              ) : (
                <>
                  <Snowflake className="w-4 h-4 ml-2" />
                  הקפא עמוד
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unfreeze Dialog */}
      <Dialog open={unfreezeDialog.open} onOpenChange={(open) => setUnfreezeDialog({ open, page: null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              הפשרת עמוד עסק
            </DialogTitle>
            <DialogDescription>
              העמוד יחזור להיות פעיל ויופיע שוב באתר
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-sm text-green-900">
              ✅ העמוד יחזור להיות נראה לכל המשתמשים באתר
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnfreezeDialog({ open: false, page: null })}
              disabled={processingFreeze}
            >
              ביטול
            </Button>
            <Button
              onClick={handleUnfreezePage}
              disabled={processingFreeze}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingFreeze ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מפשיר...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-2" />
                  הפשר עמוד
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
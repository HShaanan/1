
import React, { useState } from 'react';
import { Listing } from '@/entities/Listing';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Bug, Database, Image, AlertCircle } from 'lucide-react';

export default function AdminDebugListingPage() {
  const [user, setUser] = useState(null);
  const [listingId, setListingId] = useState('68bd1ca6e786259f384ed020');
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualImages, setManualImages] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser?.role !== 'admin') {
          setError('אין לך הרשאות אדמין');
        }
      } catch (err) {
        setError('נדרש להתחבר כאדמין');
      }
    };
    loadUser();
  }, []);

  const debugListing = async () => {
    if (!listingId.trim()) {
      setError('נא להזין מזהה מודעה');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting debug for listing:', listingId);
      
      // בדיקה 1: קריאה רגילה
      const normalResult = await Listing.filter({ id: listingId });
      console.log('📋 Normal filter result:', normalResult);

      // בדיקה 2: קריאה רגילה עם list
      const listResult = await Listing.list();
      const foundInList = listResult?.find(l => l.id === listingId);
      console.log('📋 Found in list result:', foundInList);

      // בדיקה 3: בדיקה כללית - כמה מודעות יש עם תמונות
      const allListings = await Listing.list('-created_date', 50); // Fetching recent 50 listings
      const listingsWithImages = allListings?.filter(l => l.images && Array.isArray(l.images) && l.images.length > 0) || [];
      const listingsWithoutImages = allListings?.filter(l => !l.images || !Array.isArray(l.images) || l.images.length === 0) || [];
      
      console.log('📊 Statistics:', {
        totalListings: allListings?.length || 0,
        withImages: listingsWithImages.length,
        withoutImages: listingsWithoutImages.length
      });

      // בדיקה 4: קריאה עם get אם יש נתונים
      let getResult = null;
      if (normalResult && normalResult.length > 0) {
        try {
          getResult = await Listing.get(listingId);
          console.log('📋 Get result:', getResult);
        } catch (getErr) {
          console.warn('Get failed:', getErr);
        }
      }

      const mainListing = normalResult?.[0] || foundInList || getResult;

      setDebugData({
        listingId,
        mainListing,
        normalResult,
        listResult: listResult?.slice(0, 5), // First 5 for reference
        foundInList,
        getResult,
        timestamp: new Date().toISOString(),
        imageAnalysis: mainListing ? analyzeImages(mainListing.images) : null,
        // הוספת סטטיסטיקות כלליות
        generalStats: {
          totalListings: allListings?.length || 0,
          listingsWithImages: listingsWithImages.length,
          listingsWithoutImages: listingsWithoutImages.length,
          examplesWithImages: listingsWithImages.slice(0, 3).map(l => ({
            id: l.id,
            title: l.title,
            imageCount: l.images?.length || 0,
            firstImage: l.images?.[0] ? l.images[0].substring(0, 100) + '...' : 'N/A'
          })),
          examplesWithoutImages: listingsWithoutImages.slice(0, 3).map(l => ({
            id: l.id,
            title: l.title,
            created_by: l.created_by
          }))
        }
      });

    } catch (err) {
      console.error('Debug error:', err);
      setError('שגיאה בבדיקה: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeImages = (images) => {
    return {
      raw: images,
      type: typeof images,
      isArray: Array.isArray(images),
      length: images?.length || 0,
      isEmpty: !images || (Array.isArray(images) && images.length === 0),
      firstFew: Array.isArray(images) ? images.slice(0, 3) : [],
      analysis: Array.isArray(images) 
        ? images.map((img, i) => ({
            index: i,
            value: img,
            type: typeof img,
            isString: typeof img === 'string',
            isUrl: typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:')),
            length: typeof img === 'string' ? img.length : 0
          }))
        : []
    };
  };

  const fixListingImages = async () => {
    if (!listingId.trim()) {
      setError('נא להזין מזהה מודעה');
      return;
    }

    if (!manualImages.trim()) {
      setError('נא להזין לפחות URL תמונה אחד');
      return;
    }

    setIsUpdating(true);
    setError(null); // Clear previous errors
    try {
      // Parse the manual images input - split by lines and clean
      const imageUrls = manualImages
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && (url.startsWith('http') || url.startsWith('data:')));

      if (imageUrls.length === 0) {
        throw new Error('לא נמצאו URLs תקינים. ודא שכל URL מתחיל ב-"http" או "data:".');
      }

      console.log('🔧 Fixing listing images:', { listingId, imageUrls });

      // Update the listing directly with admin privileges
      const updatedListing = await Listing.update(listingId, {
        images: imageUrls
      });

      console.log('✅ Listing updated successfully:', updatedListing);
      
      setError(null);
      alert(`התמונות עודכנו בהצלחה! נוספו ${imageUrls.length} תמונות למודעה.`);
      
      // Refresh debug data
      await debugListing();
      
    } catch (err) {
      console.error('Failed to fix listing images:', err);
      setError('שגיאה בעדכון התמונות: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">גישה מוגבלת</h2>
        <p>דף זה זמין רק למנהלי המערכת</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="w-8 h-8 text-blue-600" />
          דיבאג מודעות - בדיקת תמונות
        </h1>
        <p className="text-gray-600">כלי לבדיקת נתוני תמונות במסד הנתונים</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* כלי תיקון מיידי */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Image className="w-5 h-5" />
            כלי תיקון תמונות מיידי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              הזן URLs של תמונות (אחת בכל שורה):
            </label>
            <textarea
              value={manualImages}
              onChange={(e) => setManualImages(e.target.value)}
              placeholder={`https://example.com/image1.jpg
https://example.com/image2.png
data:image/jpeg;base64,...`}
              className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
              dir="ltr"
            />
          </div>
          <div className="flex gap-4 items-end">
            <Input
              placeholder="מזהה מודעה לתיקון"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={fixListingImages}
              disabled={isUpdating || !manualImages.trim() || !listingId.trim()}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              {isUpdating ? 'מעדכן...' : 'תקן תמונות עכשיו'}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            💡 טיפ: העתק URLs של תמונות מהמודעות הקיימות עם תמונות, או השתמש בתמונות מ-Google Drive / Imgur
          </p>
        </CardContent>
      </Card>

      {/* כלי בדיקה רגיל */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            בדיקת מודעה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="מזהה מודעה (Listing ID)"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={debugListing} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              {loading ? 'בודק...' : 'בדוק מודעה'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {debugData && (
        <div className="space-y-6">
          {/* סטטיסטיקות כלליות */}
          {debugData.generalStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-600" />
                  סטטיסטיקות כלליות - תמונות במערכת
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800">סך הכל מודעות</h4>
                    <p className="text-2xl font-bold">{debugData.generalStats.totalListings}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">מודעות עם תמונות</h4>
                    <p className="text-2xl font-bold text-green-600">{debugData.generalStats.listingsWithImages}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800">מודעות ללא תמונות</h4>
                    <p className="text-2xl font-bold text-red-600">{debugData.generalStats.listingsWithoutImages}</p>
                  </div>
                </div>

                {debugData.generalStats.examplesWithImages?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-800">דוגמאות למודעות עם תמונות:</h4>
                    <div className="space-y-2">
                      {debugData.generalStats.examplesWithImages.map((example, i) => (
                        <div key={i} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                          <div className="text-sm">
                            <strong>ID:</strong> {example.id}<br />
                            <strong>כותרת:</strong> {example.title}<br />
                            <strong>מספר תמונות:</strong> {example.imageCount}<br />
                            <strong>תמונה ראשונה:</strong> <span className="font-mono text-xs">{example.firstImage}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {debugData.generalStats.examplesWithoutImages?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-800">דוגמאות למודעות ללא תמונות:</h4>
                    <div className="space-y-2">
                      {debugData.generalStats.examplesWithoutImages.map((example, i) => (
                        <div key={i} className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                          <div className="text-sm">
                            <strong>ID:</strong> {example.id}<br />
                            <strong>כותרת:</strong> {example.title}<br />
                            <strong>נוצר על ידי:</strong> {example.created_by}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* תוצאות בדיקה */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                תוצאות בדיקה - {debugData.listingId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Filter Result</h4>
                  <p className="text-sm">{debugData.normalResult ? `נמצאו ${debugData.normalResult.length} תוצאות` : 'לא נמצא'}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800">List Search</h4>
                  <p className="text-sm">{debugData.foundInList ? 'נמצא ברשימה כללית' : 'לא נמצא ברשימה'}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800">Get Method</h4>
                  <p className="text-sm">{debugData.getResult ? 'הצליח' : 'נכשל/לא נוסה'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ניתוח תמונות */}
          {debugData.imageAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-orange-600" />
                  ניתוח תמונות מפורט
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">סוג נתונים</h4>
                    <p className="text-sm font-mono">{debugData.imageAnalysis.type}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">האם מערך</h4>
                    <p className="text-sm">{debugData.imageAnalysis.isArray ? 'כן' : 'לא'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">אורך</h4>
                    <p className="text-sm">{debugData.imageAnalysis.length}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">ריק</h4>
                    <p className="text-sm">{debugData.imageAnalysis.isEmpty ? 'כן' : 'לא'}</p>
                  </div>
                </div>

                {debugData.imageAnalysis.analysis?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">ניתוח פריטי תמונות:</h4>
                    <div className="space-y-2">
                      {debugData.imageAnalysis.analysis.map((item, i) => (
                        <div key={i} className="p-3 border rounded-lg bg-white">
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                            <div><strong>אינדקס:</strong> {item.index}</div>
                            <div><strong>סוג:</strong> {item.type}</div>
                            <div><strong>מחרוזת:</strong> {item.isString ? 'כן' : 'לא'}</div>
                            <div><strong>URL:</strong> {item.isUrl ? 'כן' : 'לא'}</div>
                            <div><strong>אורך:</strong> {item.length}</div>
                            <div className="col-span-2 md:col-span-1">
                              <strong>ערך:</strong> 
                              <p className="text-xs font-mono bg-gray-100 p-1 rounded mt-1 break-all">
                                {typeof item.value === 'string' 
                                  ? item.value.length > 50 
                                    ? item.value.substring(0, 50) + '...' 
                                    : item.value
                                  : String(item.value)
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">נתונים גולמיים:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(debugData.imageAnalysis.raw, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* נתונים גולמיים */}
          {debugData.mainListing && (
            <Card>
              <CardHeader>
                <CardTitle>נתוני מודעה מלאים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold">פרטים בסיסיים:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>ID:</strong> {debugData.mainListing.id}</div>
                    <div><strong>כותרת:</strong> {debugData.mainListing.title}</div>
                    <div><strong>נוצר על ידי:</strong> {debugData.mainListing.created_by}</div>
                    <div><strong>סטטוס אישור:</strong> {debugData.mainListing.approval_status}</div>
                    <div><strong>פעיל:</strong> {debugData.mainListing.is_active ? 'כן' : 'לא'}</div>
                    <div><strong>תאריך יצירה:</strong> {debugData.mainListing.created_date}</div>
                  </div>
                </div>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-60">
                  {JSON.stringify(debugData.mainListing, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

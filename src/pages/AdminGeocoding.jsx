import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminGeocoding() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [results, setResults] = useState(null);

    useEffect(() => {
        loadPreview();
    }, []);

    const loadPreview = async () => {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('batchGeocodeBusinesses', {
                mode: 'preview'
            });
            setPreview(data);
        } catch (error) {
            console.error('Error loading preview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (limit) => {
        if (!confirm(`האם לעדכן ${limit} עסקים?`)) return;

        setProcessing(true);
        try {
            const { data } = await base44.functions.invoke('batchGeocodeBusinesses', {
                mode: 'process',
                limit
            });
            setResults(data);
            // Reload preview
            await loadPreview();
        } catch (error) {
            console.error('Error processing:', error);
            alert('שגיאה בעיבוד: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-3xl font-bold">עדכון קואורדינטות</h1>
                            <p className="text-gray-600">מערכת Geocoding אוטומטית</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {preview && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-blue-600">
                                        {preview.total_needing_geocode}
                                    </p>
                                    <p className="text-gray-600 mt-2">עסקים ללא קואורדינטות</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-green-600">
                                        {results?.stats.successful || 0}
                                    </p>
                                    <p className="text-gray-600 mt-2">עודכנו בהצלחה</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-red-600">
                                        {results?.stats.failed || 0}
                                    </p>
                                    <p className="text-gray-600 mt-2">נכשלו</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>פעולות</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 flex-wrap">
                            <Button
                                onClick={() => handleProcess(10)}
                                disabled={processing || !preview?.total_needing_geocode}
                                className="gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        מעבד...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        עדכן 10 ראשונים
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleProcess(50)}
                                disabled={processing || !preview?.total_needing_geocode}
                            >
                                עדכן 50
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleProcess(100)}
                                disabled={processing || !preview?.total_needing_geocode}
                            >
                                עדכן 100
                            </Button>

                            <Button
                                variant="outline"
                                onClick={loadPreview}
                                disabled={processing}
                            >
                                רענן
                            </Button>
                        </div>

                        <p className="text-sm text-gray-600">
                            💡 המערכת משתמשת ב-OpenStreetMap Nominatim (חינמי לגמרי). יש המתנה של שנייה בין כל בקשה כנדרש.
                        </p>
                    </CardContent>
                </Card>

                {/* Sample Preview */}
                {preview?.sample && preview.sample.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>דוגמה - 5 עסקים ראשונים</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {preview.sample.map((business) => (
                                    <div
                                        key={business.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{business.business_name}</p>
                                            <p className="text-sm text-gray-600">
                                                {business.address}, {business.city}
                                            </p>
                                        </div>
                                        <Badge variant={business.has_coords ? "success" : "destructive"}>
                                            {business.has_coords ? 'יש קואורדינטות' : 'חסר'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {results?.results && results.results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                תוצאות עדכון אחרון
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {results.results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{result.business_name}</p>
                                            <p className="text-sm text-gray-600">
                                                {result.formatted_address}
                                            </p>
                                        </div>
                                        <Badge className="bg-green-600">
                                            {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Errors */}
                {results?.errors && results.errors.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                שגיאות
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {results.errors.map((error, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-red-50 rounded-lg"
                                    >
                                        <p className="font-medium text-red-900">{error.business_name}</p>
                                        <p className="text-sm text-red-600">{error.error}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
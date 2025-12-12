import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { getGoogleMapsKey } from "@/functions/getGoogleMapsKey";

const MapErrorComponent = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentHost = typeof window !== 'undefined' ? window.location.host : '';
    return (
        <div className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center z-50 p-6 text-right">
            <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-2xl font-extrabold text-red-800 mb-2">שגיאת טעינת מפה</h3>
            <p className="text-red-700 mb-3 max-w-xl">
              בדף זה אי אפשר לטעון את מפות Google כראוי – בדרך כלל בגלל רפררים לא מורשים, API לא מופעל או חוסר חיוב.
            </p>
            <div className="bg-white p-4 rounded-lg border border-red-200 w-full max-w-2xl space-y-2 text-sm text-gray-700 leading-6">
                <div><strong>הדומיין הנוכחי:</strong> <code dir="ltr">{currentOrigin}</code></div>
                <ol className="list-decimal list-inside space-y-1">
                    <li>ב-Google Cloud Console הפעל: Maps JavaScript API ו-Geocoding API.</li>
                    <li>ודא שחיוב (Billing) פעיל לפרויקט.</li>
                    <li>פתח את Credentials → API Keys → הדפדפן (Browser Key) שלך והוסף הגבלת HTTP referrers הכוללת:
                        <ul className="list-disc list-inside pr-4 mt-1">
                            <li dir="ltr">https://{currentHost}/*</li>
                            <li dir="ltr">https://*.base44.app/*</li>
                        </ul>
                        שמור (Save) והמתן דקה-שתיים.
                    </li>
                </ol>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 text-sm">
                רענון נסיוני לאחר עדכון ההגדרות
            </Button>
        </div>
    )
}

export default function InteractiveMap({ 
  listings = [], 
  userLocation,
  onMarkerClick,
  className = "" 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoWindow, setInfoWindow] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [mapId, setMapId] = useState(null);

  const clearMarkers = useCallback(() => {
    markers.forEach(marker => {
      // הסרת המרקר מהמפה, supporting both classic and advanced markers
      if (typeof marker.setMap === 'function') marker.setMap(null);
      else marker.map = null;
    });
    setMarkers([]);
  }, [markers]);

  const addUserMarker = useCallback(() => {
    if (!map || !userLocation) return;

    // remove previous user marker (both types supported)
    if (userMarker) {
      if (typeof userMarker.setMap === 'function') userMarker.setMap(null);
      else userMarker.map = null;
    }

    // Prefer AdvancedMarkerElement only if library is available AND mapId is set
    if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement && mapId) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#10b981"/>
            <path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="white"/>
        </svg>`;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: map,
          title: "המיקום שלי",
          content: userMarkerEl,
          zIndex: 1000
      });
      setUserMarker(marker);
    } else {
      // Fallback to classic Marker
      const marker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: "המיקום שלי",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        },
        zIndex: 1000
      });
      setUserMarker(marker);
    }
  }, [map, userLocation, userMarker, mapId]);

  const addListingMarkers = useCallback(async () => {
    if (!listings || !map) return;
    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    for (const listing of listings) {
      if (listing.lat && listing.lng) {
        const coordinates = { lat: listing.lat, lng: listing.lng };

        // Use AdvancedMarkerElement only when available and mapId exists
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement && mapId) {
          const markerEl = document.createElement('div');
          markerEl.innerHTML = createMarkerSVG(listing.is_paid);
          
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: coordinates,
              map: map,
              title: listing.title,
              content: markerEl,
              gmpDraggable: false
          });

          marker.addListener('click', () => {
            showInfoWindow(marker, listing);
            if (onMarkerClick) onMarkerClick(listing);
          });

          newMarkers.push(marker);
        } else {
          // Fallback classic marker with styled circle
          const color = listing.is_paid ? '#f59e0b' : '#3b82f6';
          const marker = new window.google.maps.Marker({
            position: coordinates,
            map: map,
            title: listing.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: listing.is_paid ? 9 : 7,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          marker.addListener('click', () => {
            showInfoWindow(marker, listing);
            if (onMarkerClick) onMarkerClick(listing);
          });

          newMarkers.push(marker);
        }
        bounds.extend(coordinates);
      }
    }

    setMarkers(newMarkers);
    if (newMarkers.length > 0 && map) {
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 16) map.setZoom(16);
          window.google.maps.event.removeListener(listener);
        });
    }
  }, [listings, map, mapId, onMarkerClick]);

  const loadGoogleMaps = useCallback(async () => {
    // If already loaded, just init
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const scriptId = 'google-maps-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    window.gm_authFailure = () => {
      setError("AUTH");
      setIsLoading(false);
    };

    window.initGoogleMap = initializeMap;

    let GOOGLE_MAPS_API_KEY;
    try {
      const response = await getGoogleMapsKey({});
      const data = response?.data || {};
      if (data.apiKey) {
        GOOGLE_MAPS_API_KEY = String(data.apiKey);
        setApiKey(GOOGLE_MAPS_API_KEY);
        setMapId(data.mapId || null);
      } else {
        setError(data?.error || "לא ניתן לטעון מפתח API למפות.");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError("שגיאה בקבלת מפתח API למפות.");
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker,geometry&language=he&region=IL&v=weekly&loading=async&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setError("שגיאה בטעינת Google Maps.");
      setIsLoading(false);
    };

    const timeout = setTimeout(() => {
      if (!(window.google && window.google.maps)) {
        setError("TIMEOUT");
        setIsLoading(false);
      }
    }, 12000);

    const prevInit = window.initGoogleMap;
    window.initGoogleMap = () => {
      clearTimeout(timeout);
      if (prevInit) prevInit();
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  useEffect(() => {
    if (map) {
      addUserMarker(); 
      clearMarkers();
      addListingMarkers();
    }
  }, [map, listings, userLocation, addUserMarker, clearMarkers, addListingMarkers]);

  useEffect(() => {
    if (map && userLocation) {
        map.panTo(userLocation);
        map.setZoom(14);
    }
  }, [map, userLocation]);

  const initializeMap = () => {
    try {
      const center = userLocation || { lat: 31.6943, lng: 35.1014 };
      createMap(center);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("שגיאה באתחול המפה");
      setIsLoading(false);
    }
  };

  const createMap = (center) => {
    if (!window.google || !window.google.maps) {
        setError("Google Maps API is not available.");
        setIsLoading(false);
        return;
    }
    const mapOptions = {
      center: center,
      zoom: 13,
      language: 'he',
      region: 'IL',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
      },
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      streetViewControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
        { featureType: "poi.attraction", elementType: "all", stylers: [{ visibility: "off" }] },
        { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
        { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "poi.park", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "poi.government", elementType: "all", stylers: [{ visibility: "on" }] },
        { featureType: "landscape", elementType: "all", stylers: [{ color: "#f7fafc" }] },
        { featureType: "water", elementType: "all", stylers: [{ color: "#d1e8ff" }, { visibility: "on" }] }
      ]
    };

    if (mapId) {
      mapOptions.mapId = mapId;
    }

    const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);

    setMap(mapInstance);
    setInfoWindow(new window.google.maps.InfoWindow({ maxWidth: 300, pixelOffset: new window.google.maps.Size(0, -30) }));
    setIsLoading(false);
  };
  
  const createMarkerSVG = (isPaid) => {
    const color = isPaid ? '#f59e0b' : '#3b82f6';
    const size = isPaid ? 36 : 28;
    const innerCircle = isPaid ? '<circle cx="12" cy="12" r="4" fill="white"/>' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); cursor: pointer;">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="1.5"/>
        ${innerCircle}
    </svg>`;
  };

  const showInfoWindow = (marker, listing) => {
    const content = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 250px;">
        <div style="padding: 12px 0;">
          <h3 style="font-size: 16px; font-weight: bold; color: #2d3748; margin: 0 0 8px 0; line-height: 1.4;">
            ${listing.display_title || listing.business_name || listing.title}
          </h3>
          <div style="color: #4a5568; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;"><span>📍</span><span>${listing.address || 'כתובת לא צוינה'}</span></div>
          <div style="color: #2b6cb0; font-size: 14px; font-weight: bold; margin-bottom: 8px;">${listing.price ? `₪${listing.price.toLocaleString()}` : 'מחיר לפי פנייה'}</div>
          <div style="margin-top: 12px;"><button onclick="window.location.href='${createPageUrl(`BusinessPage?id=${listing.id}`)}';" style="background: #3182ce; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: bold;">צפה במודעה המלאה</button></div>
        </div>
      </div>`;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  };

  return (
    <Card className={`overflow-hidden ${className}`} style={{ minHeight: '400px' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">טוען מפה...</p>
          </div>
        </div>
      )}

      {error && !isLoading && <MapErrorComponent />}
      
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px', visibility: isLoading || error ? 'hidden' : 'visible' }} aria-label="מפה אינטראקטיבית של מודעות" />
      
      {!isLoading && !error && listings && (
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-lg z-10">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{listings.length} מודעות באיזור</span>
          </div>
        </div>
      )}
    </Card>
  );
}
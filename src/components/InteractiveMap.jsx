import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertTriangle, Navigation } from "lucide-react";
import { createPageUrl } from "@/utils";
import { getGoogleMapsKey } from "@/functions/getGoogleMapsKey";

const libraries = ["geometry", "places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px'
};

const defaultCenter = {
  lat: 31.6943,
  lng: 35.1014
};

const mapOptions = {
  language: 'he',
  region: 'IL',
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: false,
  mapTypeControlOptions: {
    position: 3,
  },
  zoomControlOptions: {
    position: 6
  },
  streetViewControlOptions: {
    position: 8
  },
  styles: [
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape", elementType: "all", stylers: [{ color: "#f7fafc" }] },
    { featureType: "water", elementType: "all", stylers: [{ color: "#dbeafe" }] }
  ]
};

// Inner component that uses the API key
function MapContent({ apiKey, listings, userLocation, onMarkerClick, className, mapRef }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    language: 'he',
    region: 'IL'
  });

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    if (mapRef) {
      mapRef.current = mapInstance;
    }
  }, [mapRef]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Auto-fit bounds when listings change
  useEffect(() => {
    if (!map || !isLoaded) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (userLocation) {
      bounds.extend(userLocation);
      hasPoints = true;
    }

    listings.forEach(listing => {
      if (listing.lat && listing.lng) {
        bounds.extend({ lat: listing.lat, lng: listing.lng });
        hasPoints = true;
      }
    });

    if (hasPoints) {
      map.fitBounds(bounds);
      
      const listener = window.google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() > 16) map.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, listings, userLocation, isLoaded]);

  const handleMarkerClick = useCallback((listing) => {
    setSelectedMarker(listing);
    if (onMarkerClick) {
      onMarkerClick(listing);
    }
  }, [onMarkerClick]);

  const handleMarkerDoubleClick = useCallback((listing) => {
    window.location.href = createPageUrl(`BusinessPage?slug=${listing.url_slug || listing.id}`);
  }, []);

  const validListings = useMemo(() => 
    listings.filter(l => l.lat != null && l.lng != null && !isNaN(l.lat) && !isNaN(l.lng)),
    [listings]
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-red-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">שגיאה בטעינת Google Maps</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600 text-sm">טוען מפה...</p>
        </div>
      </div>
    );
  }

  const center = userLocation || defaultCenter;

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* User Location Marker */}
        {userLocation && (
          <>
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#10b981",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3
              }}
              title="המיקום שלי"
              zIndex={1000}
            />
            <Circle
              center={userLocation}
              radius={50}
              options={{
                fillColor: "#10b981",
                fillOpacity: 0.2,
                strokeColor: "#10b981",
                strokeOpacity: 0.5,
                strokeWeight: 1
              }}
            />
          </>
        )}

        {/* Business Listings Markers */}
        {validListings.map((listing) => (
          <Marker
            key={listing.id}
            position={{ lat: listing.lat, lng: listing.lng }}
            onClick={() => handleMarkerClick(listing)}
            onDblClick={() => handleMarkerDoubleClick(listing)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: listing.is_promoted ? 12 : 8,
              fillColor: listing.is_promoted ? "#f59e0b" : "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }}
            title={listing.business_name}
            animation={listing.is_promoted ? window.google.maps.Animation.BOUNCE : null}
          />
        ))}

        {/* Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -10),
              maxWidth: 300
            }}
          >
            <div dir="rtl" className="p-3 max-w-xs">
              <h3 className="font-bold text-base text-slate-900 mb-2">
                {selectedMarker.business_name}
              </h3>
              {selectedMarker.address && (
                <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedMarker.address}
                </p>
              )}
              {selectedMarker.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {selectedMarker.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = createPageUrl(`BusinessPage?slug=${selectedMarker.url_slug || selectedMarker.id}`);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  צפה בעסק
                </Button>
                {selectedMarker.address && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const encoded = encodeURIComponent(selectedMarker.address);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Results Counter */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-lg z-10">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{validListings.length} עסקים</span>
        </div>
      </div>
    </>
  );
}

// Main component - fetches API key first
export default function InteractiveMap({ 
  listings = [], 
  userLocation,
  onMarkerClick,
  className = "",
  mapRef
}) {
  const [apiKey, setApiKey] = useState(null);
  const [keyError, setKeyError] = useState(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const response = await getGoogleMapsKey({});
        const data = response?.data || {};
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setKeyError("לא ניתן לטעון מפתח Google Maps");
        }
      } catch (err) {
        setKeyError("שגיאה בטעינת מפתח API");
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchKey();
  }, []);

  if (keyError) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{keyError}</p>
        </div>
      </Card>
    );
  }

  if (isLoadingKey || !apiKey) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600 text-sm">מכין מפה...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden relative ${className}`} style={{ minHeight: '400px' }}>
      <MapContent 
        apiKey={apiKey}
        listings={listings}
        userLocation={userLocation}
        onMarkerClick={onMarkerClick}
        className={className}
        mapRef={mapRef}
      />
    </Card>
  );
}
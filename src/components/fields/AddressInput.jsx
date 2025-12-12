import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { getGoogleMapsKey } from '@/functions/getGoogleMapsKey';

export default function AddressInput({ 
  value = "", 
  onChange = () => {}, 
  onLocationChange = () => {}, // קבלת קואורדינטות
  placeholder = "הקלד כתובת...",
  label = "כתובת",
  className = "",
  required = false
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [isLocationFound, setIsLocationFound] = useState(false);

  // טעינת מפתח Google Maps API
  useEffect(() => {
    const loadGoogleMapsKey = async () => {
      try {
        const { data } = await getGoogleMapsKey();
        if (data?.ok && data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          console.warn('Could not load Google Maps API key for address autocomplete');
        }
      } catch (error) {
        console.warn('Could not load Google Maps API key:', error);
      }
    };

    loadGoogleMapsKey();
  }, []);

  // אתחול Google Places Autocomplete
  useEffect(() => {
    if (!apiKey || !inputRef.current || autocompleteRef.current) return;

    const loadGoogleMapsScript = () => {
      return new Promise((resolve, reject) => {
        // בדיקה אם הסקריפט כבר נטען
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve();
          return;
        }

        // יצירת סקריפט חדש
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        
        document.head.appendChild(script);
      });
    };

    const initializeAutocomplete = async () => {
      try {
        setIsLoading(true);
        await loadGoogleMapsScript();

        if (!inputRef.current || !window.google?.maps?.places) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'IL' }, // מגביל לישראל
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types'],
          types: ['establishment', 'geocode'] // מאפשר עסקים וכתובות
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            console.warn('No geometry data for selected place');
            return;
          }

          const address = place.formatted_address || place.name || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          console.log('📍 Place selected:', { address, lat, lng, place_id: place.place_id });

          // עדכון הכתובת
          onChange(address);
          
          // עדכון הקואורדינטות
          onLocationChange({
            lat,
            lng,
            formatted_address: address,
            place_id: place.place_id,
            types: place.types || []
          });

          setIsLocationFound(true);
          
          // איפוס הסטטוס אחרי 3 שניות
          setTimeout(() => setIsLocationFound(false), 3000);
        });

        autocompleteRef.current = autocomplete;
        console.log('🗺️ Google Places Autocomplete initialized');
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [apiKey, onChange, onLocationChange]);

  // טיפול בשינוי ידני של הטקסט
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // אם המשתמש מקליד ידנית, איפוס סטטוס המיקום
    setIsLocationFound(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('הדפדפן לא תומך בזיהוי מיקום');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // המרה של קואורדינטות לכתובת באמצעות Geocoding API
          if (window.google?.maps) {
            const geocoder = new window.google.maps.Geocoder();
            
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  const result = results[0];
                  const address = result.formatted_address;
                  
                  onChange(address);
                  onLocationChange({
                    lat: latitude,
                    lng: longitude,
                    formatted_address: address,
                    place_id: result.place_id,
                    types: result.types || []
                  });

                  setIsLocationFound(true);
                  setTimeout(() => setIsLocationFound(false), 3000);
                } else {
                  alert('לא ניתן היה להמיר את המיקום הנוכחי לכתובת');
                }
                setIsLoading(false);
              }
            );
          } else {
            throw new Error('Google Maps not loaded');
          }
        } catch (error) {
          console.error('Error with reverse geocoding:', error);
          alert('שגיאה בהמרת המיקום לכתובת');
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('לא ניתן היה לגשת למיקום הנוכחי');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className={className}>
      {label && (
        <Label className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`pr-10 ${isLocationFound ? 'border-green-500 bg-green-50' : ''}`}
            disabled={isLoading}
          />
          
          {/* אינדיקטור סטטוס */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : isLocationFound ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="px-3"
          title="השתמש במיקום הנוכחי"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!apiKey && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Google Places API לא זמין - חיפוש כתובות אוטומטי מושבת
        </p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        הקלד כתובת או שם עסק וקבל הצעות אוטומטיות
      </p>
    </div>
  );
}
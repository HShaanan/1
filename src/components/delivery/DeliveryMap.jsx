import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { getGoogleMapsKey } from "@/functions/getGoogleMapsKey";

const MapErrorComponent = () => {
    return (
        <div className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center z-50 p-6 text-right">
            <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-2xl font-extrabold text-red-800 mb-2">שגיאת טעינת מפה</h3>
            <p className="text-red-700 mb-3">לא ניתן לטעון את מפות Google. ודא שמפתח ה-API מוגדר כראוי.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 text-sm">
                נסה שוב
            </Button>
        </div>
    )
}

export default function DeliveryMap({ 
  orders = [], 
  couriers = [],
  businessPages = {},
  className = "" 
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [mapId, setMapId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoWindow, setInfoWindow] = useState(null);
  const markersRef = useRef([]);
  const geocodeCache = useRef({});

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      try {
        const response = await getGoogleMapsKey({});
        const data = response?.data || {};
        
        if (data.apiKey) {
          const key = String(data.apiKey);
          setApiKey(key);
          setMapId(data.mapId || null);

          const script = document.createElement('script');
          script.id = 'google-maps-delivery-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker,geometry,places&language=he&region=IL&loading=async&callback=initDeliveryMap`;
          script.async = true;
          script.defer = true;
          
          window.initDeliveryMap = () => {
            initializeMap();
          };
          
          document.head.appendChild(script);
        } else {
          setError("Missing API Key");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load maps key", err);
        setError("Error loading maps key");
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  const initializeMap = () => {
    try {
      const defaultCenter = { lat: 31.6943, lng: 35.1014 }; // Betar Illit default
      const mapOptions = {
        center: defaultCenter,
        zoom: 13,
        language: 'he',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      };

      if (mapId) mapOptions.mapId = mapId;

      const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);

      // Define Custom Overlay Class
      class HTMLMapMarker extends window.google.maps.OverlayView {
          constructor(position, html, map, onClick) {
              super();
              this.position = position;
              this.html = html;
              this.map = map;
              this.div = null;
              this.onClick = onClick;
              this.setMap(map);
          }

          onAdd() {
              this.div = document.createElement('div');
              this.div.style.position = 'absolute';
              this.div.style.cursor = 'pointer';
              this.div.innerHTML = this.html;

              if (this.onClick) {
                  this.div.addEventListener('click', (e) => {
                      e.stopPropagation();
                      this.onClick(e);
                  });
              }

              const panes = this.getPanes();
              panes.overlayMouseTarget.appendChild(this.div);
          }

          draw() {
              if (!this.div) return;
              const overlayProjection = this.getProjection();
              const point = overlayProjection.fromLatLngToDivPixel(this.position);

              if (point) {
                  this.div.style.left = point.x + 'px';
                  this.div.style.top = point.y + 'px';
                  this.div.style.transform = 'translate(-50%, -50%)';
              }
          }

          onRemove() {
              if (this.div) {
                  this.div.parentNode.removeChild(this.div);
                  this.div = null;
              }
          }

          getPosition() {
              return this.position;
          }
      }

      window.HTMLMapMarker = HTMLMapMarker; // Make available globally or in scope

      setMap(mapInstance);
      setInfoWindow(new window.google.maps.InfoWindow({ maxWidth: 300 }));
      setIsLoading(false);
      } catch (err) {
      console.error("Error initializing map:", err);
      setError("Map Init Error");
      setIsLoading(false);
      }
      };

  // Geocoding Helper
  const getCoordinates = async (address) => {
    if (!address) return null;
    if (geocodeCache.current[address]) return geocodeCache.current[address];

    // Check if address is already lat,lng
    const latLngMatch = address.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (latLngMatch) {
      const coords = { lat: parseFloat(latLngMatch[1]), lng: parseFloat(latLngMatch[3]) };
      geocodeCache.current[address] = coords;
      return coords;
    }

    // Use Geocoder
    if (!window.google || !window.google.maps) return null;
    
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          geocodeCache.current[address] = coords;
          resolve(coords);
        } else {
          console.warn(`Geocoding failed for "${address}": ${status}`);
          resolve(null);
        }
      });
    });
  };

  // Update Markers
  useEffect(() => {
    if (!map) return;

    const updateMarkers = async () => {
      // Clear existing markers
      markersRef.current.forEach(m => {
        if (m.setMap) m.setMap(null);
        else m.map = null;
      });
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();
      let hasMarkers = false;

      // 1. Plot Couriers
      for (const courier of couriers) {
        if (!courier.current_location) continue;
        if (courier.status === 'offline') continue;

        const coords = await getCoordinates(courier.current_location);
        if (coords) {
          const marker = createMarker(coords, 'courier', courier);
          markersRef.current.push(marker);
          bounds.extend(coords);
          hasMarkers = true;
        }
      }

      // 2. Group Orders by Business for deduplication
      const businessGroups = {};
      
      for (const order of orders) {
          const bid = order.business_page_id;
          if (!bid) continue;
          
          if (!businessGroups[bid]) {
              businessGroups[bid] = {
                  business: businessPages[bid],
                  orders: []
              };
          }
          businessGroups[bid].orders.push(order);
      }

      // 3. Plot Businesses (One per business)
      for (const bid in businessGroups) {
          const { business, orders: businessOrders } = businessGroups[bid];
          if (!business) continue;

          let pickupCoords = null;
          if (business.lat && business.lng) {
             pickupCoords = { lat: business.lat, lng: business.lng };
          } else if (business.address) {
             pickupCoords = await getCoordinates(business.address);
          }

          if (pickupCoords) {
             // Check for delay: if any active order is older than 30 mins
             const isDelayed = businessOrders.some(o => {
                 if (['ready', 'picked_up', 'assigned'].includes(o.status)) return false;
                 const created = new Date(o.created_date || o.order_date); 
                 const diff = (new Date() - created) / 1000 / 60; // mins
                 return diff > 30; 
             });

             const marker = createMarker(pickupCoords, 'business', { 
                 ...business, 
                 isDelayed,
                 ordersCount: businessOrders.length
             });
             markersRef.current.push(marker);
             bounds.extend(pickupCoords);
             hasMarkers = true;
          }
      }

      // 4. Plot Customers (One per order) - Blue dots
      for (const order of orders) {
        if (order.customer_address) {
          const dropoffCoords = await getCoordinates(order.customer_address);
          if (dropoffCoords) {
            const marker = createMarker(dropoffCoords, 'customer', order);
            markersRef.current.push(marker);
            bounds.extend(dropoffCoords);
            hasMarkers = true;
          }
        }
      }

      if (hasMarkers) {
        map.fitBounds(bounds);
        // Prevent zooming in too much if only one marker
        const listener = window.google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 15) map.setZoom(15);
            window.google.maps.event.removeListener(listener);
        });
      }
    };

    updateMarkers();
  }, [map, orders, couriers, businessPages]);

  const createMarker = (position, type, data) => {
    let content = '';
    let title = '';
    let color = '#3b82f6';
    
    // Helper to get SVG string
    const getSvg = (icon, color = 'white', size = 16) => {
        const svgs = {
            home: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
            user: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
            navigation: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
            bike: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
        };
        return svgs[icon] || '';
    };

    if (type === 'courier') {
      title = `שליח: ${data.name}`;
      const isBusy = data.status === 'busy';
      const isScooter = data.vehicle_type === 'scooter';
      const bgColor = isBusy ? '#2563eb' : '#10b981';
      color = bgColor;
      const icon = isScooter ? 'navigation' : 'bike';
      
      content = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="background:${bgColor}; width:36px; height:36px; border-radius:50%; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white; display:flex; align-items:center; justify-content:center; transition: transform 0.2s;">
               ${getSvg(icon, 'white', 16)}
            </div>
            <div style="background:rgba(255,255,255,0.95); padding:2px 8px; border-radius:9999px; margin-top:4px; box-shadow:0 1px 2px rgba(0,0,0,0.1); font-size:9px; font-weight:700; color:${isBusy ? '#2563eb' : '#059669'}; border:1px solid #f3f4f6; white-space:nowrap;">
                ${data.name}
            </div>
        </div>
      `;
    } else if (type === 'business') {
      title = `עסק: ${data.business_name || 'עסק'}`;
      const businessName = data.business_name || 'עסק';
      const isDelayed = data.isDelayed; 
      const bgColor = isDelayed ? '#ef4444' : '#fb923c';
      color = bgColor;
      const animationClass = isDelayed ? 'animate-bounce' : '';
      
      content = `
         <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div class="${animationClass}" style="background:${bgColor}; width:32px; height:32px; border-radius:50%; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white; display:flex; align-items:center; justify-content:center;">
               ${getSvg('home', 'white', 14)}
            </div>
            <div style="background:rgba(255,255,255,0.9); padding:2px 6px; border-radius:9999px; margin-top:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05); font-size:9px; font-weight:700; color:#4b5563; border:1px solid #f3f4f6; white-space:nowrap; max-width:80px; overflow:hidden; text-overflow:ellipsis;">
                ${businessName}
            </div>
         </div>
      `;
    } else if (type === 'customer') {
      title = `לקוח: ${data.customer_name}`;
      color = '#3b82f6';
      content = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="background:#dbeafe; width:24px; height:24px; border-radius:50%; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid #3b82f6; display:flex; align-items:center; justify-content:center;">
               ${getSvg('user', '#2563eb', 12)}
            </div>
        </div>
      `;
    }

    // Use Custom HTML Overlay for consistent rendering
    if (window.HTMLMapMarker) {
        return new window.HTMLMapMarker(position, content, map, () => {
            infoWindow.setContent(`<div dir="rtl" style="text-align:right; font-weight:bold; padding:5px;">${title}</div>`);
            infoWindow.setPosition(position);
            infoWindow.open(map);
        });
    } else {
         // Absolute Fallback if something went wrong with class definition
         const marker = new window.google.maps.Marker({
            map,
            position,
            title
         });
         return marker;
    }
  };

  return (
    <Card className={`overflow-hidden relative ${className}`} style={{ minHeight: '400px', height: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">טוען מפה...</p>
          </div>
        </div>
      )}
      {error && !isLoading && <MapErrorComponent />}
      <div ref={mapRef} className="absolute inset-0" />
    </Card>
  );
}

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Vendor } from '@/ai/flows/find-local-vendors-flow';

interface MapViewDisplayProps {
  apiKey: string | null;
  isApiLoaded: boolean;
  center: google.maps.LatLngLiteral;
  zoom: number;
  markerPos: google.maps.LatLngLiteral | null;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
  mapRef: React.RefObject<HTMLDivElement>;
  mapTypeId?: google.maps.MapTypeId | string;
  customStyles?: google.maps.MapTypeStyle[];
  enableTilt?: boolean;
  enableDrawing?: boolean;
  vendorMarkers?: Vendor[];
}

const MapViewDisplay: React.FC<MapViewDisplayProps> = ({
  apiKey,
  isApiLoaded,
  center,
  zoom,
  markerPos,
  onMapClick,
  mapRef,
  mapTypeId = 'roadmap',
  customStyles,
  enableTilt = false,
  enableDrawing = false,
  vendorMarkers = [],
}) => {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const coverageLayerRef = useRef<google.maps.StreetViewCoverageLayer | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const vendorMarkerInstancesRef = useRef<(google.maps.Marker | null)[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    if (!apiKey && mapRef.current) {
      mapRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Google Maps API Key is missing. Map cannot be displayed.</p>';
      setIsMapInitialized(false);
      if (mapInstanceRef.current) mapInstanceRef.current = null;
      if (coverageLayerRef.current) coverageLayerRef.current.setMap(null);
      return;
    }

    if (isApiLoaded && mapRef.current && typeof window.google !== 'undefined' && window.google.maps) {
      if (!mapInstanceRef.current) {
        try {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapTypeId: mapTypeId,
            styles: customStyles,
            mapTypeControl: false,
            streetViewControl: false, // Important: disable default pegman
            fullscreenControl: false,
            tilt: enableTilt ? 45 : 0,
            gestureHandling: 'greedy',
          });

          mapInstanceRef.current.addListener('click', (mapsMouseEvent: google.maps.MapMouseEvent) => {
            if (mapsMouseEvent.latLng) {
              onMapClick(mapsMouseEvent.latLng.toJSON());
            }
          });
          
          coverageLayerRef.current = new window.google.maps.StreetViewCoverageLayer();
          coverageLayerRef.current.setMap(mapInstanceRef.current);

          setIsMapInitialized(true);
        } catch (e: any) {
          console.error("Error initializing Google Map:", e);
          setIsMapInitialized(false);
          if (mapRef.current) {
              mapRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Error initializing Google Map: ${e.message}</p>`;
          }
        }
      } else {
        mapInstanceRef.current.setMapTypeId(mapTypeId);
        mapInstanceRef.current.setOptions({ styles: customStyles, gestureHandling: 'greedy' });
        mapInstanceRef.current.setTilt(enableTilt ? 45 : 0);

        if (!coverageLayerRef.current && mapInstanceRef.current) {
          coverageLayerRef.current = new window.google.maps.StreetViewCoverageLayer();
        }
        if (coverageLayerRef.current && coverageLayerRef.current.getMap() !== mapInstanceRef.current) {
          coverageLayerRef.current.setMap(mapInstanceRef.current);
        }
      }
    } else if (!isApiLoaded && mapRef.current) {
        mapRef.current.innerHTML = ''; 
        setIsMapInitialized(false);
        if (mapInstanceRef.current) mapInstanceRef.current = null;
        if (coverageLayerRef.current) coverageLayerRef.current.setMap(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isApiLoaded, mapTypeId, JSON.stringify(customStyles), enableTilt]);
  
  // Effect to manage the drawing manager
  useEffect(() => {
    if (!isMapInitialized || !window.google?.maps?.drawing) {
        return;
    }

    if (enableDrawing) {
        if (!drawingManagerRef.current) {
            drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
                drawingMode: window.google.maps.drawing.OverlayType.MARKER,
                drawingControl: true,
                drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                        window.google.maps.drawing.OverlayType.MARKER,
                        window.google.maps.drawing.OverlayType.CIRCLE,
                        window.google.maps.drawing.OverlayType.POLYGON,
                        window.google.maps.drawing.OverlayType.POLYLINE,
                        window.google.maps.drawing.OverlayType.RECTANGLE,
                    ],
                },
                markerOptions: {
                    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                },
                circleOptions: {
                    fillColor: '#ffff00',
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    clickable: false,
                    editable: true,
                    zIndex: 1,
                },
                polygonOptions: {
                    fillColor: '#3F51B5',
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    clickable: false,
                    editable: true,
                    zIndex: 1,
                },
                rectangleOptions: {
                     fillColor: '#3F51B5',
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    clickable: false,
                    editable: true,
                    zIndex: 1,
                }
            });
        }
        drawingManagerRef.current.setMap(mapInstanceRef.current);
    } else {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setMap(null);
        }
    }
  }, [isMapInitialized, enableDrawing]);

  // Effect to manage vendor markers
  useEffect(() => {
    if (!isMapInitialized || !window.google?.maps?.Marker) {
      return;
    }

    // Clear existing vendor markers
    vendorMarkerInstancesRef.current.forEach(marker => marker?.setMap(null));
    vendorMarkerInstancesRef.current = [];

    if (vendorMarkers.length > 0) {
      const newMarkers = vendorMarkers.map(vendor => {
        const marker = new window.google.maps.Marker({
          position: vendor.coordinates,
          map: mapInstanceRef.current,
          title: `${vendor.name} (${vendor.category})`,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        // Optional: Add info window on click
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${vendor.name}</strong><br/>${vendor.address}</div>`
        });
        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current!, marker);
        });

        return marker;
      });
      vendorMarkerInstancesRef.current = newMarkers;
    }

  }, [vendorMarkers, isMapInitialized]);


  useEffect(() => {
    if (mapInstanceRef.current && isMapInitialized) { 
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, isMapInitialized]);

  useEffect(() => {
    if (mapInstanceRef.current && isMapInitialized && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.Marker) {
      if (markerPos) {
        if (!markerInstanceRef.current) {
          markerInstanceRef.current = new window.google.maps.Marker();
        }
        markerInstanceRef.current.setPosition(markerPos);
        markerInstanceRef.current.setMap(mapInstanceRef.current);
      } else {
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setMap(null);
        }
      }
    }
  }, [markerPos, isMapInitialized]); 

  useEffect(() => {
    return () => {
      if (coverageLayerRef.current) {
        coverageLayerRef.current.setMap(null);
      }
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
      }
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
      }
      vendorMarkerInstancesRef.current.forEach(marker => marker?.setMap(null));
    };
  }, []);

  return (
    <div className="w-full h-full relative rounded-lg shadow-inner bg-muted">
      {!isApiLoaded && apiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <MapPin className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Map API...</p>
        </div>
      )}
       {!apiKey && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
            <MapPin className="w-16 h-16 text-destructive" />
            <p className="ml-2 text-destructive">API Key Missing</p>
        </div>
      )}
      {isApiLoaded && !isMapInitialized && apiKey && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <MapPin className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Initializing Map...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapViewDisplay;


"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapViewDisplayProps {
  apiKey: string | null;
  isApiLoaded: boolean;
  center: google.maps.LatLngLiteral;
  zoom: number;
  markerPos: google.maps.LatLngLiteral | null;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
  mapTypeId?: google.maps.MapTypeId | string;
  customStyles?: google.maps.MapTypeStyle[];
  enableTilt?: boolean;
}

const MapViewDisplay: React.FC<MapViewDisplayProps> = ({
  apiKey,
  isApiLoaded,
  center,
  zoom,
  markerPos,
  onMapClick,
  mapTypeId = 'roadmap',
  customStyles,
  enableTilt = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const coverageLayerRef = useRef<google.maps.StreetViewCoverageLayer | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    if (!apiKey && mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Google Maps API Key is missing. Map cannot be displayed.</p>';
      setIsMapInitialized(false);
      if (mapInstanceRef.current) mapInstanceRef.current = null;
      if (coverageLayerRef.current) coverageLayerRef.current.setMap(null);
      return;
    }

    if (isApiLoaded && mapContainerRef.current && typeof window.google !== 'undefined' && window.google.maps) {
      if (!mapInstanceRef.current) {
        try {
          mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: center,
            zoom: zoom,
            mapTypeId: mapTypeId,
            styles: customStyles,
            mapTypeControl: false,
            streetViewControl: false, // Important: disable default pegman
            fullscreenControl: false,
            tilt: enableTilt ? 45 : 0,
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
          if (mapContainerRef.current) {
              mapContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Error initializing Google Map: ${e.message}</p>`;
          }
        }
      } else {
        mapInstanceRef.current.setMapTypeId(mapTypeId);
        mapInstanceRef.current.setOptions({ styles: customStyles });
        mapInstanceRef.current.setTilt(enableTilt ? 45 : 0);

        if (!coverageLayerRef.current && mapInstanceRef.current) {
          coverageLayerRef.current = new window.google.maps.StreetViewCoverageLayer();
        }
        if (coverageLayerRef.current && coverageLayerRef.current.getMap() !== mapInstanceRef.current) {
          coverageLayerRef.current.setMap(mapInstanceRef.current);
        }
      }
    } else if (!isApiLoaded && mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''; 
        setIsMapInitialized(false);
        if (mapInstanceRef.current) mapInstanceRef.current = null;
        if (coverageLayerRef.current) coverageLayerRef.current.setMap(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isApiLoaded, mapTypeId, JSON.stringify(customStyles), enableTilt]);

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
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapViewDisplay;

    

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapViewDisplayProps {
  apiKey: string | null;
  isApiLoaded: boolean; // New prop
  center: google.maps.LatLngLiteral;
  zoom: number;
  markerPos: google.maps.LatLngLiteral | null;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
}

const MapViewDisplay: React.FC<MapViewDisplayProps> = ({
  apiKey,
  isApiLoaded, // Use this prop
  center,
  zoom,
  markerPos,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    if (!apiKey && mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Google Maps API Key is missing. Map cannot be displayed.</p>';
      setIsMapInitialized(false);
      return;
    }

    if (isApiLoaded && mapContainerRef.current && typeof window.google !== 'undefined' && window.google.maps && !mapInstanceRef.current) {
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current.addListener('click', (mapsMouseEvent: google.maps.MapMouseEvent) => {
          if (mapsMouseEvent.latLng) {
            onMapClick(mapsMouseEvent.latLng.toJSON());
          }
        });
        setIsMapInitialized(true);
      } catch (e: any) {
        console.error("Error initializing Google Map:", e);
        setIsMapInitialized(false);
        if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Error initializing Google Map: ${e.message}</p>`;
        }
      }
    } else if (!isApiLoaded && mapContainerRef.current) {
        // Clear map if API is not loaded (e.g. during re-renders before API load)
        mapContainerRef.current.innerHTML = ''; 
        setIsMapInitialized(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isApiLoaded, center, zoom]); // center, zoom for initial setup if map instance is not present

  useEffect(() => {
    if (mapInstanceRef.current && isApiLoaded) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, isApiLoaded]);

  useEffect(() => {
    if (mapInstanceRef.current && isApiLoaded && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.Marker) {
      if (markerPos) {
        if (!markerInstanceRef.current) {
          markerInstanceRef.current = new window.google.maps.Marker({
            position: markerPos,
            map: mapInstanceRef.current,
          });
        } else {
          markerInstanceRef.current.setPosition(markerPos);
          markerInstanceRef.current.setMap(mapInstanceRef.current);
        }
      } else {
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setMap(null);
        }
      }
    }
  }, [markerPos, isApiLoaded]);

  return (
    <div className="w-full h-full relative rounded-lg shadow-inner bg-muted">
      {!isApiLoaded && apiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <MapPin className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Map API...</p>
        </div>
      )}
       {!apiKey && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <MapPin className="w-16 h-16 text-destructive" />
            <p className="ml-2 text-destructive">API Key Missing</p>
        </div>
      )}
      {isApiLoaded && !isMapInitialized && apiKey && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <MapPin className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Initializing Map...</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] md:min-h-[calc(100vh-12rem)] rounded-lg" />
    </div>
  );
};

export default MapViewDisplay;

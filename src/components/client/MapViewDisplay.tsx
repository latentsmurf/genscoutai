
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
}

const MapViewDisplay: React.FC<MapViewDisplayProps> = ({
  apiKey,
  isApiLoaded,
  center,
  zoom,
  markerPos,
  onMapClick,
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
      if (coverageLayerRef.current) {
        coverageLayerRef.current.setMap(null);
      }
      return;
    }

    if (isApiLoaded && mapContainerRef.current && typeof window.google !== 'undefined' && window.google.maps && !mapInstanceRef.current) {
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false, // Disable default Street View pegman
          fullscreenControl: false,
        });

        mapInstanceRef.current.addListener('click', (mapsMouseEvent: google.maps.MapMouseEvent) => {
          if (mapsMouseEvent.latLng) {
            onMapClick(mapsMouseEvent.latLng.toJSON());
          }
        });

        // Add StreetView Coverage Layer
        coverageLayerRef.current = new window.google.maps.StreetViewCoverageLayer();
        coverageLayerRef.current.setMap(mapInstanceRef.current);

        setIsMapInitialized(true);
      } catch (e: any) {
        console.error("Error initializing Google Map:", e);
        setIsMapInitialized(false);
        if (coverageLayerRef.current) {
          coverageLayerRef.current.setMap(null);
        }
        if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Error initializing Google Map: ${e.message}</p>`;
        }
      }
    } else if (!isApiLoaded && mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''; 
        setIsMapInitialized(false);
        if (coverageLayerRef.current) {
            coverageLayerRef.current.setMap(null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isApiLoaded]); // Only re-initialize map if API key or loaded status changes fundamentally

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coverageLayerRef.current) {
        coverageLayerRef.current.setMap(null);
        coverageLayerRef.current = null;
      }
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
      // Note: mapInstanceRef.current is managed by its own lifecycle based on apiKey/isApiLoaded
    };
  }, []);

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

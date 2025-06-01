
"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Loader } from '@googlemaps/js-api-loader'; // Only import type
import { MapPin } from 'lucide-react';

interface MapViewDisplayProps {
  apiKey: string | null;
  center: google.maps.LatLngLiteral;
  zoom: number;
  markerPos: google.maps.LatLngLiteral | null;
  onMapClick: (latLng: google.maps.LatLngLiteral) => void;
}

const MapViewDisplay: React.FC<MapViewDisplayProps> = ({
  apiKey,
  center,
  zoom,
  markerPos,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapApiLoaded, setMapApiLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setIsMapLoading(false);
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Google Maps API Key is missing. Map cannot be displayed.</p>';
      }
      return;
    }

    // Dynamically import Loader only on client-side
    import('@googlemaps/js-api-loader').then(({ Loader: GoogleMapsLoader }) => {
        const loader = new GoogleMapsLoader({
            apiKey: apiKey,
            version: 'weekly',
            libraries: ['maps', 'marker'], // 'maps' for Map, 'marker' for AdvancedMarkerElement (optional)
        });

        loader.load().then((google) => {
            setMapApiLoaded(true);
            if (mapContainerRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = new google.maps.Map(mapContainerRef.current, {
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
            }
            setIsMapLoading(false);
        }).catch(e => {
            console.error("Error loading Google Maps API for MapView:", e);
            setIsMapLoading(false);
            if (mapContainerRef.current) {
                mapContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Error loading Google Maps: ${e.message}</p>`;
            }
        });
    }).catch(e => {
        console.error("Failed to load Google Maps Loader for MapView:", e);
        setIsMapLoading(false);
        if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Error initializing map services.</p>';
        }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]); // Only run when API key changes

  useEffect(() => {
    if (mapInstanceRef.current && mapApiLoaded) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, mapApiLoaded]);

  useEffect(() => {
    if (mapInstanceRef.current && mapApiLoaded) {
      if (markerPos) {
        if (!markerInstanceRef.current) {
          markerInstanceRef.current = new google.maps.Marker({ // Using classic marker for simplicity
            position: markerPos,
            map: mapInstanceRef.current,
          });
        } else {
          markerInstanceRef.current.setPosition(markerPos);
          markerInstanceRef.current.setMap(mapInstanceRef.current); // Ensure it's on the map
        }
      } else {
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setMap(null); // Remove marker if markerPos is null
        }
      }
    }
  }, [markerPos, mapApiLoaded]);

  return (
    <div className="w-full h-full relative rounded-lg shadow-inner bg-muted">
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <MapPin className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Map...</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] md:min-h-[calc(100vh-12rem)] rounded-lg" />
    </div>
  );
};

export default MapViewDisplay;

    

"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Loader } from '@googlemaps/js-api-loader'; // Only import type
import { ImageIcon } from 'lucide-react';

interface StreetViewDisplayProps {
  locationToLoad: string; // Changed from locationQuery
  apiKey: string | null;
  streetViewPanoramaRef: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  onStreetViewStatusChange: (status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => void;
}

const StreetViewDisplay: React.FC<StreetViewDisplayProps> = ({
  locationToLoad,
  apiKey,
  streetViewPanoramaRef,
  onStreetViewStatusChange,
}) => {
  const streetViewContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const [currentPanoId, setCurrentPanoId] = useState<string | null>(null);


  useEffect(() => {
    if (!apiKey || !streetViewContainerRef.current) {
      if (streetViewPanoramaRef.current) {
         streetViewPanoramaRef.current.setVisible(false);
      }
      return;
    }
    
    // Location can be an address string or "coords:lat,lng"
    const isCoordinates = locationToLoad.startsWith('coords:');
    let queryLocation: string | google.maps.LatLngLiteral | null = null;

    if (isCoordinates) {
        const parts = locationToLoad.substring(7).split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                queryLocation = { lat, lng };
            }
        }
    } else {
        queryLocation = locationToLoad;
    }


    if (!queryLocation && !locationToLoad) { // If queryLocation is null (bad coords) or locationToLoad is empty
      if (streetViewPanoramaRef.current) {
         streetViewPanoramaRef.current.setVisible(false);
      }
      if (streetViewContainerRef.current) {
        streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Search for a location or click on the map to see Street View.</p>';
      }
      onStreetViewStatusChange('ZERO_RESULTS', 'No location specified for Street View.');
      return;
    }
     if (!queryLocation && locationToLoad) { // Invalid coordinates string
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Invalid coordinates for Street View.</p>';
      onStreetViewStatusChange('ERROR', `Invalid coordinates provided for Street View: ${locationToLoad}`);
      return;
    }


    setIsLoadingStreetView(true);
    if (streetViewContainerRef.current) {
       streetViewContainerRef.current.innerHTML = ''; 
    }

    // Dynamically import Loader only on client-side
    import('@googlemaps/js-api-loader').then(({ Loader: GoogleMapsLoader }) => {
      const loader = new GoogleMapsLoader({
        apiKey: apiKey!, // apiKey is checked not null above
        version: 'weekly',
        libraries: ['streetView', 'geocoding'], // Geocoding needed if locationToLoad is an address
      });

      loader.load().then(async (google) => {
        const processLocation = (locationInput: string | google.maps.LatLng | google.maps.LatLngLiteral) => {
            const streetViewService = new google.maps.StreetViewService();
            streetViewService.getPanorama({ location: locationInput, radius: 50, source: google.maps.StreetViewSource.OUTDOOR }, (data, svStatus) => {
                setIsLoadingStreetView(false);
                if (svStatus === google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
                    onStreetViewStatusChange('OK');
                    const panoramaOptions: google.maps.StreetViewPanoramaOptions = {
                        pano: data.location.pano,
                        position: data.location.latLng,
                        pov: { heading: 165, pitch: 0 },
                        zoom: 1,
                        visible: true,
                        addressControl: false,
                        linksControl: true,      
                        panControl: true,        
                        zoomControl: true,       
                        clickToGo: true,         
                        enableCloseButton: false,
                        fullscreenControl: false,
                        motionTracking: false,
                        motionTrackingControl: false,
                        disableDefaultUI: false, 
                    };

                    if (streetViewPanoramaRef.current && streetViewContainerRef.current) {
                         if (currentPanoId === data.location.pano) { // If same pano, just ensure visible and options
                            streetViewPanoramaRef.current.setOptions(panoramaOptions);
                            streetViewPanoramaRef.current.setVisible(true);
                        } else { // New pano, reinitialize or update
                            streetViewPanoramaRef.current.setPano(data.location.pano!);
                            streetViewPanoramaRef.current.setPosition(data.location.latLng);
                            streetViewPanoramaRef.current.setOptions(panoramaOptions);
                            streetViewPanoramaRef.current.setVisible(true);
                        }
                    } else if (streetViewContainerRef.current) {
                        streetViewPanoramaRef.current = new google.maps.StreetViewPanorama(
                        streetViewContainerRef.current!,
                        panoramaOptions
                        );
                    }
                    setCurrentPanoId(data.location.pano!);

                } else {
                    onStreetViewStatusChange('ZERO_RESULTS', `Street View not available for this location.`);
                    if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                    if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Street View not available for this location.</p>';
                }
            });
        };

        if (typeof queryLocation === 'string') { // It's an address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: queryLocation }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
                    processLocation(results[0].geometry.location);
                } else {
                    setIsLoadingStreetView(false);
                    let userMessage = `Geocoding failed: ${status}`;
                    if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                        userMessage = `Could not find location: "${queryLocation}". Please try a different or more specific search term.`;
                    } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        userMessage = "The app has exceeded its Google Maps API usage limits. Please try again later.";
                    } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
                        userMessage = "Google Maps API request denied. Please check your API key and project setup.";
                    } else if (status === google.maps.GeocoderStatus.INVALID_REQUEST) {
                        userMessage = `The location search for "${queryLocation}" was invalid. Please check your search term.`;
                    }
                    onStreetViewStatusChange('ERROR', userMessage);
                    if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                    if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">${userMessage}</p>`;
                }
            });
        } else if (queryLocation) { // It's LatLngLiteral
            processLocation(queryLocation as google.maps.LatLngLiteral);
        }
      }).catch(e => {
        setIsLoadingStreetView(false);
        onStreetViewStatusChange('ERROR', `Error loading Google Maps API for Street View: ${e.message}`);
        console.error("Error loading Google Maps API for Street View:", e);
        if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Error loading Google Maps for Street View.</p>';
      });
    }).catch(e => {
        setIsLoadingStreetView(false);
        onStreetViewStatusChange('ERROR', `Failed to load Google Maps Loader: ${e.message}`);
        console.error("Failed to load Google Maps Loader:", e);
        if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Error initializing map services.</p>';
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationToLoad, apiKey, streetViewPanoramaRef]); // Removed onStreetViewStatusChange, streetViewContainerRef to avoid potential loops if they are not stable.

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
      {isLoadingStreetView && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Street View...</p>
        </div>
      )}
      <div ref={streetViewContainerRef} className="w-full h-full min-h-[400px] md:min-h-[calc(100vh-12rem)] rounded-lg" />
    </div>
  );
};

export default StreetViewDisplay;

    
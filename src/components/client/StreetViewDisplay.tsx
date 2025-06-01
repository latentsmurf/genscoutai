
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

interface StreetViewDisplayProps {
  locationToLoad: string;
  apiKey: string | null;
  isApiLoaded: boolean; // New prop
  streetViewPanoramaRef: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  onStreetViewStatusChange: (status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => void;
}

const StreetViewDisplay: React.FC<StreetViewDisplayProps> = ({
  locationToLoad,
  apiKey,
  isApiLoaded, // Use this prop
  streetViewPanoramaRef,
  onStreetViewStatusChange,
}) => {
  const streetViewContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const [currentPanoId, setCurrentPanoId] = useState<string | null>(null);
  const [isStreetViewInitialized, setIsStreetViewInitialized] = useState(false);


  useEffect(() => {
    if (!apiKey && streetViewContainerRef.current) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Google Maps API Key is missing. Street View cannot be displayed.</p>';
      setIsStreetViewInitialized(false);
      return;
    }

    if (!isApiLoaded || !streetViewContainerRef.current || typeof window.google === 'undefined' || !window.google.maps) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      if (!isApiLoaded && streetViewContainerRef.current && apiKey) { // Show loading if API key present but not loaded
          streetViewContainerRef.current.innerHTML = ''; // Clear previous messages
      }
      setIsStreetViewInitialized(false);
      return;
    }
    
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

    if (!queryLocation && !locationToLoad) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      if (streetViewContainerRef.current) {
        streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Search for a location or click on the map to see Street View.</p>';
      }
      onStreetViewStatusChange('ZERO_RESULTS', 'No location specified for Street View.');
      setIsLoadingStreetView(false);
      setIsStreetViewInitialized(true); // Consider initialized even if no location
      return;
    }
     if (!queryLocation && locationToLoad) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Invalid coordinates for Street View.</p>';
      onStreetViewStatusChange('ERROR', `Invalid coordinates provided for Street View: ${locationToLoad}`);
      setIsLoadingStreetView(false);
      setIsStreetViewInitialized(true);
      return;
    }

    setIsLoadingStreetView(true);
    setIsStreetViewInitialized(false);
    if (streetViewContainerRef.current) {
       streetViewContainerRef.current.innerHTML = ''; 
    }

    const processLocation = (locationInput: string | google.maps.LatLng | google.maps.LatLngLiteral) => {
        const streetViewService = new window.google.maps.StreetViewService();
        streetViewService.getPanorama({ location: locationInput, radius: 50, source: window.google.maps.StreetViewSource.OUTDOOR }, (data, svStatus) => {
            setIsLoadingStreetView(false);
            setIsStreetViewInitialized(true);
            if (svStatus === window.google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
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
                     if (currentPanoId === data.location.pano) { 
                        streetViewPanoramaRef.current.setOptions(panoramaOptions); // Re-apply options
                        streetViewPanoramaRef.current.setVisible(true);
                    } else { 
                        streetViewPanoramaRef.current.setPano(data.location.pano!);
                        streetViewPanoramaRef.current.setPosition(data.location.latLng);
                        streetViewPanoramaRef.current.setOptions(panoramaOptions);
                        streetViewPanoramaRef.current.setVisible(true);
                    }
                } else if (streetViewContainerRef.current) {
                    streetViewPanoramaRef.current = new window.google.maps.StreetViewPanorama(
                    streetViewContainerRef.current!,
                    panoramaOptions
                    );
                }
                setCurrentPanoId(data.location.pano!);

            } else {
                let userMessage = `Street View not available for this location. Google Status: ${svStatus}`;
                if(svStatus === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
                    userMessage = "Street View data not found for this location.";
                }
                onStreetViewStatusChange('ZERO_RESULTS', userMessage);
                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = `<p class="text-center p-4 text-muted-foreground">${userMessage}</p>`;
            }
        });
    };

    if (typeof queryLocation === 'string') {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: queryLocation }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
                processLocation(results[0].geometry.location);
            } else {
                setIsLoadingStreetView(false);
                setIsStreetViewInitialized(true);
                let userMessage = `Geocoding failed: ${status}`;
                if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
                    userMessage = `Could not find location: "${queryLocation}". Please try a different or more specific search term.`;
                } else if (status === window.google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                    userMessage = "The app has exceeded its Google Maps API usage limits. Please try again later.";
                } else if (status === window.google.maps.GeocoderStatus.REQUEST_DENIED) {
                    userMessage = "Google Maps API request denied. Please check your API key and project setup.";
                } else if (status === window.google.maps.GeocoderStatus.INVALID_REQUEST) {
                    userMessage = `The location search for "${queryLocation}" was invalid. Please check your search term.`;
                }
                onStreetViewStatusChange('ERROR', userMessage);
                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">${userMessage}</p>`;
            }
        });
    } else if (queryLocation) { 
        processLocation(queryLocation as google.maps.LatLngLiteral);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationToLoad, apiKey, isApiLoaded, streetViewPanoramaRef]); // onStreetViewStatusChange removed to prevent loops

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
      {!isApiLoaded && apiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Map API...</p>
        </div>
      )}
      {!apiKey && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <ImageIcon className="w-16 h-16 text-destructive" />
            <p className="ml-2 text-destructive">API Key Missing</p>
        </div>
      )}
      {isApiLoaded && (isLoadingStreetView || (!isStreetViewInitialized && locationToLoad)) && (
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

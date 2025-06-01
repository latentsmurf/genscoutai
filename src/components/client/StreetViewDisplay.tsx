
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

interface StreetViewDisplayProps {
  locationToLoad: string;
  apiKey: string | null;
  isApiLoaded: boolean;
  streetViewPanoramaRef: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  onStreetViewStatusChange: (status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => void;
}

const StreetViewDisplay: React.FC<StreetViewDisplayProps> = ({
  locationToLoad,
  apiKey,
  isApiLoaded,
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
      // Message handled by overlay
      onStreetViewStatusChange('ERROR', 'Google Maps API Key is missing.');
      setIsStreetViewInitialized(false); // It's not initialized if API key is missing
      setIsLoadingStreetView(false);
      return;
    }

    if (!isApiLoaded || !streetViewContainerRef.current || typeof window.google === 'undefined' || !window.google.maps) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      if (!isApiLoaded && apiKey) { // API key present but API not loaded
         onStreetViewStatusChange('ERROR', 'Google Maps API not loaded yet.');
      }
      setIsStreetViewInitialized(false);
      setIsLoadingStreetView(false);
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

    if (!queryLocation && locationToLoad) { // Invalid coordinate string format
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ERROR', `Invalid coordinates provided for Street View: ${locationToLoad}`);
      setIsLoadingStreetView(false);
      setIsStreetViewInitialized(true); // Considered initialized, but with an error state
      return;
    }
    
    if (!locationToLoad) { // No location at all
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ZERO_RESULTS', 'No location specified for Street View.');
      setIsLoadingStreetView(false);
      setIsStreetViewInitialized(true);
      return;
    }


    setIsLoadingStreetView(true);
    setIsStreetViewInitialized(false); // Will be set to true once processing is done


    const processLocation = (locationInput: string | google.maps.LatLng | google.maps.LatLngLiteral) => {
        const streetViewService = new window.google.maps.StreetViewService();
        streetViewService.getPanorama(
          { 
            location: locationInput, 
            radius: 50, 
            source: window.google.maps.StreetViewSource.DEFAULT // Changed from OUTDOOR
          }, 
          (data, svStatus) => {
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

                if (streetViewContainerRef.current) {
                    if (!streetViewPanoramaRef.current) {
                         streetViewPanoramaRef.current = new window.google.maps.StreetViewPanorama(
                            streetViewContainerRef.current,
                            panoramaOptions
                        );
                    } else {
                        streetViewPanoramaRef.current.setPano(data.location.pano!);
                        streetViewPanoramaRef.current.setPosition(data.location.latLng!);
                        streetViewPanoramaRef.current.setOptions(panoramaOptions); // Re-apply all options
                        streetViewPanoramaRef.current.setVisible(true);
                    }
                }
                setCurrentPanoId(data.location.pano!);

            } else {
                let userMessage = `Street View status: ${svStatus}.`;
                if(svStatus === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
                    userMessage = "Street View data not found for this location or precise spot. Try adjusting the map marker slightly.";
                } else if (svStatus === window.google.maps.StreetViewStatus.UNKNOWN_ERROR) {
                    userMessage = "An unknown error occurred while fetching Street View data.";
                }
                onStreetViewStatusChange(svStatus === window.google.maps.StreetViewStatus.ZERO_RESULTS ? 'ZERO_RESULTS' : 'ERROR', userMessage);
                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
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
                    userMessage = `Could not find location: "${queryLocation}".`;
                }
                onStreetViewStatusChange('ERROR', userMessage);
                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
            }
        });
    } else if (queryLocation) { 
        processLocation(queryLocation as google.maps.LatLngLiteral);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationToLoad, apiKey, isApiLoaded]); // streetViewPanoramaRef and onStreetViewStatusChange removed to prevent potential loops

  const showLoadingOverlay = isApiLoaded && apiKey && (isLoadingStreetView || (!isStreetViewInitialized && locationToLoad));
  const showApiKeyMissingOverlay = !apiKey;
  const showApiNotLoadedOverlay = !isApiLoaded && apiKey && !isLoadingStreetView;
  const showInitialMessageOverlay = isApiLoaded && apiKey && !locationToLoad && isStreetViewInitialized && !isLoadingStreetView;


  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
      {showApiKeyMissingOverlay && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 p-4 text-center">
            <ImageIcon className="w-16 h-16 text-destructive mb-2" />
            <p className="text-destructive font-semibold">API Key Missing</p>
            <p className="text-sm text-muted-foreground">Street View cannot be displayed.</p>
        </div>
      )}
      {showApiNotLoadedOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 p-4 text-center">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse mb-2" />
          <p className="text-foreground font-semibold">Loading Map API...</p>
        </div>
      )}
      {showLoadingOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 p-4 text-center">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse mb-2" />
          <p className="text-foreground font-semibold">Loading Street View...</p>
          <p className="text-sm text-muted-foreground">Please wait.</p>
        </div>
      )}
       {showInitialMessageOverlay && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-0 p-4 text-center">
            <ImageIcon className="w-16 h-16 text-primary/50 mb-2" />
            <p className="text-muted-foreground">Search for a location or click on the map to explore in Street View.</p>
        </div>
      )}
      <div ref={streetViewContainerRef} className="w-full h-full min-h-[400px] md:min-h-[calc(100vh-12rem)] rounded-lg" />
    </div>
  );
};

export default StreetViewDisplay;


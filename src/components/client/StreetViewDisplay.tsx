
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

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
  const { addNotification } = useAppContext();
  const streetViewContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const [_currentPanoId, setCurrentPanoId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);


  useEffect(() => {
    const currentContainer = streetViewContainerRef.current;
    if (!currentContainer) return;

    setIsLoadingStreetView(true);
    setStatusMessage(null);

    if (!apiKey) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ERROR', 'Google Maps API Key is missing.');
      setStatusMessage('Google Maps API Key is missing. Street View cannot be displayed.');
      setIsLoadingStreetView(false);
      return;
    }

    if (!isApiLoaded) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ERROR', 'Google Maps API not loaded yet.');
      setStatusMessage('Google Maps API is not loaded yet. Please wait.');
      setIsLoadingStreetView(false);
      return;
    }
    
    if (!locationToLoad) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ZERO_RESULTS', 'No location specified for Street View.');
      setStatusMessage('Search for a location or click on the map to explore in Street View.');
      setIsLoadingStreetView(false);
      return;
    }

    const isCoordinates = locationToLoad.startsWith('coords:');
    let queryParamForService: string | google.maps.LatLngLiteral | null = null;

    if (isCoordinates) {
        const parts = locationToLoad.substring(7).split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                queryParamForService = { lat, lng };
            }
        }
    } else {
        queryParamForService = locationToLoad;
    }

    if (!queryParamForService) {
      if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
      onStreetViewStatusChange('ERROR', `Invalid location format: ${locationToLoad}`);
      setStatusMessage(`Invalid location format provided: ${locationToLoad}. Please try a valid address or coordinates.`);
      setIsLoadingStreetView(false);
      return;
    }
    
    const displayPanorama = (panoData: google.maps.StreetViewPanoramaData) => {
        if (!currentContainer || !panoData.location || !panoData.location.pano) return;
        
        onStreetViewStatusChange('OK');
        setStatusMessage(null);
        
        const panoramaOptions: google.maps.StreetViewPanoramaOptions = {
            pano: panoData.location.pano,
            position: panoData.location.latLng,
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
        
        streetViewPanoramaRef.current = new window.google.maps.StreetViewPanorama(
            currentContainer,
            panoramaOptions
        );
        setCurrentPanoId(panoData.location.pano);
    };

    const attemptToFindPanorama = (locationForPanoService: string | google.maps.LatLng | google.maps.LatLngLiteral) => {
        if (!window.google || !window.google.maps || !window.google.maps.StreetViewService) {
            onStreetViewStatusChange('ERROR', 'Google Maps StreetViewService not available.');
            setStatusMessage('Street View service component failed to load. Please refresh.');
            setIsLoadingStreetView(false);
            return;
        }
        const streetViewService = new window.google.maps.StreetViewService();
        
        // First attempt: precise, 50m radius
        streetViewService.getPanorama(
            { location: locationForPanoService, radius: 50, source: window.google.maps.StreetViewSource.DEFAULT },
            (data, status) => {
                if (status === window.google.maps.StreetViewStatus.OK && data) {
                    setIsLoadingStreetView(false);
                    displayPanorama(data);
                } else if (status === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
                    // Second attempt: wider search, 1000m radius
                    streetViewService.getPanorama(
                        { location: locationForPanoService, radius: 1000, source: window.google.maps.StreetViewSource.OUTDOOR },
                        (widerData, widerStatus) => {
                            setIsLoadingStreetView(false);
                            if (widerStatus === window.google.maps.StreetViewStatus.OK && widerData) {
                                addNotification({
                                    title: "Nearby Street View Found",
                                    description: "No data was available at the exact spot. Showing the closest available location.",
                                });
                                displayPanorama(widerData);
                            } else {
                                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                                onStreetViewStatusChange('ZERO_RESULTS');
                                setStatusMessage("No Street View data found for this location, even after searching nearby.");
                            }
                        }
                    );
                } else {
                    // Handle other errors from the first attempt
                    setIsLoadingStreetView(false);
                    if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
                    const userMessage = `Street View error: ${status}. Try a different location.`;
                    onStreetViewStatusChange('ERROR', userMessage);
                    setStatusMessage(userMessage);
                }
            }
        );
    };

    const geocodeAndFindPanorama = (address: string) => {
        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
             onStreetViewStatusChange('ERROR', 'Google Maps Geocoder not available.');
             setStatusMessage('Geocoder service component failed to load. Please refresh.');
             setIsLoadingStreetView(false);
             return;
        }
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry && results[0].geometry.location) {
                attemptToFindPanorama(results[0].geometry.location);
            } else {
                setIsLoadingStreetView(false);
                let userMessage = `Geocoding failed for Street View: ${status}`;
                 if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
                    userMessage = `Could not find location for Street View: "${address}".`;
                }
                onStreetViewStatusChange('ERROR', userMessage);
                setStatusMessage(userMessage);
                if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
            }
        });
    };

    if (typeof queryParamForService === 'string') {
        geocodeAndFindPanorama(queryParamForService);
    } else if (queryParamForService) {
        attemptToFindPanorama(queryParamForService as google.maps.LatLngLiteral);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationToLoad, apiKey, isApiLoaded, addNotification]); 


  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
      {isLoadingStreetView && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20 p-4 text-center rounded-lg">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse mb-2" />
          <p className="text-foreground font-semibold">Loading Street View...</p>
          <p className="text-sm text-muted-foreground">Please wait.</p>
        </div>
      )}
      {!isLoadingStreetView && statusMessage && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm z-10 p-4 text-center rounded-lg">
            <ImageIcon className="w-12 h-12 text-primary/70 mb-3" />
            <p className="text-base text-foreground px-4">{statusMessage}</p>
        </div>
      )}
      <div ref={streetViewContainerRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default StreetViewDisplay;

    

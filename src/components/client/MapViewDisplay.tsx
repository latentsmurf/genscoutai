
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import type { Vendor } from '@/types';

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
  const drawnOverlaysRef = useRef<google.maps.MVCObject[]>([]);

  const openNoteEditor = useCallback((marker: google.maps.Marker, map: google.maps.Map, isNew: boolean) => {
    // Create info window content dynamically to avoid stale closures
    const infoWindow = new window.google.maps.InfoWindow();
    const content = document.createElement('div');

    const input = document.createElement('textarea');
    input.placeholder = "Enter note...";
    input.value = (marker.getLabel() as google.maps.MarkerLabel)?.text || '';
    input.style.cssText = "width: 220px; height: 80px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; padding: 5px; font-family: sans-serif;";
    
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.style.cssText = "margin-bottom: 10px; display: flex; align-items: center; gap: 5px;";
    colorPickerContainer.innerHTML = '<strong style="margin-right: 5px;">Color:</strong>';
    
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
    let selectedColor = 'red'; // default color

    const currentIcon = marker.getIcon() as string | google.maps.Icon | null;
    if (typeof currentIcon === 'string' && currentIcon.includes('/ms/icons/')) {
        const match = currentIcon.match(/([a-z]+)-dot\.png/);
        if (match && colors.includes(match[1])) {
            selectedColor = match[1];
        }
    }

    const colorButtons: HTMLButtonElement[] = [];
    colors.forEach(color => {
        const colorButton = document.createElement('button');
        colorButton.setAttribute('type', 'button');
        colorButton.style.cssText = `width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 2px solid transparent; cursor: pointer;`;
        if (color === selectedColor) {
            colorButton.style.borderColor = 'black';
        }
        colorButton.onclick = () => {
            selectedColor = color;
            colorButtons.forEach(btn => {
                btn.style.borderColor = btn.style.backgroundColor === selectedColor ? 'black' : 'transparent';
            });
        };
        colorPickerContainer.appendChild(colorButton);
        colorButtons.push(colorButton);
    });
    
    const buttonContainer = document.createElement('div');
    const saveButton = document.createElement('button');
    saveButton.setAttribute('type', 'button');
    saveButton.textContent = 'Save';
    saveButton.style.cssText = "padding: 5px 10px; border: 1px solid #333; background: #333; color: white; border-radius: 4px; cursor: pointer;";

    const removeButton = document.createElement('button');
    removeButton.setAttribute('type', 'button');
    removeButton.textContent = 'Remove';
    removeButton.style.cssText = "padding: 5px 10px; border: 1px solid #ccc; background: #eee; border-radius: 4px; cursor: pointer; margin-left: 10px;";

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(removeButton);

    content.appendChild(input);
    content.appendChild(colorPickerContainer);
    content.appendChild(buttonContainer);

    infoWindow.setContent(content);
    infoWindow.open({
        anchor: marker,
        map,
    });

    const saveAndClose = () => {
        const text = input.value.trim();
        marker.setIcon(`http://maps.google.com/mapfiles/ms/icons/${selectedColor}-dot.png`);
        
        if (text) {
            marker.setLabel({
                text: text,
                color: '#000000',
                fontSize: '12px',
                fontWeight: 'bold',
            });
        } else {
            marker.setLabel(null);
        }
        infoWindow.close();
    };
    
    saveButton.onclick = saveAndClose;
    removeButton.onclick = () => {
        marker.setMap(null);
        infoWindow.close();
    };
    
    const closeListener = window.google.maps.event.addListener(infoWindow, 'closeclick', () => {
        if (isNew) {
            const currentLabel = marker.getLabel();
            // If it's a new marker and was closed without saving, remove it.
            if (!currentLabel || !currentLabel.text) {
               marker.setMap(null);
            }
        }
        window.google.maps.event.removeListener(closeListener);
    });
  }, []);

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
    
    let markerCompleteListener: google.maps.MapsEventListener | null = null;
    let overlayCompleteListener: google.maps.MapsEventListener | null = null;


    if (enableDrawing) {
        if (!drawingManagerRef.current) {
            drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
                drawingMode: null, // Start with no active tool
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
            
             // Listener for general overlays
            overlayCompleteListener = window.google.maps.event.addListener(drawingManagerRef.current, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
                 drawnOverlaysRef.current.push(event.overlay);
            });

            // Specific listener for markers to add notes
            markerCompleteListener = window.google.maps.event.addListener(drawingManagerRef.current, 'markercomplete', (marker: google.maps.Marker) => {
                if (drawingManagerRef.current) {
                    drawingManagerRef.current.setDrawingMode(null);
                }
                
                openNoteEditor(marker, mapInstanceRef.current!, true);

                marker.addListener('click', () => {
                    openNoteEditor(marker, mapInstanceRef.current!, false);
                });
            });
        }
        drawingManagerRef.current.setMap(mapInstanceRef.current);
    } else {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setMap(null);
        }
    }
    
    return () => {
        // These listeners are attached to the drawingManager instance.
        // It's best practice to clean them up, but since drawingManager persists, they don't cause major leaks.
        // If enableDrawing was toggled rapidly, multiple listeners could be added.
        // For simplicity in this context, we'll rely on the single instance of the drawingManager.
    };
  }, [isMapInitialized, enableDrawing, openNoteEditor]);

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
        // Clean up drawn overlays on unmount
        drawnOverlaysRef.current.forEach(overlay => (overlay as any).setMap(null));
        drawnOverlaysRef.current = [];
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

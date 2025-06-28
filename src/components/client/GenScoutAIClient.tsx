
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Search, Sun, CloudRain, CloudFog, Snowflake, Bot, Focus, ImageIcon, Film, Download, Sparkles, MapIcon, EyeIcon, RefreshCw, DatabaseIcon, Orbit, InfoIcon, Eye, EyeOff, FileText, ParkingCircle, Truck, MessageSquarePlus, LayoutDashboard, Layers, Network, DollarSign, TimerIcon, RotateCcw, GalleryHorizontalEnd, Loader2, Compass, Building, Star, PencilRuler, Switch, ImageDown, FolderPlus } from 'lucide-react';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { generateCinematicShot, type GenerateCinematicShotInput } from '@/ai/flows/generate-cinematic-shot-flow';
import { generateLocationInfo, type GenerateLocationInfoInput, type GenerateLocationInfoOutput } from '@/ai/flows/generate-location-info-flow';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import StreetViewDisplay from './StreetViewDisplay';
import MapViewDisplay from './MapViewDisplay';
import type { FilmingLocation } from '@/types';
import { sampleFilmingLocations } from '@/data/filming-locations';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import html2canvas from 'html2canvas';

const schematicMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

export default function GenScoutAIClient() {
  const { 
    addImageToActiveProject, 
    updateSessionCost, 
    addNotification,
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject
  } = useAppContext();

  // State Variables
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [googleMapsApiLoaded, setGoogleMapsApiLoaded] = useState(false);
  const [isStreetViewReady, setIsStreetViewReady] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [locationForStreetView, setLocationForStreetView] = useState<string>('');
  // Main UI controls
  const [selectedLens, setSelectedLens] = useState<string>('50mm');
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [generatedTimePrompt, setGeneratedTimePrompt] = useState<string>('noon');
  const [isLoadingTimePrompt, setIsLoadingTimePrompt] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<string>('none');
  const [generatedWeatherPrompt, setGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingWeatherPrompt, setIsLoadingWeatherPrompt] = useState<boolean>(false);
  const [shotDirection, setShotDirection] = useState<string>('eye-level default');

  // Dialog UI controls state
  const [dialogSelectedLens, setDialogSelectedLens] = useState<string>('50mm');
  const [dialogTimeOfDay, setDialogTimeOfDay] = useState<number>(12);
  const [dialogGeneratedTimePrompt, setDialogGeneratedTimePrompt] = useState<string>('noon');
  const [isLoadingDialogTimePrompt, setIsLoadingDialogTimePrompt] = useState<boolean>(false);
  const [dialogWeatherCondition, setDialogWeatherCondition] = useState<string>('none');
  const [dialogGeneratedWeatherPrompt, setDialogGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingDialogWeatherPrompt, setIsLoadingDialogWeatherPrompt] = useState<boolean>(false);
  const [dialogShotDirection, setDialogShotDirection] = useState<string>('eye-level default');

  const [generatedCinematicImage, setGeneratedCinematicImage] = useState<string | null>(null);
  const [isGeneratingCinematicImage, setIsGeneratingCinematicImage] = useState<boolean>(false);
  const [isGeneratedImageDialogOpen, setIsGeneratedImageDialogOpen] = useState<boolean>(false);
  const [snapshotOverlays, setSnapshotOverlays] = useState<{lens: string; time: string; weather: string} | null>(null);
  const [lastBaseImageSource, setLastBaseImageSource] = useState<string | null>(null);

  const [currentDisplayMode, setCurrentDisplayMode] = useState<'map' | 'streetview' | 'planner'>('map');
  const [plannerViewType, setPlannerViewType] = useState<'satellite' | 'schematic'>('satellite');

  const [currentMapCenter, setCurrentMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 34.0522, lng: -118.2437 });
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(8);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("custom-search");
  const [filmingLocationSearchTerm, setFilmingLocationSearchTerm] = useState<string>("");
  const [locationInfo, setLocationInfo] = useState<GenerateLocationInfoOutput | null>(null);
  const [isLoadingLocationInfo, setIsLoadingLocationInfo] = useState<boolean>(false);
  const [isUiHidden, setIsUiHidden] = useState<boolean>(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>("");

  const [moodBoardImages, setMoodBoardImages] = useState<string[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);
  
  // New state for Place Photos
  const [currentPlaceId, setCurrentPlaceId] = useState<string | null>(null);
  const [placePhotos, setPlacePhotos] = useState<google.maps.places.PlacePhoto[]>([]);
  const [isLoadingPlacePhotos, setIsLoadingPlacePhotos] = useState<boolean>(false);

  // New state for Scene Planner
  const [isDrawingEnabled, setIsDrawingEnabled] = useState<boolean>(false);
  const [isCapturingPlan, setIsCapturingPlan] = useState<boolean>(false);
  
  const anyOperationInProgress = isGeneratingCinematicImage || isGeneratingVariations || isCapturingPlan;

  // Refs
  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);


  // Constants
  const shotDirectionOptions = [
    { value: 'eye-level default', label: 'Eye-level View (Default)' },
    { value: 'low angle looking up', label: 'Low Angle, Looking Up' },
    { value: 'high angle looking down', label: 'High Angle, Looking Down' },
    { value: 'wide establishing shot', label: 'Wide Establishing Shot' },
    { value: 'dutch angle', label: 'Dutch Angle / Canted View' },
    { value: 'worm-s eye view', label: "Worm's-eye View" },
    { value: 'bird-s eye view', label: "Bird's-eye View (from street level)" },
  ];
  const cameraLenses = ["16mm", "24mm", "35mm", "50mm", "85mm", "135mm"];

  const filteredFilmingLocations = sampleFilmingLocations.filter(loc => {
    const searchTermLower = filmingLocationSearchTerm.toLowerCase();
    return (
      loc.movieTitle.toLowerCase().includes(searchTermLower) ||
      loc.locationName.toLowerCase().includes(searchTermLower) ||
      loc.sceneDescription.toLowerCase().includes(searchTermLower) ||
      loc.address.toLowerCase().includes(searchTermLower)
    );
  });

  const fetchPlacePhotos = useCallback((placeId: string) => {
    if (!googleMapsApiLoaded || !window.google?.maps?.places) {
      return;
    }
    setIsLoadingPlacePhotos(true);
    setPlacePhotos([]);
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

    placesService.getDetails(
      { placeId, fields: ['photos'] },
      (place, status) => {
        updateSessionCost('placesDetailsRequests');
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.photos) {
          setPlacePhotos(place.photos.slice(0, 20)); // Limit to 20 photos
        } else {
          setPlacePhotos([]);
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            console.warn(`PlacesService failed for photos: ${status}`);
          }
        }
        setIsLoadingPlacePhotos(false);
      }
    );
  }, [googleMapsApiLoaded, updateSessionCost]);

  const fetchLocationInformation = useCallback(async (name: string, coords?: google.maps.LatLngLiteral) => {
    setIsLoadingLocationInfo(true);
    setLocationInfo(null);
    try {
      const input: GenerateLocationInfoInput = { locationName: name };
      if (coords) {
        input.coordinates = coords;
      }
      const result = await generateLocationInfo(input);
      updateSessionCost('geminiTextGenerations');
      setLocationInfo(result);
    } catch (error) {
      console.error("Error fetching location information:", error);
      const errorSummary = "Could not load information for this location.";
      setLocationInfo({
        summary: errorSummary,
        permittingInfo: "N/A",
        parkingAssessment: "N/A",
        logisticsFeasibility: "N/A"
      });
      addNotification({ title: "AI Error", description: "Failed to generate location summary.", variant: "destructive" });
    } finally {
      setIsLoadingLocationInfo(false);
    }
  }, [addNotification, updateSessionCost]);

  const handleLocationSelect = useCallback((
      name: string,
      geometry: google.maps.LatLng | google.maps.LatLngLiteral,
      placeId?: string | null
    ) => {
    const newLocation = 'toJSON' in geometry ? geometry.toJSON() : geometry;
    setLocationForStreetView(name);
    setCurrentMapCenter(newLocation);
    setMarkerPosition(newLocation);
    setCurrentMapZoom(15);
    setCurrentDisplayMode('map');
    
    fetchLocationInformation(name, newLocation);

    if (placeId) {
      setCurrentPlaceId(placeId);
      fetchPlacePhotos(placeId);
      setActiveSidebarTab("location-photos");
    } else {
      setCurrentPlaceId(null);
      setPlacePhotos([]);
    }
  }, [fetchLocationInformation, fetchPlacePhotos]);


  const handleLocationSearch = useCallback((query?: string) => {
    const effectiveQuery = query || searchInputRef.current?.value;
    if (!effectiveQuery || !effectiveQuery.trim()) {
      addNotification({ title: "Search Empty", description: "Please enter a location to search." });
      return;
    }

    if (!googleMapsApiLoaded || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.Geocoder) {
        addNotification({ title: "API Not Ready", description: "Google Maps API is not loaded yet for geocoding." });
        return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: effectiveQuery }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
            updateSessionCost('geocodingRequests');
            const formattedAddress = results[0].formatted_address || effectiveQuery;
            setSearchInput(formattedAddress);
            handleLocationSelect(formattedAddress, results[0].geometry.location, results[0].place_id);
        } else {
            let userMessage = `Geocoding failed: ${status}`;
             if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
                userMessage = `Could not find location: "${effectiveQuery}". Please try a different or more specific search term.`;
            } else if (status === window.google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                userMessage = "The app has exceeded its Google Maps API usage limits. Please try again later.";
            } else if (status === window.google.maps.GeocoderStatus.REQUEST_DENIED) {
                userMessage = "Google Maps API request denied. Please check your API key and project setup.";
            } else if (status === window.google.maps.GeocoderStatus.INVALID_REQUEST) {
                userMessage = `The location search for "${effectiveQuery}" was invalid. Please check your search term.`;
            }
            addNotification({ title: "Geocoding Error", description: userMessage, variant: "destructive" });
            setMarkerPosition(null);
            setLocationInfo(null);
        }
    });
  }, [googleMapsApiLoaded, addNotification, handleLocationSelect, updateSessionCost]);

  const handleAutocompletePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
    const placeName = place.formatted_address || place.name;
    if (!placeName) return;

    setSearchInput(placeName);
    
    if (place.geometry && place.geometry.location) {
      updateSessionCost('geocodingRequests');
      handleLocationSelect(placeName, place.geometry.location, place.place_id);
    } else {
      handleLocationSearch(placeName);
    }
  }, [handleLocationSearch, handleLocationSelect, updateSessionCost]);


  const handleStreetViewStatusChange = useCallback((status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => {
    if (status === 'OK') {
      setIsStreetViewReady(true);
    } else {
      setIsStreetViewReady(false);
      if (status === 'ERROR' && message) {
        addNotification({ title: "Street View Error", description: message, variant: "destructive" });
      }
    }
  }, [addNotification]);

  const handleTimeOfDayChange = useCallback(async (value: number, isDialogControl: boolean = false) => {
    if (isDialogControl) {
      setDialogTimeOfDay(value);
      setIsLoadingDialogTimePrompt(true);
    } else {
      setTimeOfDay(value);
      setIsLoadingTimePrompt(true);
    }
    try {
      const input: GenerateTimeOfDayPromptInput = { time: value };
      const result = await generateTimeOfDayPrompt(input);
      updateSessionCost('geminiTextGenerations');
      if (isDialogControl) {
        setDialogGeneratedTimePrompt(result.promptToken);
      } else {
        setGeneratedTimePrompt(result.promptToken);
      }
    } catch (error) {
      console.error("Error generating time of day prompt:", error);
      if (isDialogControl) {
        setDialogGeneratedTimePrompt('Error');
      } else {
        setGeneratedTimePrompt('Error');
      }
      addNotification({ title: "AI Error", description: "Failed to generate time-of-day token.", variant: "destructive" });
    } finally {
      if (isDialogControl) {
        setIsLoadingDialogTimePrompt(false);
      } else {
        setIsLoadingTimePrompt(false);
      }
    }
  }, [addNotification, updateSessionCost]);

  const handleWeatherConditionChange = useCallback(async (value: string, isDialogControl: boolean = false) => {
    if (!value || value === "none") {
      if (isDialogControl) {
        setDialogWeatherCondition('none');
        setDialogGeneratedWeatherPrompt('');
      } else {
        setWeatherCondition('none');
        setGeneratedWeatherPrompt('');
      }
      return;
    }
    if (isDialogControl) {
      setDialogWeatherCondition(value);
      setIsLoadingDialogWeatherPrompt(true);
    } else {
      setWeatherCondition(value);
      setIsLoadingWeatherPrompt(true);
    }
    try {
      const input: GenerateWeatherConditionInput = { weatherCondition: value };
      const result = await generateWeatherConditionPrompt(input);
      updateSessionCost('geminiTextGenerations');
      if (isDialogControl) {
        setDialogGeneratedWeatherPrompt(result.prompt);
      } else {
        setGeneratedWeatherPrompt(result.prompt);
      }
    } catch (error) {
      console.error("Error generating weather condition prompt:", error);
      if (isDialogControl) {
        setDialogGeneratedWeatherPrompt('Error');
      } else {
        setGeneratedWeatherPrompt('Error');
      }
      addNotification({ title: "AI Error", description: "Failed to generate weather prompt.", variant: "destructive" });
    } finally {
      if (isDialogControl) {
        setIsLoadingDialogWeatherPrompt(false);
      } else {
        setIsLoadingWeatherPrompt(false);
      }
    }
  }, [addNotification, updateSessionCost]);


  const handleMapClick = useCallback((latLng: google.maps.LatLngLiteral) => {
    setCurrentMapCenter(latLng);
    setMarkerPosition(latLng);
    const coordString = `coords:${latLng.lat},${latLng.lng}`;
    setLocationForStreetView(coordString);
    setCurrentPlaceId(null);
    setPlacePhotos([]);

    if (!googleMapsApiLoaded || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.Geocoder) {
      fetchLocationInformation(coordString, latLng);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      updateSessionCost('geocodingRequests'); 
      let locationNameForInfo = coordString;
      let placeId: string | null = null;
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        locationNameForInfo = results[0].formatted_address || coordString;
        placeId = results[0].place_id || null;
      } else {
        console.warn("Reverse geocoding failed for map click, using raw coords for info:", status);
      }
      fetchLocationInformation(locationNameForInfo, latLng);
      if(placeId) {
        setCurrentPlaceId(placeId);
        fetchPlacePhotos(placeId);
        setActiveSidebarTab('location-photos');
      }
    });
  }, [googleMapsApiLoaded, fetchLocationInformation, fetchPlacePhotos, updateSessionCost]);

  const handleDownloadImage = useCallback(async () => {
    if (generatedCinematicImage) {
      try {
        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = generatedCinematicImage;

        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            addNotification({ title: "Download Failed", description: "Could not create drawing context for watermark.", variant: "destructive"});
            return;
          }

          canvas.width = image.width;
          canvas.height = image.height;

          ctx.drawImage(image, 0, 0);

          const watermarkText = "www.GenScout.ai";
          const fontSize = Math.max(12, Math.min(24, Math.round(image.height * 0.025)));
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          const padding = Math.max(10, Math.round(image.width * 0.01));

          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          const watermarkedImageUri = canvas.toDataURL('image/png');

          const link = document.createElement('a');
          link.href = watermarkedImageUri;
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          link.download = `genscoutai-cinematic-shot-${timestamp}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addNotification({ title: "Image Downloading", description: "Your watermarked cinematic shot is being downloaded."});
        };

        image.onerror = () => {
           addNotification({ title: "Download Failed", description: "Could not load image for watermarking. Check browser console for CORS issues if image is from an external URL.", variant: "destructive"});
        }

      } catch (error) {
        console.error("Error during image watermarking and download:", error);
        addNotification({ title: "Download Failed", description: "An error occurred while preparing the image for download.", variant: "destructive"});
      }
    } else {
      addNotification({ title: "Download Failed", description: "No image available to download.", variant: "destructive"});
    }
  }, [generatedCinematicImage, addNotification]);

  const handleGenerate360Image = useCallback(() => {
     addNotification({
      title: "360 Image Generation (Conceptual)",
      description: "Generating 360-degree equirectangular images for VR is an advanced feature planned for future updates. It would likely require a specialized AI model and a dedicated Genkit flow.",
    });
  }, [addNotification]);

  const handleViewIn360VR = useCallback(() => {
    addNotification({
      title: "View in 360/VR (Conceptual)",
      description: "Displaying the image in a 360/VR viewer is planned for when 360 image generation is available. This would involve integrating a VR-capable image viewer component.",
    });
  }, [addNotification]);


  const handleFilmingLocationSelect = useCallback((location: FilmingLocation) => {
    setSearchInput(location.address || location.locationName);
    handleLocationSelect(location.address || location.locationName, location.coordinates);
    addNotification({ title: "Location Set", description: `${location.movieTitle} - ${location.locationName} loaded.` });
  }, [handleLocationSelect, addNotification]);

  const handleCaptureScenePlan = useCallback(async () => {
    if (!mapContainerRef.current) {
        addNotification({ title: "Capture Error", description: "Map element not found.", variant: "destructive" });
        return;
    }
    setIsCapturingPlan(true);
    addNotification({ title: "Capturing Scene Plan...", description: "Please wait while the map is rendered." });
    try {
        const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true, // Important for fetching map tiles from Google's servers
            allowTaint: true,
            logging: false,
            // Temporarily hide the Google logo and terms of use for a cleaner capture
            onclone: (doc) => {
              const googleUI = doc.querySelector('.gmnoprint');
              if (googleUI) (googleUI as HTMLElement).style.display = 'none';
            },
        });
        const dataUrl = canvas.toDataURL('image/png');
        addImageToActiveProject({
            src: dataUrl,
            prompt: `Scene Plan for ${locationForStreetView || 'Selected Area'}`,
            type: 'Scene Plan',
        });
        addNotification({ title: "Scene Plan Saved!", description: "Your plan has been added to the active project." });

    } catch (error) {
        console.error("Error capturing scene plan:", error);
        addNotification({ title: "Capture Failed", description: `Could not save the scene plan. Error: ${error instanceof Error ? error.message : 'Unknown'}`, variant: "destructive" });
    } finally {
        setIsCapturingPlan(false);
    }
}, [addImageToActiveProject, addNotification, locationForStreetView]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key && key !== "YOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER" && key.length > 10) {
      setGoogleMapsApiKey(key);
      const loader = new Loader({
        apiKey: key,
        version: 'weekly',
        libraries: ['maps', 'marker', 'streetView', 'geocoding', 'places', 'drawing'],
      });
      loader.load().then(() => {
        setGoogleMapsApiLoaded(true);
      }).catch(e => {
        console.error("Error loading Google Maps API:", e);
        addNotification({ title: "API Load Error", description: `Failed to load Google Maps API: ${e.message || 'Unknown error'}`, variant: "destructive"});
      });
    } else {
      console.warn("Google Maps API Key is not configured or is invalid. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
    }
  }, [addNotification]);

  useEffect(() => {
    if (googleMapsApiLoaded && searchInputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { types: ['geocode'] }
      );
      autocomplete.setFields(['name', 'formatted_address', 'geometry', 'place_id']);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && (place.formatted_address || place.name)) {
            handleAutocompletePlaceSelected(place);
        } else if (searchInputRef.current?.value) {
            handleLocationSearch(searchInputRef.current?.value);
        }
      });
      autocompleteRef.current = autocomplete;
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        // The Autocomplete instance is automatically cleaned up by the Maps JS API.
        // We only need to clear our own listeners on it.
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleMapsApiLoaded, handleAutocompletePlaceSelected, handleLocationSearch]);

  // Initialize time prompt when API is loaded
  useEffect(() => {
    if (googleMapsApiLoaded) {
        handleTimeOfDayChange(timeOfDay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsApiLoaded]);


  const processSnapshotAndGenerateAI = async (
    baseImageSource: string,
    options: {
      lens: string;
      timeOfDayValue: number;
      weatherConditionValue: string;
      direction: string;
      modificationInstruction?: string;
      sceneDesc?: string;
    }
  ) => {
    if (isGeneratingCinematicImage) return;
    setIsGeneratingCinematicImage(true);
    setGeneratedCinematicImage(null);
    setMoodBoardImages([]);

    let finalTimeOfDayToken: string;
    let finalWeatherConditionPrompt: string;

    const currentIsDialog = isGeneratedImageDialogOpen;

    if (currentIsDialog) setIsLoadingDialogTimePrompt(true); else setIsLoadingTimePrompt(true);
    try {
      const timeResult = await generateTimeOfDayPrompt({ time: options.timeOfDayValue });
      updateSessionCost('geminiTextGenerations');
      finalTimeOfDayToken = timeResult.promptToken;
      if (currentIsDialog) setDialogGeneratedTimePrompt(finalTimeOfDayToken); else setGeneratedTimePrompt(finalTimeOfDayToken);
    } catch (e) {
      console.error("Error fetching time prompt in process:", e);
      finalTimeOfDayToken = options.timeOfDayValue >= 6 && options.timeOfDayValue < 18 ? "day" : "night";
      addNotification({ title: "AI Error", description: "Failed to get time-of-day token, using simple fallback.", variant: "destructive" });
    } finally {
      if (currentIsDialog) setIsLoadingDialogTimePrompt(false); else setIsLoadingTimePrompt(false);
    }

    if (options.weatherConditionValue !== 'none') {
      if (currentIsDialog) setIsLoadingDialogWeatherPrompt(true); else setIsLoadingWeatherPrompt(true);
      try {
        const weatherResult = await generateWeatherConditionPrompt({ weatherCondition: options.weatherConditionValue });
        updateSessionCost('geminiTextGenerations');
        finalWeatherConditionPrompt = weatherResult.prompt;
        if (currentIsDialog) setDialogGeneratedWeatherPrompt(finalWeatherConditionPrompt); else setGeneratedWeatherPrompt(finalWeatherConditionPrompt);
      } catch (e) {
        console.error("Error fetching weather prompt in process:", e);
        finalWeatherConditionPrompt = "";
        addNotification({ title: "AI Error", description: "Failed to get weather prompt, using empty.", variant: "destructive" });
      } finally {
        if (currentIsDialog) setIsLoadingDialogWeatherPrompt(false); else setIsLoadingWeatherPrompt(false);
      }
    } else {
      finalWeatherConditionPrompt = '';
      if (currentIsDialog) setDialogGeneratedWeatherPrompt(''); else setGeneratedWeatherPrompt('');
    }

    try {
      const aiInput: GenerateCinematicShotInput = {
        baseImageUri: baseImageSource,
        focalLength: options.lens,
        timeOfDayToken: finalTimeOfDayToken,
        weatherConditionPrompt: finalWeatherConditionPrompt,
        sceneDescription: options.sceneDesc || (locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView),
        shotDirection: options.direction,
        modificationInstruction: options.modificationInstruction || undefined,
      };

      const result = await generateCinematicShot(aiInput);
      updateSessionCost('geminiImageGenerations');
      if (result.generatedImageDataUri) {
        setGeneratedCinematicImage(result.generatedImageDataUri);
        const overlayData = {
            lens: options.lens,
            time: finalTimeOfDayToken,
            weather: options.weatherConditionValue !== 'none' ? options.weatherConditionValue : 'Clear',
        };
        setSnapshotOverlays(overlayData);
        
        addImageToActiveProject({
            type: 'Cinematic Shot',
            src: result.generatedImageDataUri,
            prompt: `Cinematic shot of ${aiInput.sceneDescription}`,
            params: {
                location: aiInput.sceneDescription || 'Unknown Location',
                lens: aiInput.focalLength,
                direction: aiInput.shotDirection,
                time: finalTimeOfDayToken,
                weather: options.weatherConditionValue !== 'none' ? options.weatherConditionValue : 'Clear'
            }
        });

        if (!isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(true);
        addNotification({ title: "Cinematic Shot Generated!", description: "AI has reimagined your scene." });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error generating AI image:", error);
      setGeneratedCinematicImage(null);
      addNotification({
          title: "AI Generation Failed",
          description: `Could not generate AI image. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
      });
      if (isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(false);
    } finally {
      setIsGeneratingCinematicImage(false);
    }
  };


  const handleSnapshot = async () => {
    if (!isStreetViewReady || !streetViewPanoramaRef.current || !googleMapsApiKey) {
      addNotification({ title: "Street View Not Ready", description: "Please ensure Street View is loaded for a location and API key is set."});
      return;
    }

    const panorama = streetViewPanoramaRef.current;
    const panoId = panorama.getPano();
    const pov = panorama.getPov();
    const zoom = panorama.getZoom();

    if (!panoId || !pov || !googleMapsApiKey) {
        const reason = !panoId ? "Could not retrieve Street View Pano ID." : !pov ? "Could not retrieve Street View Point of View." : "Google Maps API Key is missing.";
        console.warn("Snapshot Error:", reason, {panoId, povExists: !!pov, googleMapsApiKeyExists: !!googleMapsApiKey});
        addNotification({ title: "Snapshot Error", description: `${reason} Please try re-searching the location, adjust view or check API key configuration.`, variant: "destructive" });
        return;
    }

    let fov = 90;
    if (zoom !== undefined) {
      fov = Math.max(10, Math.min(120, 180 / Math.pow(2, zoom)));
    }
    const staticImageUrl = `https://maps.googleapis.com/maps/api/streetview?pano=${panoId}&size=800x450&heading=${pov.heading}&pitch=${pov.pitch}&fov=${fov}&key=${googleMapsApiKey}`;

    try {
      updateSessionCost('streetViewSnapshots');
      
      const response = await fetch(staticImageUrl);
      if (!response.ok) {
          const errorBody = await response.text();
          console.error("Static Street View API Error Response:", errorBody, "URL:", staticImageUrl);
          let friendlyError = `Static Street View API request failed: ${response.status} ${response.statusText}`;
          if (response.status === 403) {
              friendlyError = "A 403 error often means the 'Street View Static API' is not enabled for your API key, or there's a billing issue. Please check your Google Cloud Console.";
          } else if (response.status === 400 && errorBody.includes(" reglerUrl is invalid")) {
              friendlyError = "The Pano ID might be invalid or expired. Try re-searching the location.";
          } else if (response.status === 400) {
              friendlyError = `Bad request to Street View API. Check parameters. Details: ${errorBody.substring(0,100)}`;
          } else if (response.status === 500 || response.status === 503) {
              friendlyError = "Google Street View API seems to be temporarily unavailable. Please try again later.";
          }
          throw new Error(friendlyError);
      }
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });

      setLastBaseImageSource(base64data);
      setModificationPrompt("");

      setDialogSelectedLens(selectedLens);
      setDialogTimeOfDay(timeOfDay);
      setDialogGeneratedTimePrompt(generatedTimePrompt);
      setDialogWeatherCondition(weatherCondition);
      setDialogGeneratedWeatherPrompt(generatedWeatherPrompt);
      setDialogShotDirection(shotDirection);
      setMoodBoardImages([]);

      await processSnapshotAndGenerateAI(base64data, {
        lens: selectedLens,
        timeOfDayValue: timeOfDay,
        weatherConditionValue: weatherCondition,
        direction: shotDirection,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
      });

    } catch (error) {
      console.error("Error fetching/processing Street View snapshot:", error);
      setLastBaseImageSource(null);
      addNotification({
          title: "Street View Snapshot Failed",
          description: `Could not fetch or process Street View image. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
      });
      if (isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(false);
    }
  };

  const handlePlacePhotoSelect = useCallback(async (photo: google.maps.places.PlacePhoto) => {
    if (anyOperationInProgress) return;
    addNotification({ title: "Preparing Photo...", description: "Using selected image with AI." });

    // Directly use the image URL. The Genkit flow will handle fetching it.
    const imageUrl = photo.getUrl({ maxWidth: 1600 });
    
    setLastBaseImageSource(imageUrl);
    setModificationPrompt("");
    setDialogSelectedLens(selectedLens);
    setDialogTimeOfDay(timeOfDay);
    setDialogGeneratedTimePrompt(generatedTimePrompt);
    setDialogWeatherCondition(weatherCondition);
    setDialogGeneratedWeatherPrompt(generatedWeatherPrompt);
    setDialogShotDirection(shotDirection);
    setMoodBoardImages([]);

    await processSnapshotAndGenerateAI(imageUrl, {
      lens: selectedLens,
      timeOfDayValue: timeOfDay,
      weatherConditionValue: weatherCondition,
      direction: shotDirection,
      sceneDesc: locationForStreetView || 'Selected user photo',
    });

  }, [anyOperationInProgress, addNotification, selectedLens, timeOfDay, generatedTimePrompt, weatherCondition, generatedWeatherPrompt, shotDirection, locationForStreetView, processSnapshotAndGenerateAI]);

  const handleRegenerateFromDialog = async () => {
    if (!lastBaseImageSource) {
      addNotification({ title: "Regeneration Error", description: "No base image available. Take a snapshot or select a photo first.", variant: "destructive" });
      return;
    }
    if (anyOperationInProgress) return;

    addNotification({ title: "Regenerating Shot", description: "AI is creating a new variation with dialog settings..." });
    await processSnapshotAndGenerateAI(lastBaseImageSource, {
        lens: dialogSelectedLens,
        timeOfDayValue: dialogTimeOfDay,
        weatherConditionValue: dialogWeatherCondition,
        direction: dialogShotDirection,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
    });
  };

  const handleModifyAndRegenerateFromDialog = async () => {
    if (!lastBaseImageSource) {
      addNotification({ title: "Regeneration Error", description: "No base image available. Take a snapshot or select a photo first.", variant: "destructive" });
      return;
    }
    if (!modificationPrompt.trim()) {
      addNotification({ title: "Modification Empty", description: "Please enter a modification instruction." });
      return;
    }
    if (anyOperationInProgress) return;

    addNotification({ title: "Modifying & Regenerating", description: "AI is applying your changes with dialog settings..." });
    await processSnapshotAndGenerateAI(lastBaseImageSource, {
        lens: dialogSelectedLens,
        timeOfDayValue: dialogTimeOfDay,
        weatherConditionValue: dialogWeatherCondition,
        direction: dialogShotDirection,
        modificationInstruction: modificationPrompt,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
    });
  };

  const handleGenerateSceneVariations = async () => {
    if (!lastBaseImageSource) {
      addNotification({ title: "Error", description: "No base image available for variations.", variant: "destructive" });
      return;
    }
    if (isGeneratingVariations || isGeneratingCinematicImage) return;

    setIsGeneratingVariations(true);
    setMoodBoardImages([]); 
    addNotification({ title: "Generating Variations", description: "AI is creating scene variations..." });

    const variationPrompts = [
      { shotDirection: "a slightly different camera angle of the current view, perhaps panned left or right slightly", modificationInstruction: "Show a nuanced variation of the primary scene." },
      { shotDirection: "a slightly closer shot composition, focusing on the main subject or area of interest", modificationInstruction: "Offer a tighter perspective." },
      { shotDirection: "a wider perspective of the current scene, showing more of the surroundings", modificationInstruction: "Provide more context with a broader view." },
    ];

    const generatedVariations: string[] = [];

    for (let i = 0; i < variationPrompts.length; i++) {
      try {
        const variationInput: GenerateCinematicShotInput = {
          baseImageUri: lastBaseImageSource,
          focalLength: dialogSelectedLens,
          timeOfDayToken: dialogGeneratedTimePrompt, 
          weatherConditionPrompt: dialogGeneratedWeatherPrompt, 
          sceneDescription: locationForStreetView.startsWith('coords:') ? `Custom coordinates - Variation ${i+1}` : `${locationForStreetView} - Variation ${i+1}`,
          shotDirection: variationPrompts[i].shotDirection,
          modificationInstruction: variationPrompts[i].modificationInstruction,
        };

        const result = await generateCinematicShot(variationInput);
        updateSessionCost('geminiImageGenerations');

        if (result.generatedImageDataUri) {
          generatedVariations.push(result.generatedImageDataUri);
          setMoodBoardImages(prev => [...prev, result.generatedImageDataUri!]);
        } else {
          console.warn(`Variation ${i + 1} did not return an image.`);
        }
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
        addNotification({
          title: `Variation ${i + 1} Failed`,
          description: `Could not generate one of the AI image variations. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    }

    if (generatedVariations.length > 0) {
      addNotification({ title: "Variations Generated", description: `${generatedVariations.length} scene variations created.` });
    } else if (generatedVariations.length === 0 && variationPrompts.length > 0) {
       addNotification({ title: "No Variations Generated", description: "AI could not produce any scene variations this time." });
    }
    setIsGeneratingVariations(false);
  };


  if (!isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
      <div className="flex flex-1 flex-col md:flex-row">
        {/* LEFT CONTROL PANEL */}
        <Card className="w-full md:w-[400px] flex-shrink-0 flex flex-col rounded-none shadow-none border-0 border-b md:border-r md:border-b-0">
          <CardHeader className="flex-row items-center gap-4 border-b">
            <Compass className="w-8 h-8 hidden md:block" />
            <div>
              <CardTitle className="text-lg">Scout Controls</CardTitle>
              <CardDescription className="text-sm">Find, analyze, and select your location.</CardDescription>
            </div>
          </CardHeader>
           <div className="p-4 border-b">
              <Label htmlFor="project-select">Active Project</Label>
              <div className="flex gap-2 mt-1">
                 <Select value={activeProjectId || ''} onValueChange={(val) => setActiveProjectId(val === 'none' ? null : val)} disabled={anyOperationInProgress}>
                    <SelectTrigger id="project-select">
                        <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.length > 0 ? (
                           projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                        ) : (
                           <SelectItem value="none" disabled>No projects yet</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                 <Button variant="outline" size="icon" onClick={() => createProject(`Project ${projects.length + 1}`)} title="Create New Project">
                    <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
           </div>
          <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 m-2">
                <TabsTrigger value="custom-search"><Search className="w-4 h-4 mr-1" />Search</TabsTrigger>
                <TabsTrigger value="famous-locations"><Star className="w-4 h-4 mr-1"/>Famous</TabsTrigger>
                <TabsTrigger value="location-photos" disabled={!currentPlaceId}><Building className="w-4 h-4 mr-1"/>Photos</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <div className="p-4 pt-0">
              <TabsContent value="custom-search" className="mt-0">
                  <div className="space-y-4">
                      <form onSubmit={(e) => { e.preventDefault(); handleLocationSearch(searchInputRef.current?.value); }} className="flex gap-2">
                        <Input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search for a location..."
                          defaultValue={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          disabled={!googleMapsApiLoaded || anyOperationInProgress}
                        />
                        <Button type="submit" size="icon" disabled={!googleMapsApiLoaded || anyOperationInProgress}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </form>
                      {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed to search locations.</p>}

                      <Separator />

                      <div className="space-y-2">
                          <h3 className="font-semibold flex items-center gap-2"><InfoIcon className="w-4 h-4" /> Location Intel</h3>
                          {isLoadingLocationInfo ? (
                              <div className="space-y-2 pt-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                                  <Skeleton className="h-4 w-full mt-2" />
                                  <Skeleton className="h-4 w-4/6" />
                              </div>
                          ) : locationInfo ? (
                            <div className="space-y-3 text-sm text-muted-foreground">
                              <p>{locationInfo.summary}</p>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/>Permitting Info</p>
                                <p>{locationInfo.permittingInfo}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground flex items-center gap-2"><ParkingCircle className="w-4 h-4 text-primary"/>Parking Assessment</p>
                                <p>{locationInfo.parkingAssessment}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground flex items-center gap-2"><Truck className="w-4 h-4 text-primary"/>Logistics Feasibility</p>
                                <p>{locationInfo.logisticsFeasibility}</p>
                              </div>
                            </div>
                          ) : (
                              <p className="text-sm text-muted-foreground italic">Search for a location to generate AI-powered intel.</p>
                          )}
                      </div>
                  </div>
              </TabsContent>
              <TabsContent value="famous-locations" className="mt-0">
                <div className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Filter famous locations..."
                        value={filmingLocationSearchTerm}
                        onChange={(e) => setFilmingLocationSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredFilmingLocations.map(loc => (
                          <button key={loc.id} onClick={() => handleFilmingLocationSelect(loc)} className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                              <Image src={loc.imageUrl} alt={loc.locationName} width={80} height={40} className="rounded object-cover aspect-video" />
                              <div className="flex-1">
                                  <p className="font-semibold text-sm leading-tight">{loc.movieTitle}</p>
                                  <p className="text-xs text-muted-foreground leading-tight">{loc.locationName}</p>
                              </div>
                          </button>
                      ))}
                    </div>
                </div>
              </TabsContent>
              <TabsContent value="location-photos" className="mt-0">
                 {isLoadingPlacePhotos ? (
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full aspect-video rounded-lg" />)}
                    </div>
                 ) : placePhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {placePhotos.map((photo, index) => (
                           <button key={index} onClick={() => handlePlacePhotoSelect(photo)} className="relative aspect-video group rounded-lg overflow-hidden border hover:border-primary transition-all">
                                <Image
                                    src={photo.getUrl({maxWidth: 400})}
                                    alt={`Place Photo ${index + 1}`}
                                    fill
                                    style={{objectFit: 'cover'}}
                                    className="group-hover:scale-105 transition-transform"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Sparkles className="text-white w-8 h-8" />
                                </div>
                           </button>
                        ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 h-48 rounded-lg border-2 border-dashed">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No user photos found</p>
                        <p className="text-xs">This location may not have any user-uploaded photos on Google Maps.</p>
                    </div>
                 )}
              </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </Card>

        {/* RIGHT DISPLAY PANEL */}
        <div className="flex-1 flex flex-col gap-4 relative p-4">
          {currentDisplayMode === 'streetview' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsUiHidden(!isUiHidden)}
                className="absolute top-2 right-2 z-50 bg-background/80 hover:bg-background rounded-full shadow-lg"
                title={isUiHidden ? "Show Controls" : "Hide Controls"}
              >
                {isUiHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
          )}

          {!isUiHidden && (
            <Card>
              <CardHeader className="p-4 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                   <CardTitle className="text-lg">Viewport</CardTitle>
                </div>
                <div className="flex gap-2 w-full justify-end sm:w-auto">
                  <Button
                      variant={currentDisplayMode === 'map' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentDisplayMode('map')}
                      disabled={!googleMapsApiLoaded || anyOperationInProgress}
                      className="flex-1 sm:flex-initial"
                    >
                      <MapIcon className="mr-2 h-4 w-4" /> Map
                    </Button>
                     <Button
                      variant={currentDisplayMode === 'streetview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentDisplayMode('streetview')}
                      disabled={!googleMapsApiLoaded || !locationForStreetView || anyOperationInProgress}
                      className="flex-1 sm:flex-initial"
                    >
                      <EyeIcon className="mr-2 h-4 w-4" /> Street View
                    </Button>
                     <Button
                      variant={currentDisplayMode === 'planner' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentDisplayMode('planner');
                        setCurrentMapZoom(16);
                      }}
                      disabled={!googleMapsApiLoaded || !locationForStreetView || anyOperationInProgress}
                      className="flex-1 sm:flex-initial"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Scene Planner
                  </Button>
                </div>
              </CardHeader>
               {currentDisplayMode === 'planner' && (
                 <CardContent className="p-4 pt-0 border-t">
                  <div className="flex justify-between items-center pt-4 flex-wrap gap-4">
                    <Label className="text-base font-semibold">Planner Options</Label>
                    <div className="flex gap-4 items-center flex-wrap">
                      <div className="flex items-center space-x-2">
                        <Switch id="drawing-mode" checked={isDrawingEnabled} onCheckedChange={setIsDrawingEnabled} disabled={anyOperationInProgress} />
                        <Label htmlFor="drawing-mode" className="flex items-center gap-2"><PencilRuler/> Drawing Tools</Label>
                      </div>
                      <Button size="sm" onClick={handleCaptureScenePlan} disabled={anyOperationInProgress}>
                        {isCapturingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ImageDown className="mr-2 h-4 w-4" />}
                        Capture Plan
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant={plannerViewType === 'satellite' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlannerViewType('satellite')}
                          disabled={anyOperationInProgress}
                        >
                          <Layers className="mr-2 h-4 w-4"/> Satellite
                        </Button>
                        <Button
                          variant={plannerViewType === 'schematic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlannerViewType('schematic')}
                          disabled={anyOperationInProgress}
                        >
                          <Network className="mr-2 h-4 w-4"/> Schematic
                        </Button>
                      </div>
                    </div>
                  </div>
                 </CardContent>
              )}
            </Card>
          )}

          {!isUiHidden && currentDisplayMode === 'streetview' && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-lg">Shot Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="flex-grow min-w-[150px]">
                    <Label htmlFor="camera-lens" className="flex items-center gap-2 text-sm mb-1">
                      <Focus className="w-4 h-4" /> Camera Lens
                    </Label>
                    <Select value={selectedLens} onValueChange={setSelectedLens} disabled={anyOperationInProgress}>
                      <SelectTrigger id="camera-lens" className="w-full text-sm">
                        <SelectValue placeholder="Select lens" />
                      </SelectTrigger>
                      <SelectContent>
                        {cameraLenses.map(lens => (
                          <SelectItem key={lens} value={lens}>{lens}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-grow min-w-[200px] w-full md:w-auto">
                    <Label htmlFor="time-of-day" className="flex items-center gap-2 text-sm mb-1">
                      <Sun className="w-4 h-4" /> Time of Day ({timeOfDay}:00)
                      {isLoadingTimePrompt && <span className="text-xs text-muted-foreground italic ml-1">(AI...)</span>}
                    </Label>
                    <Slider
                      id="time-of-day"
                      min={0}
                      max={23}
                      step={1}
                      value={[timeOfDay]}
                      onValueChange={(value) => handleTimeOfDayChange(value[0])}
                      className="my-2"
                      disabled={!googleMapsApiLoaded || anyOperationInProgress || isLoadingTimePrompt}
                    />
                    {generatedTimePrompt && !isLoadingTimePrompt && (
                      <div className="mt-1 p-1.5 bg-muted/50 rounded-md text-xs text-center">
                        <span className="font-semibold">Token:</span> {generatedTimePrompt}
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-[150px]">
                    <Label htmlFor="weather-condition" className="flex items-center gap-2 text-sm mb-1">
                      <Bot className="w-4 h-4" /> Weather
                      {isLoadingWeatherPrompt && <span className="text-xs text-muted-foreground italic ml-1">(AI...)</span>}
                    </Label>
                    <Select value={weatherCondition} onValueChange={(value) => handleWeatherConditionChange(value)} disabled={anyOperationInProgress || isLoadingWeatherPrompt}>
                      <SelectTrigger id="weather-condition" className="w-full text-sm">
                        <SelectValue placeholder="Select weather" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none"><span className="italic text-muted-foreground">None</span></SelectItem>
                        <SelectItem value="clear"><div className="flex items-center gap-2"><Sun className="w-4 h-4" />Clear</div></SelectItem>
                        <SelectItem value="rain"><div className="flex items-center gap-2"><CloudRain className="w-4 h-4" />Rain</div></SelectItem>
                        <SelectItem value="snow"><div className="flex items-center gap-2"><Snowflake className="w-4 h-4" />Snow</div></SelectItem>
                        <SelectItem value="fog"><div className="flex items-center gap-2"><CloudFog className="w-4 h-4" />Fog</div></SelectItem>
                      </SelectContent>
                    </Select>
                    {generatedWeatherPrompt && !isLoadingWeatherPrompt && weatherCondition !== 'none' && (
                      <div className="mt-1 p-1.5 bg-muted/50 rounded-md text-xs text-center">
                        <span className="font-semibold">Prompt:</span> {generatedWeatherPrompt}
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-[180px]">
                    <Label htmlFor="shot-direction" className="flex items-center gap-2 text-sm mb-1">
                      <Film className="w-4 h-4" /> Shot Direction
                    </Label>
                    <Select value={shotDirection} onValueChange={setShotDirection} disabled={anyOperationInProgress}>
                      <SelectTrigger id="shot-direction" className="w-full text-sm">
                        <SelectValue placeholder="Select shot direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {shotDirectionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                    <Button
                      variant="default"
                      size="sm"
                      className="text-sm"
                      onClick={handleSnapshot}
                      disabled={anyOperationInProgress || !isStreetViewReady || !googleMapsApiLoaded}
                    >
                      {isGeneratingCinematicImage && !generatedCinematicImage && lastBaseImageSource?.startsWith('data:') ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Taking Snapshot...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" /> Take Cinematic Snapshot
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={handleGenerate360Image}
                      disabled={anyOperationInProgress || !isStreetViewReady || !googleMapsApiLoaded}
                    >
                      <Orbit className="w-4 h-4 mr-2" /> Generate 360 Image
                    </Button>
                </div>
                {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed to take snapshots.</p>}
              </CardContent>
            </Card>
          )}

          <div
            className={cn(
              "relative flex-1",
              isUiHidden && currentDisplayMode === 'streetview'
                ? "fixed inset-0 z-0 w-screen h-screen !m-0 rounded-none"
                : "min-h-[300px] sm:min-h-[400px] md:min-h-0"
            )}
          >
            {!googleMapsApiLoaded && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
                    <MapIcon className="w-16 h-16 text-primary animate-pulse" />
                    <p className="ml-2 text-foreground">Loading Map API...</p>
                    {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key not configured.</p>}
                </div>
            )}
            {googleMapsApiLoaded && currentDisplayMode === 'map' && (
              <MapViewDisplay
                mapRef={mapContainerRef}
                apiKey={googleMapsApiKey}
                isApiLoaded={googleMapsApiLoaded}
                center={currentMapCenter}
                zoom={currentMapZoom}
                markerPos={markerPosition}
                onMapClick={handleMapClick}
                mapTypeId="roadmap"
              />
            )}
            {googleMapsApiLoaded && currentDisplayMode === 'streetview' && (
              <StreetViewDisplay
                locationToLoad={locationForStreetView}
                apiKey={googleMapsApiKey}
                isApiLoaded={googleMapsApiLoaded}
                streetViewPanoramaRef={streetViewPanoramaRef}
                onStreetViewStatusChange={handleStreetViewStatusChange}
              />
            )}
            {googleMapsApiLoaded && currentDisplayMode === 'planner' && (
              <MapViewDisplay
                mapRef={mapContainerRef}
                apiKey={googleMapsApiKey}
                isApiLoaded={googleMapsApiLoaded}
                center={currentMapCenter}
                zoom={currentMapZoom}
                markerPos={markerPosition}
                onMapClick={handleMapClick}
                mapTypeId={plannerViewType === 'satellite' ? 'satellite' : 'roadmap'}
                customStyles={plannerViewType === 'schematic' ? schematicMapStyles : undefined}
                enableTilt={plannerViewType === 'satellite'}
                enableDrawing={isDrawingEnabled}
              />
            )}
          </div>
        </div>


        <Dialog open={isGeneratedImageDialogOpen} onOpenChange={(open) => {
            if (anyOperationInProgress && !open) return;
            setIsGeneratedImageDialogOpen(open);
            if (!open) setMoodBoardImages([]);
        }}>
            <DialogContent className="max-w-3xl w-full p-0">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>Generated Cinematic Shot</DialogTitle>
                <DialogDescription>
                AI-reimagined scene. Adjust parameters to refine or modify.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                    {isGeneratingCinematicImage && !generatedCinematicImage && (
                        <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
                            <Skeleton className="w-full h-full rounded-lg" />
                            <p className="absolute text-foreground">
                            Generating AI Image...
                            </p>
                        </div>
                    )}
                    {isGeneratingCinematicImage && generatedCinematicImage && (
                        <div className="relative">
                        <Image
                                key={generatedCinematicImage + "-loading"}
                                src={generatedCinematicImage}
                                alt="Previous AI Cinematic Shot / Being modified"
                                width={800}
                                height={450}
                                className="object-contain rounded-lg w-full h-auto opacity-50"
                                unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                                <p className="ml-2 text-white">
                                Applying modifications...
                                </p>
                            </div>
                        </div>
                    )}
                    {!isGeneratingCinematicImage && generatedCinematicImage && (
                    <div className="relative">
                        <Image
                        key={generatedCinematicImage}
                        src={generatedCinematicImage}
                        alt="AI Cinematic Shot"
                        width={800}
                        height={450}
                        className="object-contain rounded-lg w-full h-auto"
                        priority
                        unoptimized
                        />
                        {snapshotOverlays && (
                        <>
                            <div className="absolute bottom-4 left-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm backdrop-blur-sm">
                            <p className="font-semibold">GenScoutAI</p>
                            {snapshotOverlays.lens && <p>Lens: {snapshotOverlays.lens}</p>}
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm text-right backdrop-blur-sm">
                            {snapshotOverlays.time && <p>Time: {snapshotOverlays.time}</p>}
                            {snapshotOverlays.weather && <p>Weather: {snapshotOverlays.weather}</p>}
                            </div>
                        </>
                        )}
                    </div>
                    )}
                    {!isGeneratingCinematicImage && !generatedCinematicImage && (
                        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted rounded-lg">
                            <ImageIcon className="w-16 h-16 text-primary/50" />
                            <p className="ml-2 text-muted-foreground">No image generated yet.</p>
                        </div>
                    )}

                    <div className="mt-4 space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="dialog-camera-lens" className="flex items-center gap-2 text-sm mb-1">
                                    <Focus className="w-4 h-4" /> Camera Lens
                                </Label>
                                <Select value={dialogSelectedLens} onValueChange={setDialogSelectedLens} disabled={anyOperationInProgress}>
                                    <SelectTrigger id="dialog-camera-lens" className="w-full text-sm">
                                        <SelectValue placeholder="Select lens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cameraLenses.map(lens => (
                                        <SelectItem key={lens} value={lens}>{lens}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="dialog-shot-direction" className="flex items-center gap-2 text-sm mb-1">
                                    <Film className="w-4 h-4" /> Shot Direction
                                </Label>
                                <Select value={dialogShotDirection} onValueChange={setDialogShotDirection} disabled={anyOperationInProgress}>
                                    <SelectTrigger id="dialog-shot-direction" className="w-full text-sm">
                                        <SelectValue placeholder="Select shot direction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shotDirectionOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="dialog-time-of-day" className="flex items-center gap-2 text-sm mb-1">
                                    <Sun className="w-4 h-4" /> Time of Day ({dialogTimeOfDay}:00)
                                    {isLoadingDialogTimePrompt && <span className="text-xs text-muted-foreground italic ml-1">(AI...)</span>}
                                </Label>
                                <Slider
                                    id="dialog-time-of-day"
                                    min={0}
                                    max={23}
                                    step={1}
                                    value={[dialogTimeOfDay]}
                                    onValueChange={(value) => handleTimeOfDayChange(value[0], true)}
                                    className="my-2"
                                    disabled={anyOperationInProgress || isLoadingDialogTimePrompt}
                                />
                                {dialogGeneratedTimePrompt && !isLoadingDialogTimePrompt && (
                                <div className="mt-1 p-1.5 bg-muted/50 rounded-md text-xs text-center">
                                    <span className="font-semibold">Token:</span> {dialogGeneratedTimePrompt}
                                </div>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="dialog-weather-condition" className="flex items-center gap-2 text-sm mb-1">
                                    <Bot className="w-4 h-4" /> Weather
                                    {isLoadingDialogWeatherPrompt && <span className="text-xs text-muted-foreground italic ml-1">(AI...)</span>}
                                </Label>
                                <Select value={dialogWeatherCondition} onValueChange={(value) => handleWeatherConditionChange(value, true)} disabled={anyOperationInProgress || isLoadingDialogWeatherPrompt}>
                                    <SelectTrigger id="dialog-weather-condition" className="w-full text-sm">
                                    <SelectValue placeholder="Select weather" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="none"><span className="italic text-muted-foreground">None</span></SelectItem>
                                    <SelectItem value="clear"><div className="flex items-center gap-2"><Sun className="w-4 h-4" />Clear</div></SelectItem>
                                    <SelectItem value="rain"><div className="flex items-center gap-2"><CloudRain className="w-4 h-4" />Rain</div></SelectItem>
                                    <SelectItem value="snow"><div className="flex items-center gap-2"><Snowflake className="w-4 h-4" />Snow</div></SelectItem>
                                    <SelectItem value="fog"><div className="flex items-center gap-2"><CloudFog className="w-4 h-4" />Fog</div></SelectItem>
                                    </SelectContent>
                                </Select>
                                {dialogGeneratedWeatherPrompt && !isLoadingDialogWeatherPrompt && dialogWeatherCondition !== 'none' && (
                                <div className="mt-1 p-1.5 bg-muted/50 rounded-md text-xs text-center">
                                    <span className="font-semibold">Prompt:</span> {dialogGeneratedWeatherPrompt}
                                </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button variant="outline" onClick={handleRegenerateFromDialog} disabled={!lastBaseImageSource || anyOperationInProgress}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingCinematicImage && !modificationPrompt.trim() ? 'animate-spin' : ''}`} />
                                Regenerate
                            </Button>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="modification-prompt" className="flex items-center gap-1.5">
                            <MessageSquarePlus className="w-4 h-4" />
                            Text Modification (Gemini)
                            </Label>
                            <Textarea
                            id="modification-prompt"
                            placeholder="e.g., make it snowy, add dramatic clouds (uses original scene as base)"
                            value={modificationPrompt}
                            onChange={(e) => setModificationPrompt(e.target.value)}
                            className="text-sm"
                            rows={2}
                            disabled={anyOperationInProgress}
                            />
                            <p className="text-xs text-muted-foreground">
                            Note: Modifies the original scene with these text instructions &amp; current parameters.
                            </p>
                            <div className="pt-2">
                                <Button
                                variant="default"
                                onClick={handleModifyAndRegenerateFromDialog}
                                disabled={!lastBaseImageSource || anyOperationInProgress || !modificationPrompt.trim()}
                                >
                                <Sparkles className={`mr-2 h-4 w-4 ${isGeneratingCinematicImage && modificationPrompt.trim() ? 'animate-spin' : ''}`} />
                                Modify &amp; Regenerate
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {moodBoardImages.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-md font-semibold mb-3">Scene Variations:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {moodBoardImages.map((src, index) => (
                            <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-md">
                            <Image
                                src={src}
                                alt={`Scene Variation ${index + 1}`}
                                fill
                                style={{objectFit: 'cover'}}
                                className="rounded-lg"
                                unoptimized
                            />
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                    {isGeneratingVariations && moodBoardImages.length === 0 && ( 
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-md font-semibold mb-3">Generating Scene Variations...</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="w-full aspect-video rounded-lg" />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </ScrollArea>
            <DialogFooter className="p-4 border-t flex flex-col sm:flex-row sm:justify-between items-center">
                <div className="flex gap-2 mb-2 sm:mb-0 flex-wrap justify-center sm:justify-start">
                    <Button
                    variant="outline"
                    onClick={handleGenerateSceneVariations}
                    disabled={!lastBaseImageSource || anyOperationInProgress}
                    className="w-full sm:w-auto"
                    >
                    {isGeneratingVariations ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Variations...</>
                    ) : (
                        <><GalleryHorizontalEnd className="mr-2 h-4 w-4" /> Generate Scene Variations (3)</>
                    )}
                    </Button>
                    <Button variant="outline" onClick={handleDownloadImage} disabled={!generatedCinematicImage || anyOperationInProgress} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    </Button>
                    <Button variant="outline" onClick={handleViewIn360VR} disabled={!generatedCinematicImage || anyOperationInProgress} className="w-full sm:w-auto">
                    <Orbit className="mr-2 h-4 w-4" />
                    View in 360/VR
                    </Button>
                </div>
                <DialogClose asChild>
                    <Button variant="secondary" disabled={anyOperationInProgress} className="w-full sm:w-auto mt-2 sm:mt-0">Close</Button>
                </DialogClose>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
  );
}

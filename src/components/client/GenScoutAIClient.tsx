
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, Search, Sun, CloudRain, CloudFog, Snowflake, Bot, Focus, ImageIcon, Film, Download, Sparkles, MapIcon, EyeIcon, RefreshCw, DatabaseIcon, Orbit, InfoIcon, Eye, EyeOff, FileText, ParkingCircle, Truck, MessageSquarePlus, LayoutDashboard, Layers, Network, DollarSign, AspectRatio, Wand2, TimerIcon, RotateCcw } from 'lucide-react';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { generateCinematicShot, type GenerateCinematicShotInput } from '@/ai/flows/generate-cinematic-shot-flow';
import { generateLocationInfo, type GenerateLocationInfoInput, type GenerateLocationInfoOutput } from '@/ai/flows/generate-location-info-flow';
import { reframeImage, type ReframeImageInput } from '@/ai/flows/reframe-image-flow';
import { applyFluxFilter, type ApplyFluxFilterInput } from '@/ai/flows/apply-flux-filter-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import StreetViewDisplay from './StreetViewDisplay';
import MapViewDisplay from './MapViewDisplay';
import type { FilmingLocation } from '@/types';
import { sampleFilmingLocations } from '@/data/filming-locations';
import { cn } from '@/lib/utils';

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

const ESTIMATED_COSTS = {
  GEOCODING_REQUEST: 0.005,
  STREET_VIEW_SNAPSHOT: 0.007,
  GEMINI_TEXT_PROMPT: 0.001, 
  GEMINI_IMAGE_GENERATION: 0.02,
  REPLICATE_REFRAME: 0.011,
  REPLICATE_FLUX_FILTER: 0.0385,
};

interface SessionCosts {
  geocodingRequests: number;
  streetViewSnapshots: number;
  geminiTextGenerations: number;
  geminiImageGenerations: number;
  replicateReframes: number;
  replicateFluxFilters: number;
  totalEstimatedCost: number;
}

const initialSessionCosts: SessionCosts = {
  geocodingRequests: 0,
  streetViewSnapshots: 0,
  geminiTextGenerations: 0,
  geminiImageGenerations: 0,
  replicateReframes: 0,
  replicateFluxFilters: 0,
  totalEstimatedCost: 0,
};


export default function GenScoutAIClient() {
  const { toast } = useToast();

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
  const [dialogTargetAspectRatio, setDialogTargetAspectRatio] = useState<string>("16:9");
  const [fluxPrompt, setFluxPrompt] = useState<string>('');
  const [activeDialogTab, setActiveDialogTab] = useState<string>("refine-gemini");


  const [generatedCinematicImage, setGeneratedCinematicImage] = useState<string | null>(null);
  const [isGeneratingCinematicImage, setIsGeneratingCinematicImage] = useState<boolean>(false);
  const [isReframingImage, setIsReframingImage] = useState<boolean>(false);
  const [isApplyingFluxFilter, setIsApplyingFluxFilter] = useState<boolean>(false);
  const [isGeneratedImageDialogOpen, setIsGeneratedImageDialogOpen] = useState<boolean>(false);
  const [snapshotOverlays, setSnapshotOverlays] = useState<{lens: string; time: string; weather: string, aspectRatio?: string, filter?: string} | null>(null);
  const [lastStreetViewSnapshotDataUri, setLastStreetViewSnapshotDataUri] = useState<string | null>(null);
  
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
  const [sessionCosts, setSessionCosts] = useState<SessionCosts>(initialSessionCosts);


  // Refs
  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
  const aspectRatioOptions = [
    { value: "16:9", label: "16:9 (Widescreen)" },
    { value: "9:16", label: "9:16 (Portrait)" },
    { value: "1:1", label: "1:1 (Square)" },
    { value: "4:3", label: "4:3 (Classic TV)" },
    { value: "3:2", label: "3:2 (Photography)" },
  ];

  const filteredFilmingLocations = sampleFilmingLocations.filter(loc => {
    const searchTermLower = filmingLocationSearchTerm.toLowerCase();
    return (
      loc.movieTitle.toLowerCase().includes(searchTermLower) ||
      loc.locationName.toLowerCase().includes(searchTermLower) ||
      loc.sceneDescription.toLowerCase().includes(searchTermLower) ||
      loc.address.toLowerCase().includes(searchTermLower)
    );
  });

  const updateSessionCost = useCallback((
    type: keyof Omit<SessionCosts, 'totalEstimatedCost'>,
    costPerUnit: number
  ) => {
    setSessionCosts(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      totalEstimatedCost: prev.totalEstimatedCost + costPerUnit,
    }));
  }, []);
  
  const fetchLocationInformation = useCallback(async (name: string, coords?: google.maps.LatLngLiteral) => {
    setIsLoadingLocationInfo(true);
    setLocationInfo(null);
    try {
      const input: GenerateLocationInfoInput = { locationName: name };
      if (coords) {
        input.coordinates = coords;
      }
      const result = await generateLocationInfo(input);
      updateSessionCost('geminiTextGenerations', ESTIMATED_COSTS.GEMINI_TEXT_PROMPT);
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
      toast({ title: "AI Error", description: "Failed to generate location summary.", variant: "destructive" });
    } finally {
      setIsLoadingLocationInfo(false);
    }
  }, [toast, updateSessionCost]);

  const handleLocationSearch = useCallback((query?: string) => {
    const effectiveQuery = query || searchInput;
    if (!effectiveQuery.trim()) {
      toast({ title: "Search Empty", description: "Please enter a location to search.", variant: "default" });
      return;
    }

    if (!googleMapsApiLoaded || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.Geocoder) {
        toast({ title: "API Not Ready", description: "Google Maps API is not loaded yet for geocoding.", variant: "default" });
        return;
    }
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: effectiveQuery }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
            updateSessionCost('geocodingRequests', ESTIMATED_COSTS.GEOCODING_REQUEST);
            const newLocation = results[0].geometry.location.toJSON();
            const formattedAddress = results[0].formatted_address || effectiveQuery;
            setLocationForStreetView(formattedAddress); 
            setCurrentMapCenter(newLocation);
            setMarkerPosition(newLocation);
            setCurrentMapZoom(15); 
            setCurrentDisplayMode('map'); 
            if (query) setSearchInput(formattedAddress); 
            fetchLocationInformation(formattedAddress, newLocation);
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
            toast({ title: "Geocoding Error", description: userMessage, variant: "destructive" });
            setMarkerPosition(null); 
            setLocationInfo(null);
        }
    });
  }, [searchInput, googleMapsApiLoaded, toast, fetchLocationInformation, updateSessionCost]);

  const handleAutocompletePlaceSelected = useCallback((placeName: string, placeGeometry?: google.maps.LatLng | null) => {
    setSearchInput(placeName);
    setLocationForStreetView(placeName); 
    if (placeGeometry) {
      updateSessionCost('geocodingRequests', ESTIMATED_COSTS.GEOCODING_REQUEST); // Assume autocomplete counts as a geocode/places lookup
      const newLocation = placeGeometry.toJSON();
      setCurrentMapCenter(newLocation);
      setMarkerPosition(newLocation);
      setCurrentMapZoom(15); 
      setCurrentDisplayMode('map');
      fetchLocationInformation(placeName, newLocation);
    } else {
      handleLocationSearch(placeName); 
    }
  }, [handleLocationSearch, fetchLocationInformation, updateSessionCost]);
  
  const handleStreetViewStatusChange = useCallback((status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => {
    if (status === 'OK') {
      setIsStreetViewReady(true);
    } else {
      setIsStreetViewReady(false);
      if (status === 'ERROR' && message) { 
        toast({ title: "Street View Error", description: message, variant: "destructive" });
      }
    }
  }, [toast]);

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
      updateSessionCost('geminiTextGenerations', ESTIMATED_COSTS.GEMINI_TEXT_PROMPT);
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
      toast({ title: "AI Error", description: "Failed to generate time-of-day token.", variant: "destructive" });
    } finally {
      if (isDialogControl) {
        setIsLoadingDialogTimePrompt(false);
      } else {
        setIsLoadingTimePrompt(false);
      }
    }
  }, [toast, updateSessionCost]);

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
      updateSessionCost('geminiTextGenerations', ESTIMATED_COSTS.GEMINI_TEXT_PROMPT);
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
      toast({ title: "AI Error", description: "Failed to generate weather prompt.", variant: "destructive" });
    } finally {
      if (isDialogControl) {
        setIsLoadingDialogWeatherPrompt(false);
      } else {
        setIsLoadingWeatherPrompt(false);
      }
    }
  }, [toast, updateSessionCost]);


  const handleMapClick = useCallback((latLng: google.maps.LatLngLiteral) => {
    setCurrentMapCenter(latLng);
    setMarkerPosition(latLng);
    const coordString = `coords:${latLng.lat},${latLng.lng}`;
    setLocationForStreetView(coordString); 

    if (!googleMapsApiLoaded || typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.Geocoder) {
      fetchLocationInformation(coordString, latLng); 
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      updateSessionCost('geocodingRequests', ESTIMATED_COSTS.GEOCODING_REQUEST); // Reverse geocoding
      let locationNameForInfo = coordString; 
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        locationNameForInfo = results[0].formatted_address || coordString;
      } else {
        console.warn("Reverse geocoding failed for map click, using raw coords for info:", status);
      }
      fetchLocationInformation(locationNameForInfo, latLng);
    });
  }, [googleMapsApiLoaded, fetchLocationInformation, updateSessionCost]);

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
            toast({ title: "Download Failed", description: "Could not create drawing context for watermark.", variant: "destructive"});
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
          toast({ title: "Image Downloading", description: "Your watermarked cinematic shot is being downloaded."});
        };
  
        image.onerror = () => {
           toast({ title: "Download Failed", description: "Could not load image for watermarking. Check browser console for CORS issues if image is from Replicate.", variant: "destructive"});
        }
  
      } catch (error) {
        console.error("Error during image watermarking and download:", error);
        toast({ title: "Download Failed", description: "An error occurred while preparing the image for download.", variant: "destructive"});
      }
    } else {
      toast({ title: "Download Failed", description: "No image available to download.", variant: "destructive"});
    }
  }, [generatedCinematicImage, toast]);
  
  const handleGenerate360Image = useCallback(() => {
     toast({
      title: "360 Image Generation (Conceptual)",
      description: "Generating 360-degree equirectangular images for VR is an advanced feature planned for future updates. It would likely require a specialized AI model and a dedicated Genkit flow.",
      duration: 10000,
    });
  }, [toast]);

  const handleViewIn360VR = useCallback(() => {
    toast({
      title: "View in 360/VR (Conceptual)",
      description: "Displaying the image in a 360/VR viewer is planned for when 360 image generation is available. This would involve integrating a VR-capable image viewer component.",
      duration: 10000,
    });
  }, [toast]);


  const handleFilmingLocationSelect = useCallback((location: FilmingLocation) => {
    setSearchInput(location.address || location.locationName);
    setLocationForStreetView(location.address || location.locationName);
    setCurrentMapCenter(location.coordinates);
    setMarkerPosition(location.coordinates);
    setCurrentMapZoom(15);
    setCurrentDisplayMode('map');
    fetchLocationInformation(location.locationName, location.coordinates);
    toast({ title: "Location Set", description: `${location.movieTitle} - ${location.locationName} loaded.`, variant: "default" });
  }, [fetchLocationInformation, toast]);

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
        libraries: ['maps', 'marker', 'streetView', 'geocoding', 'places'], 
      });
      loader.load().then(() => {
        setGoogleMapsApiLoaded(true);
      }).catch(e => {
        console.error("Error loading Google Maps API:", e);
        toast({ title: "API Load Error", description: `Failed to load Google Maps API: ${e.message || 'Unknown error'}`, variant: "destructive"});
      });
    } else {
      console.warn("Google Maps API Key is not configured or is invalid. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
      toast({
        title: "Google Maps API Key Configuration Critical",
        description: (
          <div>
            <p className="font-semibold">Street View, Map &amp; Autocomplete WILL FAIL without proper API setup.</p>
            <p className="mt-2">Please ensure the following for the Google Cloud Project tied to your API key:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
              <li>Your <strong>`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`</strong> in the <strong>`.env`</strong> file is correct and valid.</li>
              <li>The following APIs are <strong>ENABLED</strong> in Google Cloud Console:
                <ul className="list-disc list-inside pl-4 font-medium">
                  <li>Maps JavaScript API</li>
                  <li>Street View Static API</li>
                  <li>Places API (New)</li>
                  <li className="text-destructive"><strong>IMPORTANT for Autocomplete: The LEGACY "Places API" must ALSO be enabled. This is separate from "Places API (New)". The error "Legacy API Not Activated" directly points to this.</strong></li>
                  <li>Geocoding API (often used with Places)</li>
                </ul>
              </li>
              <li>Billing is enabled and active for your Google Cloud project.</li>
            </ol>
             <p className="mt-2 text-xs italic">The error "Legacy API Not Activated" from Google indicates the legacy "Places API" is not active. Enabling "Places API (New)" alone is often insufficient for the standard Autocomplete widget which is part of the Maps JavaScript API.</p>
             <p className="mt-2 text-xs italic">The "powered by Google" logo in Autocomplete suggestions is a mandatory branding requirement by Google and cannot be removed.</p>
          </div>
        ),
        variant: "destructive",
        duration: 30000, 
      });
    }
  }, [toast]); 

  useEffect(() => {
    if (googleMapsApiLoaded && searchInputRef.current && !autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { types: ['geocode'] }
      );
      autocomplete.setFields(['name', 'formatted_address', 'geometry']);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && (place.formatted_address || place.name) && place.geometry && place.geometry.location) {
          handleAutocompletePlaceSelected(place.formatted_address || place.name!, place.geometry.location);
        } else if (place && (place.formatted_address || place.name)) {
           handleLocationSearch(place.formatted_address || place.name!); 
        } else {
          if(searchInputRef.current?.value) {
            handleLocationSearch(searchInputRef.current.value);
          }
        }
      });
      autocompleteRef.current = autocomplete;
    }
    return () => {
      if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event && window.google.maps.event.clearInstanceListeners) {
           window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      const pacContainers = document.getElementsByClassName('pac-container');
      while (pacContainers.length > 0) {
        pacContainers[0].remove();
      }
      if (autocompleteRef.current) { 
          autocompleteRef.current = null; 
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
    base64StreetViewImage: string,
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
  
    let finalTimeOfDayToken: string;
    let finalWeatherConditionPrompt: string;

    const currentIsDialog = isGeneratedImageDialogOpen; 
  
    if (currentIsDialog) setIsLoadingDialogTimePrompt(true); else setIsLoadingTimePrompt(true);
    try {
      const timeResult = await generateTimeOfDayPrompt({ time: options.timeOfDayValue });
      updateSessionCost('geminiTextGenerations', ESTIMATED_COSTS.GEMINI_TEXT_PROMPT);
      finalTimeOfDayToken = timeResult.promptToken;
      if (currentIsDialog) setDialogGeneratedTimePrompt(finalTimeOfDayToken); else setGeneratedTimePrompt(finalTimeOfDayToken);
    } catch (e) {
      console.error("Error fetching time prompt in process:", e);
      finalTimeOfDayToken = options.timeOfDayValue >= 6 && options.timeOfDayValue < 18 ? "day" : "night"; 
      toast({ title: "AI Error", description: "Failed to get time-of-day token, using simple fallback.", variant: "destructive" });
    } finally {
      if (currentIsDialog) setIsLoadingDialogTimePrompt(false); else setIsLoadingTimePrompt(false);
    }
  
    if (options.weatherConditionValue !== 'none') {
      if (currentIsDialog) setIsLoadingDialogWeatherPrompt(true); else setIsLoadingWeatherPrompt(true);
      try {
        const weatherResult = await generateWeatherConditionPrompt({ weatherCondition: options.weatherConditionValue });
        updateSessionCost('geminiTextGenerations', ESTIMATED_COSTS.GEMINI_TEXT_PROMPT);
        finalWeatherConditionPrompt = weatherResult.prompt;
        if (currentIsDialog) setDialogGeneratedWeatherPrompt(finalWeatherConditionPrompt); else setGeneratedWeatherPrompt(finalWeatherConditionPrompt);
      } catch (e) {
        console.error("Error fetching weather prompt in process:", e);
        finalWeatherConditionPrompt = ""; 
        toast({ title: "AI Error", description: "Failed to get weather prompt, using empty.", variant: "destructive" });
      } finally {
        if (currentIsDialog) setIsLoadingDialogWeatherPrompt(false); else setIsLoadingWeatherPrompt(false);
      }
    } else {
      finalWeatherConditionPrompt = ''; 
      if (currentIsDialog) setDialogGeneratedWeatherPrompt(''); else setGeneratedWeatherPrompt('');
    }
  
    try {
      const aiInput: GenerateCinematicShotInput = {
        streetViewImageDataUri: base64StreetViewImage,
        focalLength: options.lens,
        timeOfDayToken: finalTimeOfDayToken,
        weatherConditionPrompt: finalWeatherConditionPrompt,
        sceneDescription: options.sceneDesc || (locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView),
        shotDirection: options.direction,
        modificationInstruction: options.modificationInstruction || undefined,
      };
  
      const result = await generateCinematicShot(aiInput);
      updateSessionCost('geminiImageGenerations', ESTIMATED_COSTS.GEMINI_IMAGE_GENERATION);
      if (result.generatedImageDataUri) {
        setGeneratedCinematicImage(result.generatedImageDataUri);
        setSnapshotOverlays({
            lens: options.lens,
            time: finalTimeOfDayToken,
            weather: options.weatherConditionValue !== 'none' ? options.weatherConditionValue : 'Clear',
            aspectRatio: "16:9", // Default for Gemini generation
            filter: undefined, 
        });
        setDialogTargetAspectRatio("16:9"); 
        setActiveDialogTab("refine-gemini"); 
        if (!isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(true);
        toast({ title: "Cinematic Shot Generated!", description: "AI has reimagined your scene.", variant: "default" });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error generating AI image:", error);
      setGeneratedCinematicImage(null);
      toast({
          title: "AI Generation Failed",
          description: `Could not generate AI image. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
          duration: 10000,
      });
      if (isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(false);
    } finally {
      setIsGeneratingCinematicImage(false);
    }
  };
  

  const handleSnapshot = async () => {
    if (!isStreetViewReady || !streetViewPanoramaRef.current || !googleMapsApiKey) {
      toast({ title: "Street View Not Ready", description: "Please ensure Street View is loaded for a location and API key is set.", variant: "default"});
      return;
    }

    const panorama = streetViewPanoramaRef.current;
    const panoId = panorama.getPano(); 
    const pov = panorama.getPov();
    const zoom = panorama.getZoom();

    if (!panoId || !pov || !googleMapsApiKey) {
        const reason = !panoId ? "Could not retrieve Street View Pano ID." : !pov ? "Could not retrieve Street View Point of View." : "Google Maps API Key is missing.";
        console.warn("Snapshot Error:", reason, {panoId, povExists: !!pov, googleMapsApiKeyExists: !!googleMapsApiKey});
        toast({ title: "Snapshot Error", description: `${reason} Please try re-searching the location, adjust view or check API key configuration.`, variant: "destructive" });
        return;
    }
    
    let fov = 90; 
    if (zoom !== undefined) {
      fov = Math.max(10, Math.min(120, 180 / Math.pow(2, zoom)));
    }
    const staticImageUrl = `https://maps.googleapis.com/maps/api/streetview?pano=${panoId}&size=800x450&heading=${pov.heading}&pitch=${pov.pitch}&fov=${fov}&key=${googleMapsApiKey}`;

    try {
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
      updateSessionCost('streetViewSnapshots', ESTIMATED_COSTS.STREET_VIEW_SNAPSHOT);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      
      setLastStreetViewSnapshotDataUri(base64data); 
      setModificationPrompt(""); 
      setFluxPrompt(""); 

      setDialogSelectedLens(selectedLens);
      setDialogTimeOfDay(timeOfDay);
      setDialogGeneratedTimePrompt(generatedTimePrompt); 
      setDialogWeatherCondition(weatherCondition);
      setDialogGeneratedWeatherPrompt(generatedWeatherPrompt); 
      setDialogShotDirection(shotDirection);
      setDialogTargetAspectRatio("16:9"); 
      setActiveDialogTab("refine-gemini"); 

      
      await processSnapshotAndGenerateAI(base64data, {
        lens: selectedLens,
        timeOfDayValue: timeOfDay,
        weatherConditionValue: weatherCondition,
        direction: shotDirection,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
      }); 

    } catch (error) {
      console.error("Error fetching/processing Street View snapshot:", error);
      setLastStreetViewSnapshotDataUri(null);
      toast({
          title: "Street View Snapshot Failed",
          description: `Could not fetch or process Street View image. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
          duration: 10000,
      });
      if (isGeneratedImageDialogOpen) setIsGeneratedImageDialogOpen(false);
    }
  };

  const handleRegenerateFromDialog = async () => {
    if (!lastStreetViewSnapshotDataUri) {
      toast({ title: "Regeneration Error", description: "No base Street View image available. Take a snapshot first.", variant: "destructive" });
      return;
    }
    if (isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) return;

    toast({ title: "Regenerating Shot", description: "AI is creating a new variation with dialog settings...", variant: "default" });
    await processSnapshotAndGenerateAI(lastStreetViewSnapshotDataUri, {
        lens: dialogSelectedLens,
        timeOfDayValue: dialogTimeOfDay,
        weatherConditionValue: dialogWeatherCondition,
        direction: dialogShotDirection,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
    }); 
  };

  const handleModifyAndRegenerateFromDialog = async () => {
    if (!lastStreetViewSnapshotDataUri) {
      toast({ title: "Regeneration Error", description: "No base Street View image available. Take a snapshot first.", variant: "destructive" });
      return;
    }
    if (!modificationPrompt.trim()) {
      toast({ title: "Modification Empty", description: "Please enter a modification instruction.", variant: "default" });
      return;
    }
    if (isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) return;

    toast({ title: "Modifying & Regenerating", description: "AI is applying your changes with dialog settings...", variant: "default" });
    await processSnapshotAndGenerateAI(lastStreetViewSnapshotDataUri, {
        lens: dialogSelectedLens,
        timeOfDayValue: dialogTimeOfDay,
        weatherConditionValue: dialogWeatherCondition,
        direction: dialogShotDirection,
        modificationInstruction: modificationPrompt,
        sceneDesc: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView,
    });
  };

  const handleReframeImage = async () => {
    if (!generatedCinematicImage) {
      toast({ title: "Reframing Error", description: "No generated image available to reframe.", variant: "destructive" });
      return;
    }
    if (isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) return;

    setIsReframingImage(true);
    toast({ title: "Reframing Image", description: `Attempting to reframe to ${dialogTargetAspectRatio}...`, variant: "default" });

    try {
      const reframeInput: ReframeImageInput = {
        base64ImageDataUri: generatedCinematicImage, 
        targetAspectRatio: dialogTargetAspectRatio,
        promptContext: locationForStreetView.startsWith('coords:') ? `Scene at custom coordinates for ${snapshotOverlays?.lens || 'default lens'}` : `${locationForStreetView} with ${snapshotOverlays?.lens || 'default lens'}`,
      };
      const result = await reframeImage(reframeInput);
      updateSessionCost('replicateReframes', ESTIMATED_COSTS.REPLICATE_REFRAME);

      if (result.reframedImageUrl) {
        setGeneratedCinematicImage(result.reframedImageUrl);
        setSnapshotOverlays(prev => ({
          ...prev!, 
          aspectRatio: dialogTargetAspectRatio,
          filter: prev?.filter, 
        }));
        toast({ title: "Image Reframed!", description: `Successfully reframed to ${dialogTargetAspectRatio}.`, variant: "default" });
      } else {
        throw new Error("Replicate did not return a reframed image URL.");
      }
    } catch (error) {
      console.error("Error reframing image with Replicate:", error);
      toast({
        title: "Reframing Failed",
        description: `Could not reframe image. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsReframingImage(false);
    }
  };

  const handleApplyFluxFilter = async () => {
    if (!generatedCinematicImage) {
      toast({ title: "Filter Error", description: "No generated image available to apply a filter to.", variant: "destructive" });
      return;
    }
    if (!fluxPrompt.trim()) {
      toast({ title: "Filter Prompt Empty", description: "Please enter a prompt for the artistic filter.", variant: "default" });
      return;
    }
    if (isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) return;

    setIsApplyingFluxFilter(true);
    toast({ title: "Applying Filter", description: "Applying artistic filter with Flux...", variant: "default" });

    try {
      const fluxInput: ApplyFluxFilterInput = {
        inputImageDataUri: generatedCinematicImage,
        prompt: fluxPrompt,
        outputFormat: 'png', 
      };
      const result = await applyFluxFilter(fluxInput);
      updateSessionCost('replicateFluxFilters', ESTIMATED_COSTS.REPLICATE_FLUX_FILTER);

      if (result.outputImageUrl) {
        setGeneratedCinematicImage(result.outputImageUrl);
        setSnapshotOverlays(prev => ({
          ...(prev || { lens: dialogSelectedLens, time: dialogGeneratedTimePrompt, weather: dialogWeatherCondition, aspectRatio: dialogTargetAspectRatio }), 
          filter: `Flux: ${fluxPrompt.substring(0, 30)}${fluxPrompt.length > 30 ? "..." : ""}`,
        }));
        toast({ title: "Filter Applied!", description: "Artistic filter applied successfully.", variant: "default" });
      } else {
        throw new Error("Replicate (Flux) did not return a modified image URL.");
      }
    } catch (error) {
      console.error("Error applying Flux filter:", error);
      toast({
        title: "Filter Application Failed",
        description: `Could not apply filter. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsApplyingFluxFilter(false);
    }
  };


  if (!isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  const anyOperationInProgress = isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter;

  return (
    <SidebarProvider defaultOpen={true}>
      {!isUiHidden && (
        <Sidebar variant="floating" collapsible="icon" side="left" className="border-none">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-semibold text-sidebar-foreground">GenScoutAI</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="w-full p-0">
                <TabsList className="grid w-full grid-cols-2 mb-2 sticky top-0 bg-sidebar z-10 p-2">
                  <TabsTrigger value="custom-search" className="text-[11px] px-1 py-1.5">
                    <Search className="w-3 h-3 mr-1" />Custom Search
                  </TabsTrigger>
                  <TabsTrigger value="famous-locations" className="text-[11px] px-1 py-1.5">
                    <Film className="w-3 h-3 mr-1" />Famous Locations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="custom-search" className="p-4 pt-0 space-y-4">
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Location</SidebarGroupLabel>
                    <SidebarGroupContent className="space-y-2 mt-2">
                      <div className="flex space-x-2">
                        <Input
                          ref={searchInputRef}
                          type="text"
                          placeholder="e.g., Eiffel Tower, Paris"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              if (autocompleteRef.current) {
                                  const pacSelectFirst = () => {
                                  const firstResult = document.querySelector(".pac-item");
                                  if (firstResult && (firstResult as HTMLElement).textContent) {
                                      (firstResult as HTMLElement).click();
                                  } else {
                                      handleLocationSearch((e.target as HTMLInputElement).value);
                                  }
                                  };
                                  setTimeout(pacSelectFirst, 150); 
                              } else {
                                  handleLocationSearch((e.target as HTMLInputElement).value);
                              }
                            }
                          }}
                          className="text-sm"
                          disabled={!googleMapsApiKey || !googleMapsApiLoaded}
                        />
                        <Button onClick={() => handleLocationSearch()} size="sm" aria-label="Search location" disabled={!googleMapsApiKey || !googleMapsApiLoaded || !searchInput.trim()}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      {locationForStreetView && !locationForStreetView.startsWith('coords:') && <p className="text-xs text-muted-foreground">Current Target: {locationForStreetView}</p>}
                      {locationForStreetView && locationForStreetView.startsWith('coords:') && <p className="text-xs text-muted-foreground">Target: Custom Coordinates</p>}
                      {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed for location features.</p>}
                     </SidebarGroupContent>
                  </SidebarGroup>

                  {isLoadingLocationInfo && (
                    <Card className="mt-0">
                      <CardHeader className="flex flex-row items-center gap-2 p-3">
                        <InfoIcon className="w-4 h-4 text-primary animate-spin" />
                        <CardTitle className="text-sm">Fetching Location Insights...</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3">
                        <div>
                          <Skeleton className="h-4 w-1/3 mb-1.5" />
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-5/6 mt-1" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-1/4 mb-1.5" />
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-1/3 mb-1.5" />
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                         <div>
                          <Skeleton className="h-4 w-1/3 mb-1.5" />
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {locationInfo && !isLoadingLocationInfo && (
                    <Card className="mt-0 bg-secondary/30">
                      <CardHeader className="flex flex-row items-center gap-2 p-3">
                        <InfoIcon className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm">Insights for {locationForStreetView.startsWith('coords:') ? 'this area' : locationForStreetView}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3 text-xs text-foreground">
                        <p>{locationInfo.summary}</p>
                        
                        <Separator className="my-2 bg-border/50"/>
                        
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-primary/80"/>Permitting Info</h4>
                          <p className="text-muted-foreground">{locationInfo.permittingInfo}</p>
                        </div>
                        
                        <Separator className="my-2 bg-border/50"/>

                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-1.5"><ParkingCircle className="w-3.5 h-3.5 text-primary/80"/>Parking Assessment</h4>
                          <p className="text-muted-foreground">{locationInfo.parkingAssessment}</p>
                        </div>

                        <Separator className="my-2 bg-border/50"/>
                        
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-primary/80"/>Logistics Feasibility</h4>
                          <p className="text-muted-foreground">{locationInfo.logisticsFeasibility}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="famous-locations" className="p-4 pt-0">
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1">
                      <DatabaseIcon className="w-3.5 h-3.5" /> Search Filming Locations
                    </SidebarGroupLabel>
                    <Input
                        type="text"
                        placeholder="Search movie, scene, location..."
                        value={filmingLocationSearchTerm}
                        onChange={(e) => setFilmingLocationSearchTerm(e.target.value)}
                        className="text-sm my-2"
                        disabled={!googleMapsApiLoaded}
                      />
                  </SidebarGroup>
                  <ScrollArea className="h-[calc(100vh-220px)] pr-2"> 
                    <div className="space-y-3">
                      {filteredFilmingLocations.length > 0 ? filteredFilmingLocations.map(loc => (
                        <Card key={loc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilmingLocationSelect(loc)}>
                          <CardHeader className="p-3">
                            <CardTitle className="text-sm font-semibold">{loc.movieTitle} <span className="text-xs font-normal text-muted-foreground">({loc.year})</span></CardTitle>
                            <CardDescription className="text-xs">{loc.locationName}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <Image
                                src={`https://placehold.co/300x150.png`}
                                alt={`${loc.movieTitle} - ${loc.locationName}`}
                                width={300}
                                height={150}
                                data-ai-hint={loc.imageHint}
                                className="w-full h-auto rounded-sm object-cover mb-2"
                              />
                            <p className="text-xs text-muted-foreground leading-tight">{loc.sceneDescription}</p>
                          </CardContent>
                        </Card>
                      )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No locations match your search.</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              <Separator className="my-4 mx-2" />
              <SidebarGroup className="px-2 pb-2">
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Usage &amp; Cost Monitoring
                </SidebarGroupLabel>
                <SidebarGroupContent className="mt-2">
                  <Alert variant="default" className="p-3">
                      <AlertTitle className="text-sm font-semibold">Monitor Your API Costs</AlertTitle>
                      <AlertDescription className="text-xs space-y-1.5 mt-1">
                          <p>This application utilizes cloud services which incur costs based on usage:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                              <li><strong>Google Cloud Platform:</strong>
                                  <ul className="list-disc list-inside pl-4">
                                      <li>Maps JavaScript API, Street View Static API, Places API, Geocoding API.</li>
                                      <li>Vertex AI (hosting Gemini models for text and image generation via Genkit).</li>
                                  </ul>
                              </li>
                              <li><strong>Replicate:</strong> For image reframing (e.g., `luma/reframe-image` model) and artistic filters (e.g., `black-forest-labs/flux-kontext-pro` model).</li>
                          </ul>
                          <p className="mt-1.5">For detailed billing, API usage metrics, and to set up <strong>budget alerts (highly recommended)</strong>, please refer to your respective cloud provider dashboards:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                              <li>
                                  Google Cloud Console: <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">console.cloud.google.com/billing</a>
                              </li>
                              <li>
                                  Replicate Dashboard: <a href="https://replicate.com/dashboard/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">replicate.com/dashboard/billing</a>
                              </li>
                          </ul>
                          <p className="mt-1.5">Estimated pricing can be found at:</p>
                           <ul className="list-disc pl-4 space-y-0.5">
                              <li>
                              Google Maps: <a href="https://cloud.google.com/maps-platform/pricing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">cloud.google.com/maps-platform/pricing</a>
                              </li>
                              <li>
                              Vertex AI (Gemini): <a href="https://cloud.google.com/vertex-ai/pricing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">cloud.google.com/vertex-ai/pricing</a>
                              </li>
                               <li>
                              Replicate Models: Pricing varies per model. Check the specific model page on Replicate.com.
                              </li>
                          </ul>
                           <p className="mt-1.5 text-xs italic">Ensure `REPLICATE_API_TOKEN` is set in your environment for Replicate features.</p>
                      </AlertDescription>
                  </Alert>
                  <Card className="mt-4 bg-background/50">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TimerIcon className="w-4 h-4" />
                        Current Session Estimated Costs
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Illustrative estimates only. Resets on page refresh.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 text-xs space-y-1">
                      <div className="flex justify-between"><span>Geocoding/Places API:</span> <span>{sessionCosts.geocodingRequests}</span></div>
                      <div className="flex justify-between"><span>Street View Static API:</span> <span>{sessionCosts.streetViewSnapshots}</span></div>
                      <div className="flex justify-between"><span>Gemini Text Generations:</span> <span>{sessionCosts.geminiTextGenerations}</span></div>
                      <div className="flex justify-between"><span>Gemini Image Generations:</span> <span>{sessionCosts.geminiImageGenerations}</span></div>
                      <div className="flex justify-between"><span>Replicate Reframes:</span> <span>{sessionCosts.replicateReframes}</span></div>
                      <div className="flex justify-between"><span>Replicate Flux Filters:</span> <span>{sessionCosts.replicateFluxFilters}</span></div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Total Estimated:</span>
                        <span>~${sessionCosts.totalEstimatedCost.toFixed(4)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-xs"
                        onClick={() => setSessionCosts(initialSessionCosts)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset Session Estimates
                      </Button>
                      <p className="text-xs text-muted-foreground pt-2 italic">
                        <strong>Disclaimer:</strong> These are highly simplified, illustrative estimates for the current browser session only and DO NOT represent actual costs or official pricing. For accurate billing information, always refer to your Google Cloud and Replicate dashboards. Prices are subject to change by the providers.
                      </p>
                    </CardContent>
                  </Card>
                </SidebarGroupContent>
              </SidebarGroup>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarTrigger className="ml-auto md:hidden">
              <Camera className="w-6 h-6" />
            </SidebarTrigger>
            <p className="text-xs text-sidebar-foreground/70 hidden md:block text-center">
              GenScoutAI &copy; {new Date().getFullYear()}
            </p>
          </SidebarFooter>
        </Sidebar>
      )}
      
      <SidebarInset 
        className={cn(
          "flex flex-col relative", 
          isUiHidden && currentDisplayMode === 'streetview' ? "p-0" : "p-2 md:p-4",
          !isUiHidden && "gap-4" 
        )}
      >
          {currentDisplayMode === 'streetview' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsUiHidden(!isUiHidden)}
                className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background rounded-full shadow-lg"
                title={isUiHidden ? "Show Controls" : "Hide Controls"}
              >
                {isUiHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
          )}

          {!isUiHidden && (
            <Card>
              <CardHeader className="pb-4 pt-4 px-4 flex-row items-center justify-between">
                <CardTitle className="text-lg">View Mode</CardTitle>
                <div className="flex gap-2">
                  <Button 
                      variant={currentDisplayMode === 'map' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setCurrentDisplayMode('map')}
                      disabled={!googleMapsApiLoaded || anyOperationInProgress}
                      className="min-w-[100px]"
                    >
                      <MapIcon className="mr-2 h-4 w-4" /> Map
                    </Button>
                     <Button 
                      variant={currentDisplayMode === 'streetview' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setCurrentDisplayMode('streetview')}
                      disabled={!googleMapsApiLoaded || !locationForStreetView || anyOperationInProgress}
                      className="min-w-[130px]"
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
                      className="min-w-[140px]"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Scene Planner
                  </Button>
                </div>
              </CardHeader>
             
              {currentDisplayMode === 'planner' && (
                 <CardContent className="p-4 pt-0 border-t">
                  <div className="flex justify-between items-center pt-4">
                    <Label className="text-base font-semibold">Planner Options</Label>
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
                  <p className="text-xs text-muted-foreground mt-3">
                    Use this mode to plan your shots. Interactive annotation tools (shapes, text, icons for production elements) are planned for a future update. For now, please use screen capture to save your layouts and annotate with external image editing software.
                  </p>
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
                      {isGeneratingCinematicImage && !generatedCinematicImage && lastStreetViewSnapshotDataUri ? ( 
                        <>
                          <ImageIcon className="w-4 h-4 mr-2 animate-spin" /> Taking Snapshot...
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
              "relative",
              isUiHidden && currentDisplayMode === 'streetview'
                ? "fixed inset-0 z-0 w-screen h-screen" 
                : "flex-grow min-h-[300px] sm:min-h-[400px] md:min-h-0" 
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
                apiKey={googleMapsApiKey}
                isApiLoaded={googleMapsApiLoaded}
                center={currentMapCenter}
                zoom={currentMapZoom}
                markerPos={markerPosition}
                onMapClick={handleMapClick}
                mapTypeId={plannerViewType === 'satellite' ? 'satellite' : 'roadmap'}
                customStyles={plannerViewType === 'schematic' ? schematicMapStyles : undefined}
                enableTilt={plannerViewType === 'satellite'}
              />
            )}
          </div>
      </SidebarInset>

      <Dialog open={isGeneratedImageDialogOpen} onOpenChange={(open) => {
          if (anyOperationInProgress && !open) return; 
          setIsGeneratedImageDialogOpen(open);
          if (!open) setActiveDialogTab("refine-gemini"); 
      }}>
        <DialogContent className="max-w-3xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Generated Cinematic Shot</DialogTitle>
            <DialogDescription>
              AI-reimagined scene. Adjust parameters, reframe, or apply filters.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div className="p-4 space-y-4">
                {(isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) && !generatedCinematicImage && ( 
                    <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
                        <Skeleton className="w-full h-full rounded-lg" />
                        <p className="absolute text-foreground">
                          {isGeneratingCinematicImage ? 'Generating AI Image...' : isReframingImage ? 'Reframing Image...' : 'Applying Filter...'}
                        </p>
                    </div>
                )}
                {(isGeneratingCinematicImage || isReframingImage || isApplyingFluxFilter) && generatedCinematicImage && ( 
                    <div className="relative">
                    <Image
                            key={generatedCinematicImage + "-loading"} 
                            src={generatedCinematicImage}
                            alt="Previous AI Cinematic Shot / Being modified"
                            width={800}
                            height={450}
                            data-ai-hint="cinematic outdoor"
                            className="object-contain rounded-lg w-full h-auto opacity-50"
                            unoptimized={generatedCinematicImage.startsWith('http')} 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                            <ImageIcon className="w-12 h-12 text-white animate-pulse" />
                            <p className="ml-2 text-white">
                              {isGeneratingCinematicImage ? 'Applying modifications...' : isReframingImage ? 'Applying reframe...' : 'Applying filter...'}
                            </p>
                        </div>
                    </div>
                )}
                {!isGeneratingCinematicImage && !isReframingImage && !isApplyingFluxFilter && generatedCinematicImage && (
                <div className="relative">
                    <Image
                    key={generatedCinematicImage} 
                    src={generatedCinematicImage}
                    alt="AI Cinematic Shot"
                    width={800}
                    height={450}
                    data-ai-hint="cinematic outdoor"
                    className="object-contain rounded-lg w-full h-auto"
                    priority
                    unoptimized={generatedCinematicImage.startsWith('http')} 
                    />
                    {snapshotOverlays && (
                    <>
                        <div className="absolute bottom-4 left-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm backdrop-blur-sm">
                        <p className="font-semibold">GenScoutAI</p>
                        {snapshotOverlays.lens && <p>Lens: {snapshotOverlays.lens}</p>}
                        {snapshotOverlays.aspectRatio && <p>AR: {snapshotOverlays.aspectRatio}</p>}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm text-right backdrop-blur-sm">
                        {snapshotOverlays.time && <p>Time: {snapshotOverlays.time}</p>}
                        {snapshotOverlays.weather && <p>Weather: {snapshotOverlays.weather}</p>}
                        {snapshotOverlays.filter && <p className="mt-1 text-primary/90 italic">{snapshotOverlays.filter}</p>}
                        </div>
                    </>
                    )}
                </div>
                )}
                {!isGeneratingCinematicImage && !isReframingImage && !isApplyingFluxFilter && !generatedCinematicImage && ( 
                    <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted rounded-lg">
                        <ImageIcon className="w-16 h-16 text-primary/50" />
                        <p className="ml-2 text-muted-foreground">No image generated yet.</p>
                    </div>
                )}

                <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="w-full pt-4 border-t">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="refine-gemini" disabled={anyOperationInProgress}>Refine (Gemini)</TabsTrigger>
                    <TabsTrigger value="reframe" disabled={anyOperationInProgress || !generatedCinematicImage}>Reframe</TabsTrigger>
                    <TabsTrigger value="filter-flux" disabled={anyOperationInProgress || !generatedCinematicImage}>Filter (Flux)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="refine-gemini" className="mt-4 space-y-4">
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
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="modification-prompt" className="flex items-center gap-1.5">
                        <MessageSquarePlus className="w-4 h-4" />
                        Text Modification (Gemini)
                        </Label>
                        <Textarea
                        id="modification-prompt"
                        placeholder="e.g., make it snowy, add dramatic clouds (uses original Street View as base)"
                        value={modificationPrompt}
                        onChange={(e) => setModificationPrompt(e.target.value)}
                        className="text-sm"
                        rows={2}
                        disabled={anyOperationInProgress}
                        />
                        <p className="text-xs text-muted-foreground">
                        Note: Modifies the original scene with these text instructions & current parameters. Character/prop uploads not supported by this model.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-2">
                        <Button variant="outline" onClick={handleRegenerateFromDialog} disabled={!lastStreetViewSnapshotDataUri || anyOperationInProgress}>
                          <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingCinematicImage && !modificationPrompt.trim() && !isReframingImage && !isApplyingFluxFilter ? 'animate-spin' : ''}`} />
                          Regenerate (16:9)
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={handleModifyAndRegenerateFromDialog} 
                          disabled={!lastStreetViewSnapshotDataUri || anyOperationInProgress || !modificationPrompt.trim()}
                        >
                          <Sparkles className={`mr-2 h-4 w-4 ${isGeneratingCinematicImage && modificationPrompt.trim() && !isReframingImage && !isApplyingFluxFilter ? 'animate-spin' : ''}`} />
                          Modify & Regenerate (16:9)
                        </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="reframe" className="mt-4 space-y-4">
                     <div>
                        <Label htmlFor="dialog-aspect-ratio" className="flex items-center gap-2 text-sm mb-1">
                            <AspectRatio className="w-4 h-4" /> Target Aspect Ratio
                        </Label>
                        <Select value={dialogTargetAspectRatio} onValueChange={setDialogTargetAspectRatio} disabled={anyOperationInProgress || !generatedCinematicImage}>
                            <SelectTrigger id="dialog-aspect-ratio" className="w-full text-sm">
                                <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {aspectRatioOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={handleReframeImage} disabled={!generatedCinematicImage || anyOperationInProgress}>
                      <AspectRatio className={`mr-2 h-4 w-4 ${isReframingImage ? 'animate-spin' : ''}`} />
                      Reframe to {dialogTargetAspectRatio}
                    </Button>
                  </TabsContent>

                  <TabsContent value="filter-flux" className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="flux-prompt" className="flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4" />
                        Artistic Filter Prompt (Flux)
                        </Label>
                        <Textarea
                        id="flux-prompt"
                        placeholder="e.g., Make this a 90s cartoon, apply vintage film look, cinematic lighting (modifies current image)"
                        value={fluxPrompt}
                        onChange={(e) => setFluxPrompt(e.target.value)}
                        className="text-sm"
                        rows={2}
                        disabled={anyOperationInProgress || !generatedCinematicImage}
                        />
                        <p className="text-xs text-muted-foreground">
                        Applies a filter/style to the *currently displayed image* using the Flux model.
                        </p>
                    </div>
                     <Button variant="outline" onClick={handleApplyFluxFilter} disabled={!generatedCinematicImage || anyOperationInProgress || !fluxPrompt.trim()}>
                      <Wand2 className={`mr-2 h-4 w-4 ${isApplyingFluxFilter ? 'animate-spin' : ''}`} />
                      Apply Filter
                    </Button>
                  </TabsContent>
                </Tabs>
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t flex flex-col sm:flex-row sm:justify-between">
            <div className="flex gap-2 mb-2 sm:mb-0 flex-wrap">
                <Button variant="outline" onClick={handleDownloadImage} disabled={!generatedCinematicImage || anyOperationInProgress}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleViewIn360VR} disabled={!generatedCinematicImage || anyOperationInProgress}>
                  <Orbit className="mr-2 h-4 w-4" />
                  View in 360/VR
                </Button>
            </div>
            <DialogClose asChild>
                <Button variant="secondary" disabled={anyOperationInProgress}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

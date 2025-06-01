
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Camera, Search, Sun, CloudRain, CloudFog, Snowflake, Bot, Focus, ImageIcon, Film, Download, Sparkles, MapIcon, EyeIcon } from 'lucide-react';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { generateCinematicShot, type GenerateCinematicShotInput } from '@/ai/flows/generate-cinematic-shot-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import StreetViewDisplay from './StreetViewDisplay';
import MapViewDisplay from './MapViewDisplay';

export default function GenScoutAIClient() {
  const { toast } = useToast();
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [googleMapsApiLoaded, setGoogleMapsApiLoaded] = useState(false);

  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isStreetViewReady, setIsStreetViewReady] = useState(false);

  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [locationForStreetView, setLocationForStreetView] = useState<string>('');

  const [selectedLens, setSelectedLens] = useState<string>('50mm');

  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [generatedTimePrompt, setGeneratedTimePrompt] = useState<string>('noon');
  const [isLoadingTimePrompt, setIsLoadingTimePrompt] = useState<boolean>(false);

  const [weatherCondition, setWeatherCondition] = useState<string>('none');
  const [generatedWeatherPrompt, setGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingWeatherPrompt, setIsLoadingWeatherPrompt] = useState<boolean>(false);

  const shotDirectionOptions = [
    { value: 'eye-level default', label: 'Eye-level View (Default)' },
    { value: 'low angle looking up', label: 'Low Angle, Looking Up' },
    { value: 'high angle looking down', label: 'High Angle, Looking Down' },
    { value: 'wide establishing shot', label: 'Wide Establishing Shot' },
    { value: 'dutch angle', label: 'Dutch Angle / Canted View' },
    { value: 'worm-s eye view', label: "Worm's-eye View" },
    { value: 'bird-s eye view', label: "Bird's-eye View (from street level)" },
  ];
  const [shotDirection, setShotDirection] = useState<string>(shotDirectionOptions[0].value);

  const [generatedCinematicImage, setGeneratedCinematicImage] = useState<string | null>(null);
  const [isGeneratingCinematicImage, setIsGeneratingCinematicImage] = useState<boolean>(false);
  const [isGeneratedImageDialogOpen, setIsGeneratedImageDialogOpen] = useState<boolean>(false);
  const [snapshotOverlays, setSnapshotOverlays] = useState<{lens: string; time: string; weather: string} | null>(null);

  const cameraLenses = ["16mm", "24mm", "35mm", "50mm", "85mm", "135mm"];

  // Map View State
  const [viewMode, setViewMode] = useState<'map' | 'streetview'>('map');
  const [currentMapCenter, setCurrentMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 34.0522, lng: -118.2437 }); // Default to Los Angeles
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(8);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);


  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER" && apiKey.length > 10) { 
      setGoogleMapsApiKey(apiKey);
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['geocoding', 'streetView', 'places'], // Ensure all needed libraries are loaded
      });
      loader.load().then(() => {
        setGoogleMapsApiLoaded(true);
      }).catch(e => {
        console.error("Error loading Google Maps API:", e);
        toast({ title: "API Load Error", description: `Failed to load Google Maps API: ${e.message}`, variant: "destructive"});
      });
    } else {
      console.warn("Google Maps API Key is not configured or is invalid. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
      toast({
        title: "Google Maps API Key Configuration Critical",
        description: (
          <div>
            <p className="font-semibold">Street View, Map & Autocomplete WILL FAIL without proper API setup.</p>
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

  const handleAutocompletePlaceSelected = useCallback((placeName: string, placeGeometry?: google.maps.LatLng | null) => {
    setSearchInput(placeName);
    setLocationForStreetView(placeName); // This will be used if user switches to street view
    if (placeGeometry) {
      setCurrentMapCenter(placeGeometry.toJSON());
      setMarkerPosition(placeGeometry.toJSON());
      setCurrentMapZoom(15); // Zoom in on the selected place
    }
    setViewMode('map'); // Ensure map is visible after autocomplete selection
  }, []);
  
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
           handleLocationSearch(place.formatted_address || place.name!); // Fallback if geometry is missing
        }
      });
      autocompleteRef.current = autocomplete;
    }
    // Cleanup autocomplete listeners on component unmount
    return () => {
      if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleMapsApiLoaded, handleAutocompletePlaceSelected]);


  const handleStreetViewStatusChange = useCallback((status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => {
    if (status === 'OK') {
      setIsStreetViewReady(true);
    } else {
      setIsStreetViewReady(false);
      if (message) {
        toast({ title: "Street View Info", description: message, variant: status === 'ERROR' || status === 'ZERO_RESULTS' ? "destructive" : "default" });
      }
    }
  }, [toast]);


  const handleTimeOfDayChange = useCallback(async (value: number) => {
    setTimeOfDay(value);
    setIsLoadingTimePrompt(true);
    try {
      const input: GenerateTimeOfDayPromptInput = { time: value };
      const result = await generateTimeOfDayPrompt(input);
      setGeneratedTimePrompt(result.promptToken);
    } catch (error) {
      console.error("Error generating time of day prompt:", error);
      setGeneratedTimePrompt('Error');
      toast({ title: "AI Error", description: "Failed to generate time-of-day token.", variant: "destructive" });
    } finally {
      setIsLoadingTimePrompt(false);
    }
  }, [toast]);

  const handleWeatherConditionChange = useCallback(async (value: string) => {
    if (!value || value === "none") {
      setWeatherCondition('none');
      setGeneratedWeatherPrompt('');
      return;
    }
    setWeatherCondition(value);
    setIsLoadingWeatherPrompt(true);
    try {
      const input: GenerateWeatherConditionInput = { weatherCondition: value };
      const result = await generateWeatherConditionPrompt(input);
      setGeneratedWeatherPrompt(result.prompt);
    } catch (error)
     {
      console.error("Error generating weather condition prompt:", error);
      setGeneratedWeatherPrompt('Error');
      toast({ title: "AI Error", description: "Failed to generate weather prompt.", variant: "destructive" });
    } finally {
      setIsLoadingWeatherPrompt(false);
    }
  }, [toast]);

  useEffect(() => {
    handleTimeOfDayChange(timeOfDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSearch = useCallback((query?: string) => {
    const effectiveQuery = query || searchInput;
    if (!effectiveQuery.trim()) {
      toast({ title: "Search Empty", description: "Please enter a location to search.", variant: "default" });
      return;
    }

    if (!googleMapsApiLoaded || typeof window.google === 'undefined') {
        toast({ title: "API Not Ready", description: "Google Maps API is not loaded yet.", variant: "default" });
        return;
    }
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: effectiveQuery }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
            setLocationForStreetView(effectiveQuery); // Set for potential switch to Street View
            setCurrentMapCenter(results[0].geometry.location.toJSON());
            setMarkerPosition(results[0].geometry.location.toJSON());
            setCurrentMapZoom(15); // Zoom into the searched location
            setViewMode('map'); // Ensure map is shown
            if (query) setSearchInput(query); // Update search input if called with a query (e.g. from autocomplete fallback)
        } else {
            let userMessage = `Geocoding failed: ${status}`;
            if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
                userMessage = `Could not find location: "${effectiveQuery}". Please try a different or more specific search term.`;
            } // ... (other error messages as before)
            toast({ title: "Geocoding Error", description: userMessage, variant: "destructive" });
            setMarkerPosition(null); // Clear marker if geocoding fails
        }
    });
  }, [searchInput, googleMapsApiLoaded, toast]);


  const handleMapClick = useCallback((latLng: google.maps.LatLngLiteral) => {
    setCurrentMapCenter(latLng);
    setMarkerPosition(latLng);
    // Convert latLng to a string format suitable for StreetViewDisplay
    setLocationForStreetView(`coords:${latLng.lat},${latLng.lng}`);
    setViewMode('streetview');
  }, []);


  const processSnapshot = async (panoId: string, pov: google.maps.StreetViewPov, zoom: number | undefined, currentApiKey: string) => {
    const heading = pov.heading;
    const pitch = pov.pitch;
    let fov = 90; 
    if (zoom !== undefined) {
      fov = Math.max(10, Math.min(120, 180 / Math.pow(2, zoom)));
    }

    const staticImageUrl = `https://maps.googleapis.com/maps/api/streetview?pano=${panoId}&size=800x450&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${currentApiKey}`;

    try {
      const response = await fetch(staticImageUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Static Street View API Error Response:", errorText);
        let friendlyError = `Static Street View API request failed: ${response.status} ${response.statusText}`;
        if (response.status === 403) {
            friendlyError = "A 403 error often means the 'Street View Static API' is not enabled for your API key, or there's a billing issue. Please check your Google Cloud Console.";
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

      const aiInput: GenerateCinematicShotInput = {
        streetViewImageDataUri: base64data,
        focalLength: selectedLens,
        timeOfDayToken: generatedTimePrompt || 'noon',
        weatherConditionPrompt: generatedWeatherPrompt || 'clear sky',
        sceneDescription: locationForStreetView.startsWith('coords:') ? 'Custom coordinates' : locationForStreetView, // Use actual location query for description
        shotDirection: shotDirection,
      };

      const result = await generateCinematicShot(aiInput);
      if (result.generatedImageDataUri) {
        setGeneratedCinematicImage(result.generatedImageDataUri);
        setSnapshotOverlays({
            lens: selectedLens,
            time: generatedTimePrompt,
            weather: weatherCondition !== 'none' ? weatherCondition : 'Clear'
        });
        setIsGeneratedImageDialogOpen(true);
        toast({ title: "Cinematic Shot Generated!", description: "AI has reimagined your scene.", variant: "default" });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error processing snapshot or generating AI image:", error);
      setGeneratedCinematicImage(null);
      toast({
          title: "Snapshot Failed",
          description: `Could not process Street View or generate AI image. ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
          duration: 10000,
      });
    } finally {
      setIsGeneratingCinematicImage(false);
    }
  };


  const handleSnapshot = async () => {
    if (!isStreetViewReady || !streetViewPanoramaRef.current || !googleMapsApiKey) {
      toast({ title: "Street View Not Ready", description: "Please ensure Street View is loaded for a location and API key is set.", variant: "default"});
      return;
    }
    setIsGeneratingCinematicImage(true);

    const panorama = streetViewPanoramaRef.current;
    const panoId = panorama.getPano(); 
    const pov = panorama.getPov();
    const zoom = panorama.getZoom();


    if (panoId && pov && googleMapsApiKey) { 
        await processSnapshot(panoId, pov, zoom, googleMapsApiKey);
    } else {
        const reason = !panoId ? "Could not retrieve Street View Pano ID." : !pov ? "Could not retrieve Street View Point of View." : "Google Maps API Key is missing.";
        console.warn("Snapshot Error:", reason, {panoId, povExists: !!pov, googleMapsApiKeyExists: !!googleMapsApiKey});
        toast({ title: "Snapshot Error", description: `${reason} Please try re-searching the location, adjust view or check API key configuration.`, variant: "destructive" });
        setIsGeneratingCinematicImage(false);
    }
  };

  const handleDownloadImage = useCallback(() => {
    if (generatedCinematicImage) {
      const link = document.createElement('a');
      link.href = generatedCinematicImage;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `genscoutai-cinematic-shot-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Image Downloading", description: "Your cinematic shot is being downloaded."});
    } else {
      toast({ title: "Download Failed", description: "No image available to download.", variant: "destructive"});
    }
  }, [generatedCinematicImage, toast]);

  const handleEnhanceQuality = useCallback(() => {
    toast({
      title: "Enhance Quality (Conceptual)",
      description: "This feature to generate a higher resolution or enhanced quality image is planned. The current AI model (Gemini 2.0 Flash) may not directly support different quality/resolution tiers via simple parameters. A more advanced model or a different Genkit flow might be required for this in future updates.",
      duration: 10000,
    });
  }, [toast]);


  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="floating" collapsible="icon" side="left" className="border-none">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground">GenScoutAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
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
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                      className="text-sm"
                      disabled={!googleMapsApiKey || !googleMapsApiLoaded}
                    />
                    <Button onClick={() => handleLocationSearch()} size="sm" aria-label="Search location" disabled={!googleMapsApiKey || !googleMapsApiLoaded}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {locationForStreetView && !locationForStreetView.startsWith('coords:') && <p className="text-xs text-muted-foreground">Current Target: {locationForStreetView}</p>}
                  {locationForStreetView && locationForStreetView.startsWith('coords:') && <p className="text-xs text-muted-foreground">Target: Custom Coordinates</p>}
                   {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed for location features.</p>}
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Cinematic Controls</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="camera-lens" className="flex items-center gap-2 text-sm mb-1">
                      <Focus className="w-4 h-4" /> Camera Lens
                    </Label>
                    <Select value={selectedLens} onValueChange={(value) => { setSelectedLens(value); }}>
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

                  <div>
                    <Label htmlFor="time-of-day" className="flex items-center gap-2 text-sm mb-1">
                      <Sun className="w-4 h-4" /> Time of Day ({timeOfDay}:00)
                    </Label>
                    <Slider
                      id="time-of-day"
                      min={0}
                      max={23}
                      step={1}
                      value={[timeOfDay]}
                      onValueChange={(value) => handleTimeOfDayChange(value[0])}
                      className="my-2"
                    />
                    {isLoadingTimePrompt && <p className="text-xs text-muted-foreground italic">Updating AI token...</p>}
                    {generatedTimePrompt && !isLoadingTimePrompt && (
                      <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs">
                        <span className="font-semibold">AI Time Token:</span> {generatedTimePrompt}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="weather-condition" className="flex items-center gap-2 text-sm mb-1">
                       <Bot className="w-4 h-4" /> Weather Condition
                    </Label>
                    <Select value={weatherCondition} onValueChange={handleWeatherConditionChange}>
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
                    {isLoadingWeatherPrompt && <p className="text-xs text-muted-foreground italic mt-1">Updating AI prompt...</p>}
                    {generatedWeatherPrompt && !isLoadingWeatherPrompt && (
                       <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs">
                        <span className="font-semibold">AI Weather Prompt:</span> {generatedWeatherPrompt}
                      </div>
                    )}
                  </div>

                   <div>
                    <Label htmlFor="shot-direction" className="flex items-center gap-2 text-sm mb-1">
                      <Film className="w-4 h-4" /> Shot Direction
                    </Label>
                    <Select value={shotDirection} onValueChange={(value) => {setShotDirection(value);}}>
                      <SelectTrigger id="shot-direction" className="w-full text-sm">
                        <SelectValue placeholder="Select shot direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {shotDirectionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Guides the AI's framing of the scene.</p>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-sm"
                    onClick={handleSnapshot}
                    disabled={isGeneratingCinematicImage || !isStreetViewReady || !googleMapsApiKey || viewMode !== 'streetview'}
                  >
                    {isGeneratingCinematicImage ? (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" /> Take Cinematic Snapshot
                      </>
                    )}
                  </Button>
                   {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed to take snapshots.</p>}
                   {googleMapsApiKey && viewMode === 'streetview' && !isStreetViewReady && locationForStreetView && <p className="text-xs text-destructive mt-1">Street View not available or not loaded for the current location.</p>}
                   {viewMode === 'map' && <p className="text-xs text-muted-foreground mt-1">Switch to Street View to take a snapshot.</p>}
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
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
      <SidebarInset className="p-2 md:p-4 flex flex-col">
          <div className="mb-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode(viewMode === 'map' ? 'streetview' : 'map')}
              disabled={!googleMapsApiLoaded || (viewMode === 'map' && !locationForStreetView)}
            >
              {viewMode === 'map' ? <EyeIcon className="mr-2 h-4 w-4" /> : <MapIcon className="mr-2 h-4 w-4" />}
              {viewMode === 'map' ? 'Show Street View' : 'Show Map View'}
            </Button>
          </div>
          <div className="flex-grow">
            {!googleMapsApiLoaded && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
                    <MapIcon className="w-16 h-16 text-primary animate-pulse" />
                    <p className="ml-2 text-foreground">Loading Map API...</p>
                </div>
            )}
            {googleMapsApiLoaded && viewMode === 'map' && (
              <MapViewDisplay
                apiKey={googleMapsApiKey}
                center={currentMapCenter}
                zoom={currentMapZoom}
                markerPos={markerPosition}
                onMapClick={handleMapClick}
              />
            )}
            {googleMapsApiLoaded && viewMode === 'streetview' && (
              <StreetViewDisplay
                locationToLoad={locationForStreetView}
                apiKey={googleMapsApiKey}
                streetViewPanoramaRef={streetViewPanoramaRef}
                onStreetViewStatusChange={handleStreetViewStatusChange}
              />
            )}
          </div>
      </SidebarInset>

      <Dialog open={isGeneratedImageDialogOpen} onOpenChange={setIsGeneratedImageDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Generated Cinematic Shot</DialogTitle>
            <DialogDescription>
              AI-reimagined scene based on your selections.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {isGeneratingCinematicImage && !generatedCinematicImage && (
                <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
                    <Skeleton className="w-full h-full rounded-lg" />
                </div>
            )}
            {generatedCinematicImage && (
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
                />
                {snapshotOverlays && (
                  <>
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm backdrop-blur-sm">
                      <p className="font-semibold">GenScoutAI</p>
                      <p>Lens: {snapshotOverlays.lens}</p>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded text-xs md:text-sm text-right backdrop-blur-sm">
                      <p>Time: {snapshotOverlays.time}</p>
                      <p>Weather: {snapshotOverlays.weather}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t flex sm:justify-between">
            <div className="flex gap-2 mb-2 sm:mb-0">
              <Button variant="outline" onClick={handleDownloadImage} disabled={!generatedCinematicImage || isGeneratingCinematicImage}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
               <Button variant="outline" onClick={handleEnhanceQuality} disabled={!generatedCinematicImage || isGeneratingCinematicImage}>
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance Quality
              </Button>
            </div>
            <DialogClose asChild>
              <Button variant="default">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

    
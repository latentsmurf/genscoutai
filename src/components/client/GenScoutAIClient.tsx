
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
import { Camera, Search, Sun, CloudRain, CloudFog, Snowflake, Bot, Focus, ImageIcon, Film } from 'lucide-react';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { generateCinematicShot, type GenerateCinematicShotInput } from '@/ai/flows/generate-cinematic-shot-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface StreetViewDisplayProps {
  locationQuery: string;
  generatedImage?: string | null;
  overlays?: { lens: string; time: string; weather: string };
  apiKey: string | null;
  streetViewPanoramaRef: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  streetViewContainerRef: React.RefObject<HTMLDivElement>;
  onStreetViewStatusChange: (status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>; // For Autocomplete
  onAutocompletePlaceSelected: (placeName: string) => void; // Callback for Autocomplete
}

const StreetViewDisplay: React.FC<StreetViewDisplayProps> = ({
  locationQuery,
  generatedImage,
  overlays,
  apiKey,
  streetViewPanoramaRef,
  streetViewContainerRef,
  onStreetViewStatusChange,
  searchInputRef,
  onAutocompletePlaceSelected,
}) => {
  const [isLoadingStreetView, setIsLoadingStreetView] = useState(false);
  const [streetViewUnavailable, setStreetViewUnavailable] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);


  useEffect(() => {
    if (generatedImage || !apiKey || !streetViewContainerRef.current) {
      if (streetViewPanoramaRef.current) {
         streetViewPanoramaRef.current.setVisible(false);
      }
      return;
    }
    
    if (!locationQuery && !generatedImage) { // Don't clear if showing generated image
      if (streetViewPanoramaRef.current) {
         streetViewPanoramaRef.current.setVisible(false);
      }
      if (streetViewContainerRef.current) {
        streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Search for a location to see Street View.</p>';
      }
      setStreetViewUnavailable(false);
      return;
    }

    setIsLoadingStreetView(true);
    setStreetViewUnavailable(false);
    if (streetViewContainerRef.current) {
       streetViewContainerRef.current.innerHTML = ''; // Clear previous messages
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['geocoding', 'streetView', 'places'], // Added 'places'
    });

    loader.load().then(async (google) => {
      // Initialize Autocomplete
      if (google.maps.places && searchInputRef.current && !autocompleteRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(
          searchInputRef.current,
          { types: ['geocode'] } // You can customize types: ['address'], ['(cities)'], etc.
        );
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && (place.formatted_address || place.name)) {
            onAutocompletePlaceSelected(place.formatted_address || place.name!);
          }
        });
        autocompleteRef.current = autocomplete;
      }

      if (!locationQuery) { // If locationQuery became empty after API load (e.g. initial load)
        setIsLoadingStreetView(false);
        if (streetViewContainerRef.current) {
            streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Search for a location to see Street View.</p>';
        }
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: locationQuery }, (results, status) => {
        setIsLoadingStreetView(false);
        if (status === google.maps.GeocoderStatus.OK && results && results[0] && streetViewContainerRef.current) {
          const streetViewService = new google.maps.StreetViewService();
          streetViewService.getPanorama({ location: results[0].geometry.location, radius: 50 }, (data, svStatus) => {
            if (svStatus === google.maps.StreetViewStatus.OK) {
              setStreetViewUnavailable(false);
              onStreetViewStatusChange('OK');
              if (streetViewPanoramaRef.current) {
                streetViewPanoramaRef.current.setPosition(results[0].geometry.location);
                streetViewPanoramaRef.current.setVisible(true);
              } else {
                streetViewPanoramaRef.current = new google.maps.StreetViewPanorama(
                  streetViewContainerRef.current!,
                  {
                    position: results[0].geometry.location,
                    pov: { heading: 165, pitch: 0 },
                    zoom: 1,
                    visible: true,
                    addressControl: false,
                    linksControl: true,
                    panControl: true,
                    enableCloseButton: false,
                    fullscreenControl: false,
                    motionTracking: false,
                    motionTrackingControl: false,
                  }
                );
              }
            } else {
              setStreetViewUnavailable(true);
              onStreetViewStatusChange('ZERO_RESULTS', `Street View not available for this location.`);
              if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
              if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-muted-foreground">Street View not available for this location.</p>';
            }
          });
        } else {
          setStreetViewUnavailable(true);
          onStreetViewStatusChange('ERROR', `Geocoding failed: ${status}`);
          if (streetViewPanoramaRef.current) streetViewPanoramaRef.current.setVisible(false);
          if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = `<p class="text-center p-4 text-destructive">Could not find location: ${locationQuery}.</p>`;
        }
      });
    }).catch(e => {
      setIsLoadingStreetView(false);
      setStreetViewUnavailable(true);
      onStreetViewStatusChange('ERROR', `Error loading Google Maps API: ${e.message}`);
      console.error("Error loading Google Maps API:", e);
       if (streetViewContainerRef.current) streetViewContainerRef.current.innerHTML = '<p class="text-center p-4 text-destructive">Error loading Google Maps.</p>';
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationQuery, apiKey, generatedImage]); // Ensure searchInputRef, onAutocompletePlaceSelected are stable or correctly handled if they change

  useEffect(() => {
    // Cleanup Autocomplete listener if the component unmounts or API key changes
    return () => {
      if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey]);


  if (generatedImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
        <Image
          key={generatedImage}
          src={generatedImage}
          alt="AI Cinematic Shot"
          width={800}
          height={600}
          data-ai-hint="cinematic outdoor"
          className="object-contain rounded-lg w-full h-auto max-h-[calc(100vh-12rem)]"
          priority
        />
        {overlays && (
          <>
            <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded text-xs md:text-sm">
              <p>GenScoutAI</p>
              <p>Lens: {overlays.lens}</p>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded text-xs md:text-sm text-right">
              <p>Time: {overlays.time}</p>
              <p>Weather: {overlays.weather}</p>
            </div>
          </>
        )}
      </div>
    );
  }
  
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


export default function GenScoutAIClient() {
  const { toast } = useToast();
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  const streetViewContainerRef = useRef<HTMLDivElement>(null);
  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isStreetViewReady, setIsStreetViewReady] = useState(false);

  const [locationQuery, setLocationQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for Autocomplete

  const [selectedLens, setSelectedLens] = useState<string>('50mm');
  
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [generatedTimePrompt, setGeneratedTimePrompt] = useState<string>('noon');
  const [isLoadingTimePrompt, setIsLoadingTimePrompt] = useState<boolean>(false);

  const [weatherCondition, setWeatherCondition] = useState<string>('none');
  const [generatedWeatherPrompt, setGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingWeatherPrompt, setIsLoadingWeatherPrompt] = useState<boolean>(false);

  const [shotDirection, setShotDirection] = useState<string>('');

  const [generatedCinematicImage, setGeneratedCinematicImage] = useState<string | null>(null);
  const [isGeneratingCinematicImage, setIsGeneratingCinematicImage] = useState<boolean>(false);

  const cameraLenses = ["16mm", "24mm", "35mm", "50mm", "85mm", "135mm"];

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER") {
      setGoogleMapsApiKey(apiKey);
    } else {
      console.warn("Google Maps API Key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
      toast({
        title: "API Key Missing",
        description: "Google Maps API Key is not set. Street View & Autocomplete functionality will be limited.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [toast]);

  const handleStreetViewStatusChange = useCallback((status: 'OK' | 'ZERO_RESULTS' | 'ERROR', message?: string) => {
    if (status === 'OK') {
      setIsStreetViewReady(true);
    } else {
      setIsStreetViewReady(false);
      if (message) {
        toast({ title: "Street View Info", description: message, variant: status === 'ERROR' ? "destructive" : "default" });
      }
    }
  }, [toast]);


  const handleTimeOfDayChange = useCallback(async (value: number) => {
    setTimeOfDay(value);
    setIsLoadingTimePrompt(true);
    setGeneratedCinematicImage(null); 
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
    setGeneratedCinematicImage(null); 
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

  const handleLocationSearch = useCallback(() => {
    if (!searchInput.trim()) {
      toast({ title: "Search Empty", description: "Please enter a location to search.", variant: "default" });
      return;
    }
    setLocationQuery(searchInput);
    setGeneratedCinematicImage(null); 
  }, [searchInput, toast]);
  
  const handleAutocompletePlaceSelected = useCallback((placeName: string) => {
    setSearchInput(placeName);
    setLocationQuery(placeName);
    setGeneratedCinematicImage(null);
  }, []);


  const processSnapshot = async (panoId: string, pov: google.maps.StreetViewPov, zoom: number | undefined, currentApiKey: string) => {
    const heading = pov.heading;
    const pitch = pov.pitch;
    let fov = 90; // Default FOV
    if (zoom !== undefined) {
      fov = Math.max(10, Math.min(120, 180 / Math.pow(2, zoom)));
    }

    const staticImageUrl = `https://maps.googleapis.com/maps/api/streetview?pano=${panoId}&size=800x600&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${currentApiKey}`;

    try {
      const response = await fetch(staticImageUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Static Street View API Error Response:", errorText);
        throw new Error(`Static Street View API request failed: ${response.status} ${response.statusText}`);
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
        sceneDescription: locationQuery,
        shotDirection: shotDirection || undefined,
      };
      
      const result = await generateCinematicShot(aiInput);
      if (result.generatedImageDataUri) {
        setGeneratedCinematicImage(result.generatedImageDataUri);
        toast({ title: "Cinematic Shot Generated!", description: "AI has reimagined your scene.", variant: "default" });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error processing snapshot or generating AI image:", error);
      setGeneratedCinematicImage(null);
      let description = `Could not process Street View or generate AI image. ${error instanceof Error ? error.message : ''}`;
      if (error instanceof Error && error.message.includes("403")) {
        description += " A 403 error often means the Static Street View API is not enabled for your API key, or there's a billing issue. Please check your Google Cloud Console.";
      }
      toast({ 
          title: "Snapshot Failed", 
          description: description, 
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
    setGeneratedCinematicImage(null);

    const panorama = streetViewPanoramaRef.current;
    const panoId = panorama.getPano();
    const pov = panorama.getPov();
    const zoom = panorama.getZoom();


    if (panoId && googleMapsApiKey) {
        await processSnapshot(panoId, pov, zoom, googleMapsApiKey);
    } else {
        const reason = !panoId ? "Could not retrieve Street View Pano ID." : "Google Maps API Key is missing.";
        console.warn("Snapshot Error:", reason, {panoId, googleMapsApiKeyExists: !!googleMapsApiKey});
        toast({ title: "Snapshot Error", description: `${reason} Please try re-searching the location or check API key configuration.`, variant: "destructive" });
        setIsGeneratingCinematicImage(false);
    }
  };
  
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
                      ref={searchInputRef} // Added ref
                      type="text" 
                      placeholder="e.g., Eiffel Tower, Paris" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                      className="text-sm"
                      disabled={!googleMapsApiKey}
                    />
                    <Button onClick={handleLocationSearch} size="sm" aria-label="Search location" disabled={!googleMapsApiKey}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {locationQuery && <p className="text-xs text-muted-foreground">Displaying: {locationQuery}</p>}
                   {!googleMapsApiKey && <p className="text-xs text-destructive mt-1">Google Maps API Key needed for location search.</p>}
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Cinematic Controls</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="camera-lens" className="flex items-center gap-2 text-sm mb-1">
                      <Focus className="w-4 h-4" /> Camera Lens
                    </Label>
                    <Select value={selectedLens} onValueChange={(value) => { setSelectedLens(value); setGeneratedCinematicImage(null); }}>
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
                      <Film className="w-4 h-4" /> Shot Direction / Details
                    </Label>
                    <Input 
                      id="shot-direction"
                      type="text" 
                      placeholder="e.g., Low angle, looking up" 
                      value={shotDirection}
                      onChange={(e) => {setShotDirection(e.target.value); setGeneratedCinematicImage(null);}}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Describe desired camera angle, view, or specific elements.</p>
                  </div>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full text-sm" 
                    onClick={handleSnapshot}
                    disabled={isGeneratingCinematicImage || !isStreetViewReady || !googleMapsApiKey}
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
                   {googleMapsApiKey && !isStreetViewReady && locationQuery && <p className="text-xs text-destructive mt-1">Street View not available or not loaded for the current location.</p>}


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
      <SidebarInset className="p-2 md:p-4 flex flex-col items-center justify-center">
        {isGeneratingCinematicImage && !generatedCinematicImage && (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg shadow-inner">
            <Skeleton className="w-full h-full min-h-[400px] md:min-h-[calc(100vh-12rem)] rounded-lg" />
          </div>
        )}
         <StreetViewDisplay 
            locationQuery={locationQuery}
            generatedImage={generatedCinematicImage}
            overlays={generatedCinematicImage ? {
              lens: selectedLens,
              time: generatedTimePrompt,
              weather: weatherCondition !== 'none' ? weatherCondition : 'Clear'
            } : undefined}
            apiKey={googleMapsApiKey}
            streetViewPanoramaRef={streetViewPanoramaRef}
            streetViewContainerRef={streetViewContainerRef}
            onStreetViewStatusChange={handleStreetViewStatusChange}
            searchInputRef={searchInputRef} // Pass ref
            onAutocompletePlaceSelected={handleAutocompletePlaceSelected} // Pass callback
          />
      </SidebarInset>
    </SidebarProvider>
  );
}


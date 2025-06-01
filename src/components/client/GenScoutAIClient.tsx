
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Globe, Layers, MapPin, Orbit, ChevronDownSquare, Shuffle, Camera, FileJson, Sun, CloudRain, CloudFog, Snowflake, Bot, Search, Video, Focus, ImageIcon, Film } from 'lucide-react';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { generateCinematicShot, type GenerateCinematicShotInput } from '@/ai/flows/generate-cinematic-shot-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const StreetViewDisplay: React.FC<{ locationQuery: string; generatedImage?: string | null; overlays?: { lens: string; time: string; weather: string} }> = ({ locationQuery, generatedImage, overlays }) => {
  const [streetViewSrc, setStreetViewSrc] = useState("https://placehold.co/800x600.png?text=Enter+Location");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (locationQuery) {
      setIsLoading(true);
      // Simulate API call for street view image
      setTimeout(() => {
        // For demonstration, we'll just use a placeholder that reflects the query
        // In a real app, this would fetch an actual street view image
        setStreetViewSrc(`https://placehold.co/800x600.png?text=${encodeURIComponent(locationQuery)}`);
        setIsLoading(false);
      }, 1500);
    } else {
      setStreetViewSrc("https://placehold.co/800x600.png?text=Street+View");
    }
  }, [locationQuery]);

  const displaySrc = generatedImage || streetViewSrc;
  const displayAlt = generatedImage ? "AI Cinematic Shot" : (locationQuery || "Street View Placeholder");
  const dataAiHint = generatedImage ? "cinematic outdoor" : (locationQuery ? `street view ${locationQuery.substring(0,20)}` : "street view");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg shadow-inner relative">
      {isLoading && !generatedImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <ImageIcon className="w-16 h-16 text-primary animate-pulse" />
          <p className="ml-2 text-foreground">Loading Street View...</p>
        </div>
      )}
      <Image 
        key={displaySrc} // Force re-render on src change for loading states
        src={displaySrc} 
        alt={displayAlt} 
        width={800} 
        height={600} 
        data-ai-hint={dataAiHint} 
        className="object-contain rounded-lg w-full h-auto max-h-[calc(100vh-12rem)]" 
        priority={!!generatedImage}
      />
      {generatedImage && overlays && (
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
};


export default function GenScoutAIClient() {
  const { toast } = useToast();

  const [locationQuery, setLocationQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedLens, setSelectedLens] = useState<string>('50mm');
  
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [generatedTimePrompt, setGeneratedTimePrompt] = useState<string>('noon');
  const [isLoadingTimePrompt, setIsLoadingTimePrompt] = useState<boolean>(false);

  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [generatedWeatherPrompt, setGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingWeatherPrompt, setIsLoadingWeatherPrompt] = useState<boolean>(false);

  const [shotDirection, setShotDirection] = useState<string>('');

  const [generatedCinematicImage, setGeneratedCinematicImage] = useState<string | null>(null);
  const [isGeneratingCinematicImage, setIsGeneratingCinematicImage] = useState<boolean>(false);

  const cameraLenses = ["16mm", "24mm", "35mm", "50mm", "85mm", "135mm"];

  const handleTimeOfDayChange = useCallback(async (value: number) => {
    setTimeOfDay(value);
    setIsLoadingTimePrompt(true);
    setGeneratedCinematicImage(null); // Clear generated image when params change
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
    setGeneratedCinematicImage(null); // Clear generated image when params change
    if (!value || value === "none") {
      setWeatherCondition('');
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

  const handleLocationSearch = () => {
    if (!searchInput.trim()) {
      toast({ title: "Search Empty", description: "Please enter a location to search.", variant: "default" });
      return;
    }
    setLocationQuery(searchInput);
    setGeneratedCinematicImage(null); // Clear previous image on new search
    toast({ title: "Location Search", description: `Searching for: ${searchInput} (simulated).`, variant: "default" });
  };
  
  const handleSnapshot = async () => {
    if (!locationQuery) {
      toast({ title: "No Location", description: "Please search for a location first.", variant: "default"});
      return;
    }
    setIsGeneratingCinematicImage(true);
    setGeneratedCinematicImage(null); // Clear previous

    // Simulate capturing street view image data
    // In a real app, you'd get this from the Street View component/API
    const streetViewImageDataUri = `https://placehold.co/800x600.png?text=${encodeURIComponent(locationQuery)}`;
    
    try {
      const input: GenerateCinematicShotInput = {
        streetViewImageDataUri,
        focalLength: selectedLens,
        timeOfDayToken: generatedTimePrompt || 'noon',
        weatherConditionPrompt: generatedWeatherPrompt || 'clear sky',
        sceneDescription: locationQuery,
        shotDirection: shotDirection || undefined,
      };
      const result = await generateCinematicShot(input);
      if (result.generatedImageDataUri) {
        setGeneratedCinematicImage(result.generatedImageDataUri);
        toast({ title: "Cinematic Shot Generated!", description: "AI has reimagined your scene.", variant: "default" });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error generating cinematic shot:", error);
      setGeneratedCinematicImage(null);
      toast({ title: "AI Generation Failed", description: `Could not generate cinematic shot. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
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
                      type="text" 
                      placeholder="e.g., Eiffel Tower, Paris" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                      className="text-sm"
                    />
                    <Button onClick={handleLocationSearch} size="sm" aria-label="Search location">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {locationQuery && <p className="text-xs text-muted-foreground">Displaying: {locationQuery}</p>}
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
                    disabled={isGeneratingCinematicImage || !locationQuery}
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
            <Skeleton className="w-[800px] h-[600px] max-w-full max-h-full rounded-lg" />
          </div>
        )}
        {(!isGeneratingCinematicImage || generatedCinematicImage) && (
          <StreetViewDisplay 
            locationQuery={locationQuery} 
            generatedImage={generatedCinematicImage}
            overlays={generatedCinematicImage ? {
              lens: selectedLens,
              time: generatedTimePrompt,
              weather: weatherCondition || 'Clear'
            } : undefined}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

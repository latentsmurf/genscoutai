"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Layers, MapPin, Orbit, ChevronDownSquare, Shuffle, Camera, FileJson, Sun, CloudRain, CloudFog, Snowflake, CalendarIcon, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { generateTimeOfDayPrompt, type GenerateTimeOfDayPromptInput } from '@/ai/flows/generate-time-of-day-prompt';
import { generateWeatherConditionPrompt, type GenerateWeatherConditionInput } from '@/ai/flows/generate-weather-condition-prompt';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const GlobePlaceholder: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg shadow-inner">
      <Image src="https://placehold.co/800x600.png?text=3D+Globe+View" alt="3D Globe Placeholder" width={800} height={600} data-ai-hint="globe map" className="object-cover rounded-lg" />
    </div>
  );
};


export default function GenScoutAIClient() {
  const { toast } = useToast();

  const [streetViewEnabled, setStreetViewEnabled] = useState(false);
  const [ndviLayerEnabled, setNdviLayerEnabled] = useState(false);
  const [landCoverLayerEnabled, setLandCoverLayerEnabled] = useState(false);
  const [imageryDate, setImageryDate] = useState<Date | undefined>(new Date());
  const [flyoverPreset, setFlyoverPreset] = useState<string>('');
  
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [generatedTimePrompt, setGeneratedTimePrompt] = useState<string>('');
  const [isLoadingTimePrompt, setIsLoadingTimePrompt] = useState<boolean>(false);

  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [generatedWeatherPrompt, setGeneratedWeatherPrompt] = useState<string>('');
  const [isLoadingWeatherPrompt, setIsLoadingWeatherPrompt] = useState<boolean>(false);

  const handleTimeOfDayChange = useCallback(async (value: number) => {
    setTimeOfDay(value);
    setIsLoadingTimePrompt(true);
    try {
      const input: GenerateTimeOfDayPromptInput = { time: value };
      const result = await generateTimeOfDayPrompt(input);
      setGeneratedTimePrompt(result.promptToken);
    } catch (error) {
      console.error("Error generating time of day prompt:", error);
      setGeneratedTimePrompt('Error generating prompt.');
      toast({ title: "AI Error", description: "Failed to generate time-of-day prompt.", variant: "destructive" });
    } finally {
      setIsLoadingTimePrompt(false);
    }
  }, [toast]);

  const handleWeatherConditionChange = useCallback(async (value: string) => {
    if (!value) {
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
    } catch (error) {
      console.error("Error generating weather condition prompt:", error);
      setGeneratedWeatherPrompt('Error generating prompt.');
      toast({ title: "AI Error", description: "Failed to generate weather prompt.", variant: "destructive" });
    } finally {
      setIsLoadingWeatherPrompt(false);
    }
  }, [toast]);

  useEffect(() => {
    handleTimeOfDayChange(timeOfDay);
  }, []); // Run once on mount for initial time

  const handleSnapshot = () => {
    toast({ title: "Snapshot", description: "Canvas captured (simulated)." });
  };

  const handleExportPaths = () => {
    toast({ title: "Export Paths", description: "Paths exported as JSON (simulated)." });
  };
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="floating" collapsible="icon" side="left" className="border-none">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground">GenScoutAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">View Options</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="street-view" className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" /> Street View
                    </Label>
                    <Switch id="street-view" checked={streetViewEnabled} onCheckedChange={setStreetViewEnabled} />
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Earth Engine Layers</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ndvi-layer" className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4" /> NDVI
                    </Label>
                    <Switch id="ndvi-layer" checked={ndviLayerEnabled} onCheckedChange={setNdviLayerEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="land-cover-layer" className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4" /> Land Cover
                    </Label>
                    <Switch id="land-cover-layer" checked={landCoverLayerEnabled} onCheckedChange={setLandCoverLayerEnabled} />
                  </div>
                  <div>
                    <Label htmlFor="imagery-date" className="text-sm mb-1 block">Imagery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal text-sm"
                          id="imagery-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {imageryDate ? format(imageryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={imageryDate}
                          onSelect={setImageryDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Flyover Mode</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-3 mt-2">
                  <p className="text-sm text-muted-foreground italic">Key-frame timeline UI (placeholder)</p>
                  <div>
                    <Label htmlFor="flyover-preset" className="text-sm mb-1 block">Presets</Label>
                    <Select value={flyoverPreset} onValueChange={setFlyoverPreset}>
                      <SelectTrigger id="flyover-preset" className="w-full text-sm">
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orbit"><div className="flex items-center gap-2"><Orbit className="w-4 h-4" />Orbit</div></SelectItem>
                        <SelectItem value="crane"><div className="flex items-center gap-2"><ChevronDownSquare className="w-4 h-4" />Crane</div></SelectItem>
                        <SelectItem value="sweep"><div className="flex items-center gap-2"><Shuffle className="w-4 h-4" />Sweep</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-sm" onClick={handleExportPaths}>
                    <FileJson className="w-4 h-4 mr-2" /> Export Paths (JSON)
                  </Button>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">Visual Tools</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-4 mt-2">
                  <Button variant="outline" size="sm" className="w-full text-sm" onClick={handleSnapshot}>
                    <Camera className="w-4 h-4 mr-2" /> Snapshot Tool
                  </Button>
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
                    {isLoadingTimePrompt && <p className="text-xs text-muted-foreground italic">Generating AI prompt...</p>}
                    {generatedTimePrompt && !isLoadingTimePrompt && (
                      <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs">
                        <span className="font-semibold">AI Token:</span> {generatedTimePrompt}
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
                        <SelectItem value=""><span className="italic text-muted-foreground">None</span></SelectItem>
                        <SelectItem value="rain"><div className="flex items-center gap-2"><CloudRain className="w-4 h-4" />Rain</div></SelectItem>
                        <SelectItem value="snow"><div className="flex items-center gap-2"><Snowflake className="w-4 h-4" />Snow</div></SelectItem>
                        <SelectItem value="fog"><div className="flex items-center gap-2"><CloudFog className="w-4 h-4" />Fog</div></SelectItem>
                      </SelectContent>
                    </Select>
                    {isLoadingWeatherPrompt && <p className="text-xs text-muted-foreground italic mt-1">Generating AI prompt...</p>}
                    {generatedWeatherPrompt && !isLoadingWeatherPrompt && (
                       <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs">
                        <span className="font-semibold">AI Prompt:</span> {generatedWeatherPrompt}
                      </div>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <SidebarTrigger className="ml-auto md:hidden">
            <Globe className="w-6 h-6" />
          </SidebarTrigger>
          <p className="text-xs text-sidebar-foreground/70 hidden md:block text-center">
            GenScoutAI &copy; {new Date().getFullYear()}
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4">
        <GlobePlaceholder />
      </SidebarInset>
    </SidebarProvider>
  );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Languages } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/context/AppContext';

export default function SettingsPage() {
  const { addNotification } = useAppContext();

  // State for all settings
  const [model, setModel] = useState('gemini-2.5-pro');
  const [enableUpscaler, setEnableUpscaler] = useState(false);
  const [showAddress, setShowAddress] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    addNotification({
      title: "Settings Saved (Conceptual)",
      description: "In a real application, your settings would be persisted.",
    });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (lang !== 'en') {
        addNotification({
            title: "Language Setting (Conceptual)",
            description: `UI translation for '${lang}' is a planned feature. It would involve a full i18n implementation.`
        });
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application and interface settings.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>AI & Generation Settings</CardTitle>
          <CardDescription>
            Configure the AI model and image processing options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ai-model">Generation Model</Label>
                <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="ai-model">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (New, Best Quality)</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy, Quality)</SelectItem>
                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Faster, Cost-Effective)</SelectItem>
                        <SelectItem value="dall-e-3" disabled>DALL-E 3 (Conceptual, not implemented)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select the base model for generating cinematic shots.</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="enable-upscaler">Enable AI Upscaler (Conceptual)</Label>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Increase resolution of generated images. May increase generation time and cost.
                    </p>
                </div>
                <Switch
                    id="enable-upscaler"
                    checked={enableUpscaler}
                    onCheckedChange={setEnableUpscaler}
                />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Street View Interface</CardTitle>
          <CardDescription>
            Customize the Street View viewport experience. Changes apply on next load.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="show-address">Show Address Overlay</Label>
                     <p className="text-[0.8rem] text-muted-foreground">
                        Displays the address of the current panorama at the top of the viewport.
                    </p>
                </div>
                <Switch
                    id="show-address"
                    checked={showAddress}
                    onCheckedChange={setShowAddress}
                />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="show-links">Show Navigation Links</Label>
                    <p className="text-[0.8rem] text-muted-foreground">
                       Displays the arrows that allow you to move to adjacent panoramas.
                    </p>
                </div>
                <Switch
                    id="show-links"
                    checked={showLinks}
                    onCheckedChange={setShowLinks}
                />
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Language & Locale (Conceptual)</CardTitle>
          <CardDescription>
            Configure translation and localization options for the UI and AI tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="language-select" className="flex items-center gap-2"><Languages /> UI Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language-select">
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English (Default)</SelectItem>
                        <SelectItem value="es">Español (Spanish)</SelectItem>
                        <SelectItem value="fr">Français (French)</SelectItem>
                        <SelectItem value="de">Deutsch (German)</SelectItem>
                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This is a conceptual feature. Selecting a language other than English will trigger a notification.</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for external services. This is a placeholder and does not save keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">Google Maps API Key</Label>
            <Input id="google-maps-key" type="password" placeholder="Enter your Google Maps API Key" defaultValue="placeholderkey123" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button onClick={handleSave}>Save All Settings</Button>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved (Placeholder)",
      description: "In a real application, your settings would be saved.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center gap-4">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings.</p>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage the API keys for services used by GenScoutAI. This is a placeholder and does not actually save keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">Google Maps API Key</Label>
            <Input id="google-maps-key" type="password" placeholder="Enter your Google Maps API Key" defaultValue="placeholderkey123" />
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Compass, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center p-6">
           <div className="flex justify-center items-center gap-2 mb-4">
             <Camera className="w-12 h-12 text-primary" />
             <h1 className="text-4xl font-bold tracking-tight">GenScoutAI</h1>
           </div>
          <CardTitle className="text-2xl">Welcome to Your AI Scouting Assistant</CardTitle>
          <CardDescription className="text-base">
            Find locations, visualize scenes, and generate cinematic shots instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-6">
          <Button asChild size="lg" className="h-12 text-lg">
            <Link href="/scout">
              <Compass className="mr-2" />
              Start Scouting
            </Link>
          </Button>
           <Button asChild variant="outline">
            <Link href="/gallery">
              <LayoutGrid className="mr-2" />
              View Media Gallery
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

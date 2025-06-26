'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, LogIn, UserCheck } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
    const { login } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();

    const handleDeveloperLogin = () => {
        login();
        router.push('/scout');
    };
    
    const handleStandardLogin = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Login Not Implemented",
            description: "Please use the Developer Login Override.",
            variant: "default",
        });
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center p-6">
           <div className="flex justify-center items-center gap-2 mb-4">
             <Camera className="w-12 h-12 text-primary" />
             <h1 className="text-4xl font-bold tracking-tight">GenScoutAI</h1>
           </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Log in to continue to your AI scouting assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="scout@example.com" required disabled />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" required disabled />
            </div>
            <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled>
              <LogIn className="mr-2" />
              Log In
            </Button>
          </form>
          
          <Separator className="my-6" />

          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">For development purposes:</p>
            <Button onClick={handleDeveloperLogin} variant="outline" className="w-full">
                <UserCheck className="mr-2" />
                Developer Login Override
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

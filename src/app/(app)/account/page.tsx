
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Coins, Ship, Map, Rocket } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function AccountPage() {
  const { logout } = useAppContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePurchase = (packName: string) => {
    // This is a placeholder for Stripe integration
    console.log(`Purchase initiated for ${packName}`);
  };

  return (
     <div className="p-4 md:p-6 space-y-6">
      <header className="flex items-center gap-4">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">Account & Billing</h1>
          <p className="text-muted-foreground">Manage your account, credits, and preferences.</p>
        </div>
      </header>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@scoutmaster" data-ai-hint="profile avatar" />
                <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle>Scout Master</CardTitle>
                <CardDescription>
                    scout.master@example.com
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">This is your main account page. You can manage your profile details and log out from here.</p>
            <Button variant="destructive" className="mt-4" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Credits</CardTitle>
          <CardDescription>This is your current credit balance for AI operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold flex items-center">
            <Coins className="mr-4 h-10 w-10 text-primary" />
            500
          </div>
          <p className="text-muted-foreground mt-2">Credits remaining. Purchase more below.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Purchase Credit Packs</CardTitle>
          <CardDescription>Top up your balance to continue generating amazing cinematic shots. Payments are processed securely via Stripe (conceptual).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Pack 1: Erikson Expedition */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Ship className="w-8 h-8 text-primary"/>
                <CardTitle className="text-lg">The Erikson Expedition</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="text-4xl font-bold">$10.00</div>
              <div className="text-xl font-semibold text-primary">1,000 Credits</div>
              <p className="text-sm text-muted-foreground pt-2">Perfect for crafting detailed scenes and exploring unique visual styles with precision.</p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => handlePurchase('Erikson Expedition')}>Purchase</Button>
            </CardFooter>
          </Card>

          {/* Pack 2: Polo Passage */}
          <Card className="flex flex-col relative border-primary shadow-lg">
            <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm">Great Value</Badge>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Map className="w-8 h-8 text-primary"/>
                <CardTitle className="text-lg">The Polo Passage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="text-4xl font-bold">$25.00</div>
              <div className="text-xl font-semibold text-primary">2,900 Credits</div>
              <p className="text-sm text-muted-foreground pt-2">For ambitious storytellers looking to build intricate narratives and bring grander visions to life. <strong className="text-foreground">(approx. 16% Extra)</strong></p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => handlePurchase('Polo Passage')}>Purchase</Button>
            </CardFooter>
          </Card>

          {/* Pack 3: Magellan Voyage */}
          <Card className="flex flex-col relative">
             <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm">Best Value</Badge>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8 text-primary"/>
                <CardTitle className="text-lg">The Magellan Voyage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="text-4xl font-bold">$75.00</div>
              <div className="text-xl font-semibold text-primary">9,750 Credits</div>
              <p className="text-sm text-muted-foreground pt-2">The ultimate toolkit for the visionary. Ample credits for large-scale productions and extensive AI exploration. <strong className="text-foreground">(30% Extra)</strong></p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => handlePurchase('Magellan Voyage')}>Purchase</Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

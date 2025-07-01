
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Bell,
  Camera,
  DollarSign,
  Menu,
  RotateCcw,
  Settings,
  Trash2,
  User,
  Compass,
  LayoutGrid,
  LogOut,
  CreditCard,
  PlusCircle,
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    isAuthenticated,
    isAuthLoading,
    user,
    sessionCosts, 
    resetSessionCosts, 
    notifications, 
    markAllAsRead, 
    clearNotifications,
    isGuestMode,
    setIsGuestMode
  } = useAppContext();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !isGuestMode) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, isGuestMode, router]);
  
  const handleLogout = async () => {
    await signOut(auth);
    setIsGuestMode(false);
    router.push('/login');
  };

  if (isAuthLoading && !isGuestMode) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 px-4 md:px-6 z-40 backdrop-blur-lg">
        <nav className="hidden items-center gap-1 text-lg font-medium md:flex md:flex-row md:items-center md:gap-2 md:text-sm lg:gap-4">
            <Link
              href="/scout"
              className="flex items-center gap-2 text-lg font-semibold md:text-base mr-4"
            >
              <Camera className="h-7 w-7 text-primary" />
              <span className="font-bold text-xl">GenScoutAI</span>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                      href="/scout"
                      className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                          pathname.startsWith('/scout') ? 'bg-accent text-accent-foreground' : ''
                      )}
                    >
                      <Compass className="h-5 w-5" />
                      <span className="sr-only">Scout</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">Scout</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/gallery"
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                        pathname.startsWith('/gallery') ? 'bg-accent text-accent-foreground' : ''
                    )}
                  >
                    <LayoutGrid className="h-5 w-5" />
                    <span className="sr-only">Media Gallery</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">Media Gallery</TooltipContent>
              </Tooltip>
              {!isGuestMode && (
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href="/settings"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                            pathname === '/settings' ? 'bg-accent text-accent-foreground' : ''
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Settings</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </nav>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/scout"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Camera className="h-6 w-6 text-primary" />
                <span className="font-bold">GenScoutAI</span>
              </Link>
              <Link href="/scout" onClick={closeMobileMenu} className={cn("flex items-center gap-4 px-2.5", pathname.startsWith('/scout') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <Compass className="h-5 w-5" />
                Scout
              </Link>
              <Link
                href="/gallery"
                onClick={closeMobileMenu}
                className={cn("flex items-center gap-4 px-2.5", pathname.startsWith('/gallery') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-5 w-5" />
                Media Gallery
              </Link>
              {!isGuestMode && (
                <Link href="/settings" onClick={closeMobileMenu} className={cn("flex items-center gap-4 px-2.5", pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    <Settings className="h-5 w-5" />
                    Settings
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            {!isGuestMode && (
                <div className="ml-auto flex items-center gap-2">
                    <Button asChild>
                        <Link href="/pricing">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Buy Credits
                        </Link>
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                <DollarSign className="mr-1 h-3 w-3" />
                                ~${sessionCosts.totalEstimatedCost.toFixed(4)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="bottom" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Session Cost Estimate</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Illustrative costs for this session only. Not actual billing.
                                    </p>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center justify-between"><span>Geocoding API Calls:</span><span>{sessionCosts.geocodingRequests}</span></div>
                                    <div className="flex items-center justify-between"><span>Places Details API Calls:</span><span>{sessionCosts.placesDetailsRequests}</span></div>
                                    <div className="flex items-center justify-between"><span>Street View API Calls:</span><span>{sessionCosts.streetViewSnapshots}</span></div>
                                    <div className="flex items-center justify-between"><span>Gemini Text Generations:</span><span>{sessionCosts.geminiTextGenerations}</span></div>
                                    <div className="flex items-center justify-between"><span>Gemini Image Generations:</span><span>{sessionCosts.geminiImageGenerations}</span></div>
                                </div>
                                <div className="flex items-center justify-between font-semibold border-t pt-2 mt-2">
                                    <p>Total Estimated Cost</p>
                                    <p>~${sessionCosts.totalEstimatedCost.toFixed(4)}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetSessionCosts} className="mt-2">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Session Tracker
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
            <div className={`flex-shrink-0 ${isGuestMode ? 'ml-auto' : ''}`}>
                <Popover onOpenChange={(isOpen) => { if (!isOpen) { markAllAsRead(); } }}>
                    <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 shrink-0 rounded-full p-0 flex items-center justify-center text-xs">
                            {unreadCount}
                        </Badge>
                        )}
                        <span className="sr-only">Notifications</span>
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between p-3 border-b">
                            <h4 className="font-medium">Notifications</h4>
                            {notifications.length > 0 && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearNotifications}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                <span className="sr-only">Clear all</span>
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="h-[320px]">
                            {notifications.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-16">No new notifications.</p>
                            ) : (
                            <div className="flex flex-col">
                                {notifications.map((n) => (
                                <div key={n.id} className="p-3 border-b flex gap-3 last:border-b-0">
                                    <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", n.read ? 'bg-transparent' : n.variant === 'destructive' ? 'bg-destructive' : 'bg-primary')} />
                                    <div className="space-y-1">
                                    <p className="font-semibold text-sm">{n.title}</p>
                                    <p className="text-sm text-muted-foreground">{n.description}</p>
                                    <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                            )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
            {isGuestMode ? (
                <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setIsGuestMode(false)}>Login or Sign Up</Link>
                </Button>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/account">Account & Billing</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </header>
      <main className="flex flex-1 flex-col bg-background">
        {children}
      </main>
    </div>
  );
}

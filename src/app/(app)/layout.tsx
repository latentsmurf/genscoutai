
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Camera, Settings, User, LayoutGrid, Compass, DollarSign, RotateCcw, PanelLeft, Bell, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, sessionCosts, resetSessionCosts, notifications, markAllAsRead, clearNotifications } = useAppContext();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const unreadCount = notifications.filter(n => !n.read).length;


  useEffect(() => {
    // This check ensures that we don't redirect on the server or during initial hydration.
    // It waits until the client-side has determined the auth state.
    if (typeof isAuthenticated === 'boolean') {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, router]);
  
  if (isCheckingAuth) {
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

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="floating" collapsible="icon" side="left" className="border-none">
        <SidebarHeader className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 outline-none">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[state=collapsed]:hidden">GenScoutAI</h1>
          </Link>
          <div className="flex items-center gap-1 group-data-[state=collapsed]:hidden">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <DollarSign className="mr-1 h-3 w-3" />
                            ~${sessionCosts.totalEstimatedCost.toFixed(4)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="right" align="start">
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
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/scout' || pathname.startsWith('/scout')} tooltip={{children: "Scout"}}>
                <Link href="/scout" title="Scout">
                  <Compass />
                  Scout
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/gallery'} tooltip={{children: "Media Gallery"}}>
                <Link href="/gallery" title="Media Gallery">
                  <LayoutGrid />
                  Media Gallery
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={{children: "Settings"}}>
                <Link href="/settings" title="Settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border flex flex-col items-stretch gap-2">
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton asChild isActive={pathname === '/account'} tooltip={{children: "Account"}}>
                 <Link href="/account" title="Account">
                   <User />
                   Account
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
           <div className="flex justify-end">
             <SidebarTrigger />
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-0">
        <header className="p-2 border-b md:hidden flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-lg z-10">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2 outline-none font-semibold">
            <Camera className="w-6 h-6 text-primary" />
            GenScoutAI
          </Link>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

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
} from '@/components/ui/sidebar';
import { Camera, Settings, User, LayoutGrid, Compass } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="floating" collapsible="icon" side="left" className="border-none">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 outline-none">
            <Camera className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground">GenScoutAI</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/scout' || pathname.startsWith('/scout')}>
                <Link href="/scout" title="Scout">
                  <Compass />
                  Scout
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/gallery'}>
                <Link href="/gallery" title="Media Gallery">
                  <LayoutGrid />
                  Media Gallery
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'}>
                <Link href="/settings" title="Settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton asChild isActive={pathname === '/account'}>
                 <Link href="/account" title="Account">
                   <User />
                   Account
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

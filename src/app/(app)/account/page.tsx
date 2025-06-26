'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { logout } = useAppContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
     <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center gap-4">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-muted-foreground">Manage your account details and preferences.</p>
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
            <p>This is a placeholder account page. In a real application, you would be able to manage your profile, subscription, and billing information here.</p>
            <Button variant="destructive" className="mt-4" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

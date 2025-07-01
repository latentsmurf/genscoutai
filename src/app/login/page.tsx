
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, LogIn, UserPlus } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
} from 'firebase/auth';

export default function LoginPage() {
    const { isAuthenticated, addNotification, setIsGuestMode } = useAppContext();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/scout');
        }
        // Ensure guest mode is reset when arriving at the login page.
        setIsGuestMode(false);
    }, [isAuthenticated, router, setIsGuestMode]);

    const handleAuthAction = async (action: 'signup' | 'login') => {
        setIsLoading(true);
        try {
            if (action === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
                addNotification({ title: 'Account Created', description: 'Welcome! You are now logged in.' });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                addNotification({ title: 'Logged In', description: 'Welcome back!' });
            }
            setIsGuestMode(false);
            router.push('/scout');
        } catch (error: any) {
            console.error(`${action} error:`, error);
            addNotification({ title: 'Authentication Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            addNotification({ title: 'Logged In', description: 'Welcome!' });
            setIsGuestMode(false);
            router.push('/scout');
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            addNotification({ title: 'Google Sign-In Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
      setIsGuestMode(true);
      router.push('/scout');
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center p-6">
           <div className="flex justify-center items-center gap-2 mb-4">
             <Camera className="w-12 h-12 text-primary" />
             <h1 className="text-4xl font-bold tracking-tight">GenScoutAI</h1>
           </div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription className="text-base">
            Sign in or create an account to start scouting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('login'); }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="scout@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input id="login-password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isLoading}>
                      <LogIn className="mr-2" />
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="signup">
               <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signup'); }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="scout@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" placeholder="Must be at least 6 characters" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isLoading}>
                      <UserPlus className="mr-2" />
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
            </TabsContent>
          </Tabs>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
             <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.37 1.62-4.38 1.62-3.82 0-6.94-3.1-6.94-6.94s3.12-6.94 6.94-6.94c2.26 0 3.62.92 4.48 1.74l2.54-2.54C18.27 2.3 15.84 1.08 12.48 1.08c-6.18 0-11.16 4.98-11.16 11.16s4.98 11.16 11.16 11.16c6.42 0 10.84-4.48 10.84-10.84 0-.74-.06-1.48-.18-2.2H12.48z"></path></svg>
            Google
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Button variant="link" className="w-full mt-4" onClick={handleGuestLogin}>
              Continue as Guest (Dev only)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

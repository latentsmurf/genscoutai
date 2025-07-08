
'use client';

import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import Link from 'next/link';
import { createStripePortalSession } from '@/app/actions'; // Changed import
import { Loader2 } from 'lucide-react';

export default function AccountPage() {
  const { user, addNotification } = useAppContext();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const handleProfileUpdate = async () => {
    // This is where you would implement the logic to update the user's profile
    // For now, it's just a placeholder
    addNotification({ title: 'Success', description: 'Profile updated successfully!' });
  };

  const handlePasswordReset = () => {
    // This is where you would implement the logic to send a password reset email
    addNotification({ title: 'Success', description: 'Password reset email sent!' });
  };

  const handleDeleteAccount = () => {
    // This is where you would implement the logic to delete the user's account
    // This should include a confirmation step
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      addNotification({ title: 'Success', description: 'Account deleted successfully!' });
    }
  };

  const redirectToStripePortal = async () => {
    if (!user) {
      addNotification({ title: 'Error', description: 'You must be logged in to manage billing.', variant: 'destructive' });
      return;
    }
    setIsBillingLoading(true);
    try {
      const portalUrl = await createStripePortalSession({ uid: user.uid });
      window.location.href = portalUrl;
    } catch (error) {
      console.error(error);
      addNotification({ title: 'Error', description: 'Could not redirect to Stripe. Please try again.', variant: 'destructive' });
      setIsBillingLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Manage your profile, credits, and billing settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Profile</h2>
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={handleProfileUpdate}>Update Profile</Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Credit Balance Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Credit Balance</h2>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-3xl font-bold">1,250</p>
              </div>
              <Button asChild>
                <Link href="/pricing">Buy More Credits</Link>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Billing Management Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Billing</h2>
            <p className="text-muted-foreground">Manage your payment methods and view your purchase history.</p>
            <Button onClick={redirectToStripePortal} disabled={isBillingLoading}>
              {isBillingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Billing via Stripe
            </Button>
          </div>

          <Separator />

          {/* Security Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Security</h2>
            <div className="space-y-2">
              <Button variant="outline" onClick={handlePasswordReset}>
                Send Password Reset Email
              </Button>
              <p className="text-sm text-muted-foreground">
                You will receive an email with instructions on how to reset your password.
              </p>
            </div>
            <div className="space-y-2">
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all of your data. This action cannot be undone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

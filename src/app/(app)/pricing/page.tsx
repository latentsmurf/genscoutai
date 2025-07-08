
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createCheckoutSession } from '@/ai/flows/stripe-flow';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const pricingTiers = [
  {
    name: 'The Erikson Expedition',
    price: '$10.00',
    credits: '1,000 Credits',
    description: 'Perfect for crafting detailed scenes and exploring unique visual styles with precision.',
    priceId: 'price_1RlSDORragUkhvY8W5M9kAHI',
    isMostPopular: false,
  },
  {
    name: 'The Polo Passage',
    price: '$25.00',
    credits: '2,900 Credits',
    description: 'For ambitious storytellers looking to build intricate narratives and grander visions to life. (approx. 16% Extra)',
    priceId: 'price_1RlSQRragUkhvY8QneFCSGJ',
    isMostPopular: true,
  },
  {
    name: 'The Magellan Voyage',
    price: '$75.00',
    credits: '9,750 Credits',
    description: 'The ultimate toolkit for the visionary. Ample credits for large-scale productions and extensive AI exploration. (30% Extra)',
    priceId: 'price_1RlSFragUkhvY8umWtkb81',
    isMostPopular: false,
  }
];

export default function PricingPage() {
  const { user, addNotification } = useAppContext();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      addNotification({
        title: 'Authentication Required',
        description: 'You must be logged in to make a purchase.',
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(priceId);
    try {
      const checkoutUrl = await createCheckoutSession({ uid: user.uid, priceId });
      // Redirect to Stripe's checkout page
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      addNotification({
        title: 'Checkout Error',
        description: `Could not initiate the payment process. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Purchase Credit Packs</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Top up your balance to continue generating amazing cinematic shots. Payments are processed securely via Stripe.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={cn('flex flex-col', { 'border-primary shadow-lg': tier.isMostPopular })}>
            <CardHeader>
              <CardTitle className="text-center">{tier.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">{tier.price}</span>
              </div>
              <p className="mt-2 text-lg text-center font-semibold text-primary">
                {tier.credits}
              </p>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {tier.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(tier.priceId)}
                disabled={!!isLoading}
                variant={tier.isMostPopular ? 'default' : 'outline'}
              >
                {isLoading === tier.priceId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Purchase'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

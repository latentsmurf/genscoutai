
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const pricingTiers = [
  {
    name: 'The Erikson Expedition',
    price: '$10.00',
    credits: '1,000 Credits',
    description: 'Perfect for crafting detailed scenes and exploring unique visual styles with precision.',
    features: [
    ],
    isMostPopular: false,
  },
  {
    name: 'The Polo Passage',
    price: '$25.00',
    credits: '2,900 Credits',
    description: 'For ambitious storytellers looking to build intricate narratives and bring grander visions to life. (approx. 16% Extra)',
    features: [
    ],
    isMostPopular: true,
  },
  {
    name: 'The Magellan Voyage',
    price: '$75.00',
    credits: '9,750 Credits',
    description: 'The ultimate toolkit for the visionary. Ample credits for large-scale productions and extensive AI exploration. (30% Extra)',
    features: [
    ],
    isMostPopular: false,
  }
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Purchase Credit Packs</h1>
        <p className="mt-2 text-lg text-muted-foreground">
        Top up your balance to continue generating amazing cinematic shots. Payments are processed securely via Stripe (conceptual).
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={cn('flex flex-col', { 'border-primary': tier.isMostPopular })}>
            <CardHeader>
              <CardTitle className="text-center">{tier.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">{tier.price}</span>
              </div>
              <p className="mt-2 text-lg text-center text-muted-foreground">
                {tier.credits}
              </p>
              <p className="mt-4 text-center">
                {tier.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Purchase
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// This is your Stripe webhook secret, found in your Stripe dashboard.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// A mapping from Stripe Price ID to the number of credits it provides.
// This is crucial for fulfillment.
const creditsPerPriceId: { [key: string]: number } = {
  'price_1RlSDORragUkhvY8W5M9kAHI': 1000,
  'price_1RlSQRragUkhvY8QneFCSGJ': 2900,
  'price_1RlSFragUkhvY8umWtkb81': 9750,
};

/**
 * This is the API route that Stripe will call after a payment event.
 * It's responsible for verifying the event and fulfilling the purchase.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract necessary info from the session
    const uid = session.metadata?.firebaseUID;
    const priceId = session.line_items?.data[0]?.price?.id;

    if (!uid) {
      console.error('Webhook Error: No Firebase UID in session metadata.');
      return NextResponse.json({ error: 'No UID found in session metadata.' }, { status: 400 });
    }
    
    if (!priceId) {
        console.error('Webhook Error: Could not determine Price ID from session.');
        return NextResponse.json({ error: 'No Price ID found in session.' }, { status: 400 });
    }

    const creditsToAward = creditsPerPriceId[priceId];

    if (!creditsToAward) {
      console.error(`Webhook Error: No credit amount found for Price ID: ${priceId}`);
      return NextResponse.json({ error: `No credit amount configured for price ${priceId}.` }, { status: 400 });
    }

    try {
      // Update the user's credit balance in Firestore
      const db = getFirestore();
      const userRef = db.collection('users').doc(uid);
      
      // Use FieldValue.increment to atomically update the credit balance
      await userRef.update({
        credits: FieldValue.increment(creditsToAward),
      });

      console.log(`Successfully awarded ${creditsToAward} credits to user ${uid}.`);

    } catch (error) {
      console.error(`Firestore Error: Failed to award credits to user ${uid}.`, error);
      return NextResponse.json({ error: 'Failed to update user credits in database.' }, { status: 500 });
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

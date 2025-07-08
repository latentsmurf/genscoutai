
import { defineFlow } from 'genkit';
import { z } from 'zod';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { auth } from 'firebase-admin';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Zod schema for creating a Stripe Customer Portal session
const createPortalSchema = z.object({
  uid: z.string(),
});

// Zod schema for creating a Stripe Checkout session
const createCheckoutSchema = z.object({
  uid: z.string(),
  priceId: z.string(),
});

/**
 * Retrieves the Stripe Customer ID for a given Firebase UID.
 * Creates a new Stripe customer if one doesn't exist.
 */
async function getOrCreateStripeCustomerId(uid: string): Promise<string> {
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  if (doc.exists && doc.data()?.stripeCustomerId) {
    return doc.data()?.stripeCustomerId;
  }

  // User doesn't have a customer ID, so we create one.
  const user = await auth().getUser(uid);
  const customer = await stripe.customers.create({
    email: user.email!,
    name: user.displayName,
    metadata: { firebaseUID: uid },
  });

  // Save the new customer ID to the user's document in Firestore
  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });

  return customer.id;
}


// Genkit flow to create a Stripe Customer Portal session
export const createStripePortalSession = defineFlow(
  {
    name: 'createStripePortalSession',
    inputSchema: createPortalSchema,
    outputSchema: z.string().url(),
  },
  async ({ uid }) => {
    try {
      const customerId = await getOrCreateStripeCustomerId(uid);

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
      });

      return portalSession.url;
    } catch (error) {
      console.error('Error creating Stripe portal session:', error);
      throw new Error('Failed to create Stripe portal session.');
    }
  }
);


// Genkit flow to create a Stripe Checkout session for one-time purchases
export const createCheckoutSession = defineFlow(
  {
    name: 'createCheckoutSession',
    inputSchema: createCheckoutSchema,
    outputSchema: z.string().url(),
  },
  async ({ uid, priceId }) => {
    try {
      const customerId = await getOrCreateStripeCustomerId(uid);
      
      const successUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/gallery`);
      successUrl.searchParams.append('payment_success', 'true');
      successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');


      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl.toString(),
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        // We can pass the UID in metadata to easily identify the user in webhooks
        metadata: {
          firebaseUID: uid,
        }
      });

      if (!checkoutSession.url) {
        throw new Error('Could not create Stripe Checkout session.');
      }

      return checkoutSession.url;
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
          throw new Error(`The Price ID "${priceId}" was not found in Stripe. Please ensure it is correct.`);
      }
      throw new Error('Failed to create Stripe checkout session.');
    }
  }
);


import { defineFlow } from 'genkit';
import { z } from 'zod';
import Stripe from 'stripe';
import { auth }_ from '@/lib/firebase-admin'; // Using admin SDK for elevated privileges

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Zod schema for the input
const createPortalSchema = z.object({
  uid: z.string(),
});

// Genkit flow to create a Stripe Customer Portal session
export const createStripePortalSession = defineFlow(
  {
    name: 'createStripePortalSession',
    inputSchema: createPortalSchema,
    outputSchema: z.string().url(),
  },
  async ({ uid }) => {
    try {
      // Get user from Firebase Auth to ensure they exist
      const user = await auth().getUser(uid);
      const email = user.email!;

      // Check if the user already has a Stripe customer ID in Firestore
      // (This part is conceptual until we have the Firestore structure fully in place)
      let customerId = await getStripeCustomerId(uid);

      if (!customerId) {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email,
          metadata: { firebaseUID: uid },
        });
        customerId = customer.id;
        // Save the new customer ID to Firestore
        await saveStripeCustomerId(uid, customerId);
      }

      // Create a Billing Portal session
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

// Conceptual functions for Firestore interaction
// These will be replaced with actual Firestore calls

async function getStripeCustomerId(uid: string): Promise<string | null> {
  // In a real implementation, you would fetch this from the user's document in Firestore
  console.log(`Fetching Stripe customer ID for UID: ${uid}`);
  return null; // Assume not found for now
}

async function saveStripeCustomerId(uid: string, customerId: string): Promise<void> {
  // In a real implementation, you would save this to the user's document in Firestore
  console.log(`Saving Stripe customer ID ${customerId} for UID: ${uid}`);
}

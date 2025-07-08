'use server';

/**
 * This file is a "Server Actions" file in Next.js.
 * It acts as a secure bridge, allowing client-side components to call
 * server-side Genkit flows without bundling server-only code (like firebase-admin
 * or secret keys) into the client application.
 */

import { createCheckoutSession, createStripePortalSession } from "@/ai/flows/stripe-flow";

// By re-exporting the flows from this file, we make them available as Server Actions.
export {
    createCheckoutSession,
    createStripePortalSession
};

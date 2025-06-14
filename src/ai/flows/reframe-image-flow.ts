
'use server';
/**
 * @fileOverview A Genkit flow to reframe an image to a target aspect ratio using Replicate.
 *
 * - reframeImage - A function that handles the image reframing process.
 * - ReframeImageInput - The input type for the reframeImage function.
 * - ReframeImageOutput - The return type for the reframeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Replicate from 'replicate';

const ReframeImageInputSchema = z.object({
  base64ImageDataUri: z
    .string()
    .describe(
      "The image to reframe, as a base64 data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetAspectRatio: z
    .string()
    .describe("The desired aspect ratio for the reframed image (e.g., '9:16', '1:1', '16:9')."),
  promptContext: z
    .string()
    .optional()
    .describe('Optional textual context/prompt for the reframing process.'),
});
export type ReframeImageInput = z.infer<typeof ReframeImageInputSchema>;

const ReframeImageOutputSchema = z.object({
  reframedImageUrl: z
    .string()
    .nullable()
    .describe('The URL of the reframed image, or null if reframing failed.'),
});
export type ReframeImageOutput = z.infer<typeof ReframeImageOutputSchema>;

export async function reframeImage(input: ReframeImageInput): Promise<ReframeImageOutput> {
  return reframeImageFlow(input);
}

const reframeImageFlow = ai.defineFlow(
  {
    name: 'reframeImageFlow',
    inputSchema: ReframeImageInputSchema,
    outputSchema: ReframeImageOutputSchema,
  },
  async ({ base64ImageDataUri, targetAspectRatio, promptContext }) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set.');
      return { reframedImageUrl: null };
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    try {
      // Convert base64 data URI to Buffer for Replicate
      // Format: 'data:<mimetype>;base64,<encoded_data>'
      const base64Data = base64ImageDataUri.split(',')[1];
      if (!base64Data) {
        console.error('Invalid base64 data URI format.');
        return { reframedImageUrl: null };
      }
      // Replicate client handles buffer upload and conversion to URL
      // For `image_url` type inputs, we pass the buffer directly to the `replicate` js client
      // and it handles uploading it and providing a `replicate.delivery` URL to the model.

      const replicateInput = {
        image_url: base64ImageDataUri, // The replicate JS client handles data URIs for image_url.
        aspect_ratio: targetAspectRatio,
        prompt: promptContext || 'Reframe this image to the specified aspect ratio, maintaining quality and subject focus.',
      };
      
      const output = (await replicate.run('luma/reframe-image:b65436553b60d30389979de7753758069ba45efb400057870495718e99559432', { // Pinned to a version
        input: replicateInput,
      })) as string | null; // Output is expected to be a string URL or null

      if (typeof output === 'string') {
        return { reframedImageUrl: output };
      } else {
        console.error('Replicate did not return a valid image URL. Output:', output);
        return { reframedImageUrl: null };
      }
    } catch (error) {
      console.error('Error calling Replicate API for image reframing:', error);
      return { reframedImageUrl: null };
    }
  }
);

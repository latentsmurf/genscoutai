
'use server';
/**
 * @fileOverview A Genkit flow to apply an artistic filter to an image using Replicate's flux-kontext-pro.
 *
 * - applyFluxFilter - A function that handles applying the filter.
 * - ApplyFluxFilterInput - The input type for the applyFluxFilter function.
 * - ApplyFluxFilterOutput - The return type for the applyFluxFilter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Replicate from 'replicate';

const ApplyFluxFilterInputSchema = z.object({
  inputImageDataUri: z
    .string()
    .describe(
      "The image to modify, as a data URI or an existing Replicate URL. Expected format: 'data:<mimetype>;base64,<encoded_data>' or 'https://replicate.delivery/...'"
    ),
  prompt: z
    .string()
    .describe('The prompt describing the desired artistic transformation (e.g., "Make this a 90s cartoon").'),
  outputFormat: z.enum(['jpg', 'png']).default('png').describe('The desired output format for the image.'),
});
export type ApplyFluxFilterInput = z.infer<typeof ApplyFluxFilterInputSchema>;

const ApplyFluxFilterOutputSchema = z.object({
  outputImageUrl: z
    .string()
    .nullable()
    .describe('The URL of the modified image from Replicate, or null if processing failed.'),
});
export type ApplyFluxFilterOutput = z.infer<typeof ApplyFluxFilterOutputSchema>;

export async function applyFluxFilter(input: ApplyFluxFilterInput): Promise<ApplyFluxFilterOutput> {
  return applyFluxFilterFlow(input);
}

const applyFluxFilterFlow = ai.defineFlow(
  {
    name: 'applyFluxFilterFlow',
    inputSchema: ApplyFluxFilterInputSchema,
    outputSchema: ApplyFluxFilterOutputSchema,
  },
  async ({ inputImageDataUri, prompt, outputFormat }) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set.');
      return { outputImageUrl: null };
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    try {
      const replicateInput = {
        input_image: inputImageDataUri, // Replicate client handles data URIs and URLs for image_url types
        prompt: prompt,
        output_format: outputFormat,
      };
      
      // Model: black-forest-labs/flux-kontext-pro
      // Pinned to version: 0f3f6a2201096092169469b73228e50a229728f8f818e36430ae6f6b25022a2c
      const output = (await replicate.run('black-forest-labs/flux-kontext-pro:0f3f6a2201096092169469b73228e50a229728f8f818e36430ae6f6b25022a2c', {
        input: replicateInput,
      })) as string[] | string | null; // Model can return array of URLs or single URL

      let imageUrl: string | null = null;
      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0]; // Take the first image if an array is returned
      } else if (typeof output === 'string') {
        imageUrl = output;
      }

      if (imageUrl) {
        return { outputImageUrl: imageUrl };
      } else {
        console.error('Replicate (Flux) did not return a valid image URL. Output:', output);
        return { outputImageUrl: null };
      }
    } catch (error) {
      console.error('Error calling Replicate API for Flux filter:', error);
      return { outputImageUrl: null };
    }
  }
);


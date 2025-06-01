
'use server';
/**
 * @fileOverview Generates a descriptive summary for a given location.
 *
 * - generateLocationInfo - A function that handles the location information generation.
 * - GenerateLocationInfoInput - The input type for the generateLocationInfo function.
 * - GenerateLocationInfoOutput - The return type for the generateLocationInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLocationInfoInputSchema = z.object({
  locationName: z.string().describe('The name of the location (e.g., address, city, landmark).'),
  coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional().describe('Optional geographic coordinates (latitude and longitude) of the location.'),
});
export type GenerateLocationInfoInput = z.infer<typeof GenerateLocationInfoInputSchema>;

const GenerateLocationInfoOutputSchema = z.object({
  summary: z.string().describe('A concise and interesting summary about the location, formatted as a single paragraph of 2-4 sentences (max 150 words).'),
});
export type GenerateLocationInfoOutput = z.infer<typeof GenerateLocationInfoOutputSchema>;

export async function generateLocationInfo(
  input: GenerateLocationInfoInput
): Promise<GenerateLocationInfoOutput> {
  return generateLocationInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocationInfoPrompt',
  input: {schema: GenerateLocationInfoInputSchema},
  output: {schema: GenerateLocationInfoOutputSchema},
  prompt: `Provide a concise and interesting summary (a single paragraph of 2-4 sentences, maximum 150 words) about the location: {{{locationName}}}.
{{#if coordinates}}
The approximate coordinates are Latitude: {{{coordinates.lat}}}, Longitude: {{{coordinates.lng}}}. You can use this for better context if needed.
{{/if}}
Focus on notable features, brief history, or cultural significance. Avoid generic statements. Be informative and engaging.
Example output format for "Eiffel Tower": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower from 1887–1889 for the 1889 World's Fair. It has become a global cultural icon of France and one of the most recognizable structures in the world."
`,
});

const generateLocationInfoFlow = ai.defineFlow(
  {
    name: 'generateLocationInfoFlow',
    inputSchema: GenerateLocationInfoInputSchema,
    outputSchema: GenerateLocationInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


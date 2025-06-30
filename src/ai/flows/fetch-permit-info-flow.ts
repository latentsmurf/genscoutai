
'use server';
/**
 * @fileOverview Fetches film permit and regulation information for a given location.
 *
 * - fetchPermitInfo - A function that handles fetching permit info.
 * - FetchPermitInfoInput - The input type for the fetchPermitInfo function.
 * - FetchPermitInfoOutput - The return type for the fetchPermitInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FetchPermitInfoInputSchema = z.object({
  locationName: z.string().describe('The name of the location (e.g., "Eiffel Tower, Paris" or "Santa Monica Pier, CA").'),
  coordinates: z.object({ lat: z.number(), lng: z.number() })
    .describe('The geographic coordinates of the location.'),
});
export type FetchPermitInfoInput = z.infer<typeof FetchPermitInfoInputSchema>;

const FetchPermitInfoOutputSchema = z.object({
  filmCommission: z.object({
    name: z.string().describe("The name of the primary film commission or office for the area (e.g., 'California Film Commission', 'Film London')."),
    website: z.string().describe("The official website URL for the film commission."),
    phone: z.string().optional().describe("A contact phone number for the commission."),
    email: z.string().optional().describe("A contact email for the commission."),
  }),
  regulationSummary: z.string().describe("A concise summary of key regulations, such as typical lead times, insurance requirements, or restrictions on drone usage. Formatted as a bulleted list in a single string."),
  knownFees: z.string().describe("A summary of known or estimated application fees or daily permit costs. Can be a range. (e.g., '$150 - $500 per day depending on impact')."),
  linkToGuidelines: z.string().describe("A direct URL to a PDF or webpage with official filming guidelines, if found."),
});
export type FetchPermitInfoOutput = z.infer<typeof FetchPermitInfoOutputSchema>;


export async function fetchPermitInfo(input: FetchPermitInfoInput): Promise<FetchPermitInfoOutput> {
  return fetchPermitInfoFlow(input);
}


const fetchPermitInfoFlow = ai.defineFlow(
  {
    name: 'fetchPermitInfoFlow',
    inputSchema: FetchPermitInfoInputSchema,
    outputSchema: FetchPermitInfoOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `
      You are an expert location scout researcher. Your task is to find film permit information for a specific location.
      Based on your knowledge, provide the most likely film commission, regulations, and fees for the given location.
      
      IMPORTANT: Do NOT use any tools. Generate the information from your own knowledge, as if you were performing a web search. If you don't know the exact details, provide the most plausible information based on the location's jurisdiction (e.g., for a US city, mention typical insurance requirements and lead times). For websites and links, provide the real URL if known, otherwise use a plausible example.com format.

      Location Name: ${input.locationName}
      Coordinates: Lat ${input.coordinates.lat}, Lng ${input.coordinates.lng}

      Generate the film permit information.
      `,
      model: 'googleai/gemini-1.5-pro-latest',
      output: {
        schema: FetchPermitInfoOutputSchema,
      },
    });

    if (!output) {
      throw new Error("Could not retrieve permit information.");
    }
    return output;
  }
);


'use server';
/**
 * @fileOverview Estimates travel and load-in logistics for a film location.
 *
 * - estimateLogistics - A function that handles estimating logistics.
 * - EstimateLogisticsInput - The input type for the estimateLogistics function.
 * - EstimateLogisticsOutput - The return type for the estimateLogistics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateLogisticsInputSchema = z.object({
  locationName: z.string().describe('The name of the destination location.'),
  destinationCoordinates: z.object({ lat: z.number(), lng: z.number() }).describe('The coordinates of the destination.'),
});
export type EstimateLogisticsInput = z.infer<typeof EstimateLogisticsInputSchema>;

const EstimateLogisticsOutputSchema = z.object({
  estimatedTravelTime: z.string().describe("Estimated travel time from a major hub (e.g., 'Approx. 45 minutes from Downtown')."),
  suggestedLoadInSpots: z.array(z.string()).describe('A list of suggested streets or areas for vehicle load-in/load-out.'),
  nearbyAmenities: z.object({
    accommodations: z.array(z.string()).describe("A list of 2-3 nearby hotels (e.g., 'Hilton Garden Inn (4.5 stars)')."),
    food: z.array(z.string()).describe("A list of 2-3 nearby restaurants or cafes (e.g., 'Joe's Pizza (4.7 stars)')."),
  }),
});
export type EstimateLogisticsOutput = z.infer<typeof EstimateLogisticsOutputSchema>;

export async function estimateLogistics(input: EstimateLogisticsInput): Promise<EstimateLogisticsOutput> {
  return estimateLogisticsFlow(input);
}


const estimateLogisticsFlow = ai.defineFlow(
  {
    name: 'estimateLogisticsFlow',
    inputSchema: EstimateLogisticsInputSchema,
    outputSchema: EstimateLogisticsOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        prompt: `
        You are an expert film location manager. Analyze the logistics for a film shoot at the given location and provide key information.
        
        IMPORTANT: Do NOT use any tools. Generate the information from your own knowledge, as if you were using Google Maps and local directories.

        Location Name: "${input.locationName}"
        Coordinates: Lat ${input.destinationCoordinates.lat}, Lng ${input.destinationCoordinates.lng}

        Your task is to provide:
        1.  **Estimated Travel Time:** A reasonable estimate of travel time from a major nearby city hub (e.g., 'Approx. 30-45 minutes from Downtown LA depending on traffic').
        2.  **Suggested Load-in Spots:** A list of 2-3 suggested streets or areas for production vehicle load-in/load-out. Analyze the likely street type based on the coordinates (e.g., industrial area, residential street, main thoroughfare) to make realistic suggestions.
        3.  **Nearby Amenities:** A list of 2-3 plausible, well-known hotels and 2-3 restaurants/cafes near the location. Include a realistic star rating for each (e.g., 'Hilton Garden Inn (4.5 stars)', 'Joe's Pizza (4.7 stars)').
        `,
        model: 'googleai/gemini-1.5-pro-latest',
        output: {
          schema: EstimateLogisticsOutputSchema,
        },
    });

    if (!output) {
      throw new Error("Could not estimate logistics information.");
    }
    return output;
  }
);

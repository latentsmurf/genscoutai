
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

// Conceptual tool to get travel time. In a real app, this would call the Google Directions API.
const getTravelTime = ai.defineTool({
    name: 'getTravelTime',
    description: 'Calculates travel time from a major city hub to the destination coordinates.',
    inputSchema: z.object({ destinationCoordinates: z.object({ lat: z.number(), lng: z.number() }) }),
    outputSchema: z.string(),
}, async () => {
    return `Approx. ${Math.floor(Math.random() * 40) + 20} minutes from a major hub (traffic dependent).`;
});

// Conceptual tool to find nearby amenities. In a real app, this would use the Google Places API.
const findNearbyAmenities = ai.defineTool({
    name: 'findNearbyAmenities',
    description: 'Finds nearby hotels and restaurants.',
    inputSchema: z.object({ coordinates: z.object({ lat: z.number(), lng: z.number() }) }),
    outputSchema: z.object({
        accommodations: z.array(z.string()),
        food: z.array(z.string()),
    }),
}, async () => {
    return {
        accommodations: ['Grand Hyatt (4.6 stars)', 'Marriott Courtyard (4.4 stars)', 'Motel 8 (3.5 stars)'],
        food: ['The Corner Bistro (4.8 stars)', 'QuickEats Cafe (4.2 stars)', 'Starbucks (4.5 stars)'],
    };
});


const estimateLogisticsFlow = ai.defineFlow(
  {
    name: 'estimateLogisticsFlow',
    inputSchema: EstimateLogisticsInputSchema,
    outputSchema: EstimateLogisticsOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        prompt: `
        Analyze the logistics for a film shoot at "${input.locationName}".

        1.  Determine the best load-in and parking spots for production vehicles. Consider street width, parking lots, and alleys. Provide 2-3 suggestions.
        2.  Use the provided tools to get travel time estimates and find nearby amenities.
        `,
        tools: [getTravelTime, findNearbyAmenities],
        model: 'googleai/gemini-1.5-pro-latest',
        output: {
          schema: EstimateLogisticsOutputSchema,
        },
    });

    return output!;
  }
);


'use server';
/**
 * @fileOverview Finds local vendors for film production near a specific location.
 *
 * - findLocalVendors - A function that handles finding vendors.
 * - FindLocalVendorsInput - The input type for the findLocalVendors function.
 * - FindLocalVendorsOutput - The return type for the findLocalVendors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VendorSchema = z.object({
  name: z.string().describe('The name of the vendor.'),
  category: z.string().describe('The category of the vendor (e.g., "Camera Rental", "Catering").'),
  address: z.string().describe('The physical address of the vendor.'),
  phone: z.string().optional().describe('The contact phone number.'),
  website: z.string().url().optional().describe('The vendor\'s website.'),
  rating: z.number().min(1).max(5).optional().describe('A user rating, from 1 to 5.'),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).describe('The geographic coordinates of the vendor.'),
});
type Vendor = z.infer<typeof VendorSchema>;

const FindLocalVendorsInputSchema = z.object({
  category: z.enum(['Camera & Grip', 'Catering', 'RV & Vehicle Rental', 'Local Crew']),
  centerCoordinates: z.object({ lat: z.number(), lng: z.number() }).describe('The coordinates to search around.'),
});
export type FindLocalVendorsInput = z.infer<typeof FindLocalVendorsInputSchema>;

const FindLocalVendorsOutputSchema = z.object({
  vendors: z.array(VendorSchema),
});
export type FindLocalVendorsOutput = z.infer<typeof FindLocalVendorsOutputSchema>;

export async function findLocalVendors(input: FindLocalVendorsInput): Promise<FindLocalVendorsOutput> {
  return findLocalVendorsFlow(input);
}

// This is a conceptual tool. In a real app, this would query a database or a service like Google Places API.
const searchVendorDatabase = ai.defineTool({
    name: 'searchVendorDatabase',
    description: 'Searches a database for local production vendors by category near a set of coordinates.',
    inputSchema: FindLocalVendorsInputSchema,
    outputSchema: FindLocalVendorsOutputSchema,
}, async ({ category, centerCoordinates }) => {
    // Mock data for demonstration purposes
    const mockVendors: Record<typeof category.enum[number], Vendor[]> = {
        'Camera & Grip': [
            { name: 'Hollywood Camera Rentals', category: 'Camera & Grip', address: '123 Film Row, Los Angeles, CA', phone: '555-RENT-CAM', website: 'https://example.com', rating: 4.8, coordinates: { lat: centerCoordinates.lat + 0.05, lng: centerCoordinates.lng - 0.05 } },
            { name: 'Indie Grip & Electric', category: 'Camera & Grip', address: '456 Gaffer St, Los Angeles, CA', phone: '555-GET-GRIP', website: 'https://example.com', rating: 4.5, coordinates: { lat: centerCoordinates.lat - 0.02, lng: centerCoordinates.lng + 0.03 } },
        ],
        'Catering': [
            { name: 'Set-Feast Catering', category: 'Catering', address: '789 Crafty Ave, Burbank, CA', phone: '555-EAT-NOW', website: 'https://example.com', rating: 4.9, coordinates: { lat: centerCoordinates.lat + 0.03, lng: centerCoordinates.lng + 0.06 } },
            { name: 'The On-Location Kitchen', category: 'Catering', address: '101 Meal Dr, Culver City, CA', phone: '555-SET-FOOD', website: 'https://example.com', rating: 4.6, coordinates: { lat: centerCoordinates.lat - 0.04, lng: centerCoordinates.lng - 0.01 } },
        ],
        'RV & Vehicle Rental': [
            { name: 'Star Trailers', category: 'RV & Vehicle Rental', address: '222 Honeywagon Way, Sylmar, CA', phone: '555-RV-4-U', website: 'https://example.com', rating: 4.7, coordinates: { lat: centerCoordinates.lat + 0.1, lng: centerCoordinates.lng + 0.1 } },
        ],
        'Local Crew': [
            { name: 'LA Crew Pool', category: 'Local Crew', address: 'Online Service', phone: '555-CREW-UP', website: 'https://example.com', rating: 4.9, coordinates: { lat: centerCoordinates.lat + 0.01, lng: centerCoordinates.lng + 0.01 } },
        ],
    };
    return { vendors: mockVendors[category] || [] };
});

const findLocalVendorsFlow = ai.defineFlow(
  {
    name: 'findLocalVendorsFlow',
    inputSchema: FindLocalVendorsInputSchema,
    outputSchema: FindLocalVendorsOutputSchema,
  },
  async (input) => {
    const {toolOutputs} = await ai.generate({
        prompt: `Find vendors for the category "${input.category}" near the given coordinates.`,
        tools: [searchVendorDatabase],
        model: 'googleai/gemini-1.5-flash-latest', // Use a faster model as this is a simple tool call
    });

    const vendors = toolOutputs?.[0]?.output;
    if (!vendors) {
        return { vendors: [] };
    }
    return vendors;
  }
);

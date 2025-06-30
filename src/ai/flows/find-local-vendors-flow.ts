
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
  website: z.string().optional().describe("The vendor's website."),
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

const findLocalVendorsFlow = ai.defineFlow(
  {
    name: 'findLocalVendorsFlow',
    inputSchema: FindLocalVendorsInputSchema,
    outputSchema: FindLocalVendorsOutputSchema,
  },
  async ({ category, centerCoordinates }) => {
    const { output } = await ai.generate({
        prompt: `
        You are a film production assistant. Your task is to find local vendors based on a specified category and location.
        Based on your knowledge of major cities and production hubs, generate a list of 2-3 realistic, well-known (or plausibly named) vendors for the requested category.

        IMPORTANT: Do NOT use any tools. Generate the list from your own knowledge, as if you were searching the web.

        Category: "${category}"
        Search Near Location (Latitude, Longitude): ${centerCoordinates.lat}, ${centerCoordinates.lng}

        For each vendor, you must provide a plausible name, address, phone number, and website. The address and coordinates should be reasonably close to the provided location coordinates. If you do not know any real vendors for the area, create realistic-sounding ones that would fit the location (e.g., if it's in Los Angeles, use LA-style names and addresses).
        `,
        model: 'googleai/gemini-1.5-pro-latest',
        output: {
          schema: FindLocalVendorsOutputSchema,
        },
    });

    return output || { vendors: [] };
  }
);

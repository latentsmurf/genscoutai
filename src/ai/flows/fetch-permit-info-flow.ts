
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
    website: z.string().url().describe("The official website URL for the film commission."),
    phone: z.string().optional().describe("A contact phone number for the commission."),
    email: z.string().email().optional().describe("A contact email for the commission."),
  }),
  regulationSummary: z.string().describe("A concise summary of key regulations, such as typical lead times, insurance requirements, or restrictions on drone usage. Formatted as a bulleted list in a single string."),
  knownFees: z.string().describe("A summary of known or estimated application fees or daily permit costs. Can be a range. (e.g., '$150 - $500 per day depending on impact')."),
  linkToGuidelines: z.string().url().describe("A direct URL to a PDF or webpage with official filming guidelines, if found."),
});
export type FetchPermitInfoOutput = z.infer<typeof FetchPermitInfoOutputSchema>;


export async function fetchPermitInfo(input: FetchPermitInfoInput): Promise<FetchPermitInfoOutput> {
  return fetchPermitInfoFlow(input);
}

// This is a conceptual tool. In a real application, this would use a web search API.
const searchFilmPermitInfo = ai.defineTool(
  {
    name: 'searchFilmPermitInfo',
    description: 'Searches the web for official film commission websites, permit applications, and regulations for a specific city or region.',
    inputSchema: FetchPermitInfoInputSchema,
    outputSchema: FetchPermitInfoOutputSchema,
  },
  async ({ locationName }) => {
    // Mock data based on location name for demonstration
    if (locationName.toLowerCase().includes('paris')) {
      return {
        filmCommission: {
          name: 'Mission Cinéma - City of Paris',
          website: 'https://www.paris.fr/pages/tourner-a-paris-2334',
          phone: '+33 1 42 76 22 21',
          email: 'tournages@paris.fr',
        },
        regulationSummary: "- Application lead time: At least 15 days for standard shoots.\n- Public liability insurance of €8M required.\n- Drone use heavily restricted, requires special authorization.",
        knownFees: 'Application fee: €200. Daily fees vary by district and impact, from €300 to €2,500.',
        linkToGuidelines: 'https://cdn.paris.fr/paris/2023/09/21/2b1a4b4e3f1e7d8c4d8f9b9e6c6b3e7d.pdf',
      };
    }
    if (locationName.toLowerCase().includes('los angeles') || locationName.toLowerCase().includes('ca')) {
         return {
            filmCommission: {
                name: 'FilmL.A., Inc.',
                website: 'https://www.filmla.com/',
                phone: '213-977-8600',
                email: 'info@filmla.com',
            },
            regulationSummary: "- Standard permit processing time is 3 business days.\n- General liability insurance of $1M required.\n- Student projects may qualify for waivers and discounts.",
            knownFees: 'Application fee: $835. Additional fees for monitors, police, and specific locations apply.',
            linkToGuidelines: 'https://www.filmla.com/wp-content/uploads/2023/04/Filming-Rules-and-Regulations.pdf',
        };
    }
    // Default mock data
    return {
      filmCommission: {
        name: 'Regional Film & Events Office',
        website: 'https://www.examplefilmcommission.com',
        phone: '555-123-4567',
        email: 'permits@examplefilmcommission.com',
      },
      regulationSummary: "- Typical lead time: 5-10 business days.\n- General liability insurance of $1M is usually required.\n- Neighborhood notification may be required for residential filming.",
      knownFees: 'Application fees typically start at $500. Additional costs for police or fire personnel may apply.',
      linkToGuidelines: 'https://www.examplefilmcommission.com/guidelines.pdf',
    };
  }
);


const fetchPermitInfoFlow = ai.defineFlow(
  {
    name: 'fetchPermitInfoFlow',
    inputSchema: FetchPermitInfoInputSchema,
    outputSchema: FetchPermitInfoOutputSchema,
  },
  async (input) => {
     const {toolOutputs} = await ai.generate({
      prompt: `Find the film permit information for ${input.locationName}.`,
      tools: [searchFilmPermitInfo],
    });

    const permitInfo = toolOutputs[0]?.output;
    if (!permitInfo) {
      throw new Error("Could not retrieve permit information using the available tool.");
    }
    return permitInfo;
  }
);

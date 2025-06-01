
'use server';
/**
 * @fileOverview Generates a descriptive summary and logistical insights for a given location.
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
  permittingInfo: z.string().describe("Guidance on likely film permitting authorities (e.g., 'city film office,' 'county parks department') or how to find this information. General advice based on location type."),
  parkingAssessment: z.string().describe("Assessment of general nearby parking suitability for production vehicles and crew, based on location type (urban, rural, etc.)."),
  logisticsFeasibility: z.string().describe("Comments on the likely feasibility of setting up a small basecamp (craft services, actor holding, generators) near the location, considering space and accessibility based on location type."),
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
  prompt: `You are a helpful AI assistant providing information about a location for potential film scouting.

Location: {{{locationName}}}
{{#if coordinates}}
Approximate Coordinates: Latitude: {{{coordinates.lat}}}, Longitude: {{{coordinates.lng}}}.
{{/if}}

First, provide a concise and interesting summary (a single paragraph of 2-4 sentences, maximum 150 words) about the location. Focus on notable features, brief history, or cultural significance. Avoid generic statements. Be informative and engaging.

Next, provide practical information for film production logistics based on the nature of the location (e.g., urban street, park, remote natural area, specific landmark).

1.  **Permitting Info**: Describe the likely type of permitting authority (e.g., "City Film Office," "National Park Service," "Private Property Owner") one would need to contact for filming. If specific contacts are unknown, suggest how one might find this information (e.g., "Check the official city/county website for a film commission or special events office.").
2.  **Parking Assessment**: Based on the location type, assess the general parking situation. Consider availability for production vehicles (trucks, vans) and crew cars. For example: "Urban core, street parking likely metered and scarce; larger vehicles may need designated zones arranged with the city." or "Rural area, ample space for parking on adjacent land might be possible, subject to permission."
3.  **Logistics Feasibility**: Comment on the general feasibility of setting up a small basecamp (for craft services, equipment staging, actor holding areas, generators if needed). Consider available space, accessibility, and potential impact on the surroundings. For example: "Public park, designated areas might be available for small setups, but likely requires coordination with park authorities." or "Remote natural landmark, basecamp might need to be established some distance away due to protected status or difficult terrain."

Provide these details clearly and concisely.

Example summary output for "Eiffel Tower": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower from 1887–1889 for the 1889 World's Fair. It has become a global cultural icon of France and one of the most recognizable structures in the world."
Example permitting info: "Likely requires permits from the City of Paris Film Office and potentially specific authorities managing the Champ de Mars."
Example parking assessment: "Street parking in the immediate vicinity is extremely limited and challenging for large vehicles. Production would need to coordinate dedicated parking zones or use off-site lots."
Example logistics feasibility: "Setting up extensive basecamp directly at the tower base is difficult due to high tourist traffic and security. Nearby streets or designated areas on the Champ de Mars might be possibilities with proper authorization."
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



'use server';
/**
 * @fileOverview Generates a potential shot list based on a cinematic image and its context.
 *
 * - generateShotList - A function that handles generating the shot list.
 * - GenerateShotListInput - The input type for the generateShotList function.
 * - GenerateShotListOutput - The return type for the generateShotList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShotSchema = z.object({
    shotNumber: z.number().describe("The sequential number of the shot (e.g., 1, 2, 3)."),
    cameraAngle: z.string().describe("Description of the camera angle and framing (e.g., 'Medium Shot', 'Wide Angle, low perspective')."),
    shotDescription: z.string().describe("A brief description of the action or subject in the shot."),
    notes: z.string().optional().describe("Potential directorial or technical notes (e.g., 'Slow pan right', 'Use a stabilizer')."),
});
export type Shot = z.infer<typeof ShotSchema>;

const GenerateShotListInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated cinematic image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sceneContext: z.object({
      location: z.string(),
      lens: z.string(),
      time: z.string(),
      weather: z.string(),
      direction: z.string(),
    }).describe("The parameters used to generate the cinematic image."),
});
export type GenerateShotListInput = z.infer<typeof GenerateShotListInputSchema>;

const GenerateShotListOutputSchema = z.object({
    shots: z.array(ShotSchema).describe("An array of 3-5 potential shots that could be filmed in this location, inspired by the provided image."),
});
export type GenerateShotListOutput = z.infer<typeof GenerateShotListOutputSchema>;


export async function generateShotList(input: GenerateShotListInput): Promise<GenerateShotListOutput> {
  return generateShotListFlow(input);
}


const generateShotListFlow = ai.defineFlow(
  {
    name: 'generateShotListFlow',
    inputSchema: GenerateShotListInputSchema,
    outputSchema: GenerateShotListOutputSchema,
  },
  async ({ imageDataUri, sceneContext }) => {
    
    const { output } = await ai.generate({
        prompt: `
        You are a film director's assistant creating a sample shot list.
        Analyze the provided image and its context to suggest a sequence of 3 to 5 potential shots.
        The goal is to capture the mood and character of the location.
        Base your suggestions on the provided image and the following context.

        Image Context:
        - Location: ${sceneContext.location}
        - Camera Lens Used: ${sceneContext.lens}
        - Time of Day: ${sceneContext.time}
        - Weather: ${sceneContext.weather}
        - Initial Shot Direction: ${sceneContext.direction}

        Provided Image:
        {{media url=imageDataUri}}

        Based on everything, generate a shot list. The first shot should closely match the provided image and context. Subsequent shots should be logical follow-ups (e.g., a wide shot followed by a medium, then a close-up, or shots exploring different angles of the same location).
        `,
        model: 'googleai/gemini-1.5-pro-latest',
        output: {
          schema: GenerateShotListOutputSchema,
        },
    });

    return output || { shots: [] };
  }
);

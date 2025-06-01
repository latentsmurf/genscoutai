
'use server';
/**
 * @fileOverview Generates a cinematic shot based on a street view image and parameters.
 *
 * - generateCinematicShot - A function that handles the cinematic shot generation.
 * - GenerateCinematicShotInput - The input type for the generateCinematicShot function.
 * - GenerateCinematicShotOutput - The return type for the generateCinematicShot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCinematicShotInputSchema = z.object({
  streetViewImageDataUri: z
    .string()
    .describe(
      "A snapshot of a street view scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  focalLength: z.string().describe('The desired camera focal length (e.g., "24mm", "50mm", "85mm"). This influences field of view and perspective.'),
  timeOfDayToken: z.string().describe('A descriptive token for the time of day (e.g., "golden hour", "night", "noon"). This influences lighting and mood.'),
  weatherConditionPrompt: z.string().describe('A short prompt describing the weather (e.g., "light rain", "foggy morning", "clear sky"). This influences atmospheric effects.'),
  sceneDescription: z.string().optional().describe('Optional brief description of the location or scene context.'),
  shotDirection: z.string().describe('Specific instructions for camera angle, view, or framing (e.g., "eye-level view", "low angle looking up").'),
});
export type GenerateCinematicShotInput = z.infer<typeof GenerateCinematicShotInputSchema>;

const GenerateCinematicShotOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .nullable()
    .describe(
      "The AI-generated cinematic image as a data URI (data:image/png;base64,...), or null if generation failed. Expected aspect ratio is 16:9 landscape."
    ),
});
export type GenerateCinematicShotOutput = z.infer<typeof GenerateCinematicShotOutputSchema>;

export async function generateCinematicShot(input: GenerateCinematicShotInput): Promise<GenerateCinematicShotOutput> {
  return generateCinematicShotFlow(input);
}

// This prompt definition is kept for reference or potential future use with models that prefer structured prompts.
// The current implementation crafts a detailed text prompt directly for the image generation model.
const _promptTemplate = ai.definePrompt({
  name: 'generateCinematicShotPromptTemplate',
  input: {schema: GenerateCinematicShotInputSchema},
  output: {schema: GenerateCinematicShotOutputSchema},
  prompt: `
Objective: Create a high-quality, cinematic photograph in 16:9 landscape aspect ratio.
Base Image: Use the provided street view image as the structural and content foundation.
{{media url=streetViewImageDataUri}}

Key Cinematic Adjustments:
1.  **Focal Length & Perspective**: Re-interpret the scene as if captured with a {{{focalLength}}} lens. This must influence the field of view, depth, and perspective. For wider lenses (e.g., 16mm, 24mm), show a broader view with potential perspective distortion. For longer lenses (e.g., 85mm, 135mm), create a more compressed perspective. Ensure the final image is 16:9 landscape regardless of lens choice.
2.  **Time of Day & Lighting**: The ambiance, lighting, and shadows must accurately reflect '{{{timeOfDayToken}}}'.
3.  **Weather Conditions**: The scene must incorporate the specified weather: '{{{weatherConditionPrompt}}}'.
4.  **Shot Framing**: Adhere to the specified shot direction: '{{{shotDirection}}}'.
5.  **Scene Context**: {{#if sceneDescription}}The location is '{{{sceneDescription}}}'.{{else}}The location is a general urban/street scene.{{/if}}

CRITICAL INSTRUCTIONS:
A.  **Output Format**: The final image MUST be in a 16:9 landscape aspect ratio. DO NOT generate portrait or square images.
B.  **Remove ALL UI Overlays**: Ensure the final image is purely the photographic scene. All UI elements, text, navigation arrows, watermarks, logos, or any other non-diegetic graphical elements present in the original street view image MUST be completely removed.
C.  **Cinematic Quality**: Focus on realistic and compelling composition, lighting, color grading, and texture to produce a visually appealing, film-like image. Avoid an overly "digital," "artificial," or "game-like" look.
D.  **Maintain Scene Integrity**: While stylizing, the core architectural elements, objects, and general layout of the original scene should remain recognizable. Do not invent entirely new structures or radically alter the environment beyond what's plausible for the requested cinematic transformation.

Generate the reimagined cinematic shot based on these precise instructions.
`,
});


const generateCinematicShotFlow = ai.defineFlow(
  {
    name: 'generateCinematicShotFlow',
    inputSchema: GenerateCinematicShotInputSchema,
    outputSchema: GenerateCinematicShotOutputSchema,
  },
  async (input: GenerateCinematicShotInput) => {
    // Construct a detailed text prompt for the image generation model
    let textPrompt = `Objective: Create a high-quality, cinematic photograph in 16:9 landscape aspect ratio.
Base Image: Use the provided street view image as the structural and content foundation.
Key Cinematic Adjustments:
1. Focal Length & Perspective: Re-interpret the scene as if captured with a ${input.focalLength} lens. This must influence the field of view, depth, and perspective. For wider lenses (e.g., 16mm, 24mm), show a broader view with potential perspective distortion. For longer lenses (e.g., 85mm, 135mm), create a more compressed perspective. IMPORTANT: The final image output must always be 16:9 landscape, regardless of the chosen focal length.
2. Time of Day & Lighting: The ambiance, lighting, and shadows must accurately reflect '${input.timeOfDayToken}'.
3. Weather Conditions: The scene must incorporate the specified weather: '${input.weatherConditionPrompt}'.
4. Shot Framing: Adhere to the specified shot direction: '${input.shotDirection}'.
`;

    if (input.sceneDescription) {
      textPrompt += `5. Scene Context: The location is '${input.sceneDescription}'.\n`;
    } else {
      textPrompt += `5. Scene Context: The location is a general urban/street scene.\n`;
    }

    textPrompt += `CRITICAL INSTRUCTIONS:
A. Output Format: The final image MUST be in a 16:9 landscape aspect ratio. DO NOT generate portrait or square images.
B. Remove ALL UI Overlays: Ensure the final image is purely the photographic scene. All UI elements, text, navigation arrows, watermarks, logos, or any other non-diegetic graphical elements present in the original street view image MUST be completely removed.
C. Cinematic Quality: Focus on realistic and compelling composition, lighting, color grading, and texture to produce a visually appealing, film-like image. Avoid an overly "digital," "artificial," or "game-like" look.
D. Maintain Scene Integrity: While stylizing, the core architectural elements, objects, and general layout of the original scene should remain recognizable.

Generate the reimagined cinematic shot based on these precise instructions.
`;

    const imageGenPrompt = [
        {text: textPrompt},
        {media: {url: input.streetViewImageDataUri}},
    ];

    try {
      const {media, text} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: imageGenPrompt,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
           safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (media && media.url) {
        return { generatedImageDataUri: media.url };
      } else {
        console.warn('Image generation did not return media.url. Text response from AI:', text);
        return { generatedImageDataUri: null };
      }
    } catch (error) {
      console.error('Error in generateCinematicShotFlow during AI generation:', error);
      return { generatedImageDataUri: null };
    }
  }
);



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
  focalLength: z.string().describe('The desired camera focal length (e.g., "24mm", "50mm", "85mm").'),
  timeOfDayToken: z.string().describe('A descriptive token for the time of day (e.g., "golden hour", "night").'),
  weatherConditionPrompt: z.string().describe('A short prompt describing the weather (e.g., "light rain", "foggy morning").'),
  sceneDescription: z.string().optional().describe('Optional brief description of the location or scene context.'),
});
export type GenerateCinematicShotInput = z.infer<typeof GenerateCinematicShotInputSchema>;

const GenerateCinematicShotOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .nullable()
    .describe(
      "The AI-generated cinematic image as a data URI (data:image/png;base64,...), or null if generation failed."
    ),
  // We could add more details here if the AI provides them, e.g., revised scene description.
});
export type GenerateCinematicShotOutput = z.infer<typeof GenerateCinematicShotOutputSchema>;

export async function generateCinematicShot(input: GenerateCinematicShotInput): Promise<GenerateCinematicShotOutput> {
  return generateCinematicShotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCinematicShotPrompt',
  input: {schema: GenerateCinematicShotInputSchema},
  output: {schema: GenerateCinematicShotOutputSchema}, // The model will generate an image, not structured JSON for this output.
                                                        // We expect the image to be in the `media` part of the response.
  prompt: `You are an expert virtual Director of Photography. Your task is to transform a raw street-level image into a high-quality, cinematic still shot.

Consider the following parameters for your render:
- Focal Length: Re-interpret the scene as if it were captured with a {{{focalLength}}} lens. This should influence the field of view, perspective, and potential depth of field.
- Time of Day: The ambiance should reflect '{{{timeOfDayToken}}}'.
- Weather: The scene should incorporate '{{{weatherConditionPrompt}}}'.
- Scene Context: {{#if sceneDescription}}The location is '{{{sceneDescription}}}'. {{else}}The location is a general urban/street scene.{{/if}}

IMPORTANT INSTRUCTIONS:
1.  **Remove UI Overlays**: Eliminate any text, navigation arrows, watermarks, or other UI elements present in the original street view image.
2.  **Cinematic Quality**: Focus on composition, lighting, and color grading to produce a visually appealing, film-like image. Avoid an overly "digital" or "game-like" look.
3.  **Maintain Scene Integrity**: While stylizing, the core elements and layout of the original scene should remain recognizable. Do not invent entirely new structures or radically alter the environment unless it enhances the cinematic feel in a plausible way.

Original street view image:
{{media url=streetViewImageDataUri}}

Generate the reimagined cinematic shot.
`,
});

const generateCinematicShotFlow = ai.defineFlow(
  {
    name: 'generateCinematicShotFlow',
    inputSchema: GenerateCinematicShotInputSchema,
    outputSchema: GenerateCinematicShotOutputSchema, // Flow output will be structured
  },
  async (input: GenerateCinematicShotInput) => {
    // For image generation, we use ai.generate directly with specific model and config.
    // The prompt defined above is primarily for text-based models if we were to use it for that.
    // Here, we re-craft a prompt array suitable for Gemini 2.0 Flash image generation.
    
    const imageGenPrompt = [
        {text: `Re-render the following street scene as a cinematic still, as if shot with a ${input.focalLength} lens. The time of day is '${input.timeOfDayToken}' and the weather is '${input.weatherConditionPrompt}'. ${input.sceneDescription ? `The location is '${input.sceneDescription}'.` : ''} Remove all UI elements, text, and navigation arrows from the original image. Focus on cinematic quality, lighting, and composition.`},
        {media: {url: input.streetViewImageDataUri}},
    ];

    try {
      const {media, text} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: imageGenPrompt,
        config: {
          responseModalities: ['IMAGE', 'TEXT'], // Important: Must request IMAGE modality
           safetySettings: [ // Example safety settings, adjust as needed
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
        // output: { schema: GenerateCinematicShotOutputSchema } // Not strictly needed here as we manually construct the output
      });

      if (media && media.url) {
        return { generatedImageDataUri: media.url };
      } else {
        console.warn('Image generation did not return media.url. Text response:', text);
        return { generatedImageDataUri: null };
      }
    } catch (error) {
      console.error('Error in generateCinematicShotFlow during AI generation:', error);
      return { generatedImageDataUri: null };
    }
  }
);

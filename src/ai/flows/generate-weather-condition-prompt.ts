
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating weather condition prompts.
 *
 * The flow takes a weather condition token as input and returns a prompt that can be used to modify the scene's appearance.
 * - generateWeatherConditionPrompt - A function that handles the weather condition prompt generation process.
 * - GenerateWeatherConditionInput - The input type for the generateWeatherConditionPrompt function.
 * - GenerateWeatherConditionOutput - The return type for the generateWeatherConditionPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeatherConditionInputSchema = z.object({
  weatherCondition: z
    .string()
    .describe("A token representing the desired weather condition (e.g., 'rain', 'snow', 'fog')."),
});
export type GenerateWeatherConditionInput = z.infer<typeof GenerateWeatherConditionInputSchema>;

const GenerateWeatherConditionOutputSchema = z.object({
  prompt: z.string().describe('A prompt that can be used to modify the scene appearance.'),
});
export type GenerateWeatherConditionOutput = z.infer<typeof GenerateWeatherConditionOutputSchema>;

export async function generateWeatherConditionPrompt(
  input: GenerateWeatherConditionInput
): Promise<GenerateWeatherConditionOutput> {
  return generateWeatherConditionPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeatherConditionPrompt',
  input: {schema: GenerateWeatherConditionInputSchema},
  output: {schema: GenerateWeatherConditionOutputSchema},
  prompt: `You are generating a prompt to create a weather condition for a scene.

The desired weather condition is: {{{weatherCondition}}}

Generate a concise prompt phrase that describes this weather condition, suitable for an image generation model. For example, if the condition is "rain", a good prompt might be "light rain" or "raining". If the condition is "clear", it might be "clear sky".`,
});

const generateWeatherConditionPromptFlow = ai.defineFlow(
  {
    name: 'generateWeatherConditionPromptFlow',
    inputSchema: GenerateWeatherConditionInputSchema,
    outputSchema: GenerateWeatherConditionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


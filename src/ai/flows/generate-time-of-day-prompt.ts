'use server';
/**
 * @fileOverview Generates a descriptive prompt token based on the time of day.
 *
 * - generateTimeOfDayPrompt - A function that generates the prompt token.
 * - GenerateTimeOfDayPromptInput - The input type for the generateTimeOfDayPrompt function.
 * - GenerateTimeOfDayPromptOutput - The return type for the generateTimeOfDayPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTimeOfDayPromptInputSchema = z.object({
  time: z
    .number()
    .min(0)
    .max(24)
    .describe('The time of day, represented as a number between 0 and 24.'),
});
export type GenerateTimeOfDayPromptInput = z.infer<typeof GenerateTimeOfDayPromptInputSchema>;

const GenerateTimeOfDayPromptOutputSchema = z.object({
  promptToken: z
    .string()
    .describe(
      'A descriptive token representing the time of day (e.g., night, blue hour, golden hour, noon, dusk).'
    ),
});
export type GenerateTimeOfDayPromptOutput = z.infer<typeof GenerateTimeOfDayPromptOutputSchema>;

export async function generateTimeOfDayPrompt(
  input: GenerateTimeOfDayPromptInput
): Promise<GenerateTimeOfDayPromptOutput> {
  return generateTimeOfDayPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'timeOfDayPrompt',
  input: {schema: GenerateTimeOfDayPromptInputSchema},
  output: {schema: GenerateTimeOfDayPromptOutputSchema},
  prompt: `Based on the time {{{time}}}, generate a single descriptive token that best represents that time of day for influencing the visual style of a globe. Options are: night, blue hour, golden hour, noon, dusk. Be concise and only return one of the options.`,
});

const generateTimeOfDayPromptFlow = ai.defineFlow(
  {
    name: 'generateTimeOfDayPromptFlow',
    inputSchema: GenerateTimeOfDayPromptInputSchema,
    outputSchema: GenerateTimeOfDayPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

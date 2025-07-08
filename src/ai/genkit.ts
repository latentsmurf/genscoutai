import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {replicatePlugin} from './replicate';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    replicatePlugin,
  ],
  model: 'googleai/gemini-1.5-pro-latest', // Updated default model
});

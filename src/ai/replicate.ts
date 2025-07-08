import {Action, GenkitPlugin, Plugin, action} from 'genkit';
import Replicate from 'replicate';
import {z} from 'zod';

export const fluxDepth = 'black-forest-labs/flux-depth-dev';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const generateRealisticImageSchema = z.object({
  prompt: z.string(),
  control_image: z.string(),
  num_outputs: z.number().optional(),
  num_inference_steps: z.number().optional(),
  guidance: z.number().optional(),
  seed: z.number().optional(),
  output_format: z.string().optional(),
  output_quality: z.number().optional(),
  disable_safety_checker: z.boolean().optional(),
  megapixels: z.string().optional(),
});

export const replicatePlugin: GenkitPlugin = Plugin(
  'replicate',
  async (options) => ({
    actions: [
      action(
        {
          name: 'generateRealisticImage',
          inputSchema: generateRealisticImageSchema,
        },
        async (input) => {
          const output = await replicate.run(fluxDepth, {input});
          return output;
        }
      ),
    ],
  })
);

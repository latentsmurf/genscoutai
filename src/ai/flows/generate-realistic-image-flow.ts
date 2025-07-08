import {z} from 'zod';
import {Action, flow} from 'genkit';
import {generateRealisticImageSchema} from '../replicate';

export const generateRealisticImageFlow = flow(
  {
    name: 'generateRealisticImageFlow',
    inputSchema: z.object({
      control_image: z.string(),
      weather: z.string().optional(),
      time_of_day: z.string().optional(),
    }),
    outputSchema: z.any(),
  },
  async ({control_image, weather, time_of_day}) => {
    const realisticImage = await new Action(
      'generateRealisticImage'
    ).run(
      {
        control_image,
        prompt: `A realistic image of a street, ${
          weather ? `with ${weather} weather,` : ''
        } ${time_of_day ? `during the ${time_of_day}` : ''}`,
      },
      {
        context: {
          waitUntil: true,
        },
      }
    );

    return realisticImage;
  }
);

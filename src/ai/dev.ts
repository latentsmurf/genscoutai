
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-time-of-day-prompt.ts';
import '@/ai/flows/generate-weather-condition-prompt.ts';
import '@/ai/flows/generate-cinematic-shot-flow.ts';
import '@/ai/flows/generate-location-info-flow.ts';
import '@/ai/flows/reframe-image-flow.ts'; // Added new flow

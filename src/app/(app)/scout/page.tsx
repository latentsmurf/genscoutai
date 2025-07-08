
import GenScoutAIClient from '@/components/client/GenScoutAIClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scout',
  description: 'Find, configure, and visualize your cinematic scene using the AI-powered tools on the GenScoutAI scout page.',
};

export default function ScoutPage({ user, isGuestMode }) {
  return <GenScoutAIClient user={user} isGuestMode={isGuestMode} />;
}

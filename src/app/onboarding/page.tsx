import { Metadata } from 'next';
import OnboardingPageClient from './OnboardingPageClient';

export const metadata: Metadata = {
  title: 'Taste Preferences | Meal Planner',
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}

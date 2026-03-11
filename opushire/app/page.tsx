import { AgenticHero } from '@/components/landing/AgenticHero';
import { AgenticEvolution } from '@/components/landing/AgenticEvolution';
import { AgenticIntelligence } from '@/components/landing/AgenticIntelligence';
import { AgenticCTA } from '@/components/landing/AgenticCTA';

export default function Home() {
  return (
    <main className="overflow-hidden bg-background-dark">
      <AgenticHero />
      <AgenticEvolution />
      <AgenticIntelligence />
      <AgenticCTA />
    </main>
  );
}

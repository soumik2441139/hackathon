import { JobList } from '@/components/jobs/JobList';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function JobsPage() {
    return (
        <main className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal direction="down">
                    <header className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">Find your <span className="text-gradient">next role</span></h1>
                        <p className="text-white/50 text-xl">Explore 2,500+ active opportunities from top-tier startups.</p>
                    </header>
                </ScrollReveal>

                <JobList />
            </div>
        </main>
    );
}

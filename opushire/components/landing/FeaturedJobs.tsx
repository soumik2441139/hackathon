import { MOCK_JOBS } from '@/lib/data';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../animations/ScrollReveal';
import Link from 'next/link';

export const FeaturedJobs = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                <ScrollReveal direction="right" duration={0.8}>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Opportunities</h2>
                        <p className="text-white/50 max-w-lg">
                            Hand-picked roles from top-tier companies actively looking for student talent like you.
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal direction="left" duration={0.8}>
                    <Link href="/jobs">
                        <Button variant="outline">View All Jobs</Button>
                    </Link>
                </ScrollReveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_JOBS.slice(0, 4).map((job, index) => (
                    <ScrollReveal key={job._id} delay={index * 0.1} direction="up" duration={0.6}>
                        <JobCard job={job} />
                    </ScrollReveal>
                ))}
            </div>
        </section>
    );
};

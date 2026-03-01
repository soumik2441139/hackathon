"use client";
import React, { useEffect, useState } from 'react';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../animations/ScrollReveal';
import Link from 'next/link';

export const FeaturedJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        jobsApi.getAll({ featured: 'true', limit: 4 })
            .then(res => setJobs(res.data.jobs))
            .catch(err => console.error('Failed to fetch featured jobs:', err))
            .finally(() => setLoading(false));
    }, []);

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card h-[400px] animate-pulse bg-white/5 rounded-3xl" />
                    ))
                ) : (
                    jobs.map((job, index) => (
                        <ScrollReveal key={job._id} delay={index * 0.1} direction="up" duration={0.6} width="100%">
                            <JobCard job={job} />
                        </ScrollReveal>
                    ))
                )}
            </div>
        </section>
    );
};

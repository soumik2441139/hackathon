"use client";
import React, { useState } from 'react';
import { MOCK_JOBS } from '@/lib/data';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilter } from '@/components/jobs/JobFilter';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Search } from 'lucide-react';

export const JobList = () => {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("All");

    const filteredJobs = MOCK_JOBS.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.company.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "All" || job.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filter */}
            <aside className="w-full lg:w-72 shrink-0">
                <JobFilter
                    selectedType={filterType}
                    onTypeChange={setFilterType}
                />
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search jobs, companies, or skills..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 bg-brand-glass border border-brand-glass-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-violet/50 transition-all font-medium text-brand-text placeholder:text-brand-text/30"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job, index) => (
                            <ScrollReveal key={job._id} delay={index * 0.05} direction="up" width="100%">
                                <JobCard job={job} />
                            </ScrollReveal>
                        ))
                    ) : (
                        <div className="text-center py-20 glass-card">
                            <p className="text-brand-text/40 text-lg">No jobs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

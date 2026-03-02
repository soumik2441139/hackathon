"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { jobs as jobsApi, JobFilters } from '@/lib/api';
import { Job } from '@/lib/types';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilter } from '@/components/jobs/JobFilter';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Search } from 'lucide-react';

export const JobList = () => {
    const [jobList, setJobList] = useState<Job[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [page, setPage] = useState(1);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const filters: JobFilters = { page, limit: 12 };
            if (search) filters.q = search;
            if (filterType !== 'All') filters.type = filterType;
            const res = await jobsApi.getAll(filters);
            setJobList(res.data.jobs);
            setPagination(res.data.pagination);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [search, filterType, page]);

    useEffect(() => {
        const timer = setTimeout(fetchJobs, 300);
        return () => clearTimeout(timer);
    }, [fetchJobs]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [search, filterType]);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 shrink-0">
                <JobFilter selectedType={filterType} onTypeChange={setFilterType} />
            </aside>

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

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/5" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 glass-card">
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : jobList.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {jobList.map((job, index) => (
                                <ScrollReveal key={job._id} delay={index * 0.05} direction="up" width="100%">
                                    <JobCard job={job} />
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center gap-3 pt-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-5 py-2 glass-card rounded-xl text-sm font-bold disabled:opacity-30 hover:border-white/20 transition-all"
                                >← Prev</button>
                                <span className="px-5 py-2 text-sm text-white/50">
                                    Page {page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                    className="px-5 py-2 glass-card rounded-xl text-sm font-bold disabled:opacity-30 hover:border-white/20 transition-all"
                                >Next →</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 glass-card">
                        <p className="text-brand-text/40 text-lg">No jobs found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

"use client";
import React, { useState, useEffect } from 'react';
import { applications } from '@/lib/api';
import { Application } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { timeAgo } from '@/lib/utils';

export const ApplicationTracker = () => {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        applications.getMine()
            .then(res => setApps(res.data))
            .catch(err => setError(err.message || 'Failed to load applications'))
            .finally(() => setLoading(false));
    }, []);

    const statusVariant = (status: string) => {
        if (status === 'Interview') return 'cyan';
        if (status === 'Shortlisted') return 'violet';
        if (status === 'Hired') return 'cyan';
        return 'default';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Your Applications</h2>
                <span className="text-sm text-white/50">{loading ? '...' : `${apps.length} Total`}</span>
            </div>

            {loading && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-6 h-24 animate-pulse bg-white/5" />
                    ))}
                </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {!loading && !error && apps.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <p className="text-white/40">You haven&apos;t applied to any jobs yet.</p>
                </div>
            )}

            {!loading && apps.length > 0 && (
                <div className="space-y-4">
                    {apps.map(app => {
                        const job = typeof app.job === 'string' ? null : app.job;
                        return (
                            <div key={app._id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                                        {job?.companyLogo?.startsWith('http') ? (
                                            <img src={job.companyLogo} alt={`${job.company} logo`} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            job?.companyLogo ?? (typeof app.job === 'object' ? app.job?.company?.charAt(0) : '?')
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{job?.title ?? 'Job'}</h3>
                                        <p className="text-sm text-white/50">{job?.company}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block">
                                        <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-1">Applied</p>
                                        <p className="text-sm">{timeAgo(app.appliedAt)}</p>
                                    </div>
                                    <Badge variant={statusVariant(app.status)} className="px-5 py-2">
                                        {app.status}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

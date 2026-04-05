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
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">Your Applications</h2>
                <span className="text-sm font-bold uppercase tracking-widest text-orange-400 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                    {loading ? 'SYNCING...' : `${apps.length} ACTIVE`}
                </span>
            </div>

            {loading && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-6 h-28 animate-pulse bg-white/5 border-white/5 rounded-2xl" />
                    ))}
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {!loading && !error && apps.length === 0 && (
                <div className="glass-card p-16 text-center border-dashed border-white/20 bg-white/[0.02]">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Applications Yet</h3>
                    <p className="text-white/40">Your journey starts here. Explore opportunities and apply!</p>
                </div>
            )}

            {!loading && apps.length > 0 && (
                <div className="space-y-4">
                    {apps.map((app, i) => {
                        const job = typeof app.job === 'string' ? null : app.job;
                        // Dynamically pick gradient based on status
                        const getStatusClasses = (status: string) => {
                            if (status === 'Interview') return 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
                            if (status === 'Shortlisted') return 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]';
                            if (status === 'Rejected') return 'bg-red-500/10 border-red-500/30 text-red-400';
                            if (status === 'Hired') return 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]';
                            return 'bg-white/10 border-white/20 text-white shadow-lg';
                        };

                        return (
                            <div
                                key={app._id}
                                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-500/30 hover:bg-white/[0.03] transition-all group rounded-2xl border-white/5 relative overflow-hidden"
                            >
                                {/* Hover background glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                <div className="flex gap-5 relative z-10">
                                    <div className="w-14 h-14 rounded-[1.2rem] bg-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 shadow-xl group-hover:scale-110 transition-transform p-1 box-border">
                                        {job?.companyLogo?.startsWith('http') ? (
                                            <>
                                                <img 
                                                    src={job.companyLogo} 
                                                    alt={`${job.company} logo`} 
                                                    className="w-full h-full object-contain" 
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <span className="text-slate-800 hidden">{job?.company?.charAt(0) || '?'}</span>
                                            </>
                                        ) : (
                                            <span className="text-slate-800">{job?.companyLogo ?? (typeof app.job === 'object' ? app.job?.company?.charAt(0) : '?')}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors">{job?.title ?? 'Job Title'}</h3>
                                        <p className="text-sm font-medium text-white/50">{job?.company}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="hidden md:block text-right">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-1">Applied</p>
                                        <p className="text-sm font-bold text-white/70">{timeAgo(app.appliedAt)}</p>
                                    </div>
                                    <div className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${getStatusClasses(app.status)}`}>
                                        {app.status}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

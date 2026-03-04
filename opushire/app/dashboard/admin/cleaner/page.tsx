"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Trash2, ArrowLeft, DatabaseZap,
    Filter, AlertCircle, RefreshCcw
} from 'lucide-react';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CleanerDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'featured'>('newest');
    const [filterSource, setFilterSource] = useState<string>('all');

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchJobs();
        }
    }, [user, sortBy, filterSource]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Fetch a large pool to allow local processing or just rely on API if it has generic pagination
            // Right now we will fetch with limit=500 to simulate a 'cleaner' master view
            const res = await jobsApi.getAll({ limit: 500, q: search });
            let fetchedJobs = res.data.jobs || [];

            if (filterSource !== 'all') {
                fetchedJobs = fetchedJobs.filter((j: any) => j.source === filterSource || (filterSource === 'manual' && !j.source));
            }

            if (sortBy === 'oldest') {
                fetchedJobs = fetchedJobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            } else if (sortBy === 'newest') {
                fetchedJobs = fetchedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else if (sortBy === 'featured') {
                fetchedJobs = fetchedJobs.sort((a, b) => (a.featured === b.featured) ? 0 : a.featured ? -1 : 1);
            }

            setJobs(fetchedJobs);
        } catch (err) {
            console.error("Failed to load jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

        setDeleting(id);
        try {
            await jobsApi.delete(id);
            setJobs(prev => prev.filter(j => j._id !== id));
        } catch (err: any) {
            alert('Failed to delete job: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="space-y-6 max-w-md">
                    <AlertCircle size={80} className="text-red-500 mx-auto animate-pulse" />
                    <h1 className="text-4xl font-black uppercase text-white tracking-tighter">Access Forbidden</h1>
                </div>
            </div>
        );
    }

    const filteredJobs = search.trim() === '' ? jobs : jobs.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white relative">
            <div className="max-w-7xl mx-auto relative z-10">
                <button
                    onClick={() => router.push('/dashboard/admin/bots')}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Bot Manager</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 border-b border-white/10 pb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-4">
                            <DatabaseZap size={12} /> Bot 5 Active
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                            The <span className="text-orange-500">Cleaner</span>
                        </h1>
                        <p className="text-white/40 max-w-xl font-medium">Advanced omni-view of the database allowing rapid filtering, location spotting, and manual archiving of tainted job posts.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Jobs in View</p>
                            <p className="font-bold text-2xl text-orange-400">{filteredJobs.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Query database by title, company, or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex gap-4 shrink-0">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                            <select
                                value={filterSource}
                                onChange={(e) => setFilterSource(e.target.value)}
                                className="appearance-none bg-white/5 border border-white/10 rounded-xl h-full py-0 pl-12 pr-10 text-sm font-bold text-white focus:outline-none focus:border-orange-500/50"
                            >
                                <option value="all">All Sources</option>
                                <option value="remotive">Remotive Bot</option>
                                <option value="arbeitnow">Arbeitnow Bot</option>
                                <option value="adzuna">Adzuna Bot</option>
                                <option value="telegram">Telegram Bot</option>
                                <option value="manual">Manual / Web</option>
                            </select>
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-6 text-sm font-bold text-white focus:outline-none focus:border-orange-500/50"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="featured">Featured First</option>
                        </select>

                        <button onClick={fetchJobs} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 transition-colors">
                            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Job Title</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">
                                            Executing database scan...
                                        </td>
                                    </tr>
                                ) : filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">
                                            No jobs match the current matrix parameters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJobs.map((job: any) => (
                                        <tr key={job._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {job.featured && <span className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" title="Featured" />}
                                                    <span className="font-bold text-white truncate max-w-[250px]">{job.title}</span>
                                                </div>
                                                <div className="text-[10px] text-white/30 font-mono mt-1">ID: {job._id}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white/70">{job.company}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-white/5 px-2 py-1 rounded border border-white/10 text-xs">{job.location || 'Unknown'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="uppercase text-[10px] tracking-wider font-bold text-white/50">{job.source || 'Manual'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDelete(job._id, job.title)}
                                                    disabled={deleting === job._id}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center ml-auto hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Permanently Delete Job"
                                                >
                                                    {deleting === job._id ? (
                                                        <RefreshCcw size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

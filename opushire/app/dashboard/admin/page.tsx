"use client";
import React, { useState, useEffect } from 'react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { jobs as jobsApi, applications as appApi } from '@/lib/api';
import { Job, Application } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChart3, Users, Briefcase, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { timeAgo } from '@/lib/utils';

export default function AdminDashboard() {
    const [jobList, setJobList] = useState<Job[]>([]);
    const [allApps, setAllApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            jobsApi.getAll({ limit: 50 }),
            appApi.getAll(),
        ]).then(([jobsRes, appsRes]) => {
            setJobList(jobsRes.data.jobs);
            setAllApps(appsRes.data);
        }).finally(() => setLoading(false));
    }, []);

    const interviewCount = allApps.filter(a => a.status === 'Interview').length;

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this job?')) return;
        await jobsApi.delete(id);
        setJobList(prev => prev.filter(j => j._id !== id));
    };

    return (
        <ProtectedRoute requiredRole="admin">
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal direction="down">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold">Admin Console</h1>
                                <p className="text-white/50 text-xl">Manage your listings and track applicant pipelines.</p>
                            </div>
                            <Link href="/jobs/create">
                                <Button className="gap-2 h-14 px-8"><Plus size={20} /> Post New Job</Button>
                            </Link>
                        </header>
                    </ScrollReveal>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="glass-card p-8 items-center flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-violet/20 flex items-center justify-center text-brand-violet">
                                <Briefcase size={28} />
                            </div>
                            <div>
                                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Active Jobs</p>
                                <p className="text-3xl font-black">{loading ? '—' : jobList.length}</p>
                            </div>
                        </div>
                        <div className="glass-card p-8 items-center flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Applicants</p>
                                <p className="text-3xl font-black">{loading ? '—' : allApps.length}</p>
                            </div>
                        </div>
                        <div className="glass-card p-8 items-center flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <BarChart3 size={28} />
                            </div>
                            <div>
                                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Interviews</p>
                                <p className="text-3xl font-black">{loading ? '—' : interviewCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Listings Table */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Active Listings</h2>
                        </div>

                        {loading ? (
                            <div className="p-8 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : jobList.length === 0 ? (
                            <div className="p-16 text-center text-white/40">
                                No jobs posted yet.{' '}
                                <Link href="/jobs/create" className="text-brand-violet hover:underline">Post your first job →</Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-xs uppercase tracking-widest text-white/30 font-bold">
                                            <th className="px-8 py-4">Job Title</th>
                                            <th className="px-8 py-4">Applicants</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Posted</th>
                                            <th className="px-8 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {jobList.map(job => {
                                            const jobApps = allApps.filter(a =>
                                                (typeof a.job === 'string' ? a.job : a.job._id) === job._id
                                            );
                                            return (
                                                <tr key={job._id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold">{job.title}</div>
                                                        <div className="text-xs text-white/40">{job.type} · {job.mode}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold">{jobApps.length}</td>
                                                    <td className="px-8 py-6"><Badge variant="cyan">Active</Badge></td>
                                                    <td className="px-8 py-6 text-white/50 text-sm">{timeAgo(job.createdAt)}</td>
                                                    <td className="px-8 py-6 text-right flex justify-end gap-4 items-center">
                                                        <Link href={`/jobs/${job._id}`} className="text-brand-violet hover:underline text-sm font-bold">View</Link>
                                                        <button onClick={() => handleDelete(job._id)} className="text-red-400 hover:text-red-300 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

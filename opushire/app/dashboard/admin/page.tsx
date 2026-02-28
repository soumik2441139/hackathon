"use client";
import React from 'react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { MOCK_JOBS } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChart3, Users, Briefcase, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
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
                            <p className="text-3xl font-black">{MOCK_JOBS.length}</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 items-center flex gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Applicants</p>
                            <p className="text-3xl font-black">128</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 items-center flex gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Interviews</p>
                            <p className="text-3xl font-black">14</p>
                        </div>
                    </div>
                </div>

                {/* Active Listings Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-xl font-bold">Active Listings</h2>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                                <input type="text" placeholder="Search..." className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2"><Filter size={16} /> Filter</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] text-xs uppercase tracking-widest text-white/30 font-bold">
                                    <th className="px-8 py-4">Job Title</th>
                                    <th className="px-8 py-4">Applicants</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Posted Date</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {MOCK_JOBS.map(job => (
                                    <tr key={job._id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold">{job.title}</div>
                                            <div className="text-xs text-white/40">{job.type} · {job.mode}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">24</span>
                                                <span className="text-emerald-500 text-xs font-bold">+2 new</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="cyan">Active</Badge>
                                        </td>
                                        <td className="px-8 py-6 text-white/50 text-sm">
                                            {job.posted}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link href={`/jobs/${job._id}`} className="text-brand-violet hover:underline text-sm font-bold">Manage</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

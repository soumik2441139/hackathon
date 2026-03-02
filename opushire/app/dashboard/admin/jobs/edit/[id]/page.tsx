"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit3, Activity, Briefcase, FileText, IndianRupee, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';

export default function AdminEditJobPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('Full-time');
    const [mode, setMode] = useState('Remote');
    const [salaryMin, setSalaryMin] = useState(0);
    const [salaryMax, setSalaryMax] = useState(0);
    const [description, setDescription] = useState('');
    const [responsibilities, setResponsibilities] = useState('');
    const [requirements, setRequirements] = useState('');

    useEffect(() => {
        if (!authLoading && currentUser?.role !== 'admin') {
            router.push('/dashboard/admin');
            return;
        }

        const fetchJob = async () => {
            if (!id) return;
            try {
                const res = await jobsApi.getById(id);
                const j = res.data;
                setJob(j);
                setTitle(j.title || '');
                setCompany(j.company || '');
                setLocation(j.location || j.city || '');
                setType(j.type || 'Full-time');
                setMode(j.mode || 'Remote');
                setSalaryMin(j.salaryMin || 0);
                setSalaryMax(j.salaryMax || 0);
                setDescription(j.description || '');
                setResponsibilities(j.responsibilities?.join('\n') || '');
                setRequirements(j.requirements?.join('\n') || '');
            } catch (err) {
                console.error(err);
                alert('Job not found');
                router.push('/dashboard/admin/jobs');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.role === 'admin') {
            fetchJob();
        }
    }, [id, currentUser, authLoading, router]);

    const handleUpdateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await jobsApi.update(id, {
                title,
                company,
                location,
                type,
                mode,
                salaryMin: Number(salaryMin),
                salaryMax: Number(salaryMax),
                description,
                responsibilities: responsibilities.split('\n').filter(Boolean),
                requirements: requirements.split('\n').filter(Boolean),
            });
            alert('Job successfully updated.');
            router.push('/dashboard/admin/jobs');
        } catch (err: any) {
            console.error(err);
            alert(`Failed to update job: ${err.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-brand-cyan animate-spin" />
                    <p className="text-white/60 font-black tracking-widest uppercase text-xs">Accessing Job Data...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-10 group text-sm font-bold"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    BACK TO LISTINGS
                </button>

                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/5 border border-brand-cyan/20 text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan mb-4">
                        <Edit3 size={12} /> Edit Sequence
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                        Modify <span className="text-cyan-400">Listing</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium">
                        Editing ID: <span className="text-brand-cyan/50 font-mono tracking-wider">{job._id}</span>
                    </p>
                </div>

                <form onSubmit={handleUpdateJob} className="space-y-8 glass-card p-8 border-white/5">

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold border-b border-white/10 pb-4 text-brand-cyan flex items-center gap-2">
                            <Briefcase size={20} /> Identity Definitions
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Role Title</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 h-12 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Company</label>
                                <input
                                    value={company}
                                    onChange={e => setCompany(e.target.value)}
                                    required
                                    className="w-full px-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 h-12 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Location</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 pl-10 pr-4 h-12 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black tracking-widest uppercase text-white/40">Role Type</label>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 h-12 px-3 outline-none"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black tracking-widest uppercase text-white/40">Work Mode</label>
                                    <select
                                        value={mode}
                                        onChange={e => setMode(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 h-12 px-3 outline-none"
                                    >
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="On-site">On-site</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Min Salary (INR/m)</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="number"
                                        value={salaryMin}
                                        onChange={e => setSalaryMin(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 pl-10 pr-4 h-12 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Max Salary (INR/m)</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="number"
                                        value={salaryMax}
                                        onChange={e => setSalaryMax(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 pl-10 pr-4 h-12 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-6 pt-6">
                        <h2 className="text-xl font-bold border-b border-white/10 pb-4 text-brand-violet flex items-center gap-2">
                            <FileText size={20} /> Copy Details
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs font-black tracking-widest uppercase text-white/40">Core Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 p-4 outline-none resize-none font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Responsibilities (One per line)</label>
                                <textarea
                                    value={responsibilities}
                                    onChange={e => setResponsibilities(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 p-4 outline-none resize-none font-medium leading-relaxed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest uppercase text-white/40">Requirements (One per line)</label>
                                <textarea
                                    value={requirements}
                                    onChange={e => setRequirements(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl focus:border-brand-cyan/50 p-4 outline-none resize-none font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-8 flex gap-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="h-14 flex-1 border-white/10 hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-14 flex-[2] bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase tracking-widest"
                        >
                            {saving ? 'Transmitting...' : 'Commit Changes to Database'}
                        </Button>
                    </div>

                </form>
            </div>
        </main>
    );
}

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobs as jobsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Briefcase, IndianRupee, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';

export default function CreateJobPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: '', company: '', location: '', city: '',
        type: 'Internship' as const, mode: 'Remote' as const,
        salaryMin: 0, salaryMax: 0, salary: '',
        description: '', openings: 1, featured: false,
        deadline: '',
    });
    const [responsibilities, setResponsibilities] = useState<string[]>(['']);
    const [requirements, setRequirements] = useState<string[]>(['']);
    const [tags, setTags] = useState<string[]>(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const setNum = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [field]: Number(e.target.value) }));

    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        setter(prev => [...prev, '']);

    const updateItem = (index: number, val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
        setter(prev => { const next = [...prev]; next[index] = val; return next; });

    const inputClass = "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-white/20";
    const selectClass = "w-full h-12 bg-[#1a1a1f] border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = {
                ...form,
                responsibilities: responsibilities.filter(Boolean),
                requirements: requirements.filter(Boolean),
                tags: tags.filter(Boolean),
                deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
                salary: form.salary || undefined,
            };
            await jobsApi.create(payload);
            router.push('/dashboard/admin');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="admin">
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal direction="down">
                        <header className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Post a <span className="text-gradient">new opportunity</span></h1>
                            <p className="text-white/50 text-xl">Find the best student talent for your startup.</p>
                        </header>
                    </ScrollReveal>

                    {error && (
                        <div className="mb-8 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="glass-card p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="text-brand-violet" /> Basic Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Job Title *</label>
                                    <input type="text" placeholder="e.g. Full Stack Developer" required value={form.title} onChange={set('title')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Company Name *</label>
                                    <input type="text" placeholder="e.g. Opushire" required value={form.company} onChange={set('company')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Location</label>
                                    <input type="text" placeholder="e.g. Bangalore · Remote" value={form.location} onChange={set('location')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">City</label>
                                    <input type="text" placeholder="e.g. Bangalore" value={form.city} onChange={set('city')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Job Type *</label>
                                    <select required value={form.type} onChange={set('type')} className={selectClass}>
                                        <option>Internship</option><option>Full-time</option><option>Part-time</option><option>Contract</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Work Mode *</label>
                                    <select required value={form.mode} onChange={set('mode')} className={selectClass}>
                                        <option>Remote</option><option>Hybrid</option><option>Onsite</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Openings</label>
                                    <input type="number" min={1} value={form.openings} onChange={setNum('openings')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Application Deadline</label>
                                    <input type="date" value={form.deadline} onChange={set('deadline')} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <IndianRupee className="text-brand-cyan" /> Compensation
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Min Salary (₹/mo)</label>
                                    <input type="number" placeholder="30000" value={form.salaryMin || ''} onChange={setNum('salaryMin')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Max Salary (₹/mo)</label>
                                    <input type="number" placeholder="50000" value={form.salaryMax || ''} onChange={setNum('salaryMax')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white/70">Salary Label</label>
                                    <input type="text" placeholder="₹30K–₹50K/mo" value={form.salary} onChange={set('salary')} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 space-y-6">
                            <h2 className="text-xl font-bold">Description & Details</h2>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Full Description *</label>
                                <textarea rows={5} required value={form.description} onChange={set('description')} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-violet/50 text-brand-text placeholder:text-white/20 resize-none" placeholder="Tell candidates about the role..." />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/70">Responsibilities</label>
                                {responsibilities.map((r, i) => (
                                    <input key={i} value={r} onChange={e => updateItem(i, e.target.value, setResponsibilities)} className={inputClass} placeholder={`Responsibility ${i + 1}`} />
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setResponsibilities)} className="gap-2"><Plus size={16} /> Add</Button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/70">Requirements</label>
                                {requirements.map((r, i) => (
                                    <input key={i} value={r} onChange={e => updateItem(i, e.target.value, setRequirements)} className={inputClass} placeholder={`Requirement ${i + 1}`} />
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setRequirements)} className="gap-2"><Plus size={16} /> Add</Button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/70">Skill Tags</label>
                                {tags.map((t, i) => (
                                    <input key={i} value={t} onChange={e => updateItem(i, e.target.value, setTags)} className={inputClass} placeholder={`e.g. React`} />
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setTags)} className="gap-2"><Plus size={16} /> Add Tag</Button>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))} className="w-5 h-5 accent-brand-violet" />
                                <label htmlFor="featured" className="text-sm text-white/70">Mark as Featured</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
                            <Button size="lg" className="px-12" disabled={loading}>
                                {loading ? 'Publishing...' : 'Publish Job'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </ProtectedRoute>
    );
}

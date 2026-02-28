"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Briefcase, IndianRupee, MapPin, Tag, Plus, Check } from 'lucide-react';

export default function CreateJobPage() {
    const [responsibilities, setResponsibilities] = useState<string[]>([""]);
    const [requirements, setRequirements] = useState<string[]>([""]);

    const addItem = (set: React.Dispatch<React.SetStateAction<string[]>>) => set(prev => [...prev, ""]);
    const updateItem = (index: number, val: string, set: React.Dispatch<React.SetStateAction<string[]>>) => {
        set(prev => {
            const next = [...prev];
            next[index] = val;
            return next;
        });
    };

    return (
        <main className="pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <ScrollReveal direction="down">
                    <header className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Post a <span className="text-gradient">new opportunity</span></h1>
                        <p className="text-white/50 text-xl">Find the best student talent for your startup.</p>
                    </header>
                </ScrollReveal>

                <form className="space-y-8">
                    <div className="glass-card p-8 space-y-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Briefcase className="text-brand-violet" /> Basic Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Job Title</label>
                                <input type="text" placeholder="e.g. Full Stack Developer" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Company Name</label>
                                <input type="text" placeholder="e.g. Opushire" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Location</label>
                                <input type="text" placeholder="e.g. Bangalore · Remote" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Type</label>
                                <select className="w-full h-12 bg-[#1a1a1f] border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50">
                                    <option>Internship</option>
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 space-y-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <IndianRupee className="text-brand-cyan" /> Compensation & Mode
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Min Salary (₹/mo)</label>
                                <input type="number" placeholder="30000" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Max Salary (₹/mo)</label>
                                <input type="number" placeholder="50000" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white/70">Work Mode</label>
                                <select className="w-full h-12 bg-[#1a1a1f] border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50">
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                    <option>Onsite</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 space-y-6">
                        <h2 className="text-xl font-bold mb-4">Description & Responsibilities</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white/70">Full Description</label>
                            <textarea rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-violet/50" placeholder="Tell us about the role..."></textarea>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/70">Responsibilities</label>
                            {responsibilities.map((r, i) => (
                                <div key={i} className="flex gap-2">
                                    <input value={r} onChange={(e) => updateItem(i, e.target.value, setResponsibilities)} className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50" />
                                </div>
                            ))}
                            <Button type="button" variant="ghost" size="sm" onClick={() => addItem(setResponsibilities)} className="gap-2">
                                <Plus size={16} /> Add Responsibility
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" size="lg">Save Draft</Button>
                        <Button size="lg" className="px-12">Publish Job</Button>
                    </div>
                </form>
            </div>
        </main>
    );
}

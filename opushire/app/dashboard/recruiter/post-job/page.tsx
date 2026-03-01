"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import {
    Briefcase, MapPin, DollarSign, FileText, CheckCircle2,
    ArrowRight, ArrowLeft, Send, Sparkles, Building
} from 'lucide-react';
import { jobs } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const STEPS = [
    { id: 1, title: 'Basics', icon: <Briefcase size={20} /> },
    { id: 2, title: 'Details', icon: <FileText size={20} /> },
    { id: 3, title: 'Confirm', icon: <CheckCircle2 size={20} /> },
];

export default function PostJobPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    // Security & Auth Guard
    React.useEffect(() => {
        if (!authLoading) {
            if (!user) router.push('/login');
            else if (user.role !== 'recruiter' && user.role !== 'admin') {
                router.push('/dashboard/student');
            }
        }
    }, [user, authLoading, router]);

    const [form, setForm] = useState({
        title: '',
        type: 'Full-time',
        mode: 'Remote',
        location: '',
        city: 'Bangalore',
        salaryMin: '',
        salaryMax: '',
        description: '',
        responsibilities: '',
        requirements: '',
        tags: '',
    });

    if (authLoading || (!user || (user.role !== 'recruiter' && user.role !== 'admin'))) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-white/20 uppercase tracking-widest animate-pulse">Initializing Suite...</div>;
    }

    const update = (field: string, value: any) => setForm(s => ({ ...s, [field]: value }));

    const next = () => setStep(s => Math.min(s + 1, 3));
    const prev = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...form,
                salaryMin: Number(form.salaryMin),
                salaryMax: Number(form.salaryMax),
                salary: `₹${(Number(form.salaryMin) / 100000).toFixed(0)} - ${(Number(form.salaryMax) / 100000).toFixed(0)} LPA`,
                responsibilities: form.responsibilities.split('\n').filter(Boolean),
                requirements: form.requirements.split('\n').filter(Boolean),
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                company: user?.companyName || 'Unknown Company',
                companyLogo: '🏢', // Default logo for now
            };
            await jobs.create(payload);
            setDone(true);
            setTimeout(() => router.push('/jobs'), 2000);
        } catch (err) {
            console.error(err);
            alert('Failed to post job. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-brand-cyan/50 transition-all text-brand-text placeholder:text-white/20";
    const labelClass = "text-sm font-bold text-white/40 uppercase tracking-widest mb-2 block ml-1";

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl font-black mb-4">Job Published!</h1>
                    <p className="text-white/50 text-lg">Your opportunity is now live for thousands of students.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <main className="pt-32 pb-24 px-6 overflow-hidden min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <ScrollReveal direction="up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-brand-cyan/30 text-sm font-bold text-brand-cyan mb-6">
                            <Sparkles size={14} /> Recruitment Suite
                        </div>
                        <h1 className="text-5xl font-black mb-4 leading-tight">Post a <span className="text-gradient">new role</span></h1>
                        <p className="text-white/40 text-lg">Fill in the details to find your next top-tier talent.</p>
                    </ScrollReveal>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-12 relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
                    <motion.div
                        className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-brand-violet to-brand-cyan -translate-y-1/2 -z-10"
                        animate={{ width: `${(step - 1) * 50}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                    {STEPS.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${step >= s.id ? 'bg-brand-dark border-brand-cyan text-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-brand-dark border-white/10 text-white/20'}`}>
                                {s.icon}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${step >= s.id ? 'text-brand-cyan' : 'text-white/20'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Form Steps */}
                <div className="glass-card p-10 relative overflow-hidden min-h-[500px] flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5" />

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8 flex-1"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Job Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Senior Frontend Engineer"
                                            value={form.title}
                                            onChange={(e) => update('title', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Job Type</label>
                                        <select
                                            value={form.type}
                                            onChange={(e) => update('type', e.target.value)}
                                            className={inputClass + " appearance-none cursor-pointer"}
                                        >
                                            <option value="Full-time" className="bg-brand-dark">Full-time</option>
                                            <option value="Internship" className="bg-brand-dark">Internship</option>
                                            <option value="Contract" className="bg-brand-dark">Contract</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Work Mode</label>
                                        <select
                                            value={form.mode}
                                            onChange={(e) => update('mode', e.target.value)}
                                            className={inputClass + " appearance-none cursor-pointer"}
                                        >
                                            <option value="Remote" className="bg-brand-dark">Remote</option>
                                            <option value="Hybrid" className="bg-brand-dark">Hybrid</option>
                                            <option value="Onsite" className="bg-brand-dark">Onsite</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Base City</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bangalore"
                                            value={form.city}
                                            onChange={(e) => update('city', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Location Tag</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bangalore, India"
                                            value={form.location}
                                            onChange={(e) => update('location', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8 flex-1"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={labelClass}>Min Salary (Annual ₹)</label>
                                        <input
                                            type="number"
                                            placeholder="800000"
                                            value={form.salaryMin}
                                            onChange={(e) => update('salaryMin', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Max Salary (Annual ₹)</label>
                                        <input
                                            type="number"
                                            placeholder="1500000"
                                            value={form.salaryMax}
                                            onChange={(e) => update('salaryMax', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Description</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Describe the role..."
                                            value={form.description}
                                            onChange={(e) => update('description', e.target.value)}
                                            className={inputClass + " resize-none"}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Requirements (One per line)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="3+ years of React experience&#10;Strong TypeScript skills..."
                                            value={form.requirements}
                                            onChange={(e) => update('requirements', e.target.value)}
                                            className={inputClass + " resize-none font-mono text-sm"}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Tags (Comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="React, AWS, Node.js"
                                            value={form.tags}
                                            onChange={(e) => update('tags', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-10 flex-1"
                            >
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-violet/20 to-brand-cyan/20 flex items-center justify-center text-3xl">
                                            🏢
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black">{form.title || 'Untitled Role'}</h2>
                                            <p className="text-brand-cyan font-bold">{user?.companyName}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Location</p>
                                            <p className="text-sm font-bold flex items-center gap-1.5"><MapPin size={14} className="text-white/40" /> {form.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Type</p>
                                            <p className="text-sm font-bold flex items-center gap-1.5"><Briefcase size={14} className="text-white/40" /> {form.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Mode</p>
                                            <p className="text-sm font-bold flex items-center gap-1.5"><Building size={14} className="text-white/40" /> {form.mode}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Salary</p>
                                            <p className="text-sm font-bold flex items-center gap-1.5"><DollarSign size={14} className="text-white/40" /> {form.salaryMin ? `₹${(Number(form.salaryMin) / 100000).toFixed(0)}L` : '-'} - {form.salaryMax ? `₹${(Number(form.salaryMax) / 100000).toFixed(0)}L` : '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-violet/10 border border-brand-violet/20 p-6 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-violet flex items-center justify-center text-brand-dark">
                                        <Sparkles size={20} />
                                    </div>
                                    <p className="text-sm text-brand-violet-light font-medium flex-1">
                                        Our AI has optimized your job listing for 2.4x more reach among top-tier university students.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-10 mt-auto border-t border-white/5">
                        <Button
                            variant="ghost"
                            onClick={prev}
                            className={`gap-2 ${step === 1 ? 'invisible' : ''}`}
                        >
                            <ArrowLeft size={18} /> Previous
                        </Button>

                        {step < 3 ? (
                            <Button
                                onClick={next}
                                className="gap-2 px-10"
                                disabled={step === 1 && !form.title}
                            >
                                Next Step <ArrowRight size={18} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                className="gap-2 px-10 shadow-lg shadow-brand-violet/20"
                            >
                                <Send size={18} /> Publish Opportunity
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

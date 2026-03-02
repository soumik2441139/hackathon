"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import {
    Briefcase, MapPin, DollarSign, FileText, CheckCircle2,
    ArrowRight, ArrowLeft, Send, Sparkles, Building, TrendingUp
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
        companyWebsite: user?.companyWebsite || '',
        companyLogo: user?.companyLogo || '',
    });

    const [logoPreview, setLogoPreview] = useState(user?.companyLogo || '');

    // Auto-fetch logo from domain
    React.useEffect(() => {
        if (form.companyWebsite && form.companyWebsite.includes('.')) {
            const domain = form.companyWebsite
                .replace(/^(https?:\/\/)?(www\.)?/, '')
                .split('/')[0]
                .toLowerCase();
            if (domain.length > 3) {
                const logoUrl = `https://unavatar.io/${domain}`;
                setLogoPreview(logoUrl);
                update('companyLogo', logoUrl);
            }
        }
    }, [form.companyWebsite]);

    // Sync user profile data when loaded
    React.useEffect(() => {
        if (user && !authLoading) {
            setForm(s => ({
                ...s,
                companyWebsite: s.companyWebsite || user.companyWebsite || '',
                companyLogo: s.companyLogo || user.companyLogo || '',
            }));
            if (!logoPreview) setLogoPreview(user.companyLogo || '');
        }
    }, [user, authLoading]);

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
                companyLogo: form.companyLogo || user?.companyLogo || '🏢',
                companyWebsite: form.companyWebsite
            };
            await jobs.create(payload);
            setDone(true);
            setTimeout(() => router.push('/jobs'), 2000);
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Failed to post job. Please check all fields.';
            if (err.fields) {
                const details = Object.entries(err.fields)
                    .map(([field, errors]: [string, any]) => `${field}: ${errors.join(', ')}`)
                    .join('\n');
                msg = `Validation Failed:\n${details}`;
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#8EC5FC]/50 transition-all text-brand-text placeholder:text-white/20";
    const labelClass = "text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 block ml-1";

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-brand-dark">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">Job Published!</h1>
                    <p className="text-white/40 text-lg font-medium">Your opportunity is now live for thousands of students.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <main className="pt-32 pb-24 px-6 overflow-hidden min-h-screen bg-brand-dark relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E0C3FC]/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8EC5FC]/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <ScrollReveal direction="up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-6">
                            <Sparkles size={12} className="text-[#A1FFCE]" />
                            Opportunity Creator
                        </div>
                        <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter leading-none">
                            Post a <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E0C3FC] to-[#8EC5FC]">new role</span>
                        </h1>
                        <p className="text-white/40 text-lg font-medium">Find your next top-tier talent with precision.</p>
                    </ScrollReveal>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-12 relative px-4 max-w-2xl mx-auto">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 -z-10 rounded-full" />
                    <motion.div
                        className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-[#E0C3FC] to-[#8EC5FC] -translate-y-1/2 -z-10 rounded-full"
                        animate={{ width: `${(step - 1) * 50}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {STEPS.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-4">
                            <motion.div
                                animate={{
                                    scale: step === s.id ? 1.1 : 1,
                                    borderColor: step >= s.id ? 'rgba(142, 197, 252, 0.5)' : 'rgba(255, 255, 255, 0.05)'
                                }}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 bg-brand-dark ${step >= s.id ? 'text-[#8EC5FC] shadow-[0_0_20px_rgba(142,197,252,0.2)]' : 'text-white/20'}`}
                            >
                                {s.icon}
                            </motion.div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-white' : 'text-white/20'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Form Steps */}
                <div className="glass-card p-12 relative overflow-hidden min-h-[500px] flex flex-col border-white/5 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="space-y-10 flex-1"
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
                                            placeholder="e.g. Gurgaon"
                                            value={form.city}
                                            onChange={(e) => update('city', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Location Tag</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Gurgaon, India"
                                            value={form.location}
                                            onChange={(e) => update('location', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Company Website</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="text"
                                                placeholder="e.g. stripe.com"
                                                value={form.companyWebsite}
                                                onChange={(e) => update('companyWebsite', e.target.value)}
                                                className={inputClass}
                                            />
                                            {logoPreview && (
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-2"
                                                >
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo Preview"
                                                        className="w-full h-full object-contain"
                                                        onError={() => setLogoPreview('')}
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
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
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="space-y-10 flex-1"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={labelClass}>Min Salary (Annual ₹)</label>
                                        <input
                                            type="number"
                                            placeholder="1200000"
                                            value={form.salaryMin}
                                            onChange={(e) => update('salaryMin', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Max Salary (Annual ₹)</label>
                                        <input
                                            type="number"
                                            placeholder="2400000"
                                            value={form.salaryMax}
                                            onChange={(e) => update('salaryMax', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Description</label>
                                        <textarea
                                            rows={4}
                                            placeholder="What makes this role special?..."
                                            value={form.description}
                                            onChange={(e) => update('description', e.target.value)}
                                            className={inputClass + " resize-none"}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Requirements (One per line)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Proficiency in Go&#10;Experience with AWS Lambda..."
                                            value={form.requirements}
                                            onChange={(e) => update('requirements', e.target.value)}
                                            className={inputClass + " resize-none font-mono text-sm"}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Tags (Comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="Go, Distributed Systems, Backend"
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
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="space-y-10 flex-1"
                            >
                                <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E0C3FC]/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-4xl overflow-hidden p-3 border border-white/10 shadow-xl">
                                            {form.companyLogo ? (
                                                <img src={form.companyLogo} alt={user?.companyName} className="w-full h-full object-contain" />
                                            ) : user?.companyLogo && user.companyLogo.startsWith('http') ? (
                                                <img src={user.companyLogo} alt={user.companyName} className="w-full h-full object-contain" />
                                            ) : (
                                                user?.companyLogo || '🏢'
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight leading-none mb-2">{form.title || 'Untitled Role'}</h2>
                                            <p className="text-[#8EC5FC] font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                                <Building size={14} /> {user?.companyName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2">Location</p>
                                            <p className="text-sm font-bold flex items-center gap-2 text-white/80"><MapPin size={16} className="text-white/20" /> {form.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2">Type</p>
                                            <p className="text-sm font-bold flex items-center gap-2 text-white/80"><Briefcase size={16} className="text-white/20" /> {form.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2">Mode</p>
                                            <p className="text-sm font-bold flex items-center gap-2 text-white/80"><Sparkles size={16} className="text-white/20" /> {form.mode}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2">Package</p>
                                            <p className="text-sm font-black flex items-center gap-2 text-[#A1FFCE]"><DollarSign size={16} className="text-white/20" /> {form.salaryMin ? `${(Number(form.salaryMin) / 100000).toFixed(0)} - ${(Number(form.salaryMax) / 100000).toFixed(0)} LPA` : '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#A1FFCE]/5 border border-[#A1FFCE]/10 p-8 rounded-3xl flex items-center gap-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#A1FFCE]/10 blur-3xl rounded-full" />
                                    <div className="w-14 h-14 rounded-2xl bg-[#A1FFCE] text-brand-dark flex items-center justify-center relative z-10 shadow-lg shadow-[#A1FFCE]/10">
                                        <TrendingUp size={28} />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">Elite Visibility Enabled</h4>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed">
                                            This role will be highlighted to the top <span className="text-[#A1FFCE]">5% of candidates</span> matching your technical criteria.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-12 mt-auto border-t border-white/5 relative z-10">
                        <Button
                            variant="ghost"
                            onClick={prev}
                            className={`gap-2 h-14 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${step === 1 ? 'invisible' : 'hover:bg-white/5'}`}
                        >
                            <ArrowLeft size={16} /> Previous Step
                        </Button>

                        <div className="flex items-center gap-4">
                            {step < 3 ? (
                                <Button
                                    onClick={next}
                                    className="gap-3 px-10 h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                                    disabled={step === 1 && !form.title}
                                >
                                    Next Phase <ArrowRight size={18} />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    loading={loading}
                                    className="gap-3 px-10 h-14 rounded-2xl bg-[#E0C3FC] text-black hover:bg-[#D4B3F8] font-black uppercase tracking-widest text-[10px] shadow-[0_15px_30px_rgba(224,195,252,0.2)]"
                                >
                                    <Send size={18} /> Deploy Opportunity
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TrendingUp, Briefcase, GraduationCap, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const SALARY_DATA = [
    {
        role: 'Full Stack Developer', icon: '⚡', category: 'Engineering',
        stipend: { min: 30000, max: 80000, avg: 50000 },
        fullTime: { min: 800000, max: 2500000, avg: 1400000 },
        trend: '+18%', topCompanies: ['Razorpay', 'Zepto', 'CRED', 'Stripe'],
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        color: 'brand-violet',
    },
    {
        role: 'Frontend Engineer', icon: '🎨', category: 'Engineering',
        stipend: { min: 25000, max: 70000, avg: 42000 },
        fullTime: { min: 700000, max: 2000000, avg: 1200000 },
        trend: '+22%', topCompanies: ['Figma', 'Notion', 'Vercel', 'Airbnb'],
        skills: ['React', 'TypeScript', 'CSS', 'Framer Motion'],
        color: 'brand-cyan',
    },
    {
        role: 'Backend Engineer', icon: '⚙️', category: 'Engineering',
        stipend: { min: 28000, max: 75000, avg: 48000 },
        fullTime: { min: 900000, max: 2800000, avg: 1600000 },
        trend: '+15%', topCompanies: ['Stripe', 'Razorpay', 'Swiggy', 'CRED'],
        skills: ['Node.js', 'Python', 'Go', 'Databases'],
        color: 'emerald-400',
    },
    {
        role: 'Product Designer', icon: '✍️', category: 'Design',
        stipend: { min: 20000, max: 60000, avg: 38000 },
        fullTime: { min: 600000, max: 1800000, avg: 1000000 },
        trend: '+12%', topCompanies: ['Figma', 'Airbnb', 'Notion', 'Zepto'],
        skills: ['Figma', 'Prototyping', 'Research', 'Animation'],
        color: 'rose-400',
    },
    {
        role: 'Data Scientist', icon: '📊', category: 'Data',
        stipend: { min: 35000, max: 90000, avg: 58000 },
        fullTime: { min: 1000000, max: 3500000, avg: 1800000 },
        trend: '+31%', topCompanies: ['Swiggy', 'CRED', 'Razorpay', 'Zepto'],
        skills: ['Python', 'ML', 'SQL', 'TensorFlow'],
        color: 'yellow-400',
    },
    {
        role: 'DevOps / SRE', icon: '☁️', category: 'Infrastructure',
        stipend: { min: 30000, max: 70000, avg: 46000 },
        fullTime: { min: 900000, max: 2600000, avg: 1500000 },
        trend: '+19%', topCompanies: ['Vercel', 'Razorpay', 'Stripe', 'Swiggy'],
        skills: ['Kubernetes', 'AWS', 'CI/CD', 'Linux'],
        color: 'sky-400',
    },
];

const LOCATIONS = [
    { city: 'Bangalore', index: 100, color: '#82BAC4' },
    { city: 'Mumbai', index: 95, color: '#E37C78' },
    { city: 'Delhi NCR', index: 92, color: '#a78bfa' },
    { city: 'Hyderabad', index: 88, color: '#34d399' },
    { city: 'Pune', index: 80, color: '#fbbf24' },
    { city: 'Chennai', index: 78, color: '#f472b6' },
];

function formatLPA(val: number) {
    return `₹${(val / 100000).toFixed(1)}L`;
}
function formatK(val: number) {
    return `₹${(val / 1000).toFixed(0)}K`;
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <div ref={ref} className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : {}}
                transition={{ duration: 1.2, delay, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, var(--color-brand-violet), var(--color-brand-cyan))` }}
            />
        </div>
    );
}

function CountUp({ end, prefix = '', suffix = '', delay = 0 }: { end: number; prefix?: string; suffix?: string; delay?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const timer = setTimeout(() => {
            const duration = 1500;
            const steps = 60;
            const step = end / steps;
            let current = 0;
            const interval = setInterval(() => {
                current = Math.min(current + step, end);
                setCount(Math.floor(current));
                if (current >= end) clearInterval(interval);
            }, duration / steps);
            return () => clearInterval(interval);
        }, delay * 1000);
        return () => clearTimeout(timer);
    }, [inView, end, delay]);

    return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function SalariesPage() {
    const [expandedRole, setExpandedRole] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Engineering', 'Design', 'Data', 'Infrastructure'];
    const filtered = SALARY_DATA.filter(r => activeCategory === 'All' || r.category === activeCategory);

    return (
        <main className="pt-32 pb-24 px-6 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">

                {/* Hero */}
                <ScrollReveal direction="up" duration={0.7} width="100%">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-brand-cyan/30 text-sm font-bold text-brand-cyan mb-6">
                            <TrendingUp size={14} /> Real Salary Data · Updated Feb 2026
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            Know your<br /><span className="text-gradient">market worth</span>
                        </h1>
                        <p className="text-white/50 text-xl max-w-2xl mx-auto">
                            Transparent salary data from 18,000+ placed students across 500+ companies.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Hero Stats */}
                <ScrollReveal direction="up" delay={0.1} width="100%">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                        {[
                            { label: 'Avg Internship', value: 46000, prefix: '₹', suffix: '/mo', sub: 'stipend' },
                            { label: 'Avg Full-time', value: 14, prefix: '₹', suffix: 'L/yr', sub: 'package' },
                            { label: 'Highest Stipend', value: 90000, prefix: '₹', suffix: '/mo', sub: 'data science' },
                            { label: 'Salary Growth', value: 21, prefix: '', suffix: '%', sub: 'YoY increase' },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                className="glass-card p-6 text-center"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-violet to-brand-cyan">
                                    <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} delay={i * 0.1} />
                                </p>
                                <p className="text-xs uppercase tracking-widest text-white/30 font-bold mt-1">{s.label}</p>
                                <p className="text-xs text-white/20 mt-0.5">{s.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Role Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    {/* Left — role list */}
                    <div className="lg:col-span-2 space-y-4">
                        <ScrollReveal direction="up" width="100%">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">By Role</h2>
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map(cat => (
                                        <button key={cat} onClick={() => setActiveCategory(cat)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === cat
                                                ? 'bg-brand-violet/20 text-brand-violet border border-brand-violet/40'
                                                : 'text-white/30 hover:text-white border border-transparent hover:border-white/10'
                                                }`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>

                        {filtered.map((role, i) => (
                            <motion.div
                                key={role.role}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.07 }}
                                className="glass-card overflow-hidden border-white/5 hover:border-white/15 transition-colors"
                            >
                                <button
                                    className="w-full p-6 flex items-center justify-between gap-4 text-left"
                                    onClick={() => setExpandedRole(expandedRole === i ? null : i)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                                            {role.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{role.role}</h3>
                                            <p className="text-xs text-white/40">{role.category}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm font-bold text-brand-cyan">{formatK(role.stipend.avg)}/mo</p>
                                            <p className="text-xs text-white/30">avg internship</p>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm font-bold">{formatLPA(role.fullTime.avg)}/yr</p>
                                            <p className="text-xs text-white/30">avg full-time</p>
                                        </div>
                                        <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2.5 py-1 rounded-full">
                                            {role.trend}
                                        </span>
                                        {expandedRole === i ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                    </div>
                                </button>

                                {/* Expanded content */}
                                <motion.div
                                    initial={false}
                                    animate={{ height: expandedRole === i ? 'auto' : 0, opacity: expandedRole === i ? 1 : 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-6">
                                        {/* Stipend Range */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">Internship Stipend Range</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/50">{formatK(role.stipend.min)}</span>
                                                    <span className="font-bold text-brand-cyan">{formatK(role.stipend.avg)} avg</span>
                                                    <span className="text-white/50">{formatK(role.stipend.max)}</span>
                                                </div>
                                                <AnimatedBar pct={(role.stipend.avg - role.stipend.min) / (role.stipend.max - role.stipend.min) * 100} color="brand-violet" delay={0.2} />
                                            </div>

                                            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 pt-2">Full-time Package Range</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/50">{formatLPA(role.fullTime.min)}</span>
                                                    <span className="font-bold">{formatLPA(role.fullTime.avg)} avg</span>
                                                    <span className="text-white/50">{formatLPA(role.fullTime.max)}</span>
                                                </div>
                                                <AnimatedBar pct={(role.fullTime.avg - role.fullTime.min) / (role.fullTime.max - role.fullTime.min) * 100} color="brand-cyan" delay={0.3} />
                                            </div>
                                        </div>

                                        {/* Companies + Skills */}
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Top Hiring Companies</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {role.topCompanies.map(c => (
                                                        <span key={c} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Top Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {role.skills.map(s => (
                                                        <span key={s} className="px-3 py-1 rounded-lg bg-brand-violet/10 border border-brand-violet/20 text-xs font-bold text-brand-violet">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Right — location heatmap */}
                    <div className="space-y-6">
                        <ScrollReveal direction="left" delay={0.2}>
                            <div className="glass-card p-8 sticky top-32">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <MapPin size={16} className="text-brand-cyan" /> Salary by City
                                </h3>
                                <p className="text-xs text-white/30 mb-8">Relative index (Bangalore = 100)</p>

                                <div className="space-y-6">
                                    {LOCATIONS.map((loc, i) => (
                                        <motion.div
                                            key={loc.city}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.4, delay: i * 0.1 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{loc.city}</span>
                                                <span className="font-bold" style={{ color: loc.color }}>{loc.index}</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${loc.index}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                                                    className="h-full rounded-full"
                                                    style={{ background: loc.color }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Quick Tip</h4>
                                    <p className="text-sm text-white/50 leading-relaxed">
                                        Remote roles typically offer Bangalore-level pay regardless of your location. 🌐
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Bottom insight banner */}
                <ScrollReveal direction="up" delay={0.1} width="100%">
                    <div className="glass-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-brand-violet/10 via-transparent to-brand-cyan/10 border-brand-violet/20">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <GraduationCap size={20} className="text-brand-violet" />
                                <span className="text-sm font-bold uppercase tracking-widest text-white/40">Did you know?</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Students with 2+ skills earn <span className="text-gradient">47% more</span></h3>
                            <p className="text-white/50">Combining frontend + backend, or design + code dramatically increases your offer range.</p>
                        </div>
                        <div className="shrink-0">
                            <motion.div
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-violet/30 to-brand-cyan/30 flex items-center justify-center text-4xl font-black border border-brand-violet/30"
                                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                47%
                            </motion.div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </main>
    );
}

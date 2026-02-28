"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Users, Briefcase, Globe, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';

const COMPANIES = [
    {
        id: 1, name: 'Vercel', logo: '▲', category: 'Cloud / DevTools',
        location: 'San Francisco', employees: '500-1K', openings: 12,
        founded: 2015, description: 'Build, scale, and secure the web. The platform for frontend developers.',
        tags: ['Next.js', 'Cloud', 'DevTools'], rating: 4.9, color: 'from-white/20 to-white/5',
    },
    {
        id: 2, name: 'Razorpay', logo: '🚀', category: 'Fintech',
        location: 'Bangalore', employees: '2K-5K', openings: 34,
        founded: 2014, description: 'India\'s leading payment gateway trusted by 5M+ businesses.',
        tags: ['Payments', 'API', 'Fintech'], rating: 4.7, color: 'from-brand-violet/20 to-brand-violet/5',
    },
    {
        id: 3, name: 'Stripe', logo: '💳', category: 'Fintech',
        location: 'Dublin', employees: '7K-10K', openings: 8,
        founded: 2010, description: 'Payment infrastructure for the internet. Millions of companies use Stripe.',
        tags: ['Payments', 'Global', 'SaaS'], rating: 4.8, color: 'from-indigo-500/20 to-indigo-500/5',
    },
    {
        id: 4, name: 'Airbnb', logo: '🏠', category: 'Travel / Marketplace',
        location: 'San Francisco', employees: '5K-10K', openings: 5,
        founded: 2008, description: 'Belong anywhere. The global leader in short-term home rentals.',
        tags: ['Marketplace', 'Travel', 'Design'], rating: 4.5, color: 'from-rose-500/20 to-rose-500/5',
    },
    {
        id: 5, name: 'Notion', logo: '⬜', category: 'Productivity / SaaS',
        location: 'San Francisco', employees: '500-1K', openings: 18,
        founded: 2016, description: 'The all-in-one workspace for notes, tasks, wikis, and databases.',
        tags: ['SaaS', 'Productivity', 'AI'], rating: 4.6, color: 'from-brand-cyan/20 to-brand-cyan/5',
    },
    {
        id: 6, name: 'Zepto', logo: '⚡', category: 'Quick Commerce',
        location: 'Mumbai', employees: '2K-5K', openings: 42,
        founded: 2021, description: '10-minute grocery delivery disrupting Indian quick commerce.',
        tags: ['Logistics', 'Operations', 'Startup'], rating: 4.3, color: 'from-yellow-500/20 to-yellow-500/5',
    },
    {
        id: 7, name: 'CRED', logo: '💎', category: 'Fintech',
        location: 'Bangalore', employees: '1K-2K', openings: 21,
        founded: 2018, description: 'Rewarding creditworthy India. Premium fintech for high credit score users.',
        tags: ['Fintech', 'Premium', 'Rewards'], rating: 4.4, color: 'from-purple-500/20 to-purple-500/5',
    },
    {
        id: 8, name: 'Figma', logo: '🎨', category: 'Design Tools',
        location: 'San Francisco', employees: '500-1K', openings: 9,
        founded: 2012, description: 'Where teams design together. The collaborative interface design tool.',
        tags: ['Design', 'Collaboration', 'SaaS'], rating: 4.9, color: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
        id: 9, name: 'Swiggy', logo: '🍜', category: 'Food Tech',
        location: 'Bangalore', employees: '5K+', openings: 67,
        founded: 2014, description: 'Food ordering and delivery platform trusted by millions.',
        tags: ['Food Tech', 'Logistics', 'Consumer'], rating: 4.2, color: 'from-orange-500/20 to-orange-500/5',
    },
];

const categories = ['All', 'Fintech', 'Cloud / DevTools', 'SaaS', 'Design Tools', 'Travel / Marketplace', 'Food Tech', 'Quick Commerce', 'Productivity / SaaS'];

import type { Variants } from 'framer-motion';

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function CompaniesPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = COMPANIES.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
        const matchCat = activeCategory === 'All' || c.category === activeCategory;
        return matchSearch && matchCat;
    });

    return (
        <main className="pt-32 pb-24 px-6 overflow-x-hidden">
            {/* Hero */}
            <div className="max-w-7xl mx-auto mb-20">
                <ScrollReveal direction="up" duration={0.7}>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-brand-violet/30 text-sm font-bold text-brand-violet mb-6">
                            <Globe size={14} /> 500+ Companies Worldwide
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            Find your<br />
                            <span className="text-gradient">dream company</span>
                        </h1>
                        <p className="text-white/50 text-xl max-w-2xl mx-auto">
                            Discover the world's best startups and scale-ups hiring students right now.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Stats Row */}
                <ScrollReveal direction="up" delay={0.1} duration={0.6} width="100%">
                    <div className="grid grid-cols-3 gap-6 mb-14">
                        {[
                            { label: 'Companies', value: '500+', icon: <Briefcase size={20} className="text-brand-violet" /> },
                            { label: 'Open Roles', value: '2,400+', icon: <TrendingUp size={20} className="text-brand-cyan" /> },
                            { label: 'Students Placed', value: '18K+', icon: <Users size={20} className="text-emerald-400" /> },
                        ].map((s, i) => (
                            <div key={i} className="glass-card p-6 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{s.icon}</div>
                                <div>
                                    <p className="text-2xl font-black">{s.value}</p>
                                    <p className="text-xs uppercase tracking-widest text-white/40 font-bold">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Search */}
                <ScrollReveal direction="up" delay={0.15} width="100%">
                    <div className="relative mb-8">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search companies, categories, tech stacks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-16 bg-brand-glass border border-brand-glass-border rounded-2xl pl-14 pr-6 text-lg focus:outline-none focus:border-brand-violet/50 transition-all text-brand-text placeholder:text-white/20"
                        />
                    </div>
                </ScrollReveal>

                {/* Category Tabs */}
                <ScrollReveal direction="up" delay={0.2} width="100%">
                    <div className="flex flex-wrap gap-2 mb-12">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                                    ? 'bg-brand-violet/20 text-brand-violet border border-brand-violet/40'
                                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Company Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key={activeCategory + search}
                >
                    {filtered.map((company) => (
                        <motion.div
                            key={company.id}
                            variants={cardVariants}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            className="glass-card p-7 flex flex-col gap-5 group cursor-pointer border-white/5 hover:border-white/15 transition-colors relative overflow-hidden"
                        >
                            {/* Background glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${company.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                                        {company.logo}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold group-hover:text-brand-violet transition-colors">{company.name}</h3>
                                        <p className="text-xs text-white/40 font-medium">{company.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                                    <Star size={13} fill="currentColor" /> {company.rating}
                                </div>
                            </div>

                            <p className="relative text-sm text-white/50 leading-relaxed line-clamp-2">{company.description}</p>

                            <div className="relative flex flex-wrap gap-3 text-xs text-white/40">
                                <span className="flex items-center gap-1"><MapPin size={11} /> {company.location}</span>
                                <span className="flex items-center gap-1"><Users size={11} /> {company.employees} employees</span>
                                <span className="flex items-center gap-1"><Briefcase size={11} /> {company.openings} openings</span>
                            </div>

                            <div className="relative flex flex-wrap gap-1.5">
                                {company.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs py-0.5 px-2">{tag}</Badge>
                                ))}
                            </div>

                            <div className="relative pt-2 border-t border-white/5">
                                <Link href={`/jobs?company=${encodeURIComponent(company.name)}`}>
                                    <Button variant="glass" className="w-full text-sm">
                                        View {company.openings} Open Roles →
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {filtered.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-white/40 text-lg">No companies found. Try a different search.</p>
                    </div>
                )}
            </div>

            {/* CTA Banner */}
            <ScrollReveal direction="up" delay={0.2} width="100%">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-card p-12 text-center bg-gradient-to-br from-brand-violet/20 via-transparent to-brand-cyan/20 border-brand-violet/20 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-violet/10 blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-brand-cyan/10 blur-3xl" />
                        <h2 className="relative text-3xl md:text-4xl font-black mb-4">Is your company hiring?</h2>
                        <p className="relative text-white/50 text-lg mb-8 max-w-lg mx-auto">
                            Post jobs and connect with 50,000+ talented students from top colleges.
                        </p>
                        <Link href="/register">
                            <Button size="lg" className="px-12">Get Started Free →</Button>
                        </Link>
                    </div>
                </div>
            </ScrollReveal>
        </main>
    );
}

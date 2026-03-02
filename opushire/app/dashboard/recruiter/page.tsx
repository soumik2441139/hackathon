"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Briefcase, Users, BarChart3, Plus, ArrowRight, Sparkles,
    ExternalLink, MapPin, Clock, ChevronRight, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { JobCard } from '@/components/jobs/JobCard';

export default function RecruiterDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, profileViews: '0' });
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, jobsRes] = await Promise.all([
                    jobsApi.getStats(),
                    jobsApi.getAll({ limit: 10, postedBy: user?._id })
                ]);
                setStats(statsRes.data);
                setMyJobs(jobsRes.data.jobs);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?._id) fetchData();
    }, [user?._id]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const cards = [
        {
            title: 'Active Jobs',
            value: stats.activeJobs,
            icon: <Briefcase size={28} />,
            color: 'from-[#E0C3FC] to-[#8EC5FC]',
            textColor: 'text-[#8EC5FC]',
            bg: 'bg-[#8EC5FC]/10'
        },
        {
            title: 'Total Applicants',
            value: stats.totalApplicants,
            icon: <Users size={28} />,
            color: 'from-[#A1FFCE] to-[#FAFFD1]',
            textColor: 'text-[#A1FFCE]',
            bg: 'bg-[#A1FFCE]/10'
        },
        {
            title: 'Profile Views',
            value: stats.profileViews,
            icon: <BarChart3 size={28} />,
            color: 'from-[#FF9A9E] to-[#FECFEF]',
            textColor: 'text-[#FF9A9E]',
            bg: 'bg-[#FF9A9E]/10'
        },
    ];

    return (
        <main className="pt-32 pb-24 px-6 overflow-hidden min-h-screen bg-brand-dark">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    {/* Header Area */}
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <AnimatePresence>
                                {user?.companyLogo && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-24 h-24 rounded-3xl bg-white/5 p-1 border border-white/10 overflow-hidden hidden md:flex items-center justify-center relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-violet/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img src={user.companyLogo} alt={user.companyName} className="w-full h-full object-contain relative z-10" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">
                                    <Sparkles size={12} className="text-brand-cyan" />
                                    Master Dashboard
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">
                                    Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E0C3FC] via-[#A1FFCE] to-[#FF9A9E] animate-gradient-x">{user?.name?.split(' ')[0] || 'Recruiter'}</span>
                                </h1>
                                <p className="text-white/40 text-lg font-medium">Your activity hub for <span className="text-white/80">{user?.companyName}</span></p>
                            </div>
                        </div>
                        <Link href="/dashboard/recruiter/post-job">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button className="h-16 px-10 text-lg gap-3 bg-white text-black hover:bg-white/90 shadow-[0_20px_40px_rgba(255,255,255,0.1)] rounded-2xl">
                                    <Plus size={20} /> Post Opportunity
                                </Button>
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {cards.map((card, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="glass-card p-8 relative overflow-hidden group border-white/5"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`} />
                                <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center ${card.textColor} mb-6 transition-transform duration-500 group-hover:rotate-6`}>
                                    {card.icon}
                                </div>
                                <h3 className="text-5xl font-black mb-1 tracking-tighter">{loading ? '...' : card.value}</h3>
                                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px]">{card.title}</p>
                                <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <TrendingUp size={14} />
                                    <span>+12% from last month</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom Section: Recent Jobs & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Recent Postings</h2>
                                <Link href="/jobs" className="text-xs font-bold text-white/30 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
                                    See all <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    [...Array(2)].map((_, i) => <div key={i} className="h-24 glass-card animate-pulse" />)
                                ) : myJobs.length > 0 ? (
                                    myJobs.map((job) => (
                                        <motion.div
                                            key={job._id}
                                            whileHover={{ x: 10 }}
                                            className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/5 hover:bg-white/[0.03]"
                                        >
                                            <div className="flex gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                                                    {job.companyLogo ? (
                                                        <img src={job.companyLogo} alt={job.company} className="w-8 h-8 object-contain" />
                                                    ) : '🏢'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">{job.title}</h4>
                                                    <div className="flex flex-wrap gap-4 mt-1">
                                                        <span className="text-xs text-white/40 flex items-center gap-1.5"><MapPin size={12} /> {job.location}</span>
                                                        <span className="text-xs text-white/40 flex items-center gap-1.5"><Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">Applicants</p>
                                                    <p className="font-black text-brand-cyan">0</p>
                                                </div>
                                                <Link href={`/jobs/${job._id}`}>
                                                    <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl border-white/10 hover:border-white/20">
                                                        Manage
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="glass-card p-12 text-center border-dashed border-white/5">
                                        <p className="text-white/20 font-medium">No jobs posted recently.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-6">
                            <h2 className="text-2xl font-black uppercase tracking-tight">Insights</h2>
                            <div className="bg-gradient-to-br from-[#E0C3FC]/10 to-[#8EC5FC]/10 border border-white/5 p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-violet/20 blur-3xl rounded-full" />
                                <div className="space-y-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-[#E0C3FC] text-black flex items-center justify-center">
                                        <Sparkles size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold leading-tight">Boost your reach with Premium</h3>
                                    <p className="text-sm text-white/50 leading-relaxed">Featured jobs get 4x more visibility. Reach the top 1% today.</p>
                                    <Button className="w-full bg-[#E0C3FC] text-black hover:bg-[#D4B3F8] font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">Upgrade Now</Button>
                                </div>
                            </div>

                            <div className="glass-card p-6 border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.05]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-cyan"><ExternalLink size={18} /></div>
                                    <span className="font-bold text-sm tracking-tight text-white/60 group-hover:text-white transition-colors">Help Center</span>
                                </div>
                                <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
            `}</style>
        </main>
    );
}

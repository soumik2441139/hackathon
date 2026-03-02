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
        <main className="pt-32 pb-24 px-6 overflow-hidden min-h-screen bg-[var(--background)] transition-colors duration-500">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    {/* Header Area - Starry Night Hero */}
                    <motion.div
                        variants={itemVariants}
                        className="relative p-12 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#0B1E3B] to-[#020817] border border-white/5 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#BEF264]/10 to-transparent pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#BEF264]/5 blur-[120px] rounded-full" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                            <div className="flex items-center gap-8">
                                <AnimatePresence>
                                    {user?.companyLogo && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-32 h-32 rounded-[2.5rem] bg-[#0F172A] p-2 border border-white/10 shadow-xl flex items-center justify-center relative group"
                                        >
                                            <img src={user.companyLogo} alt={user.companyName} className="w-20 h-20 object-contain" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#BEF264] mb-6">
                                        <Sparkles size={12} />
                                        Master Dashboard
                                    </div>
                                    <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter leading-none">
                                        <span className="text-white block">HELLO,</span>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BEF264] to-[#84CC16]">
                                            {user?.companyName || user?.name?.split(' ')[0] || 'RECRUITER'}
                                        </span>
                                    </h1>
                                    <p className="text-white/40 text-xl font-medium max-w-md">Your activity hub for {user?.companyName || 'your business'}.</p>
                                </div>
                            </div>

                            <Link href="/dashboard/recruiter/post-job">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button className="h-24 px-12 text-2xl gap-4 bg-white text-[#020817] font-black uppercase rounded-[2rem] shadow-2xl hover:bg-white/90 transition-all">
                                        <Plus size={32} strokeWidth={3} /> Post Opportunity
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stats Grid - Starry Night Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Active Jobs', value: stats.activeJobs, icon: <Briefcase size={28} />, color: 'from-[#BEF264]/5 to-transparent', iconColor: 'text-[#BEF264]' },
                            { title: 'Total Applicants', value: stats.totalApplicants, icon: <Users size={28} />, color: 'from-blue-400/5 to-transparent', iconColor: 'text-blue-400' },
                            { title: 'Profile Views', value: stats.profileViews, icon: <BarChart3 size={28} />, color: 'from-pink-400/5 to-transparent', iconColor: 'text-pink-400' },
                        ].map((card, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.02)" }}
                                className="p-10 rounded-[2.5rem] bg-[#0B1E3B]/40 border border-white/5 relative overflow-hidden group min-h-[220px] flex flex-col justify-between"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className={`w-16 h-16 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-center ${card.iconColor} mb-8 shadow-inner`}>
                                    {card.icon}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-6xl font-black mb-2 tracking-tighter text-white">{loading ? '...' : card.value}</h3>
                                    <p className="text-white/30 font-black uppercase tracking-widest text-[11px]">{card.title}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#BEF264]/60 uppercase tracking-tight">
                                        <TrendingUp size={12} /> +12% from last month
                                    </div>
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
                            <div className="bg-[#0B1E3B]/60 border border-white/5 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#BEF264]/10 blur-3xl rounded-full" />
                                <div className="space-y-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-[#BEF264] text-[#020817] flex items-center justify-center shadow-[0_0_30px_rgba(190,242,100,0.3)]">
                                        <Sparkles size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-none">Upgrade to <br /><span className="text-[#BEF264]">PRO Access</span></h3>
                                    <p className="text-sm text-white/50 leading-relaxed font-medium">Featured jobs get 4x more visibility. Reach the top 1% today.</p>
                                    <Button className="w-full bg-[#BEF264] text-[#020817] hover:bg-[#A3E635] font-black uppercase tracking-widest text-xs h-14 rounded-2xl transition-all shadow-xl">Activate Now</Button>
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

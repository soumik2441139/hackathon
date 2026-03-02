"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ApplicationTracker } from '@/components/dashboard/ApplicationTracker';
import { SavedJobs } from '@/components/dashboard/SavedJobs';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Settings, Bell, Camera, Loader2, Target,
    Bookmark, Briefcase, Zap, Sparkles, User as UserIcon,
    ChevronRight, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { freeapi, applications, jobs } from '@/lib/api';
import Link from 'next/link';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'applications' | 'saved'>('applications');
    const [stats, setStats] = useState({ apps: 0, saved: 2, profileViews: '18' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        applications.getMine().then(res => {
            setStats(s => ({ ...s, apps: res.data.length }));
        }).catch(() => { });
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const res = await freeapi.uploadAvatar(file);
            if (res.success && res.data.avatarUrl) {
                window.location.reload();
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Failed to upload avatar: ' + message);
        } finally {
            setIsUploading(false);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-32 pb-24 px-6 min-h-screen overflow-x-hidden bg-[var(--background)] selection:bg-brand-cyan/30">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-10"
                    >
                        {/* Hero Section */}
                        <motion.div variants={itemVariants} className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#0B0D17] to-[#05050A] border border-white/5 shadow-2xl p-10 md:p-14">
                            {/* Ambient Glows */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-cyan/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-violet/15 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/4" />

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                    <div
                                        className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-brand-violet via-brand-cyan to-brand-violet p-[2px] cursor-pointer group shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:shadow-[0_0_60px_rgba(0,240,255,0.4)] transition-all duration-500"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-full h-full rounded-[2.4rem] bg-[#0B0D17] flex items-center justify-center text-4xl font-black text-white overflow-hidden relative">
                                            {user?.avatar?.startsWith('http') ? (
                                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.avatar ?? user?.name?.charAt(0).toUpperCase() ?? '?'
                                            )}

                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                {isUploading ? <Loader2 className="animate-spin text-brand-cyan mb-1" size={24} /> : <Camera className="text-brand-cyan mb-1" size={24} />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">Update</span>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>

                                    <div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-[10px] font-black uppercase tracking-[0.2em] text-brand-cyan mb-4 backdrop-blur-md">
                                            <Sparkles size={12} className="animate-pulse" />
                                            Candidate Portal
                                        </div>
                                        <h1 className="text-5xl md:text-7xl font-black mb-2 uppercase tracking-tighter leading-none">
                                            <span className="text-white">HELLO, </span>
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-violet">
                                                {user?.name?.split(' ')[0] || 'STUDENT'}
                                            </span>
                                        </h1>
                                        <p className="text-white/50 text-xl font-medium flex items-center gap-2">
                                            <Zap size={18} className="text-brand-violet" />
                                            {[user?.degree, user?.college].filter(Boolean).join(', ') || 'Ready to discover your next role.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsSettingsOpen(false); }}
                                            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${isNotificationsOpen ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Bell size={24} />
                                            <span className="absolute top-3 right-3 w-3 h-3 bg-brand-violet rounded-full border-2 border-[#0B0D17] animate-pulse"></span>
                                        </button>

                                        <AnimatePresence>
                                            {isNotificationsOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-4 w-80 glass-card p-6 z-50 border-brand-cyan/20 shadow-2xl"
                                                >
                                                    <h3 className="font-bold mb-4 text-xs uppercase tracking-[0.2em] text-brand-cyan">Notifications</h3>
                                                    <div className="space-y-3">
                                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-violet/30 hover:bg-white/10 transition-all cursor-pointer group">
                                                            <p className="font-bold text-sm text-white group-hover:text-brand-violet transition-colors">Profile Viewed</p>
                                                            <p className="text-xs text-white/50 mt-1 leading-relaxed">A recruiter from Notional checked out your resume.</p>
                                                            <p className="text-[10px] uppercase font-bold text-white/20 mt-3">2 hours ago</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsNotificationsOpen(false); }}
                                            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${isSettingsOpen ? 'bg-brand-violet/10 border-brand-violet/30 text-brand-violet shadow-[0_0_20px_rgba(138,43,226,0.2)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Settings size={24} className={isSettingsOpen ? "animate-spin-slow" : ""} />
                                        </button>

                                        <AnimatePresence>
                                            {isSettingsOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-4 w-72 glass-card p-6 z-50 border-brand-violet/20 shadow-2xl"
                                                >
                                                    <h3 className="font-bold mb-4 text-xs uppercase tracking-[0.2em] text-brand-violet">Preferences</h3>
                                                    <div className="space-y-4">
                                                        {['Job Alerts', 'Application Updates', 'Newsletter'].map((item, i) => (
                                                            <div key={item} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                                                <span className="text-sm font-bold text-white/80">{item}</span>
                                                                <div className={`w-10 h-5 rounded-full relative cursor-pointer ${i < 2 ? 'bg-brand-violet' : 'bg-white/10'}`}>
                                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${i < 2 ? 'right-0.5' : 'left-0.5'}`} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Applications', value: stats.apps, icon: <Briefcase size={24} />, color: 'from-brand-cyan/10 to-transparent', border: 'border-brand-cyan/20', iconColor: 'text-brand-cyan' },
                                { title: 'Saved Jobs', value: stats.saved, icon: <Bookmark size={24} />, color: 'from-brand-violet/10 to-transparent', border: 'border-brand-violet/20', iconColor: 'text-brand-violet' },
                                { title: 'Profile Views', value: stats.profileViews, icon: <UserIcon size={24} />, color: 'from-pink-500/10 to-transparent', border: 'border-pink-500/20', iconColor: 'text-pink-500' },
                            ].map((s, i) => (
                                <div key={i} className={`glass-card p-8 bg-gradient-to-br ${s.color} border border-white/5 hover:${s.border} transition-all duration-300 group overflow-hidden relative`}>
                                    <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity scale-150 rotate-12 ${s.iconColor}`}>
                                        {s.icon}
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl bg-[#0B0D17] border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${s.iconColor}`}>
                                            {s.icon}
                                        </div>
                                    </div>
                                    <p className="text-4xl font-black mb-1 tracking-tighter relative z-10">{s.value}</p>
                                    <p className="text-xs uppercase tracking-widest text-white/40 font-bold relative z-10">{s.title}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* Interactive Main Section */}
                        <motion.div variants={itemVariants} className="glass-card rounded-[2.5rem] p-4 md:p-8 border-white/5 bg-[#05050A]/50">
                            <div className="flex items-center gap-2 mb-8 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('applications')}
                                    className={`px-8 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${activeTab === 'applications' ? 'bg-brand-cyan text-brand-dark shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'text-white/50 hover:text-white'}`}
                                >
                                    My Applications
                                </button>
                                <button
                                    onClick={() => setActiveTab('saved')}
                                    className={`px-8 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${activeTab === 'saved' ? 'bg-brand-violet text-white shadow-[0_0_20px_rgba(138,43,226,0.3)]' : 'text-white/50 hover:text-white'}`}
                                >
                                    Saved Opportunities
                                </button>
                            </div>

                            <div className="min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {activeTab === 'applications' ? <ApplicationTracker /> : <SavedJobs />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Explore Banner */}
                        <motion.div variants={itemVariants} className="relative rounded-[2.5rem] overflow-hidden bg-brand-cyan text-brand-dark p-10 md:p-14 border border-brand-cyan shadow-[0_0_40px_rgba(0,240,255,0.1)] group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-white/20 blur-[80px] rounded-full group-hover:bg-white/30 transition-colors"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Discover Your Next Move</h2>
                                    <p className="text-brand-dark/70 text-lg font-bold max-w-xl">
                                        Thousands of premium companies are looking for talent just like you. Let's get you placed.
                                    </p>
                                </div>
                                <Link href="/jobs">
                                    <button className="flex items-center gap-3 px-10 py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black hover:scale-105 transition-all shadow-xl">
                                        Explore Jobs <ExternalLink size={18} />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

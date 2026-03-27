"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ApplicationTracker } from '@/components/dashboard/ApplicationTracker';
import { SavedJobs } from '@/components/dashboard/SavedJobs';
import { ResumeUpload } from '@/components/dashboard/ResumeUpload';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Loader2, Sparkles, Brain, FileText, Settings, ArrowRight,
    Upload, Target, Bookmark, Briefcase, Zap, Cpu, Search, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { freeapi, applications, resumeScore as resumeScoreApi, match as matchApi } from '@/lib/api';
import Link from 'next/link';

export default function StudentDashboard() {
    const { user } = useAuth();
    
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'applications' | 'saved'>('applications');
    const [stats, setStats] = useState({ apps: 0, profileViews: '18', resumeScore: 0, matchCount: 0 });
    const [showResumeUpload, setShowResumeUpload] = useState(false);
    const [scoreAnimated, setScoreAnimated] = useState(0);

    const savedCount = user?.savedJobs?.length || 0;
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        applications.getMine().then(res => setStats(s => ({ ...s, apps: res.data.length }))).catch(() => {});
        resumeScoreApi.getMine().then(res => setStats(s => ({ ...s, resumeScore: res.score || 0 }))).catch(() => {});
        matchApi.getMine().then(res => setStats(s => ({ ...s, matchCount: res.matches?.length || 0 }))).catch(() => {});
    }, []);

    useEffect(() => {
        // Animate score dial
        const timer = setTimeout(() => {
            setScoreAnimated(stats.resumeScore);
        }, 500);
        return () => clearTimeout(timer);
    }, [stats.resumeScore]);

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

    // Calculate dynamic glowing colors based on AI Score
    const getScoreColor = (score: number) => {
        if (score >= 80) return { hex: '#10B981', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]', gradient: 'from-emerald-500/20 to-teal-500/5' };
        if (score >= 50) return { hex: '#F59E0B', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]', gradient: 'from-amber-500/20 to-orange-500/5' };
        if (score > 0) return { hex: '#EF4444', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]', gradient: 'from-red-500/20 to-rose-500/5' };
        return { hex: '#6366F1', glow: 'shadow-[0_0_40px_rgba(99,102,241,0.3)]', gradient: 'from-indigo-500/20 to-purple-500/5' };
    };

    const sColor = getScoreColor(stats.resumeScore);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scoreAnimated / 100) * circumference;

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-28 pb-24 px-4 sm:px-6 min-h-screen bg-[#050505] selection:bg-purple-500/30 overflow-x-hidden text-neutral-200">
                {/* Master Background Noise & Dynamic Orbs */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] rounded-full" />
                </div>

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* █ [BENTO 1] USER PROFILE (Col Span 8) █ */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="lg:col-span-8 p-8 md:p-10 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 relative overflow-hidden group"
                        >
                            {/* Animated SVG Border Sweep */}
                            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                                <div 
                                    className="relative w-32 h-32 rounded-full p-[3px] cursor-pointer group/avatar shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {/* Neon Spinning Gradient Border */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-indigo-500 animate-[spin_4s_linear_infinite] opacity-70 group-hover/avatar:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-indigo-500 blur-md opacity-40 animate-[spin_4s_linear_infinite]" />
                                    
                                    <div className="w-full h-full rounded-full bg-[#0A0A0C] flex items-center justify-center text-4xl font-black text-white overflow-hidden relative z-10">
                                        {user?.avatar?.startsWith('http') ? (
                                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user?.avatar ?? user?.name?.charAt(0).toUpperCase() ?? '?'
                                        )}
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-md">
                                            {isUploading ? <Loader2 className="animate-spin text-cyan-400 mb-1" size={24} /> : <Camera className="text-cyan-400 mb-1" size={24} />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Update</span>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                                </div>

                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-4 backdrop-blur-md">
                                        <Sparkles size={12} className="animate-pulse" />
                                        AI Candidate Portal
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-white">
                                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{user?.name?.split(' ')[0] || 'Student'}</span>
                                    </h1>
                                    <p className="text-neutral-400 text-lg flex items-center gap-2 font-medium">
                                        <Zap size={18} className="text-cyan-400" />
                                        {[user?.degree, user?.college].filter(Boolean).join(' • ') || 'Ready to accelerate your career.'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* █ [BENTO 2] AI RESUME SCORE (Col Span 4) █ */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className={`lg:col-span-4 p-8 rounded-3xl backdrop-blur-xl border border-white/5 relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b ${sColor.gradient}`}
                        >
                            <h3 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-6 flex items-center gap-2"><Cpu size={14}/> AI Match Score</h3>
                            
                            <div className={`relative w-40 h-40 flex items-center justify-center rounded-full ${sColor.glow}`}>
                                <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                                    {/* Track */}
                                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                    {/* Dynamic Score Ring */}
                                    <motion.circle 
                                        cx="50" cy="50" r={radius} fill="none" 
                                        stroke={sColor.hex} 
                                        strokeWidth="6" 
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-white">{stats.resumeScore}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">out of 100</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* █ [BENTO 3,4,5] QUICK NAV MODULES (Col Span 4 each) █ */}
                        {[
                            { title: 'Career Advisor', icon: <Brain size={24} />, desc: 'AI skill-gap analysis & insights', href: '/dashboard/student/ai', col: 'cyan' },
                            { title: 'Resume Vault', icon: <FileText size={24} />, desc: 'Upload or view analyzed resume', href: '#', onClick: () => setShowResumeUpload(!showResumeUpload), col: 'emerald' },
                            { title: 'Global Profile', icon: <Settings size={24} />, desc: 'Manage skills & preferences', href: '/dashboard/student/profile', col: 'purple' },
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                                className="lg:col-span-4 h-full"
                            >
                                <Link href={item.href} onClick={(e) => { if(item.onClick){ e.preventDefault(); item.onClick(); }}}>
                                    <div className="h-full p-6 rounded-3xl bg-neutral-900/30 backdrop-blur-md border border-white/5 hover:border-white/15 transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.col}-500/10 blur-[50px] rounded-full group-hover:bg-${item.col}-500/20 transition-colors`} />
                                        <div className="flex items-start justify-between mb-4 z-10 relative">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-110 transition-all shadow-xl">
                                                {item.icon}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                                <ArrowRight size={14} className="text-white/50 -rotate-45 group-hover:rotate-0 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="z-10 relative mt-4">
                                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                            <p className="text-sm font-medium text-neutral-500">{item.desc}</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}

                        {/* Resume Upload Module */}
                        <AnimatePresence>
                            {showResumeUpload && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, scale: 0.98 }}
                                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                                    exit={{ height: 0, opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.4 }}
                                    className="lg:col-span-12 overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl"
                                >
                                    <div className="p-8">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Upload size={18}/> Secure Encrypted Upload</h3>
                                        <ResumeUpload onUploadComplete={() => {
                                            setTimeout(() => {
                                                resumeScoreApi.getMine().then(res => setStats(s => ({ ...s, resumeScore: res.score || 0 }))).catch(() => {});
                                            }, 3000);
                                        }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* █ [BENTO 6,7,8] QUICK STATS (Col Span 4 each) █ */}
                         {[
                            { label: 'Active Applications', val: stats.apps, icon: <Briefcase size={16}/> },
                            { label: 'Saved Jobs', val: savedCount, icon: <Bookmark size={16}/> },
                            { label: 'Platform AI Matches', val: stats.matchCount, icon: <Target size={16}/> },
                        ].map((stat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                                className="lg:col-span-4 p-5 rounded-2xl bg-neutral-900/20 border border-white-[0.02] flex items-center justify-between group"
                            >
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{stat.label}</p>
                                    <p className="text-3xl font-black text-white">{stat.val}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                                    {stat.icon}
                                </div>
                            </motion.div>
                        ))}

                        {/* █ [BENTO 9] THE CAREER PIPELINE (Col Span 12) █ */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                            className="lg:col-span-12 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 overflow-hidden flex flex-col"
                            style={{ minHeight: '600px' }}
                        >
                            {/* Pipeline Header Tabs */}
                            <div className="border-b border-white/5 p-4 md:p-6 bg-black/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Activity className="text-purple-400" /> Career Pipeline
                                    </h2>
                                    <p className="text-neutral-500 text-sm mt-1">Manage your active job pursuits and AI recommended roles.</p>
                                </div>
                                <div className="flex bg-neutral-950 rounded-xl p-1 border border-white/5 w-full md:w-auto">
                                    <button
                                        onClick={() => setActiveTab('applications')}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'applications' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                    >
                                        Applications <span className="ml-2 bg-black/30 px-2 py-0.5 rounded text-xs">{stats.apps}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('saved')}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'saved' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                    >
                                        Saved <span className="ml-2 bg-black/30 px-2 py-0.5 rounded text-xs">{savedCount}</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Rendering Pipeline Content */}
                            <div className="flex-1 p-4 md:p-8 bg-black/10 relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: activeTab === 'applications' ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: activeTab === 'applications' ? 20 : -20 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="h-full"
                                    >
                                        {activeTab === 'applications' ? <ApplicationTracker /> : <SavedJobs />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                        
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

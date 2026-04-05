"use client";
import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft, Brain, Target, Briefcase, TrendingUp,
    Sparkles, BookOpen, AlertCircle, Loader2,
    ChevronDown, ChevronRight, ExternalLink, Zap,
    GraduationCap
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { resumeScore as resumeScoreApi, match as matchApi, careerAdvisor as careerAdvisorApi, opusAI as opusAIApi, type ApiError } from '@/lib/api';
import type { ResumeMatch, CareerInsight, ScoutMatch, ApiResponse } from '@/lib/types';



import Link from 'next/link';
import AnimatedLoadingSkeleton from '@/components/ui/AnimatedLoadingSkeleton';



export default function AIInsightsPage() {


    // Resume Score
    const [score, setScore] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<string[]>([]);
    const [scoreLoading, setScoreLoading] = useState(true);

    // AI Matches
    const [matches, setMatches] = useState<ResumeMatch[]>([]);
    const [matchLoading, setMatchLoading] = useState(true);

    // Career Advisor
    const [insights, setInsights] = useState<CareerInsight | null>(null);
    const [advisorLoading, setAdvisorLoading] = useState(true);
    const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());

    // Opus AI Live Discovery
    const [liveMatches, setLiveMatches] = useState<ScoutMatch[]>([]);

    const [liveLoading, setLiveLoading] = useState(true);


    // Errors
    const [noResume, setNoResume] = useState(false);

    useEffect(() => {
        // Fetch Resume Score
        resumeScoreApi.getMine()
            .then(res => {
                setScore(res.score || 0);
                setBreakdown(res.breakdown || []);
            })
            .catch((err: ApiError) => {
                if (err.status === 404) setNoResume(true);
            })

            .finally(() => setScoreLoading(false));

        // Fetch AI Matches
        matchApi.getMine()
            .then(res => {
                setMatches(res.matches || []);
            })
            .catch(() => {})
            .finally(() => setMatchLoading(false));

        // Fetch Career Advisor
        careerAdvisorApi.getMine()
            .then(res => {
                setInsights(res);
            })
            .catch(() => {})
            .finally(() => setAdvisorLoading(false));

        // Fetch Opus AI (Live) Discovery
        opusAIApi.getMatches()
            .then((res: ApiResponse<ScoutMatch[]>) => {
                setLiveMatches(res.data || []);
            })


            .catch(() => {})
            .finally(() => setLiveLoading(false));
    }, []);


    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    const toggleSkillExpand = (idx: number) => {
        setExpandedSkills(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    // Score color gradient
    const getScoreColor = (s: number) => {
        if (s >= 80) return { ring: 'stroke-emerald-400', text: 'text-emerald-400', label: 'Excellent' };
        if (s >= 60) return { ring: 'stroke-yellow-400', text: 'text-yellow-400', label: 'Good' };
        if (s >= 40) return { ring: 'stroke-orange-400', text: 'text-orange-400', label: 'Average' };
        return { ring: 'stroke-red-400', text: 'text-red-400', label: 'Needs Work' };
    };

    const scoreInfo = getScoreColor(score);

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-32 pb-24 px-6 min-h-screen bg-[#0A0A0C] text-white relative overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-purple-500/8 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] rounded-full" />
                    <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] bg-pink-500/5 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Back Button */}
                    <Link href="/dashboard/student">
                        <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                        </button>
                    </Link>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-purple-400 mb-4">
                            <Brain size={10} /> Powered by AI Agents
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-3">
                            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">Insights</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-2xl font-medium">
                            Your resume analyzed, matched with opportunities, and career path mapped — all autonomously.
                        </p>
                    </motion.div>

                    {/* No Resume State */}
                    {noResume && !scoreLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 rounded-3xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 text-center mb-12"
                        >
                            <AlertCircle size={48} className="text-orange-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">No Resume Found</h2>
                            <p className="text-white/50 mb-6 max-w-md mx-auto">Upload your resume from the dashboard to unlock AI-powered insights, job matching, and career advice.</p>
                            <Link href="/dashboard/student">
                                <button className="px-8 py-3 rounded-xl bg-orange-500 text-black font-black uppercase tracking-wider text-sm hover:bg-orange-400 transition-colors">
                                    Upload Resume
                                </button>
                            </Link>
                        </motion.div>
                    )}

                    {!noResume && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >
                            {/* Section 1: Resume Score */}
                            <motion.div variants={itemVariants} className="rounded-[2rem] p-8 md:p-10 border border-white/[0.06] bg-[#111114] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <Target size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">Resume Score</h2>
                                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">AI-Evaluated Quality Index</p>
                                        </div>
                                    </div>

                                    {scoreLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="animate-spin text-purple-400" size={32} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col lg:flex-row gap-10 items-center">
                                            {/* Circular Score */}
                                            <div className="relative w-52 h-52 shrink-0">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                                                    <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                                    <motion.circle
                                                        cx="100" cy="100" r="85" fill="none"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        className={scoreInfo.ring}
                                                        strokeDasharray={2 * Math.PI * 85}
                                                        initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                                                        animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - score / 100) }}
                                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.span
                                                        className={`text-5xl font-black tracking-tighter ${scoreInfo.text}`}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.5, type: 'spring' }}
                                                    >
                                                        {score}
                                                    </motion.span>
                                                    <span className="text-white/30 text-xs font-bold uppercase tracking-widest">out of 100</span>
                                                    <span className={`text-xs font-black uppercase tracking-widest mt-1 ${scoreInfo.text}`}>{scoreInfo.label}</span>
                                                </div>
                                            </div>

                                            {/* Score Breakdown */}
                                            <div className="flex-1 w-full space-y-3">
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Score Breakdown</h3>
                                                {breakdown.length > 0 ? (
                                                    breakdown.map((item, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.5 + i * 0.1 }}
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                                            <span className="text-sm text-white/70">{item}</span>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <p className="text-white/30 text-sm italic">Score breakdown will appear after AI analysis completes.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Section: Opus AI — Live Discovery */}
                            <motion.div variants={itemVariants} className="rounded-[2rem] p-8 md:p-10 border border-white/[0.06] bg-[#111114] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                                <Sparkles size={20} className="text-cyan-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black uppercase tracking-tighter">Opus AI <span className="text-white/30 font-bold ml-2">Live Discovery</span></h2>
                                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Autonomous matching engine</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <div className="px-4 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400/80">Active Scouts Scanning</span>
                                            </div>
                                        </div>
                                    </div>


                                    {liveLoading ? (
                                        <div className="py-2">
                                            <AnimatedLoadingSkeleton />
                                        </div>
                                    ) : liveMatches.length === 0 ? (
                                        <div className="text-center py-16 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10 group hover:border-pink-500/20 transition-colors">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                <Zap size={32} className="text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white/50 mb-2 uppercase tracking-tighter">No Live Discovery Yet</h3>
                                            <p className="text-white/30 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                                                Opus AI scouts are exploring Greenhouse, Lever, and remote boards for your perfect role.
                                            </p>

                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {liveMatches.map((m, i) => (
                                                <motion.div
                                                    key={m._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="p-6 rounded-[1.5rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 hover:border-pink-500/30 transition-all group relative overflow-hidden"
                                                >
                                                    {/* Score Indicator */}
                                                    <div className="absolute top-6 right-6 flex flex-col items-end">
                                                        <div className={`text-3xl font-black tracking-tighter leading-none ${m.antigravityScore >= 80 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                                            {m.antigravityScore}
                                                        </div>
                                                        <div className="text-[7px] font-black uppercase tracking-[0.2em] text-white/20">AI Confidence</div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <h4 className="font-bold text-white text-xl leading-tight mb-2 pr-12 group-hover:text-cyan-400 transition-colors">{m.jobTitle}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                                            <span className="text-cyan-400/90 text-[10px] font-black uppercase tracking-widest">{m.company}</span>

                                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">{m.location || 'Remote'}</span>
                                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest border border-white/5">{m.source}</span>
                                                        </div>
                                                    </div>

                                                    {/* AI Confidence Markers */}
                                                    <div className="flex flex-wrap gap-1.5 mb-8">
                                                        {m.matchedSkills.slice(0, 5).map(s => (
                                                            <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black text-emerald-400/70 uppercase tracking-wider">
                                                                {s}
                                                            </span>
                                                        ))}
                                                        {m.matchedSkills.length > 5 && (
                                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest self-center">+{m.matchedSkills.length - 5} More</span>
                                                        )}
                                                    </div>

                                                    <a href={m.applyUrl} target="_blank" rel="noopener noreferrer" className="block mt-auto relative z-10">
                                                        <button className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-[0.1em] text-[11px] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(6,182,212,0.2)]">
                                                            Quick Apply <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                        </button>
                                                    </a>
                                                    
                                                    {/* Decorative background glow */}
                                                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full group-hover:bg-cyan-500/10 transition-colors" />

                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Section 2: AI Job Matches */}

                            <motion.div variants={itemVariants} className="rounded-[2rem] p-8 md:p-10 border border-white/[0.06] bg-[#111114] relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                            <TrendingUp size={20} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">AI Job Matches</h2>
                                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Ranked by compatibility with your profile</p>
                                        </div>
                                    </div>

                                    {matchLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="animate-spin text-cyan-400" size={32} />
                                        </div>
                                    ) : matches.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Briefcase size={40} className="text-white/10 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-white/50 mb-2">No Matches Yet</h3>
                                            <p className="text-white/30 text-sm max-w-md mx-auto">
                                                AI agents are still processing your profile. Matches will appear after the matching pipeline runs.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {matches.map((m, i) => {
                                                const job = m.job;
                                                const matchPercent = Math.round((m.rerankScore || 0) * 100);
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition-all group"
                                                    >
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-white truncate">{job?.title || 'Untitled'}</h4>
                                                                <p className="text-white/40 text-sm">{job?.company || 'Unknown'} · {job?.location || ''}</p>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <span className={`text-2xl font-black tracking-tighter ${matchPercent >= 70 ? 'text-emerald-400' : matchPercent >= 40 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                                    {matchPercent}%
                                                                </span>
                                                                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Match</p>
                                                            </div>
                                                        </div>

                                                        {/* Match Bar */}
                                                        <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
                                                            <motion.div
                                                                className={`h-full rounded-full ${matchPercent >= 70 ? 'bg-emerald-400' : matchPercent >= 40 ? 'bg-yellow-400' : 'bg-orange-400'}`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${matchPercent}%` }}
                                                                transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                                                            />
                                                        </div>

                                                        {m.explanation && (
                                                            <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-2">{m.explanation}</p>
                                                        )}

                                                        <div className="flex gap-2">
                                                            {job?._id && (
                                                                <Link href={`/jobs/${job._id}`} className="flex-1">
                                                                    <button className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                                        View Job <ExternalLink size={12} />
                                                                    </button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Section 3: Career Advisor */}
                            <motion.div variants={itemVariants} className="rounded-[2rem] p-8 md:p-10 border border-white/[0.06] bg-[#111114] relative overflow-hidden">
                                <div className="absolute top-0 left-[30%] w-[300px] h-[300px] bg-pink-500/8 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                                            <GraduationCap size={20} className="text-pink-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">Career Advisor</h2>
                                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Skill gap analysis & personalized learning paths</p>
                                        </div>
                                    </div>

                                    {advisorLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="animate-spin text-pink-400" size={32} />
                                        </div>
                                    ) : !insights || (insights.gaps.length === 0 && insights.learningPath.length === 0) ? (
                                        <div className="text-center py-12">
                                            <BookOpen size={40} className="text-white/10 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-white/50 mb-2">No Insights Available</h3>
                                            <p className="text-white/30 text-sm max-w-md mx-auto">
                                                Career insights will be generated after AI matches your profile with job requirements.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Skill Gaps */}
                                            {insights.gaps.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                                        <Zap size={14} className="text-pink-400" /> Skill Gaps to Fill
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {insights.gaps.map((gap, i) => (
                                                            <motion.span
                                                                key={i}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: i * 0.05 }}
                                                                className="px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm font-bold"
                                                            >
                                                                {gap}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Learning Paths */}
                                            {insights.learningPath.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                                        <BookOpen size={14} className="text-purple-400" /> Learning Paths
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {insights.learningPath.map((lp, i) => {
                                                            const isExpanded = expandedSkills.has(i);
                                                            return (
                                                                <motion.div
                                                                    key={i}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
                                                                >
                                                                    <button
                                                                        onClick={() => toggleSkillExpand(i)}
                                                                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                                                <Sparkles size={14} className="text-purple-400" />
                                                                            </div>
                                                                            <span className="font-bold text-white">{lp.skill}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{lp.steps.length} steps</span>
                                                                            {isExpanded ? <ChevronDown size={16} className="text-white/30" /> : <ChevronRight size={16} className="text-white/30" />}
                                                                        </div>
                                                                    </button>

                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            className="border-t border-white/5 p-4"
                                                                        >
                                                                            <div className="space-y-2">
                                                                                {lp.steps.map((step, si) => (
                                                                                    <div key={si} className="flex items-start gap-3 py-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                                            <span className="text-[10px] font-black text-white/40">{si + 1}</span>
                                                                                        </div>
                                                                                        <span className="text-sm text-white/60">{step}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}

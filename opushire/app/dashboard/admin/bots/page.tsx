"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Terminal as TerminalIcon,
    Play, Square, RefreshCcw, X, Cpu, CheckCircle2, XCircle,
    FileText, ChevronDown, ChevronRight, Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { admin as adminApi } from '@/lib/api';
import { BarVisualizer, type AgentState } from '@/components/ui/BarVisualizer';

interface BotConfig {
    id: string;
    name: string;
    description: string;
    dir: string;
    script: string;
    color: string;
    status: 'online' | 'stopped' | 'error';
    uptime: number;
}

interface PendingJob {
    _id: string;
    title: string;
    company: string;
    tags: string[];
    verifiedTags: string[];
}

interface BotStats {
    jobsAdded?: number;
    anomaliesFound?: number;
    fixesMade?: number;
    hallucinationsCaught?: number;
    jobsArchived?: number;
    ghostJobsRemoved?: number;
    resumesMatched?: number;
    advisoriesGenerated?: number;
    profilesEnriched?: number;
}

interface BotAction {
    timestamp: string;
    action: string;
    count?: number;
}

interface BotReport {
    botId: string;
    botName: string;
    actions: BotAction[];
    summary: {
        totalActions: number;
        jobsProcessed: number;
        errors: number;
    };
}

export default function AdminBotsDashboard() {
    const { user: currentUser } = useAuth();
    const [bots, setBots] = useState<BotConfig[]>([]);
    const [stats, setStats] = useState<BotStats>({});
    const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isPollingLogs, setIsPollingLogs] = useState(false);

    // Reports state
    const [reports, setReports] = useState<Record<string, BotReport[]>>({});
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [reportsLoading, setReportsLoading] = useState(false);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchBotStatuses();
            fetchPendingJobs();
            fetchReports();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.role !== 'admin') return;
        const interval = setInterval(() => {
            fetchBotStatuses();
            fetchPendingJobs();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        if (!selectedBotId) {
            setIsPollingLogs(false);
            return;
        }

        setIsPollingLogs(true);
        fetchLogs(selectedBotId);

        const interval = setInterval(() => {
            fetchLogs(selectedBotId);
        }, 2000);

        return () => clearInterval(interval);
    }, [selectedBotId]);

    const fetchBotStatuses = async () => {
        try {
            const [statusRes, statsRes] = await Promise.all([
                adminApi.bots.getStatuses(),
                adminApi.botStats.getToday()
            ]);
            setBots(statusRes.data as BotConfig[]);
            if (statsRes.success) setStats(statsRes.data || {});
        } catch (err) {
            console.error('Failed to fetch bot statuses', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingJobs = async () => {
        try {
            const res = await adminApi.getPendingJobs();
            if (res.success) setPendingJobs(res.data);
        } catch (err) {
            console.error('Failed to fetch pending jobs', err);
        }
    };

    const fetchLogs = async (id: string) => {
        try {
            const res = await adminApi.bots.getLogs(id);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    const fetchReports = async () => {
        setReportsLoading(true);
        try {
            const res = await adminApi.reports.getAll();
            if (res.success) setReports(res.data || {});
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'start' | 'stop') => {
        try {
            // Optimistic UI updates to make it feel industry-grade and responsive
            setBots(prev => prev.map(b => b.id === id ? { ...b, status: action === 'start' ? 'online' : 'stopped' } : b));
            
            if (action === 'start') {
                await adminApi.bots.start(id);
            } else {
                await adminApi.bots.stop(id);
            }
            // Trigger an immediate sync for real-time accuracy after the command completes
            await fetchBotStatuses();
        } catch (err) {
            const error = err as Error;
            console.error(`Failed to ${action} bot`, error);
            alert(`Failed to ${action} bot: ${error.message || 'Unknown error'}`);
            await fetchBotStatuses();
        }
    };

    const handlePipelineTrigger = async () => {
        // If already running a pipeline/online bots, user probably wants to STOP the swarm
        const onlineCount = bots.filter(b => b.status === 'online').length;
        if (onlineCount > 0) {
            if (!confirm('This will stop ALL currently running bots in the ecosystem. Proceed?')) return;
            try {
                // Stop all running bots sequentially
                for (const bot of bots.filter(b => b.status === 'online')) {
                    await adminApi.bots.stop(bot.id);
                }
                alert('Ecosystem swarm stopped.');
                await fetchBotStatuses();
            } catch (err) {
                const error = err as Error;
                alert(error.message || 'Failed to stop pipeline');
            }
            return;
        }

        if (!confirm('This will trigger the full autonomous sequence: Recruiter -> Scanner -> Fixer -> Supervisor -> Cleaner -> Archiver -> Matcher -> Advisor -> LinkedIn Enricher. Proceed?')) return;
        try {
            // Non-awaited to let the swarm run asynchronously while UI stays reactive
            await adminApi.bots.pipeline();
            alert('Swarm pipeline initiated. View live logs for real-time progress.');
            await fetchBotStatuses();
        } catch (err) {
            const error = err as Error;
            alert(error.message || 'Failed to trigger pipeline');
        }
    };

    const handleJobReview = async (id: string, action: 'approve' | 'reject') => {
        try {
            setPendingJobs(prev => prev.filter(j => j._id !== id));
            await adminApi.resolvePendingJob(id, action);
            await fetchPendingJobs();
        } catch (err) {
            const error = err as Error;
            alert('Error reviewing job: ' + error.message);
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="space-y-6 max-w-md">
                    <ShieldAlert size={80} className="text-red-500 mx-auto animate-pulse" />
                    <h1 className="text-4xl font-black uppercase text-white tracking-tighter">Access Forbidden</h1>
                    <p className="text-white/40">Supervisor access required to manage AI ecosystem.</p>
                </div>
            </div>
        );
    }

    const onlineCount = bots.filter(b => b.status === 'online').length;
    const isPipelineRunning = onlineCount > 0;

    // Map bot IDs to their industrial impact metrics for the enterprise dashboard
    const getBotStatMetric = (botId: string) => {
        if (!stats) return { label: 'Today\'s Impact', value: 0 };
        switch (botId) {
            case 'bot0-recruiter': return { label: 'Jobs Scraped Today', value: stats.jobsAdded || 0 };
            case 'bot1-scanner': return { label: 'Anomalies Identified', value: stats.anomaliesFound || 0 };
            case 'bot2-fixer': return { label: 'Fixes Proposed', value: stats.fixesMade || 0 };
            case 'bot3-supervisor': return { label: 'Hallucinations Caught', value: stats.hallucinationsCaught || 0 };
            case 'bot4-cleanup': return { label: 'Jobs Rotating', value: stats.jobsArchived || 0 };
            case 'bot6-archiver': return { label: 'Ghost Jobs Removed', value: stats.ghostJobsRemoved || 0 };
            case 'bot7-matcher': return { label: 'Resumes Matched', value: stats.resumesMatched || 0 };
            case 'bot8-advisor': return { label: 'Advisories Generated', value: stats.advisoriesGenerated || 0 };
            case 'bot9-linkedin-enricher': return { label: 'Profiles Enriched', value: stats.profilesEnriched || 0 };
            default: return { label: 'Impact Score', value: 0 };
        }
    };

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-violet/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-violet mb-4">
                            <Cpu size={12} /> OpusHire Autonomous Ecosystem
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                            AI Bot <span className="text-gradient">Manager</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-2xl font-medium mb-6">Command center for the ecosystem&apos;s background micro-agents.</p>

                        <motion.button
                            onClick={handlePipelineTrigger}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`${isPipelineRunning ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white' : 'bg-brand-violet text-white border border-brand-violet/50 shadow-[0_0_20px_rgba(139,92,246,0.5)]'} transition-colors px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 `}
                        >
                            {isPipelineRunning ? (
                                <><Square size={16} fill="currentColor" /> Stop Pipeline</>
                            ) : (
                                <><Play size={16} fill="white" /> Initiate Swarm Pipeline</>
                            )}
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Active Operations</p>
                            <p className={`font-bold flex items-center justify-end gap-2 text-xl ${onlineCount > 0 ? 'text-emerald-400' : 'text-white/50'}`}>
                                {onlineCount > 0 && <Activity size={16} className="animate-bounce" />} {onlineCount} / {bots.length} Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bot Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 glass-card border-white/5 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
                        {bots.map((bot) => {
                            const metric = getBotStatMetric(bot.id);
                            return (
                                <div key={bot.id} className="glass-card p-6 md:p-8 border-white/5 relative group transition-all hover:border-white/10 flex flex-col justify-between">
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-3xl pointer-events-none z-0"
                                        style={{ background: `radial-gradient(circle at center, ${bot.color} 0%, transparent 70%)` }}
                                    />

                                    <div className="flex-1 relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ color: bot.color }}>{bot.name}</h3>
                                                <p className="text-xs text-white/30 font-mono mt-1">{bot.dir}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    bot.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-white/5 text-white/40 border-white/10'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${bot.status === 'online' ? 'bg-emerald-400 animate-pulse' : bot.status === 'error' ? 'bg-red-400' : 'bg-white/40'}`} />
                                                    {bot.status}
                                                </div>

                                                <div className="text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/10 text-white/60 font-bold tracking-wider">
                                                    {metric.label}: <span className="text-white">{metric.value}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-white/60 mb-6 font-medium leading-relaxed">
                                            {bot.description}
                                        </p>

                                        <div className="mb-6">
                                            {isMounted && bot.status === 'online' ? (
                                                <BarVisualizer
                                                    state={"speaking" as AgentState}
                                                    barCount={20}
                                                    minHeight={15}
                                                    maxHeight={90}
                                                    className="h-10"
                                                />
                                            ) : (
                                                <div className="h-10 flex items-end gap-[3px]">
                                                    {Array(20).fill(0).map((_, i) => (
                                                        <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: '15%' }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 relative z-10 w-full">
                                        {bot.status === 'online' ? (
                                            <motion.button
                                                onClick={() => handleAction(bot.id, 'stop')}
                                                whileHover={{ scale: 1.04, backgroundColor: 'rgba(239,68,68,1)', color: '#fff' }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold cursor-pointer"
                                            >
                                                <Square size={15} /> Stop Agent
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={() => handleAction(bot.id, 'start')}
                                                whileHover={{ scale: 1.04, backgroundColor: 'rgba(16,185,129,1)', color: '#fff' }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold cursor-pointer"
                                            >
                                                <Play size={15} /> Start Force
                                            </motion.button>
                                        )}

                                        <motion.button
                                            onClick={() => setSelectedBotId(bot.id)}
                                            whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff' }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold cursor-pointer"
                                        >
                                            <TerminalIcon size={15} /> Logs
                                        </motion.button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* AI Review Queue Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">AI Review Queue</h2>
                    <p className="text-white/40 mb-6">Jobs whose tags have been re-written by the LLM and successfully verified by the Supervisor bot. They await final industrial approval.</p>

                    {pendingJobs.length === 0 ? (
                        <div className="p-12 glass-card border-white/5 text-center flex flex-col items-center justify-center">
                            <CheckCircle2 size={40} className="text-emerald-500/50 mb-4" />
                            <h3 className="text-xl font-bold text-white/60">Queue is Clear</h3>
                            <p className="text-white/40 text-sm">All AI improvements have been reviewed by supervisors.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingJobs.map(job => (
                                <div key={job._id} className="glass-card p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">{job.title} <span className="text-white/40 font-normal">at {job.company}</span></h3>

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                                                <p className="text-xs text-red-400/80 font-bold mb-2 uppercase tracking-wider">Original Requirements</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.tags?.filter(t => t.length > 20).map((t, i) => (
                                                        <span key={i} className="text-xs bg-red-500/10 text-red-300 px-2 py-1 rounded-md max-w-full truncate">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                                <p className="text-xs text-emerald-400/80 font-bold mb-2 uppercase tracking-wider">AI Simplified Keywords</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.verifiedTags?.map((t, i) => (
                                                        <span key={i} className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-md">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex md:flex-col gap-2 shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleJobReview(job._id, 'approve')}
                                            className="bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 flex-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow"
                                        >
                                            <CheckCircle2 size={18} /> Approve Keyword Extraction
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleJobReview(job._id, 'reject')}
                                            className="bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/20 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 flex-1 transition-colors"
                                        >
                                            <XCircle size={18} /> Reject
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Automation Log Feed */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
                                <FileText size={28} className="text-brand-cyan" /> Automation Flux
                            </h2>
                            <p className="text-white/40">Real-time activity audit from the last 7 production days.</p>
                        </div>
                        <motion.button
                            onClick={fetchReports}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 text-sm font-bold"
                        >
                            <RefreshCcw size={14} className={reportsLoading ? 'animate-spin' : ''} /> Force Sync
                        </motion.button>
                    </div>

                    {Object.keys(reports).length === 0 ? (
                        <div className="p-12 glass-card border-white/5 text-center flex flex-col items-center justify-center">
                            <Clock size={40} className="text-white/20 mb-4" />
                            <h3 className="text-xl font-bold text-white/60">Silence in the Flux</h3>
                            <p className="text-white/40 text-sm">Activity logs will emerge here as bots process jobs.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(reports).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayReports]) => {
                                const isExpanded = expandedDay === date;
                                const totalActions = dayReports.reduce((sum: number, r: BotReport) => sum + (r.summary?.totalActions || 0), 0);
                                const totalErrors = dayReports.reduce((sum: number, r: BotReport) => sum + (r.summary?.errors || 0), 0);
                                const totalProcessed = dayReports.reduce((sum: number, r: BotReport) => sum + (r.summary?.jobsProcessed || 0), 0);
                                const isToday = date === new Date().toISOString().split('T')[0];

                                return (
                                    <div key={date} className="glass-card border-white/5 overflow-hidden">
                                        <button
                                            onClick={() => setExpandedDay(isExpanded ? null : date)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                {isExpanded ? <ChevronDown size={18} className="text-white/40" /> : <ChevronRight size={18} className="text-white/40" />}
                                                <div>
                                                    <p className="font-bold text-lg">
                                                        {isToday && <span className="text-brand-cyan mr-2">●</span>}
                                                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        {isToday && <span className="ml-2 text-[10px] bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Production Today</span>}
                                                    </p>
                                                    <p className="text-xs text-white/30 mt-1">{dayReports.length} agent swarms active</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                                    <span className="text-white/40">Events:</span> <span className="text-white font-bold">{totalActions}</span>
                                                </span>
                                                <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                    <span className="text-emerald-400/60">Throughput:</span> <span className="text-emerald-400 font-bold">{totalProcessed}</span>
                                                </span>
                                                {totalErrors > 0 && (
                                                    <span className="bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                                        <span className="text-red-400/60">Anomalies:</span> <span className="text-red-400 font-bold">{totalErrors}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="border-t border-white/5 p-5 space-y-4">
                                                        {dayReports.map((report: BotReport) => {
                                                            const botColor = bots.find(b => b.id === report.botId)?.color || '#a78bfa';
                                                            return (
                                                                <div key={report.botId} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: botColor }}>{report.botName}</h4>
                                                                        <div className="flex gap-3 text-[10px]">
                                                                            <span className="text-white/40">Events: <span className="text-white font-bold">{report.summary?.totalActions || 0}</span></span>
                                                                            <span className="text-white/40">Impact: <span className="text-emerald-400 font-bold">{report.summary?.jobsProcessed || 0}</span></span>
                                                                            {(report.summary?.errors || 0) > 0 && (
                                                                                <span className="text-red-400">Errors: <span className="font-bold">{report.summary.errors}</span></span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                                        {(report.actions || []).map((action: BotAction, idx: number) => (
                                                                            <div key={idx} className="flex items-start gap-3 text-xs py-1">
                                                                                <span className="text-white/20 font-mono shrink-0 mt-0.5">
                                                                                    {new Date(action.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                <span className={action.action.includes('ERROR') || action.action.includes('❌') ? 'text-red-400' : action.action.includes('✅') ? 'text-emerald-400' : 'text-white/60'}>
                                                                                    {action.action}
                                                                                    {typeof action.count === 'number' && action.count > 0 && <span className="ml-1 text-white/30">({action.count})</span>}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                        {(!report.actions || report.actions.length === 0) && (
                                                                            <p className="text-white/20 text-xs italic">Stream quiet.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Terminal Stream Overaly */}
            <AnimatePresence>
                {selectedBotId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBotId(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-[#0C0C0E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                            style={{ height: '70vh' }}
                        >
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <TerminalIcon size={16} className="text-white/40" />
                                    <span className="text-xs font-mono text-white/60">{bots.find(b => b.id === selectedBotId)?.name} Terminal stream</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                                        <RefreshCcw size={10} className={isPollingLogs ? "animate-spin text-emerald-400" : ""} />
                                        {isPollingLogs ? 'Live Swarm Status' : 'Audit Mode'}
                                    </div>
                                    <button onClick={() => setSelectedBotId(null)} className="text-white/40 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs md:text-sm bg-black text-white/80 leading-relaxed custom-scrollbar">
                                {logs.length === 0 ? (
                                    <p className="text-white/20 italic">Awaiting agent handshake. No stream output yet.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className="break-all whitespace-pre-wrap">
                                                {log.includes('ERROR') || log.includes('Failed') || log.includes('❌') ? (
                                                    <span className="text-red-400">{log}</span>
                                                ) : log.includes('✅') || log.includes('Success') || log.includes('Connected') ? (
                                                    <span className="text-emerald-400">{log}</span>
                                                ) : log.includes('Bot ' + (bots.find(b => b.id === selectedBotId)?.name)) || log.includes('[') ? (
                                                    <span style={{ color: bots.find(b => b.id === selectedBotId)?.color || '#fff' }}>{log}</span>
                                                ) : (
                                                    <span className="text-white/70">{log}</span>
                                                )}
                                            </div>
                                        ))}
                                        {/* Auto-scroll anchor */}
                                        <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Terminal as TerminalIcon,
    Play, Square, RefreshCcw, X, Cpu, CheckCircle2, XCircle
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

export default function AdminBotsDashboard() {
    const { user: currentUser } = useAuth();
    const [bots, setBots] = useState<BotConfig[]>([]);
    const [stats, setStats] = useState<any>({});
    const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isPollingLogs, setIsPollingLogs] = useState(false);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchBotStatuses();
            fetchPendingJobs();
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
            setBots(statusRes.data);
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

    const handleAction = async (id: string, action: 'start' | 'stop') => {
        try {
            setBots(prev => prev.map(b => b.id === id ? { ...b, status: action === 'start' ? 'online' : 'stopped' } : b));
            if (action === 'start') {
                await adminApi.bots.start(id);
            } else {
                await adminApi.bots.stop(id);
            }
            await fetchBotStatuses();
        } catch (err: any) {
            alert(`Failed to ${action} bot: ${err.message}`);
            await fetchBotStatuses();
        }
    };

    const handlePipelineTrigger = async () => {
        // If already running a pipeline/has online bots, user probably wants to STOP
        if (onlineCount > 0) {
            if (!confirm('This will stop ALL currently running bots in the ecosystem. Proceed?')) return;
            try {
                // Stop all sequentially
                for (const bot of bots.filter(b => b.status === 'online')) {
                    await adminApi.bots.stop(bot.id);
                }
                alert('Ecosystem pipeline stopped.');
                fetchBotStatuses();
            } catch (err: any) {
                alert(err.message || 'Failed to stop pipeline');
            }
            return;
        }

        if (!confirm('This will trigger the full autonomous sequence: Recruiter -> Scanner -> Fixer -> Supervisor -> Archiver. Proceed?')) return;
        try {
            await adminApi.bots.pipeline();
            alert('Pipeline sequence initiated. View live logs for progress.');
            fetchBotStatuses();
        } catch (err: any) {
            alert(err.message || 'Failed to trigger pipeline');
        }
    };

    const handleJobReview = async (id: string, action: 'approve' | 'reject') => {
        try {
            setPendingJobs(prev => prev.filter(j => j._id !== id));
            await adminApi.resolvePendingJob(id, action);
            fetchPendingJobs();
        } catch (err: any) {
            alert('Error reviewing job: ' + err.message);
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

    // Map bot ID to the stat it tracks
    const getBotStatMetric = (botId: string) => {
        if (!stats) return { label: 'Today\'s Impact', value: 0 };
        switch (botId) {
            case 'bot0-recruiter': return { label: 'Jobs Scraped Today', value: stats.jobsAdded || 0 };
            case 'bot1-scanner': return { label: 'Anomalies Identified', value: stats.anomaliesFound || 0 };
            case 'bot2-fixer': return { label: 'Fixes Proposed', value: stats.fixesMade || 0 };
            case 'bot3-supervisor': return { label: 'Fixes Verified', value: stats.approvals || 0 };
            case 'bot4-cleanup': return { label: 'Jobs Archived', value: stats.jobsArchived || 0 };
            case 'bot6-archiver': return { label: 'Ghost Jobs Removed', value: stats.jobsArchived || 0 };
            default: return { label: 'No Data', value: 0 };
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
                        <p className="text-white/40 text-lg max-w-2xl font-medium mb-6">Command center for the ecosystem's background micro-agents.</p>

                        <motion.button
                            onClick={handlePipelineTrigger}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`${isPipelineRunning ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white' : 'bg-brand-violet text-white border border-brand-violet/50 shadow-[0_0_20px_rgba(139,92,246,0.5)]'} transition-colors px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 `}
                        >
                            {isPipelineRunning ? (
                                <><Square size={16} fill="currentColor" /> Stop Pipeline</>
                            ) : (
                                <><Play size={16} fill="white" /> Initiate Autonomous Pipeline</>
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
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 glass-card border-white/5 animate-pulse" />)}
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
                                        {bot.id === 'bot5-cleaner' ? (
                                            <motion.button
                                                onClick={() => window.location.href = '/dashboard/admin/cleaner'}
                                                whileHover={{ scale: 1.04, backgroundColor: 'rgba(249,115,22,1)', color: '#fff' }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/30 text-sm font-bold cursor-pointer"
                                            >
                                                <ShieldAlert size={15} /> Open Cleaner Dashboard
                                            </motion.button>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* AI Review Queue Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">AI Review Queue</h2>
                    <p className="text-white/40 mb-6">Jobs whose tags have been re-written by the LLM and successfully verified by the Supervisor bot. They await your final approval to go live.</p>

                    {pendingJobs.length === 0 ? (
                        <div className="p-12 glass-card border-white/5 text-center flex flex-col items-center justify-center">
                            <CheckCircle2 size={40} className="text-emerald-500/50 mb-4" />
                            <h3 className="text-xl font-bold text-white/60">Queue is Empty</h3>
                            <p className="text-white/40 text-sm">All AI fixes have been reviewed.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingJobs.map(job => (
                                <div key={job._id} className="glass-card p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">{job.title} <span className="text-white/40 font-normal">at {job.company}</span></h3>

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                                                <p className="text-xs text-red-400/80 font-bold mb-2 uppercase tracking-wider">Original Long Tags</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.tags?.filter(t => t.length > 20).map((t, i) => (
                                                        <span key={i} className="text-xs bg-red-500/10 text-red-300 px-2 py-1 rounded-md max-w-full truncate">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                                <p className="text-xs text-emerald-400/80 font-bold mb-2 uppercase tracking-wider">Proposed Short Tags</p>
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
                                            <CheckCircle2 size={18} /> Apply Fix
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
            </div>

            {/* Terminal Modal */}
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
                                    <span className="text-xs font-mono text-white/60">{bots.find(b => b.id === selectedBotId)?.name} Terminal Stream</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                                        <RefreshCcw size={10} className={isPollingLogs ? "animate-spin text-emerald-400" : ""} />
                                        {isPollingLogs ? 'Live Syncing' : 'Paused'}
                                    </div>
                                    <button onClick={() => setSelectedBotId(null)} className="text-white/40 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs md:text-sm bg-black text-white/80 leading-relaxed flex flex-col justify-end custom-scrollbar">
                                {logs.length === 0 ? (
                                    <p className="text-white/20 italic">No logs available. Bot might be starting or has not emitted any output yet.</p>
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

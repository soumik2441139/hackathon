"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Terminal as TerminalIcon,
    Play, Square, RefreshCcw, X, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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

export default function AdminBotsDashboard() {
    const { user: currentUser } = useAuth();
    const [bots, setBots] = useState<BotConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Mark as mounted after first client render (guards SSR-unsafe components)
    useEffect(() => { setIsMounted(true); }, []);

    // Terminal Modal State
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isPollingLogs, setIsPollingLogs] = useState(false);

    // Initial load
    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchBotStatuses();
        }
    }, [currentUser]);

    // Poll statuses every 5 seconds
    useEffect(() => {
        if (currentUser?.role !== 'admin') return;
        const interval = setInterval(fetchBotStatuses, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Poll logs every 2 seconds if modal is open
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
            const res = await adminApi.bots.getStatuses();
            setBots(res.data);
        } catch (err) {
            console.error('Failed to fetch bot statuses', err);
        } finally {
            setLoading(false);
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
            // Optimistic UI update
            setBots(prev => prev.map(b => b.id === id ? { ...b, status: action === 'start' ? 'online' : 'stopped' } : b));

            if (action === 'start') {
                await adminApi.bots.start(id);
            } else {
                await adminApi.bots.stop(id);
            }
            await fetchBotStatuses(); // Sync real status
        } catch (err: any) {
            alert(`Failed to ${action} bot: ${err.message}`);
            await fetchBotStatuses(); // Revert on failure
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

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
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
                        <p className="text-white/40 text-lg max-w-2xl font-medium">Command center for the ecosystem's background micro-agents.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-64 glass-card border-white/5 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bots.map((bot) => (
                            <div key={bot.id} className="glass-card p-6 md:p-8 border-white/5 relative group transition-all hover:border-white/10 flex flex-col justify-between">
                                {/* Hover Gradient */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-3xl"
                                    style={{ background: `radial-gradient(circle at center, ${bot.color} 0%, transparent 70%)` }}
                                />

                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ color: bot.color }}>{bot.name}</h3>
                                            <p className="text-xs text-white/30 font-mono mt-1">{bot.dir}/{bot.script}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            bot.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${bot.status === 'online' ? 'bg-emerald-400 animate-pulse' : bot.status === 'error' ? 'bg-red-400' : 'bg-white/40'}`} />
                                            {bot.status}
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/60 mb-6 font-medium leading-relaxed">
                                        {bot.description}
                                    </p>

                                    {/* BarVisualizer Heartbeat - only once mounted on client */}
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

                                <div className="flex items-center gap-3">
                                    {bot.status === 'online' ? (
                                        <motion.button
                                            onClick={() => handleAction(bot.id, 'stop')}
                                            whileHover={{ scale: 1.04, backgroundColor: 'rgba(239,68,68,1)', color: '#fff' }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold cursor-pointer"
                                        >
                                            <Square size={15} /> Stop Agent
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            onClick={() => handleAction(bot.id, 'start')}
                                            whileHover={{ scale: 1.04, backgroundColor: 'rgba(16,185,129,1)', color: '#fff' }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold cursor-pointer"
                                        >
                                            <Play size={15} /> Start Agent
                                        </motion.button>
                                    )}

                                    <motion.button
                                        onClick={() => setSelectedBotId(bot.id)}
                                        whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff' }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold cursor-pointer"
                                    >
                                        <TerminalIcon size={15} /> View Live Logs
                                    </motion.button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                            {/* Terminal Window Header */}
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

                            {/* Terminal Output */}
                            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs md:text-sm bg-black text-white/80 leading-relaxed scrollbar-hide flex flex-col justify-end">
                                {logs.length === 0 ? (
                                    <p className="text-white/20 italic">No logs available. Bot might be starting or has not emitted any output yet.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className="break-all whitespace-pre-wrap">
                                                {log.includes('ERROR') || log.includes('Failed') ? (
                                                    <span className="text-red-400">{log}</span>
                                                ) : log.includes('✅') || log.includes('Success') || log.includes('Connected') ? (
                                                    <span className="text-emerald-400">{log}</span>
                                                ) : log.includes('Bot ' + (bots.find(b => b.id === selectedBotId)?.name)) || log.includes('[') ? (
                                                    <span style={{ color: bots.find(b => b.id === selectedBotId)?.color }}>{log}</span>
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

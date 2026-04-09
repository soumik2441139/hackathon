"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Briefcase, Trash2,
    Search, ShieldAlert,
    Activity, Zap, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { admin as adminApi } from '@/lib/api';
import { User } from '@/lib/types';

interface HealthStatus {
    status: 'ok' | 'error';
    mongodb: string;
    redis: {
        primary: string;
        secondary: string;
        tertiary: string;
    };
    alerts: { type: string; message: string }[];
    circuits: Record<string, string>;
}

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Record<string, number> | null>(null);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [latency, setLatency] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'student' | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const start = performance.now();
                const [usersRes, statsRes, healthRes] = await Promise.all([
                    adminApi.getUsers(filter === 'all' ? undefined : filter),
                    adminApi.getStats(),
                    adminApi.getHealth().catch(() => ({ data: null }))
                ]);
                const end = performance.now();
                setLatency(Math.round(end - start));
                setUsers(usersRes.data);
                setStats(statsRes.data);
                if (healthRes.data) setHealth(healthRes.data);
            } catch (err) {
                console.error('Admin Access Denied:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.role === 'admin') {
            fetchAdminData();
            const interval = setInterval(() => {
                const start = performance.now();
                adminApi.getStats().then(res => setStats(res.data)).catch(console.error);
                adminApi.getHealth().then(res => {
                    const end = performance.now();
                    setLatency(Math.round(end - start));
                    setHealth(res.data);
                }).catch(console.error);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [currentUser, filter]);

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you absolutely sure? This will delete all associated data (jobs/applications). This action cannot be undone.')) return;
        try {
            await adminApi.deleteUser(id);
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete user');
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="space-y-6 max-w-md">
                    <ShieldAlert size={80} className="text-red-500 mx-auto animate-pulse" />
                    <h1 className="text-4xl font-black uppercase text-white tracking-tighter">Access Forbidden</h1>
                    <p className="text-white/40">This sector is restricted to supervisors only. Your activity has been logged.</p>
                    <Button onClick={() => window.location.href = '/'} variant="outline" className="border-white/10 text-white">Return to Surface</Button>
                </div>
            </div>
        );
    }

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const filteredUsers = users.filter((u) =>
        [u.name, u.email, u.college, u.degree, u.year]
            .some((value) => (value ?? '').toLowerCase().includes(normalizedSearchTerm))
    );

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-violet/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* System Alerts */}
                {health && health.alerts && health.alerts.length > 0 && (
                    <div className="mb-8 space-y-4">
                        {health.alerts.map((alert, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top border ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/50 text-red-100' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-100'}`}>
                                <ShieldAlert size={24} className={alert.type === 'critical' ? 'text-red-500 animate-pulse' : 'text-yellow-500'} />
                                <div>
                                    <h3 className="font-bold text-sm uppercase tracking-wider">{alert.type === 'critical' ? 'Critical Outage' : 'System Warning'}</h3>
                                    <p className="text-white/70">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan mb-4 animate-pulse">
                            <Shield size={12} /> System Supervisor Access
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                            Admin <span className="text-gradient">Console</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-2xl font-medium">Monitoring platform-wide activity and managing authority across student and administrator accounts.</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="text-right px-4">
                                <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">System Status</p>
                                <p className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
                                    <Activity size={12} className="animate-bounce" /> OPUS_ONLINE_01
                                </p>
                            </div>
                        </div>
                        <Button
                            className="bg-brand-violet hover:bg-brand-violet/80 text-white w-full border border-brand-violet/20 shadow-[0_0_20px_rgba(138,43,226,0.3)] gap-2 h-12 rounded-2xl"
                            onClick={() => window.location.href = '/dashboard/admin/jobs'}
                        >
                            <Briefcase size={16} /> Manage Job Listings
                        </Button>
                        <Button
                            className="bg-[#0C0C0E] hover:bg-white/10 text-white w-full border border-white/20 gap-2 h-12 rounded-2xl"
                            onClick={() => window.location.href = '/dashboard/admin/bots'}
                        >
                            <Sparkles size={16} className="text-brand-cyan" /> Autonomous Bot Hub
                        </Button>
                    </div>
                </div>

                {/* System Heartbeat HUD */}
                <div className="grid grid-cols-1 mb-12">
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                                <Activity size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">System Heartbeat</h3>
                                <p className="text-sm font-bold text-white/80">Cluster Health Telemetry</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 flex-wrap">
                            {/* Latency */}
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Latency</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${latency && latency < 300 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : (latency && latency < 600 ? 'bg-yellow-500 shadow-[0_0_10px_#f59e0b]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]')}`} />
                                    <span className="text-sm font-black mono">{latency ? `${latency}ms` : '---'}</span>
                                </div>
                            </div>

                            {/* Providers */}
                            {[
                                { label: 'Azure (PR)', status: health?.redis?.primary },
                                { label: 'Upstash (SC)', status: health?.redis?.secondary },
                                { label: 'Render (TR)', status: health?.redis?.tertiary },
                                { label: 'MongoDB', status: health?.mongodb === 'connected' ? 'connected' : 'unavailable' }
                            ].map((db, i) => (
                                <div key={i} className="flex flex-col items-center border-l border-white/5 pl-8">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">{db.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${db.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500/50'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${db.status === 'connected' ? 'text-emerald-400' : 'text-white/20'}`}>
                                            {db.status === 'connected' ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { id: 'all', label: 'Total Jobs', val: stats?.totalJobs, icon: <Briefcase />, color: 'text-brand-violet', bg: 'bg-brand-violet/10', role: 'all' },
                        { id: 'all', label: 'Total Apps', val: stats?.totalApplicants, icon: <Zap />, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10', role: 'all' },
                        { id: 'student', label: 'Students', val: stats?.totalStudents, icon: <Users />, color: 'text-[#A1FFCE]', bg: 'bg-[#A1FFCE]/10', role: 'student' },
                    ].map((s, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilter(s.role as 'all' | 'student')}
                            className={`glass-card p-8 border-white/5 transition-all group overflow-hidden relative text-left w-full ${filter === s.role ? 'ring-2 ring-brand-cyan bg-white/[0.05]' : 'hover:border-white/10'}`}
                        >
                            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity scale-[3]`}>{s.icon}</div>
                            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}>{s.icon}</div>
                            <h3 className="text-5xl font-black tracking-tighter mb-1">{loading ? '...' : s.val}</h3>
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest leading-none">{s.label}</p>
                        </motion.button>
                    ))}
                </div>

                {/* Insights Panel */}
                <AnimatePresence mode="wait">
                    {filter !== 'all' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-12 overflow-hidden"
                        >
                            <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl p-8 backdrop-blur-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="text-brand-cyan" size={20} />
                                    <h2 className="text-xl font-bold uppercase tracking-tight">System Insights: {filter}s</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Activity Trend</p>
                                        <p className="text-sm font-medium">Growth in {filter} registrations is up 12% this week.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority Segment</p>
                                        <p className="text-sm font-medium">Engineering graduates are most active.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Admin Note</p>
                                        <p className="text-sm font-medium">Ensure profile verification is completed within 24h.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Management Section */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl transition-all ${filter === 'all' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>All Users</button>
                            <button onClick={() => setFilter('student')} className={`px-4 py-2 rounded-xl transition-all ${filter === 'student' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Students</button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-cyan transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email, college or degree..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 w-full md:w-[400px] outline-none focus:border-brand-cyan/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden border-white/5">
                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-white/30 bg-white/[0.01]">
                                        <th className="px-8 py-6">User Identity</th>
                                        <th className="px-8 py-6">Role</th>
                                        <th className="px-8 py-6">Profile Snapshot</th>
                                        <th className="px-8 py-6 text-right">Action Authority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-8 h-20 bg-white/[0.01]" />
                                            </tr>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => (
                                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xs border border-white/10">
                                                            {u.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{u.name}</p>
                                                            <p className="text-xs text-white/30">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-brand-violet/10 border-brand-violet/20 text-brand-violet' : 'bg-[#A1FFCE]/10 border-[#A1FFCE]/20 text-[#A1FFCE]'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {u.role === 'student' ? (
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">{u.college || <span className="text-white/20 italic">No College</span>}</p>
                                                            <p className="text-[10px] font-black uppercase text-brand-cyan tracking-widest">{u.degree || 'General'}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">Platform administrator</p>
                                                            <p className="text-[10px] font-black uppercase text-brand-violet tracking-widest">Full access</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center mx-auto ml-auto"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-white/20 font-medium">No users matched the current search parameters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

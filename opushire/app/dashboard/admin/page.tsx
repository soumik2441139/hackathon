"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Briefcase, Trash2,
    ExternalLink, Search, ShieldAlert,
    Activity, Zap, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { admin as adminApi } from '@/lib/api';
import { User } from '@/lib/types';

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'student' | 'recruiter' | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [usersRes, statsRes] = await Promise.all([
                    adminApi.getUsers(filter === 'all' ? undefined : filter),
                    adminApi.getStats()
                ]);
                setUsers(usersRes.data);
                setStats(statsRes.data);
            } catch (err) {
                console.error('Admin Access Denied:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.role === 'admin') {
            fetchAdminData();
        }
    }, [currentUser, filter]);

    const handleReSync = async () => {
        if (!confirm('This will attempt to pull and reorganize data from the legacy "hackathon" database. Proceed?')) return;
        setLoading(true);
        try {
            await adminApi.reSync();
            alert('Re-Sync completed. Refreshing data...');
            window.location.reload();
        } catch (err) {
            console.error('Re-Sync failed:', err);
            alert('Re-Sync encountered an issue. Check system logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you absolutely sure? This will delete all associated data (jobs/applications). This action cannot be undone.')) return;
        try {
            await adminApi.deleteUser(id);
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (err) {
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

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-violet/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan mb-4 animate-pulse">
                            <Shield size={12} /> System Supervisor Access
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                            Admin <span className="text-gradient">Console</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-2xl font-medium">Monitoring platform-wide activity and managing authority across student and recruiter collectives.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <div className="text-right px-4">
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">System Status</p>
                            <p className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
                                <Activity size={12} className="animate-bounce" /> OPUS_ONLINE_01
                            </p>
                        </div>
                        <button
                            onClick={handleReSync}
                            disabled={loading}
                            className="mr-2 px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/40 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-cyan hover:bg-brand-cyan/30 transition-all disabled:opacity-50"
                        >
                            Trigger Data Re-Sync
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { id: 'all', label: 'Total Jobs', val: stats?.totalJobs, icon: <Briefcase />, color: 'text-brand-violet', bg: 'bg-brand-violet/10', role: 'all' },
                        { id: 'all', label: 'Total Apps', val: stats?.totalApplicants, icon: <Zap />, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10', role: 'all' },
                        { id: 'student', label: 'Students', val: stats?.totalStudents, icon: <Users />, color: 'text-[#A1FFCE]', bg: 'bg-[#A1FFCE]/10', role: 'student' },
                        { id: 'recruiter', label: 'Recruiters', val: stats?.totalRecruiters, icon: <Shield />, color: 'text-[#FF9A9E]', bg: 'bg-[#FF9A9E]/10', role: 'recruiter' },
                    ].map((s, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilter(s.role as any)}
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
                                        <p className="text-sm font-medium">{filter === 'student' ? 'Engineering graduates are most active.' : 'Tech startups represent 60% of openings.'}</p>
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
                            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl transition-all ${filter === 'all' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>All Entities</button>
                            <button onClick={() => setFilter('recruiter')} className={`px-4 py-2 rounded-xl transition-all ${filter === 'recruiter' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Recruiters</button>
                            <button onClick={() => setFilter('student')} className={`px-4 py-2 rounded-xl transition-all ${filter === 'student' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Students</button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-cyan transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email or company..."
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
                                        <th className="px-8 py-6">Entity Identity</th>
                                        <th className="px-8 py-6">Role / Collective</th>
                                        <th className="px-8 py-6">Affiliation / Details</th>
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
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'recruiter' ? 'bg-[#FF9A9E]/10 border-[#FF9A9E]/20 text-[#FF9A9E]' : 'bg-[#A1FFCE]/10 border-[#A1FFCE]/20 text-[#A1FFCE]'}`}>
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
                                                        <div className="text-sm font-medium flex items-center gap-2">
                                                            {u.companyName ? (
                                                                <>
                                                                    {u.companyName}
                                                                    <a href={u.companyWebsite} target="_blank" className="text-white/20 hover:text-white"><ExternalLink size={12} /></a>
                                                                </>
                                                            ) : (
                                                                <span className="text-white/20 italic">No Affiliation</span>
                                                            )}
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
                                            <td colSpan={4} className="px-8 py-20 text-center text-white/20 font-medium">No entities detected matching the search parameters.</td>
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

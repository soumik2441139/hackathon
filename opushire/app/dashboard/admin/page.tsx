"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Briefcase, BarChart3, Trash2,
    ExternalLink, Search, Filter, ShieldAlert, Sparkles,
    ChevronRight, Activity, Zap
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
        <main className="pt-32 pb-24 px-6 min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-brand-cyan/30">
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
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: 'Total Jobs', val: stats?.totalJobs, icon: <Briefcase />, color: 'text-brand-violet', bg: 'bg-brand-violet/10' },
                        { label: 'Total Apps', val: stats?.totalApplicants, icon: <Zap />, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' },
                        { label: 'Students', val: stats?.totalStudents, icon: <Users />, color: 'text-[#A1FFCE]', bg: 'bg-[#A1FFCE]/10' },
                        { label: 'Recruiters', val: stats?.totalRecruiters, icon: <Shield />, color: 'text-[#FF9A9E]', bg: 'bg-[#FF9A9E]/10' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 border-white/5 hover:border-white/10 transition-all group overflow-hidden relative"
                        >
                            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity scale-[3]`}>{s.icon}</div>
                            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}>{s.icon}</div>
                            <h3 className="text-5xl font-black tracking-tighter mb-1">{loading ? '...' : s.val}</h3>
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest leading-none">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

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
                                        <th className="px-8 py-6">Organization</th>
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

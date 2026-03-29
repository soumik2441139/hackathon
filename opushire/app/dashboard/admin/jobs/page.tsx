"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Building2, MapPin, Trash2, Edit3, Briefcase, ChevronRight, Activity, Filter, SquareCheck, Square, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function AdminJobsConsole() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    useEffect(() => {
        if (!authLoading && currentUser?.role !== 'admin') {
            router.push('/dashboard/admin');
            return;
        }

        const fetchJobs = async () => {
            try {
                // Fetching all jobs without filtering by user to see the entire platform's postings
                const res = await jobsApi.getAll({ limit: 1000 });
                setJobs(res.data.jobs || []);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.role === 'admin') {
            fetchJobs();
        }
    }, [currentUser, authLoading, router]);

    const handleDeleteJob = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
        try {
            await jobsApi.delete(id);
            setJobs(prev => prev.filter(j => j._id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete job');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected job postings? This action cannot be undone.`)) return;
        
        setIsDeletingBulk(true);
        try {
            await jobsApi.deleteBulk(selectedIds);
            setJobs(prev => prev.filter(j => !selectedIds.includes(j._id)));
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
            alert('Failed to delete selected jobs');
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length > 0 && selectedIds.length === filteredJobs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredJobs.map(j => j._id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getSourceLabel = (job: Job) => {
        if (!job.source || job.source === 'manual') return 'Manual';
        
        if (job.source === 'telegram' && job.externalId) {
            const parts = job.externalId.split('_');
            const channel = parts[1] || 'Channel';
            return `Telegram - ${channel}`;
        }
        
        // Capitalize others
        return job.source.charAt(0).toUpperCase() + job.source.slice(1);
    };

    if (authLoading || (currentUser?.role === 'admin' && loading)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-brand-cyan animate-spin" />
                    <p className="text-white/60 font-black tracking-widest uppercase text-xs">Syncing Database...</p>
                </div>
            </div>
        );
    }

    if (currentUser?.role !== 'admin') return null;

    const filteredJobs = jobs.filter(j => {
        const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            j.company?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = !sourceFilter || j.source === sourceFilter;
        const matchesLocation = !locationFilter || 
                                (j.location?.toLowerCase().includes(locationFilter.toLowerCase()) || 
                                 j.city?.toLowerCase().includes(locationFilter.toLowerCase()));
        const matchesType = !typeFilter || j.type === typeFilter;
        
        return matchesSearch && matchesSource && matchesLocation && matchesType;
    });

    return (
        <main className="pt-32 pb-24 px-6 min-h-screen bg-black text-white overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-violet/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <button
                    onClick={() => router.push('/dashboard/admin')}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-10 group text-sm font-bold"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    BACK TO ADMIN CONSOLE
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/5 border border-brand-cyan/20 text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan mb-4">
                            <Briefcase size={12} /> Job Management Matrix
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                            Platform <span className="text-gradient">Listings</span>
                        </h1>
                        <p className="text-white/40 text-sm max-w-xl font-medium">
                            Administrative oversight of all active job postings on OpusHire. You can view, edit, or terminate listings from this console.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 mr-2"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                    {selectedIds.length} Selected
                                </span>
                                <Button 
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white border-none"
                                >
                                    {isDeletingBulk ? <Activity size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    DELETE
                                </Button>
                            </motion.div>
                        )}

                        <div className="glass-card p-4 flex flex-1 gap-4 items-center min-w-[300px]">
                            <div className="flex items-center gap-4 px-4 border-r border-white/10 shrink-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total</span>
                                <span className="text-2xl font-black text-brand-cyan">{jobs.length}</span>
                            </div>
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-cyan transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search listings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent border-none rounded-none pl-10 pr-4 py-2 w-full outline-none text-sm font-medium placeholder:text-white/20 h-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-card px-4 py-2 flex items-center gap-3 bg-white/[0.02]">
                        <Globe size={14} className="text-white/20" />
                        <select 
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-white/60 w-full appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-black">All Sources</option>
                            <option value="telegram" className="bg-black">Telegram</option>
                            <option value="remotive" className="bg-black">Remotive</option>
                            <option value="arbeitnow" className="bg-black">Arbeitnow</option>
                            <option value="adzuna" className="bg-black">Adzuna</option>
                            <option value="himalayas" className="bg-black">Himalayas</option>
                            <option value="manual" className="bg-black">Manual</option>
                        </select>
                    </div>

                    <div className="glass-card px-4 py-2 flex items-center gap-3 bg-white/[0.02]">
                        <MapPin size={14} className="text-white/20" />
                        <input 
                            type="text"
                            placeholder="Filter by Location..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-white/60 w-full placeholder:text-white/20"
                        />
                    </div>

                    <div className="glass-card px-4 py-2 flex items-center gap-3 bg-white/[0.02]">
                        <Filter size={14} className="text-white/20" />
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-white/60 w-full appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-black">All Types</option>
                            <option value="Full-time" className="bg-black">Full-time</option>
                            <option value="Internship" className="bg-black">Internship</option>
                            <option value="Contract" className="bg-black">Contract</option>
                        </select>
                    </div>
                </div>

                <div className="glass-card overflow-hidden border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-white/30 bg-white/[0.01]">
                                    <th className="px-6 py-5 w-10">
                                        <button 
                                            onClick={toggleSelectAll}
                                            className="text-white/20 hover:text-brand-cyan transition-colors"
                                        >
                                            {selectedIds.length > 0 && selectedIds.length === filteredJobs.length ? (
                                                <SquareCheck size={16} className="text-brand-cyan" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5">Role Identity</th>
                                    <th className="px-6 py-5">Corporate Entity</th>
                                    <th className="px-6 py-5">Source</th>
                                    <th className="px-6 py-5">Origin Timeline</th>
                                    <th className="px-6 py-5 text-right w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => (
                                        <tr key={job._id} className={`hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(job._id) ? 'bg-brand-cyan/[0.03]' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleSelect(job._id)}
                                                    className="text-white/20 hover:text-brand-cyan transition-colors"
                                                >
                                                    {selectedIds.includes(job._id) ? (
                                                        <SquareCheck size={16} className="text-brand-cyan" />
                                                    ) : (
                                                        <Square size={16} />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-brand-cyan flex items-center gap-2">
                                                    {job.title}
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[8px] font-black tracking-widest uppercase text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                                        {job.type}
                                                    </span>
                                                    <span className="text-[8px] font-black tracking-widest uppercase text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                                        {job.mode}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                                        {job.companyLogo ? (
                                                            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain p-1" />
                                                        ) : <Building2 size={12} className="text-white/30" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{job.company}</p>
                                                        <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                                            <MapPin size={10} /> {job.location || job.city || 'Remote'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                                        {getSourceLabel(job)}
                                                    </span>
                                                    {job.source === 'telegram' && (
                                                        <span className="text-[8px] font-black text-brand-cyan/60 uppercase tracking-tighter">Verified Bot Feed</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-white/40 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => router.push(`/dashboard/admin/jobs/edit/${job._id}`)}
                                                        className="h-8 w-8 p-0 rounded-lg bg-brand-cyan/5 text-brand-cyan hover:bg-brand-cyan hover:text-black border border-brand-cyan/20"
                                                    >
                                                        <Edit3 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleDeleteJob(job._id)}
                                                        className="h-8 w-8 p-0 rounded-lg bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => router.push(`/jobs/${job._id}`)}
                                                        className="h-8 w-8 p-0 rounded-lg bg-white/5 text-white/60 hover:bg-white hover:text-black border border-white/10"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-white/30 font-medium">
                                            No job listings found matching your constraints.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

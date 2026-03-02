"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jobs as jobsApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { ApplyModal } from '@/components/jobs/ApplyModal';
import { ArrowLeft, ChevronRight, Share2, Bookmark, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { timeAgo, formatSalary } from '@/lib/utils';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/jobs/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Job not found');
                return data;
            })
            .then(data => setJob(data.data))
            .catch(err => setError(err.message || 'Failed to load job details'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <main className="pt-32 pb-20 px-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass-card p-8 h-32 animate-pulse bg-white/5" />
                ))}
            </div>
        </main>
    );

    if (error || !job) return (
        <div className="min-h-screen flex flex-col items-center justify-center pt-20">
            <h1 className="text-4xl font-bold mb-4">Job Not Found</h1>
            <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
    );

    const handleApplyClick = () => {
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'student') return;
        setShowApplyModal(true);
    };

    return (
        <>
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-brand-text/50 hover:text-brand-text transition-colors mb-12 group"
                    >
                        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                        <span>Back to Browse</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-10">
                            <ScrollReveal direction="right">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                    <div className="flex gap-5">
                                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl overflow-hidden shrink-0">
                                            {job.companyLogo?.startsWith('http') || job.companyLogo?.startsWith('data:') ? (
                                                <img src={job.companyLogo} alt={`${job.company} logo`} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                job.companyLogo || '🏢'
                                            )}
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-black mb-1.5 text-brand-text">{job.title}</h1>
                                            <div className="flex items-center gap-2 text-brand-text/60">
                                                <span className="text-lg font-bold text-brand-text/80">{job.company}</span>
                                                {job.location && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-sm">{job.location}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 p-6 glass-card border-brand-violet/20 bg-brand-violet/5">
                                    <div className="flex flex-col gap-0.5 pr-10 border-r border-white/10">
                                        <span className="text-[10px] uppercase tracking-widest text-brand-text/30 font-bold">Salary</span>
                                        <span className="text-base font-bold text-brand-cyan">
                                            {job.salary || formatSalary(job.salaryMin, job.salaryMax)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 px-10 border-r border-white/10">
                                        <span className="text-[10px] uppercase tracking-widest text-brand-text/30 font-bold">Type</span>
                                        <span className="text-base font-bold text-brand-text">{job.type}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 pl-10">
                                        <span className="text-[10px] uppercase tracking-widest text-brand-text/30 font-bold">Mode</span>
                                        <span className="text-base font-bold text-brand-text">{job.mode}</span>
                                    </div>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={0.1}>
                                <div className="space-y-8">
                                    <section>
                                        <h2 className="text-2xl font-bold mb-4 text-brand-text">About the role</h2>
                                        <p className="text-brand-text/60 leading-relaxed text-lg">{job.description}</p>
                                    </section>

                                    {job.responsibilities.length > 0 && (
                                        <section>
                                            <h2 className="text-2xl font-bold mb-4 text-brand-text">Responsibilities</h2>
                                            <ul className="space-y-3">
                                                {job.responsibilities.map((r, i) => (
                                                    <li key={i} className="flex gap-3 text-brand-text/60">
                                                        <ChevronRight className="shrink-0 text-brand-violet w-5 h-5 mt-1" />
                                                        <span>{r}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {job.requirements.length > 0 && (
                                        <section>
                                            <h2 className="text-2xl font-bold mb-4 text-brand-text">Requirements</h2>
                                            <ul className="space-y-3">
                                                {job.requirements.map((r, i) => (
                                                    <li key={i} className="flex gap-3 text-brand-text/60">
                                                        <CheckCircle2 className="shrink-0 text-brand-cyan w-5 h-5 mt-1" />
                                                        <span>{r}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* Sidebar Action */}
                        <div className="space-y-6">
                            <ScrollReveal direction="left">
                                <div className="glass-card p-8 sticky top-32 space-y-6">
                                    {applied ? (
                                        <div className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-lg">
                                            <CheckCircle2 size={20} /> Applied!
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full h-14 text-lg"
                                            onClick={handleApplyClick}
                                            disabled={user?.role === 'admin'}
                                        >
                                            {!user ? 'Login to Apply' : user.role === 'admin' ? 'Admin View' : 'Apply Now'}
                                        </Button>
                                    )}

                                    <div className="flex gap-4">
                                        <Button variant="outline" className="flex-1 gap-2 border-white/10"><Bookmark size={18} /> Save</Button>
                                        <Button variant="outline" className="w-14 items-center justify-center p-0 border-white/10"><Share2 size={18} /></Button>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-text/40 font-bold uppercase tracking-widest">Posted</span>
                                            <span className="text-brand-text/80">{timeAgo(job.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-text/40 font-bold uppercase tracking-widest">Openings</span>
                                            <span className="text-brand-text/80">{job.openings}</span>
                                        </div>
                                        {job.deadline && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-brand-text/40 font-bold uppercase tracking-widest">Deadline</span>
                                                <span className="text-brand-text/80">{new Date(job.deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {job.tags.length > 0 && (
                                        <div className="pt-6">
                                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text/30 mb-4">Skills required</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {job.tags.map(tag => (
                                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </main>

            {showApplyModal && job && (
                <ApplyModal
                    jobId={job._id}
                    jobTitle={job.title}
                    company={job.company}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={() => { setShowApplyModal(false); setApplied(true); }}
                />
            )}
        </>
    );
}

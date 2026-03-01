"use client";
import React from 'react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/Button';
import { Briefcase, Users, BarChart3, Plus, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RecruiterDashboard() {
    const { user } = useAuth();

    return (
        <main className="pt-32 pb-24 px-6 overflow-hidden min-h-screen">
            <div className="max-w-6xl mx-auto">
                <ScrollReveal direction="up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm font-bold text-brand-cyan mb-4">
                                <Sparkles size={14} /> Recruiter Hub
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                                Welcome back, <span className="text-gradient">{user?.name.split(' ')[0]}</span>
                            </h1>
                            <p className="text-white/40 text-lg">Manage your company presence and find top talent.</p>
                        </div>
                        <Link href="/dashboard/recruiter/post-job">
                            <Button className="h-16 px-10 text-lg gap-3">
                                <Plus size={20} /> Post New Opportunity
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Stats Card 1 */}
                        <div className="glass-card p-8 border-brand-violet/20 hover:border-brand-violet/50 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-brand-violet/20 flex items-center justify-center text-brand-violet mb-6 group-hover:scale-110 transition-transform">
                                <Briefcase size={28} />
                            </div>
                            <h3 className="text-4xl font-black mb-2 tracking-tighter">12</h3>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Active Jobs</p>
                        </div>

                        {/* Stats Card 2 */}
                        <div className="glass-card p-8 border-brand-cyan/20 hover:border-brand-cyan/50 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
                                <Users size={28} />
                            </div>
                            <h3 className="text-4xl font-black mb-2 tracking-tighter">48</h3>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Total Applicants</p>
                        </div>

                        {/* Stats Card 3 */}
                        <div className="glass-card p-8 border-brand-rose/20 hover:border-brand-rose/50 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-brand-rose/20 flex items-center justify-center text-brand-rose mb-6 group-hover:scale-110 transition-transform">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-4xl font-black mb-2 tracking-tighter">2.4k</h3>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Profile Views</p>
                        </div>
                    </div>

                    {/* Quick Actions / Recent Activity Placeholder */}
                    <div className="mt-12 glass-card p-10 flex flex-col items-center justify-center text-center border-white/5">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-6">
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No active jobs yet?</h3>
                        <p className="text-white/40 max-w-md mb-8">Start your recruitment journey by posting your first job opportunity to our community of elite students.</p>
                        <Link href="/dashboard/recruiter/post-job">
                            <Button variant="outline" className="gap-2">
                                Create your first listing <ArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        </main>
    );
}

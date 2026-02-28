"use client";
import React from 'react';
import { ApplicationTracker } from '@/components/dashboard/ApplicationTracker';
import { SavedJobs } from '@/components/dashboard/SavedJobs';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { User, Settings, Bell, BookMarked, Briefcase } from 'lucide-react';

export default function StudentDashboard() {
    return (
        <main className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal direction="down">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-violet to-brand-cyan p-[1px]">
                                <div className="w-full h-full rounded-[1.4rem] bg-brand-dark flex items-center justify-center text-3xl">
                                    👨‍🎓
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold">Hi, John!</h1>
                                <p className="text-white/50 text-xl">3rd Year, IIIT Bangalore</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                                <Bell size={20} />
                            </button>
                            <button className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                                <Settings size={20} />
                            </button>
                        </div>
                    </header>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <ApplicationTracker />
                    </div>

                    <div className="space-y-12">
                        <div className="glass-card p-8">
                            <h3 className="font-bold mb-6 flex items-center gap-2"><User size={18} className="text-brand-violet" /> Profile Strength</h3>
                            <div className="w-full h-2 bg-white/5 rounded-full mb-4 overflow-hidden">
                                <div className="w-[75%] h-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
                            </div>
                            <p className="text-sm text-white/50 mb-6">Your profile is 75% complete. Add your projects to reach 100%.</p>
                            <button className="text-brand-cyan text-sm font-bold hover:underline">Complete Profile →</button>
                        </div>

                        <SavedJobs />
                    </div>
                </div>
            </div>
        </main>
    );
}

"use client";
import React, { useState } from 'react';
import { ApplicationTracker } from '@/components/dashboard/ApplicationTracker';
import { SavedJobs } from '@/components/dashboard/SavedJobs';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Settings, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal direction="down">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-violet to-brand-cyan p-[1px]">
                                    <div className="w-full h-full rounded-[1.4rem] bg-brand-dark flex items-center justify-center text-3xl font-bold text-white">
                                        {user?.avatar ?? user?.name?.charAt(0).toUpperCase() ?? '?'}
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-bold">Hi, {user?.name?.split(' ')[0]}!</h1>
                                    <p className="text-white/50 text-xl">
                                        {[user?.degree, user?.college].filter(Boolean).join(', ') || 'Student'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 relative">
                                {/* Notifications Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsSettingsOpen(false); }}
                                        className={`w-12 h-12 rounded-full glass-card flex items-center justify-center transition-colors ${isNotificationsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                    >
                                        <Bell size={20} />
                                        <span className="absolute top-2 right-2 w-3 h-3 bg-brand-cyan rounded-full border-2 border-brand-dark"></span>
                                    </button>

                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-4 w-80 glass-card p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-white/50">Notifications</h3>
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                                                    <p className="font-medium text-sm">Application Viewed</p>
                                                    <p className="text-xs text-brand-violet mt-1">Stripe reviewed your Software Engineer application.</p>
                                                    <p className="text-xs text-white/30 mt-2">2 hours ago</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                                                    <p className="font-medium text-sm">New Match</p>
                                                    <p className="text-xs text-brand-violet mt-1">Vercel posted a new Frontend Engineering Internship.</p>
                                                    <p className="text-xs text-white/30 mt-2">1 day ago</p>
                                                </div>
                                            </div>
                                            <button className="w-full mt-4 text-xs tracking-wider uppercase text-brand-cyan hover:text-white transition-colors">Mark all as read</button>
                                        </div>
                                    )}
                                </div>

                                {/* Settings Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsNotificationsOpen(false); }}
                                        className={`w-12 h-12 rounded-full glass-card flex items-center justify-center transition-colors ${isSettingsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                    >
                                        <Settings size={20} className={isSettingsOpen ? "animate-spin-slow" : ""} />
                                    </button>

                                    {isSettingsOpen && (
                                        <div className="absolute right-0 mt-4 w-72 glass-card p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-white/50">Preferences</h3>
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">Email Alerts</p>
                                                        <p className="text-xs text-white/40">New job matches</p>
                                                    </div>
                                                    <button className="w-12 h-6 rounded-full bg-brand-cyan relative">
                                                        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">Application Updates</p>
                                                        <p className="text-xs text-white/40">Status changes</p>
                                                    </div>
                                                    <button className="w-12 h-6 rounded-full bg-brand-cyan relative">
                                                        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                                                    <div>
                                                        <p className="text-sm font-medium">Dark Mode</p>
                                                        <p className="text-xs text-white/40">System default</p>
                                                    </div>
                                                    <button className="w-12 h-6 rounded-full bg-white/20 relative" disabled>
                                                        <span className="absolute right-1 top-1 w-4 h-4 bg-white/50 rounded-full"></span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-white/10">
                                                <button className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-12">
                            <ApplicationTracker />
                        </div>

                        <div className="space-y-12">
                            <div className="glass-card p-8">
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-white/50">Profile Strength</h3>
                                <div className="w-full h-2 bg-white/5 rounded-full mb-4 overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r from-brand-violet to-brand-cyan`}
                                        style={{ width: `${[user?.name, user?.college, user?.degree, user?.bio, (user?.skills?.length ?? 0) > 0].filter(Boolean).length * 20}%` }}
                                    />
                                </div>
                                <p className="text-sm text-white/50 mb-6">
                                    Complete your profile to stand out to employers.
                                </p>
                            </div>
                            <SavedJobs />
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

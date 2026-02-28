"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Mail, Lock, Ghost } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/20 via-transparent to-brand-cyan/20 blur-3xl -z-10" />

            <ScrollReveal direction="up" duration={0.8}>
                <div className="glass-card w-full max-w-md p-10 flex flex-col items-center border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center text-brand-dark mb-8">
                        <UserIcon className="w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-bold mb-2 text-brand-text">Welcome Back</h1>
                    <p className="text-brand-text/50 text-center mb-10">
                        Log in to Opushire to explore 2,500+ active student job openings.
                    </p>

                    <form className="w-full space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input
                                    type="email"
                                    placeholder="name@college.edu"
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-brand-text/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-brand-text/30"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" className="text-sm text-brand-cyan hover:underline">Forgot Password?</button>
                        </div>

                        <Button className="w-full h-14 text-lg">Sign In</Button>
                    </form>

                    <div className="mt-10 flex items-center gap-4 w-full">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <span className="text-xs text-brand-text/20 uppercase font-bold tracking-widest">Or continue with</span>
                        <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                        <Button variant="outline" className="h-12 border-white/10">Google</Button>
                        <Button variant="outline" className="h-12 border-white/10">GitHub</Button>
                    </div>

                    <p className="mt-10 text-brand-text/50 text-sm">
                        Don't have an account? <Link href="/register" className="text-brand-violet font-bold hover:underline ml-1">Sign Up</Link>
                    </p>
                </div>
            </ScrollReveal>
        </div>
    );
}

const UserIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

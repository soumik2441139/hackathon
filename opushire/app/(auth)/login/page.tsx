"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col font-display selection:bg-primary/30">
            {/* Ambient Liquid Background */}
            <div className="liquid-bg fixed top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] portal-gradient"></div>
            </div>



            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative py-20">
                {/* Center Portal Decorative Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square pointer-events-none opacity-20">
                    <div className="w-full h-full border-[1px] border-primary/20 rounded-full animate-[pulse_8s_infinite]"></div>
                    <div className="absolute inset-20 border-[1px] border-primary/10 rounded-full animate-[pulse_6s_infinite]"></div>
                </div>

                <div className="w-full max-w-[440px] z-10">
                    {/* Glassmorphic Login Card */}
                    <div className="bg-[#192233]/70 backdrop-blur-xl rounded-2xl p-8 lg:p-10 border border-primary/20 relative overflow-hidden shadow-[0_0_40px_rgba(17,82,212,0.15)]">
                        {/* Glowing accent at top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                        
                        <div className="mb-10 text-center">
                            <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Student Gateway</h1>
                            <p className="text-slate-400 text-sm">Log in to explore exclusive junior roles.</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Identity</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-primary/60 text-xl group-focus-within:text-primary transition-colors">alternate_email</span>
                                    </div>
                                    <input 
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#101622]/50 border border-primary/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" 
                                        placeholder="name@college.edu" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Security Key</label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-primary/60 text-xl group-focus-within:text-primary transition-colors">lock</span>
                                    </div>
                                    <input 
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#101622]/50 border border-primary/20 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            <button 
                                disabled={loading}
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_-5px_rgba(17,82,212,0.4)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-70"
                            >
                                <span className="relative z-10 uppercase tracking-widest text-sm">{loading ? 'Authenticating...' : 'Initiate Access'}</span>
                                {!loading && <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                            </button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-primary/10 text-center">
                            <p className="text-sm text-slate-500">
                                New to the network? <Link href="/register" className="text-primary font-bold hover:underline">Sign up here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Visual Accents */}
            <div className="fixed bottom-10 left-10 hidden lg:block pointer-events-none">
                <div className="flex flex-col gap-2">
                    <div className="w-32 h-1 bg-primary/20 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-primary animate-[pulse_2s_infinite]"></div>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono">CONNECTION_STABLE: L-METAL-4</p>
                </div>
            </div>

            <div className="fixed bottom-10 right-10 hidden lg:flex items-center gap-4 text-slate-500 pointer-events-none">
                <span className="material-symbols-outlined text-sm">language</span>
                <span className="text-[10px] font-bold tracking-widest">GLOBAL / EN-US</span>
            </div>
        </div>
    );
}

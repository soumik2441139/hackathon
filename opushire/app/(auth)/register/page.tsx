"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        college: '', degree: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanLog, setScanLog] = useState<string[]>([]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 3D Parallax effect
    useEffect(() => {
        const card = cardRef.current;
        const container = containerRef.current;
        if (!card || !container || isScanning) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(card, {
                duration: 0.8,
                rotationY: x * 15,
                rotationX: -y * 15,
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(17, 82, 212, 0.2)',
                borderColor: 'rgba(17, 82, 212, 0.4)',
                ease: 'power2.out',
                transformPerspective: 1000,
            });
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                duration: 1.2,
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                boxShadow: 'none',
                borderColor: 'rgba(255, 255, 255, 0.05)',
                ease: 'elastic.out(1, 0.5)',
            });
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isScanning]);

    // Handle form submission and fake scanning delay
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsScanning(true);
        setScanLog(['[SYS] Initiating profile synthesis...']);

        // Simulate scanning logs
        setTimeout(() => setScanLog(prev => [...prev, '[SYS] Verifying university credentials...']), 800);
        setTimeout(() => setScanLog(prev => [...prev, '[SYS] Mapping junior developer roles...']), 1600);
        setTimeout(() => setScanLog(prev => [...prev, '[SYS] Profile encrypted and synced.']), 2400);

        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                college: form.college,
                degree: form.degree
            });
            // Give time for the animation
            setTimeout(() => {
                router.push('/dashboard');
            }, 3200);
        } catch (err: unknown) {
            setIsScanning(false);
            setError(err instanceof Error ? err.message : 'Registration failed.');
            setLoading(false);
        }
    };

    if (isScanning) {
        return (
            <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col font-display selection:bg-primary/30 items-center justify-center p-6">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="space-y-2">
                        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                            Stage 02: Synthesis
                        </div>
                        <h1 className="text-slate-100 text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            Neural Blueprint Mapping
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl">
                            Actively scanning and mapping your professional profile to locate the best entry-level roles.
                        </p>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 border border-primary/20 shadow-2xl backdrop-blur-sm p-6 flex flex-col min-h-[400px]">
                        <div className="absolute inset-0 shimmer-grid opacity-30"></div>
                        <div className="scanning-line z-10 absolute top-0 left-0 w-full animate-[scan_2s_linear_infinite]"></div>
                        
                        <div className="relative z-20 flex-1 flex flex-col gap-4 opacity-70">
                            <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-700 rounded w-full"></div>
                                <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                                <div className="h-3 bg-slate-700 rounded w-4/6"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="h-20 bg-slate-700/50 rounded-lg border border-slate-600"></div>
                                <div className="h-20 bg-slate-700/50 rounded-lg border border-slate-600"></div>
                            </div>
                        </div>

                        <div className="relative z-20 mt-auto pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-primary/10">
                            <div className="flex flex-col">
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Semantic Extraction</p>
                                <p className="text-primary text-sm font-bold animate-pulse">PROCESSING DATA...</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-slate-800 h-32 overflow-hidden flex flex-col gap-2 font-mono text-xs shadow-inner">
                        {scanLog.map((log, i) => (
                            <div key={i} className="text-primary/80 transition-all duration-300">
                                {log}
                            </div>
                        ))}
                        <div className="text-primary/60 animate-pulse">_</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#020203] text-slate-100 min-h-screen flex flex-col font-display selection:bg-primary/30 relative">
            {/* Background Particles (static radial substitute) */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(17,82,212,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(17,82,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

            <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-20 py-6 bg-[#101622]/60 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <div className="size-8 bg-primary rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">stat_3</span>
                    </div>
                    <h2 className="text-white text-xl font-extrabold tracking-tighter uppercase italic">Opushire</h2>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-widest transition-all">Sign In</Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-4 z-10 w-full">
                <div className="max-w-5xl w-full">
                    <div className="flex flex-col items-center text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(17,82,212,0.2)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Enrolling New Talent
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1] max-w-2xl">
                            BUILD YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">PROFILE</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-light max-w-xl">
                            Join the smartest talent network for junior developers and connect with your next great role.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
                        <div className="lg:col-span-7 space-y-8 w-full">
                            <div className="bg-[#101622]/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(17,82,212,0.15)] w-full">
                                {error && (
                                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                            <input 
                                                type="text"
                                                required
                                                value={form.name}
                                                onChange={set('name')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="John Doe" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">College Email</label>
                                            <input 
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={set('email')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="name@college.edu" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">University / College</label>
                                            <input 
                                                type="text"
                                                value={form.college}
                                                onChange={set('college')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="MIT" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Degree / Branch</label>
                                            <input 
                                                type="text"
                                                value={form.degree}
                                                onChange={set('degree')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="B.Tech Computer Science" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
                                            <input 
                                                type="password"
                                                required
                                                minLength={6}
                                                value={form.password}
                                                onChange={set('password')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="••••••••" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Confirm Password</label>
                                            <input 
                                                type="password"
                                                required
                                                minLength={6}
                                                value={form.confirmPassword}
                                                onChange={set('confirmPassword')}
                                                className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                placeholder="••••••••" 
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-3 group mt-4 relative overflow-hidden"
                                    >
                                        <span className="relative z-10 uppercase tracking-[0.2em] text-sm">Initiate Onboarding</span>
                                        <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-5 h-full w-full">
                            <div className="sticky top-32 w-full" style={{ perspective: '1000px' }} ref={containerRef}>
                                <div 
                                    ref={cardRef}
                                    className="bg-[#101622]/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 relative overflow-hidden transition-all duration-500 ease-out shadow-xl w-full"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Profile Status</h4>
                                                <p className="text-white text-xs font-mono mt-1 opacity-70">STATUS: {form.name || form.email ? 'BUILDING_PROFILE' : 'AWAITING_INPUT'}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">psychology</span>
                                        </div>
                                        
                                        <div className="space-y-3 pt-4">
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary shadow-[0_0_10px_rgba(17,82,212,0.8)] transition-all duration-700"
                                                    style={{ width: `${Math.min(100, (Object.values(form).filter(v => v !== '').length / 6) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="bg-[#020203]/80 p-3 rounded-lg border border-white/5">
                                                    <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Experience Level</span>
                                                    <span className="text-white text-xs font-bold mt-1 block">Junior / Intern</span>
                                                </div>
                                                <div className="bg-[#020203]/80 p-3 rounded-lg border border-white/5">
                                                    <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Data Sync</span>
                                                    <span className="text-white text-xs font-bold mt-1 block tracking-widest">{form.email ? 'ENCRYPTED' : 'PENDING'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 items-center pt-2">
                                            <div className="size-1.5 rounded-full bg-primary animate-ping"></div>
                                            <div className="text-[8px] text-primary/80 font-mono tracking-widest break-all">
                                                {form.college ? 'CONNECTING_TO_UNIVERSITY_GRAPH...' : 'AWAITING_DATA...'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

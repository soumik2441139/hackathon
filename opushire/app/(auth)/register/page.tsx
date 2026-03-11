"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function RegisterPage() {
    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lightRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        legalIdentity: '',
        secureChannel: ''
    });

    useEffect(() => {
        const card = cardRef.current;
        const container = containerRef.current;
        const light = lightRef.current;
        if (!card || !container || !light) return;

        const parallaxElements = card.querySelectorAll('[data-depth]');

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
                border: '1px solid rgba(17, 82, 212, 0.4)',
                ease: 'power2.out',
                transformPerspective: 1000,
            });

            const lightX = (e.clientX - rect.left);
            const lightY = (e.clientY - rect.top);
            gsap.to(light, {
                duration: 0.5,
                opacity: 1,
                background: `radial-gradient(circle at ${lightX}px ${lightY}px, rgba(17, 82, 212, 0.25) 0%, transparent 60%)`,
                ease: 'power1.out'
            });

            parallaxElements.forEach((el) => {
                const depth = parseFloat(el.getAttribute('data-depth') || '0.1');
                gsap.to(el, {
                    duration: 0.8,
                    x: -x * 30 * depth,
                    y: -y * 30 * depth,
                    ease: 'power2.out'
                });
            });
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                duration: 1.2,
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                boxShadow: 'none',
                border: '1px solid rgba(17, 82, 212, 0.2)',
                ease: 'elastic.out(1, 0.5)',
            });

            gsap.to(light, {
                duration: 0.5,
                opacity: 0,
                ease: 'power2.inOut'
            });

            parallaxElements.forEach((el) => {
                gsap.to(el, {
                    duration: 1.2,
                    x: 0,
                    y: 0,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCVClick = () => {
        document.getElementById('cv-upload')?.click();
    };

    return (
        <div className="font-display text-slate-100 selection:bg-primary/30 min-h-screen relative tracking-normal">
            <style dangerouslySetInnerHTML={{__html: `
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(500%); }
                }
                .particle-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    background-image: 
                        radial-gradient(circle at 20% 30%, rgba(17, 82, 212, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(17, 82, 212, 0.05) 0%, transparent 50%);
                }
                .vanta-gradient {
                    background: radial-gradient(circle at 50% 50%, #111722 0%, #05070a 100%);
                }
                .neural-glow {
                    box-shadow: 0 0 20px rgba(17, 82, 212, 0.15);
                    border: 1px solid rgba(17, 82, 212, 0.3);
                }
                .glass-panel {
                    background: rgba(16, 22, 34, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
            `}} />

            <div className="particle-bg"></div>
            
            <div className="relative flex min-h-screen w-full flex-col bg-[#05070a] overflow-x-hidden pt-24">


                <main className="flex-1 flex flex-col items-center pb-20 px-4 w-full">
                    <div className="max-w-4xl w-full">
                        <div className="flex flex-col items-center text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Enrolling for Q4
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] max-w-2xl">
                                JOIN THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#60a5fa]">ELITE</span>
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl font-light max-w-xl">
                                Experience the Vantablack Depth of our private talent network. Reserved for the top 0.1% of global innovators.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            <div className="lg:col-span-7 space-y-8">
                                <div className="glass-panel p-8 rounded-2xl neural-glow">
                                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Legal Identity</label>
                                                <input 
                                                    className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                    placeholder="Full Name" 
                                                    type="text"
                                                    name="legalIdentity"
                                                    value={form.legalIdentity}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Secure Channel</label>
                                                <input 
                                                    className="w-full bg-[#020203] border border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl h-14 text-white placeholder:text-slate-700 transition-all px-5" 
                                                    placeholder="Email Address" 
                                                    type="email"
                                                    name="secureChannel"
                                                    value={form.secureChannel}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Intellectual Digital Blueprint</label>
                                            <div onClick={handleCVClick} className="relative group cursor-pointer">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                                <div className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-800 bg-[#020203] rounded-xl group-hover:border-primary/50 transition-all p-8">
                                                    <span className="material-symbols-outlined text-4xl text-primary mb-3">cloud_upload</span>
                                                    <p className="text-sm text-slate-300 font-medium">Drop CV or Portfolio</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Maximum fidelity required (PDF/JSON/MD)</p>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none overflow-hidden rounded-xl">
                                                        <div className="w-full h-[1px] bg-primary animate-[pulse_2s_infinite]"></div>
                                                    </div>
                                                </div>
                                                <input type="file" id="cv-upload" className="hidden" accept=".pdf,.json,.md" />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 perspective-1000" id="cv-parallax-container" ref={containerRef}>
                                            <div className="glass-panel p-6 rounded-2xl border border-primary/20 relative overflow-hidden transition-all duration-500 ease-out transform-style-3d shadow-2xl" id="neural-blueprint-card" ref={cardRef}>
                                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" id="card-dynamic-light" ref={lightRef} style={{ background: 'radial-gradient(circle at 50% 50%, rgba(17, 82, 212, 0.15) 0%, transparent 70%)' }}></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                                                <div className="relative z-10 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-primary text-[10px] font-black uppercase tracking-[0.3em]" data-depth="0.1">Neural Blueprint</h4>
                                                            <p className="text-white text-xs font-mono mt-1 opacity-70" data-depth="0.05">STATUS: ANALYZING_DATA_STRUCTURE</p>
                                                        </div>
                                                        <span className="material-symbols-outlined text-primary text-3xl animate-pulse">psychology</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden" data-depth="0.15">
                                                            <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(17,82,212,0.8)]"></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4" data-depth="0.08">
                                                            <div className="bg-[#020203]/50 p-3 rounded-lg border border-white/5">
                                                                <span className="text-[8px] text-slate-500 uppercase block">Cognitive Load</span>
                                                                <span className="text-white text-xs font-mono" data-depth="0.05">8.4 PFLOPS</span>
                                                            </div>
                                                            <div className="bg-[#020203]/50 p-3 rounded-lg border border-white/5">
                                                                <span className="text-[8px] text-slate-500 uppercase block">Experience Depth</span>
                                                                <span className="text-white text-xs font-mono" data-depth="0.05">LEVEL_09</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="size-1.5 rounded-full bg-primary animate-ping"></div>
                                                        <div className="text-[8px] text-primary/80 font-mono tracking-widest">SCANNING_SUB_SURFACE_NODES...</div>
                                                    </div>
                                                </div>
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-[scan_3s_linear_infinite] pointer-events-none"></div>
                                            </div>
                                        </div>

                                        <button className="w-full bg-primary hover:bg-[#2563eb] text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-3 group mt-8">
                                            <span className="uppercase tracking-[0.2em] text-sm">Initiate Onboarding</span>
                                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="flex items-center gap-4 text-slate-500 text-xs font-medium px-4">
                                    <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                                    <p>End-to-end encrypted submission. Your data is processed through our proprietary neural scrub before storage.</p>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-white/5 space-y-6">
                                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em]">Network Privileges</h3>
                                    <div className="space-y-8">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">hub</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white text-sm font-bold">Neural Mapping</h4>
                                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Our AI decodes your career trajectory to match you with visionary mandates.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">visibility_off</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white text-sm font-bold">Shadow Operations</h4>
                                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Stealth-mode recruitment for high-stakes leadership transitions.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">diamond</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white text-sm font-bold">Vantablack Tier</h4>
                                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Access to pre-IPO opportunities and confidential research grants.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-2xl aspect-video glass-panel p-1 group">
                                    <div className="absolute inset-0 bg-primary/20 animate-pulse group-hover:hidden"></div>
                                    <img 
                                        alt="Abstract neural network" 
                                        className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700 opacity-40 group-hover:opacity-80" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx5cLtdu9DTUSh7VjjiaKy7MdQg7FldPs-W1phABEuXiwlfiExaXzH_OyvY3BOt9XwqKtexo_Sw0Cfez7zGTaJYQK7SwMZipOgutsRitPl-7qc9ZLW0twahp2_jrUegeFiqVp9CaAHos4aWnnZWVuWWpVUmQOYqFuApoNLqiCSGb0ii-_GNrzdxlOATf8kss5B1LHUsJzE69clxZ_ZraK6RULgWgJDlow2FwOUo4_k1Ve4hkcof-ThrvtlyqqoxYNyKpT1iVLFnu4"
                                    />
                                    <div className="absolute bottom-4 left-4 flex flex-col">
                                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Network Live</span>
                                        <span className="text-white text-[8px] font-mono">NODE_772_OPUS_SYNC... ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="mt-auto border-t border-slate-900/50 py-10 px-8 md:px-20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">© 2024 OPUSHIRE FOUNDATION</p>
                        <p className="text-slate-700 text-[8px] mt-1 italic tracking-widest">ARCHITECTED FOR THE SOVEREIGN INDIVIDUAL</p>
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <Link href="/nodes" className="hover:text-primary transition-colors">Nodes</Link>
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Lexicon</Link>
                        <Link href="/sub-space" className="hover:text-primary transition-colors">Sub-Space</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

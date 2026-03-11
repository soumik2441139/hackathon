"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export const AgenticIntelligence = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Section Entrance Parallax
        if (sectionRef.current && contentRef.current) {
            gsap.from(contentRef.current, {
                opacity: 0,
                y: 100,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            });
        }
        
        // Progress bar dynamic load
        if (progressRef.current && sectionRef.current) {
            gsap.fromTo(progressRef.current, 
                { width: "0%" }, 
                { 
                    width: "98.4%", 
                    duration: 2.5, 
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 60%"
                    }
                }
            );
        }
    }, []);

    return (
        <section ref={sectionRef} className="py-32 relative overflow-hidden bg-background-dark" id="intelligence">
            <div className="glow-orb bottom-[-20%] right-[-10%] opacity-40"></div>
            
            <div ref={contentRef} className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    
                    {/* Left: UI Mockup */}
                    <div className="relative">
                        <div className="aspect-square w-full max-w-lg mx-auto rounded-3xl overflow-hidden glass-morphism p-8 flex flex-col gap-6" style={{ background: 'rgba(17, 23, 34, 0.4)' }}>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="size-3 rounded-full bg-red-500/50"></div>
                                    <div className="size-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="size-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Matching Engine v2.4</span>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-white">Senior ML Architect</span>
                                        <span className="text-xs text-primary font-mono">98.4% Match</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div ref={progressRef} className="h-full bg-primary w-[98.4%]"></div>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">Agentic Reasoning</span>
                                    <p className="text-sm text-slate-300 italic font-light">&quot;Candidate demonstrates cross-domain expertise in neural architectures and distributed systems. 4-year retention probability: 82%.&quot;</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <span className="block text-xl font-bold text-white">4ms</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Latency</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <span className="block text-xl font-bold text-white">12k</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Vectors Checked</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="w-full py-3 bg-white text-background-dark font-bold rounded-lg text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                Approve Match
                            </button>
                        </div>
                    </div>

                    {/* Right: Copy */}
                    <div>
                        <h2 className="text-xs uppercase text-primary font-bold tracking-[0.3em] mb-4">Phase 02</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-8">Intelligence Beyond Information</h3>
                        <p className="text-slate-400 text-lg font-light leading-relaxed mb-10">
                            Our intelligence engine doesn&apos;t just read resumes; it understands context. It maps candidate aspirations to company trajectories using agentic reasoning and real-time skill verification.
                        </p>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-bold">Predictive Match Scoring</h5>
                                    <p className="text-slate-500 text-sm">Assess potential performance before the first interview.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-bold">Real-time Reasoning</h5>
                                    <p className="text-slate-500 text-sm">Every match comes with a detailed agent-generated justification.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

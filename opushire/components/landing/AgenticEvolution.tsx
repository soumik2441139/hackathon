"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export const AgenticEvolution = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    
    // Custom hook for magnetic effect on buttons
    const applyMagneticEffect = (element: HTMLElement | null) => {
        if (!element) return;
        const moveHandler = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(element, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: "power3.out" });
        };
        const leaveHandler = () => {
            gsap.to(element, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
        };
        element.addEventListener('mousemove', moveHandler);
        element.addEventListener('mouseleave', leaveHandler);
        return () => {
            element.removeEventListener('mousemove', moveHandler);
            element.removeEventListener('mouseleave', leaveHandler);
        };
    };

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

        // Cards Stagger Reveal
        if (cardsContainerRef.current) {
            const cards = cardsContainerRef.current.querySelectorAll('.evolution-card');
            gsap.from(cards, {
                y: 60,
                opacity: 0,
                stagger: 0.15,
                duration: 1,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 70%",
                }
            });
        }
        
        // Clean up
        const magneticElements = document.querySelectorAll('.magnetic-element');
        const cleanupFns: any[] = [];
        magneticElements.forEach(el => {
           cleanupFns.push(applyMagneticEffect(el as HTMLElement));
        });

        return () => {
            cleanupFns.forEach(fn => fn && fn());
        };
    }, []);

    return (
        <section ref={sectionRef} className="py-32 relative bg-background-dark" id="evolution">
            <div ref={contentRef} className="max-w-7xl mx-auto px-6">
                
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-xs uppercase text-primary font-bold tracking-[0.3em] mb-4">Phase 01</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">The Evolution</h3>
                        <p className="mt-6 text-slate-400 text-lg font-light leading-relaxed">
                            Static databases are dead. We’ve architected a system that evolves with the market, identifying talent signals before they reach the mainstream.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="size-12 rounded-full border border-white/10 flex items-center justify-center text-slate-500 cursor-pointer magnetic-element">
                            <span className="material-symbols-outlined">keyboard_arrow_left</span>
                        </div>
                        <div className="size-12 rounded-full border border-primary/50 flex items-center justify-center text-primary cursor-pointer magnetic-element">
                            <span className="material-symbols-outlined">keyboard_arrow_right</span>
                        </div>
                    </div>
                </div>

                <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="evolution-card group relative p-8 rounded-2xl glass-morphism transition-all hover:bg-white/5 hover:-translate-y-2 cursor-pointer">
                        <div className="size-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-primary">
                            <span className="material-symbols-outlined">history</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">Legacy Hiring</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Manual filtering, outdated CVs, and friction-filled recruitment cycles that waste human potential.</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>Deprecating</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="evolution-card group relative p-8 rounded-2xl bg-primary/10 border border-primary/30 transition-all hover:-translate-y-2 cursor-pointer">
                        <div className="size-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6 text-primary">
                            <span className="material-symbols-outlined">shield_lock</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">The Protocol</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Encrypted, high-speed data synchronization ensuring candidate privacy and employer precision.</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                            <span>Active Syncing</span>
                            <div className="h-px flex-1 bg-primary/30"></div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="evolution-card group relative p-8 rounded-2xl glass-morphism transition-all hover:bg-white/5 hover:-translate-y-2 cursor-pointer">
                        <div className="size-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-primary">
                            <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">Agentic Future</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Autonomous agents matching talent in real-time based on high-dimensional skill vectors.</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>Initiating</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

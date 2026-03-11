"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export const AgenticHero = () => {
    const orbRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Orb Parallax Effect
        const handleMouseMove = (e: MouseEvent) => {
            if (!orbRef.current) return;
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            gsap.to(orbRef.current, {
                x: mouseX * 100,
                y: mouseY * 100,
                duration: 2,
                ease: "power2.out"
            });
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Heading Reveal
        if (headingRef.current) {
            const words = headingRef.current.querySelectorAll('.reveal-word');
            gsap.from(words, {
                y: "100%",
                stagger: 0.05,
                duration: 1.2,
                ease: "power4.out",
                delay: 0.2
            });
        }

        // Hero Content Parallax Zoom
        if (containerRef.current && contentRef.current) {
            gsap.to(contentRef.current, {
                scale: 1.1,
                opacity: 0.5,
                y: -100,
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <main ref={containerRef} className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col justify-center">
            <div ref={orbRef} className="glow-orb top-[-10%] left-1/2 -translate-x-1/2"></div>
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none"></div>

            <div ref={contentRef} className="max-w-5xl mx-auto px-6 text-center relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Autonomous Match Protocol Active
                </div>

                <h1 ref={headingRef} className="text-6xl md:text-8xl font-extrabold leading-[1.1] tracking-tight mb-8 text-slate-100">
                    <span className="reveal-word-wrapper"><span className="reveal-word">Agentic</span></span> <br className="hidden md:block"/>
                    <span className="reveal-word-wrapper"><span className="reveal-word text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Recruitment</span></span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-12">
                    The shift from legacy databases to autonomous talent acquisition. <br className="hidden md:block"/> Real-time intelligence matching human potential with precision.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="w-full max-w-md p-1 rounded-xl bg-gradient-to-r from-primary/50 via-blue-500/20 to-transparent">
                        <div className="bg-slate-custom rounded-lg p-6 flex items-center justify-between gap-4">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-1">CV Upload Hub</span>
                                <span className="text-white font-medium">Drop your manifest here</span>
                            </div>
                            <Link href="/register">
                                <button className="bg-primary text-white p-3 rounded-lg hover:scale-105 transition-transform flex items-center justify-center">
                                    <span className="material-symbols-outlined">upload_file</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

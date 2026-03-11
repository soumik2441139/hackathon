"use client";
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export const AgenticCTA = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sectionRef.current && contentRef.current) {
            gsap.from(contentRef.current, {
                opacity: 0,
                y: 100,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
        }
    }, []);

    return (
        <section ref={sectionRef} className="py-32 bg-slate-custom relative" id="protocol">
            <div ref={contentRef} className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to initiate sync?</h2>
                <p className="text-slate-400 text-lg font-light mb-12">Join the elite layer of companies building with autonomous talent intelligence.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link href="/register">
                        <button className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-transform magnetic-element">
                            Enter Dashboard
                        </button>
                    </Link>
                    <Link href="/jobs">
                        <button className="w-full sm:w-auto px-10 py-4 border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/5 transition-colors magnetic-element">
                            View Protocol Docs
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

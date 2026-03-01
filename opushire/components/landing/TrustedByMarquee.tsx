"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const TrustedByMarquee = () => {
    // We duplicate the list to create a seamless infinite loop
    const companies = [
        <div key="c0" className="text-2xl font-black italic px-8">VERCEL</div>,
        <div key="c1" className="text-2xl font-black tracking-widest leading-none px-8">STRIPE</div>,
        <div key="c2" className="text-2xl font-bold font-mono px-8">razorpay</div>,
        <div key="c3" className="text-2xl font-bold lowercase tracking-tighter px-8">airbnb</div>,
        <div key="c4" className="text-2xl font-black uppercase px-8">CRED</div>,
        <div key="c5" className="text-2xl font-bold font-serif italic px-8">Notion</div>,
        <div key="c6" className="text-2xl font-bold px-8">OpenAI</div>,

        // Duplicates for seamless loop
        <div key="c0_dup" className="text-2xl font-black italic px-8">VERCEL</div>,
        <div key="c1_dup" className="text-2xl font-black tracking-widest leading-none px-8">STRIPE</div>,
        <div key="c2_dup" className="text-2xl font-bold font-mono px-8">razorpay</div>,
        <div key="c3_dup" className="text-2xl font-bold lowercase tracking-tighter px-8">airbnb</div>,
        <div key="c4_dup" className="text-2xl font-black uppercase px-8">CRED</div>,
        <div key="c5_dup" className="text-2xl font-bold font-serif italic px-8">Notion</div>,
        <div key="c6_dup" className="text-2xl font-bold px-8">OpenAI</div>,
    ];

    return (
        <div className="w-full mt-20 pt-12 border-t border-white/5 relative">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-8 text-center">
                Trusted by world-class teams
            </p>

            <div
                className="flex whitespace-nowrap opacity-40 grayscale hover:grayscale-0 transition-all duration-700 w-full overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                }}
            >
                <motion.div
                    className="flex flex-row items-center justify-start space-x-12 w-max"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 25 // adjust speed of crawler
                    }}
                >
                    {...companies}
                </motion.div>
            </div>
        </div>
    );
};

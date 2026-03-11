"use client";
import React from "react";

/**
 * Renders an invisible grid of identifying text over the entire screen.
 * While practically invisible to the human eye reading the PDF underneath,
 * it acts as a permanent fingerprint natively embedded inside any screenshots taken.
 */
export default function SecureOverlay({ email, userId }: { email: string, userId: string }) {
    const text = `CONFIDENTIAL • ${email} • ${userId}`;
    const gridElements = Array.from({ length: 20 }); 

    return (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-wrap justify-center content-center overflow-hidden opacity-30 mix-blend-overlay">
            {gridElements.map((_, i) => (
                <div 
                    key={i} 
                    className="flex h-40 w-1/4 items-center justify-center -rotate-12 select-none text-xs text-black/40 font-mono whitespace-nowrap p-4"
                >
                    {text}
                </div>
            ))}
        </div>
    );
}

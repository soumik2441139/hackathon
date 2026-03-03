"use client";

import { useEffect, useRef, useState } from "react";

// Safe wrappers for browser-only APIs (requestAnimationFrame is undefined on SSR)
const raf = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: FrameRequestCallback) => setTimeout(cb, 16);
const caf = typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : clearTimeout;

export type AgentState =
    | "connecting"
    | "initializing"
    | "listening"
    | "speaking"
    | "thinking";

interface BarVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
    state: AgentState;
    barCount?: number;
    minHeight?: number;
    maxHeight?: number;
    demo?: boolean;
    centerAlign?: boolean;
}

function getTargetHeightsForState(state: AgentState, barCount: number): number[] {
    const heights = Array(barCount).fill(0);
    const mid = Math.floor(barCount / 2);

    switch (state) {
        case "speaking": {
            // Wave pattern - tall bars in the middle
            return heights.map((_, i) => {
                const dist = Math.abs(i - mid);
                const base = Math.max(20, 95 - dist * 12);
                return base + Math.random() * 15;
            });
        }
        case "thinking": {
            // Pulse - alternating heights
            return heights.map((_, i) => (i % 2 === 0 ? 70 + Math.random() * 25 : 20 + Math.random() * 20));
        }
        case "listening": {
            // Low gentle wave indicating idle listening
            return heights.map((_, i) => 20 + Math.sin(i * 0.8) * 12 + Math.random() * 10);
        }
        case "connecting":
        case "initializing": {
            // Growing pattern left to right
            return heights.map((_, i) => 10 + (i / barCount) * 50 + Math.random() * 15);
        }
        default:
            return heights.map(() => 20);
    }
}

const STATE_COLORS: Record<AgentState, string> = {
    connecting: "#06b6d4",
    initializing: "#06b6d4",
    listening: "#22c55e",
    speaking: "#a855f7",
    thinking: "#eab308",
};

export function BarVisualizer({
    state,
    barCount = 15,
    minHeight = 20,
    maxHeight = 100,
    demo = false,
    centerAlign = false,
    className = "",
    ...props
}: BarVisualizerProps) {
    const animationRef = useRef<number | null>(null);
    const [heights, setHeights] = useState<number[]>(Array(barCount).fill(minHeight));
    const targetHeightsRef = useRef<number[]>(Array(barCount).fill(minHeight));
    const color = STATE_COLORS[state];

    // Continuously push bars toward new target heights, creating a smooth animation
    useEffect(() => {
        function animate() {
            setHeights((prev) => {
                const targets = targetHeightsRef.current;
                return prev.map((h, i) => {
                    const t = targets[i];
                    // Lerp toward target
                    const diff = t - h;
                    return h + diff * 0.07;
                });
            });
            animationRef.current = raf(animate);
        }

        animationRef.current = raf(animate);
        return () => {
            if (animationRef.current) caf(animationRef.current);
        };
    }, []);

    // Randomize targets on an interval based on state
    useEffect(() => {
        function updateTargets() {
            const newTargets = getTargetHeightsForState(state, barCount);
            // Clamp to min/max
            targetHeightsRef.current = newTargets.map((h) =>
                Math.min(maxHeight, Math.max(minHeight, h))
            );
        }

        updateTargets(); // Run immediately on state change
        const interval = setInterval(updateTargets, state === "thinking" ? 400 : state === "speaking" ? 200 : 700);
        return () => clearInterval(interval);
    }, [state, barCount, minHeight, maxHeight]);

    return (
        <div
            {...props}
            className={`flex items-end gap-[3px] w-full ${centerAlign ? "justify-center" : "justify-between"} ${className}`}
        >
            {heights.map((h, i) => (
                <div
                    key={i}
                    style={{
                        height: `${h}%`,
                        backgroundColor: color,
                        borderRadius: "2px 2px 0 0",
                        opacity: 0.75 + (h / maxHeight) * 0.25,
                        flex: 1,
                        boxShadow: `0 0 6px ${color}66`,
                        transition: "background-color 0.5s ease",
                    }}
                />
            ))}
        </div>
    );
}

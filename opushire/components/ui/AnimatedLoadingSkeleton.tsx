"use client";

import React, { useCallback, useEffect, useState } from 'react'
import { motion, useAnimate } from 'framer-motion'

// Interface for grid configuration structure
interface GridConfig {
    numCards: number // Total number of cards to display
    cols: number     // Number of columns in the grid
    xBase: number    // Base x-coordinate for positioning
    yBase: number    // Base y-coordinate for positioning
    xStep: number    // Horizontal step between cards
    yStep: number    // Vertical step between cards
}

interface Position { x: number; y: number }

// Dynamically calculates grid configuration based on window width
const getGridConfig = (width: number): GridConfig => ({
    numCards: 6,
    cols: width >= 1024 ? 3 : width >= 640 ? 2 : 1,
    xBase: 40,
    yBase: 60,
    xStep: 210,
    yStep: 230,
})

const AnimatedLoadingSkeleton = () => {
    // Lazy initializer — runs once on client. Returns 0 during SSR (no window).
    // This avoids calling setState inside useEffect entirely, satisfying the React Compiler.
    const [windowWidth, setWindowWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return 0
        return window.innerWidth
    })

    const [scope, animate] = useAnimate()

    // Generates random animation path for the search icon
    const generateSearchPath = useCallback((config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols)
        const allPositions: Position[] = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (row * cols + col < numCards) {
                    allPositions.push({
                        x: xBase + col * xStep,
                        y: yBase + row * yStep,
                    })
                }
            }
        }

        const numRandomCards = 4
        const shuffled = [...allPositions]
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        if (shuffled.length === 0) return null

        // Close the loop so the icon returns to start
        shuffled.push(shuffled[0])

        return {
            x:     shuffled.map(p => p.x),
            y:     shuffled.map(p => p.y),
            scale: Array<number>(shuffled.length).fill(1.2),
        }
    }, [])

    // Track window width changes via resize listener
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Re-animate the search icon whenever window width changes
    useEffect(() => {
        const config = getGridConfig(windowWidth)
        const path      = generateSearchPath(config)
        if (!path || !scope.current) return

        animate(
            '#search-icon',
            { x: path.x, y: path.y, scale: path.scale },
            {
                duration: path.x.length * 2,
                repeat:   Infinity,
                ease:     'easeInOut',
                times:    path.x.map((_, i) => i / (path.x.length - 1)),
            },
        )
    }, [windowWidth, animate, generateSearchPath, scope])

    // Variants for the outer frame
    const frameVariants = {
        hidden:  { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    }

    // Staggered card variants
    const cardVariants = {
        hidden:  { y: 20, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 },
        }),
    }

    // Wait until client width is known before rendering
    // This prevents SSR/client grid-column mismatch
    const config = windowWidth !== undefined ? getGridConfig(windowWidth) : getGridConfig(0)

    return (
        <motion.div
            ref={scope}
            className="w-full max-w-4xl mx-auto p-6 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg"
            variants={frameVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-8">
                {/* Search icon — driven by useAnimate via #search-icon id */}
                <motion.div
                    id="search-icon"
                    className="absolute z-10 pointer-events-none"
                    style={{ left: 24, top: 24 }}
                >
                    <motion.div
                        className="bg-blue-500/20 p-3 rounded-full backdrop-blur-sm"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(59, 130, 246, 0.2)',
                                '0 0 35px rgba(59, 130, 246, 0.4)',
                                '0 0 20px rgba(59, 130, 246, 0.2)',
                            ],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Grid of animated skeleton cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(config.numCards)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white/80 rounded-lg shadow-sm p-4 border border-gray-100"
                        >
                            {/* Shimmer placeholders */}
                            <motion.div
                                className="h-32 bg-gray-200/50 rounded-md mb-3"
                                animate={{
                                    background: [
                                        'rgba(243, 244, 246, 0.5)',
                                        'rgba(229, 231, 235, 0.5)',
                                        'rgba(243, 244, 246, 0.5)',
                                    ],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-3 w-3/4 bg-gray-200/50 rounded mb-2"
                                animate={{
                                    background: [
                                        'rgba(243, 244, 246, 0.5)',
                                        'rgba(229, 231, 235, 0.5)',
                                        'rgba(243, 244, 246, 0.5)',
                                    ],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-3 w-1/2 bg-gray-200/50 rounded"
                                animate={{
                                    background: [
                                        'rgba(243, 244, 246, 0.5)',
                                        'rgba(229, 231, 235, 0.5)',
                                        'rgba(243, 244, 246, 0.5)',
                                    ],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default AnimatedLoadingSkeleton;

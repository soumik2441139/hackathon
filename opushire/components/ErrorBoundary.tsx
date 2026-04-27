'use client';

import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary for graceful failure handling.
 * Catches render-time errors in child components and shows
 * a user-friendly fallback instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <DashboardContent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200">Something went wrong</h2>
                    <p className="text-sm text-slate-400 max-w-md">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <code className="text-xs text-red-300/70 bg-red-500/5 px-3 py-1.5 rounded-lg max-w-sm truncate">
                        {this.state.error?.message || 'Unknown error'}
                    </code>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

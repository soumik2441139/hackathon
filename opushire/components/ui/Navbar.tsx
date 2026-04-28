"use client";
import Link from 'next/link';
import { Button } from './Button';
import { Menu, X, LogOut, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, loading } = useAuth();

    const dashboardHref = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/student';

    return (
        <nav className="fixed top-0 left-0 w-full z-50 glass-morphism border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="size-8 bg-primary rounded flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-xl">deployed_code</span>
                    </div>
                    <span className="font-display text-xl font-bold tracking-tighter uppercase text-white">
                        OpusHire
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/jobs" className="text-brand-text/70 hover:text-brand-text transition-colors">Jobs</Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full border-2 border-brand-violet/30 border-t-brand-violet animate-spin" />
                    ) : user ? (
                        <>
                            <Link href={dashboardHref}>
                                <Button variant="primary" size="sm" className="px-6 h-10 font-bold tracking-widest uppercase">
                                    Initialize Access
                                </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="gap-2 border-white/10" onClick={logout}>
                                <LogOut size={15} /> Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="primary" size="sm" className="px-6 h-10 font-bold tracking-widest uppercase">
                                    Initialize Access
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden absolute top-24 left-6 right-6 p-6 glass-card flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <Link href="/jobs" className="text-lg py-2 border-b border-white/5" onClick={() => setIsOpen(false)}>Jobs</Link>
                    {user ? (
                        <>
                            <Link href={dashboardHref} className="text-lg py-2 border-b border-white/5" onClick={() => setIsOpen(false)}>
                                {user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
                            </Link>
                            <button className="text-lg py-2 text-left text-red-400" onClick={() => { logout(); setIsOpen(false); }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-lg py-2" onClick={() => setIsOpen(false)}>Login</Link>
                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                <Button className="w-full">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

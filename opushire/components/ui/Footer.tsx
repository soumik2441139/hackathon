import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-20 border-t border-white/5 bg-background-dark z-10 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <div className="size-6 bg-primary rounded flex items-center justify-center transition-transform group-hover:scale-105">
                                <span className="material-symbols-outlined text-white text-[14px]">deployed_code</span>
                            </div>
                            <span className="text-lg font-bold tracking-tighter uppercase text-white">OpusHire</span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">Autonomous talent infrastructure for the next generation of industry leaders.</p>
                    </div>

                    <div>
                        <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6">System</h6>
                        <ul className="space-y-4 text-slate-500 text-sm">
                            <li><Link className="hover:text-primary transition-colors" href="/jobs">Protocol</Link></li>
                            <li><Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Protocol</h6>
                        <ul className="space-y-4 text-slate-500 text-sm">
                            <li><Link className="hover:text-primary transition-colors" href="#">Security</Link></li>
                            <li><Link className="hover:text-primary transition-colors" href="#">Privacy</Link></li>
                            <li><Link className="hover:text-primary transition-colors" href="/login">Node Access</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Connect</h6>
                        <div className="flex gap-4">
                            <div className="size-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer">
                                <Twitter className="w-5 h-5" />
                            </div>
                            <div className="size-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer">
                                <Github className="w-5 h-5" />
                            </div>
                            <div className="size-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer">
                                <Linkedin className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6">
                    <span className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">© 2026 OPUSHIRE_SYSTEMS. ALL RIGHTS RESERVED.</span>
                    <div className="flex gap-8">
                        <span className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">LATENCY: 12MS</span>
                        <div className="flex items-center gap-1 group">
                            <span className="w-2 h-2 rounded-full bg-green-500 group-hover:animate-ping"></span>
                            <span className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">STATUS: OPERATIONAL</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="w-full pt-32 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/5">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center text-brand-dark font-bold transition-transform hover:rotate-12">
                                O
                            </div>
                            <span className="font-display text-xl font-bold tracking-tight text-brand-text">Opushire</span>
                        </Link>
                        <p className="text-brand-text/50 text-sm leading-relaxed mb-6">
                            Premium job portal designed specifically for students to find high-growth opportunities at top startups.
                        </p>
                        <div className="flex gap-4">
                            <Twitter className="w-5 h-5 text-brand-text/30 hover:text-brand-text cursor-pointer transition-colors" />
                            <Github className="w-5 h-5 text-brand-text/30 hover:text-brand-text cursor-pointer transition-colors" />
                            <Linkedin className="w-5 h-5 text-brand-text/30 hover:text-brand-text cursor-pointer transition-colors" />
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-brand-text">Platform</h4>
                        <ul className="space-y-4 text-sm text-brand-text/50">
                            <li className="hover:text-brand-text transition-colors cursor-pointer">
                                <Link href="/jobs">Find Jobs</Link>
                            </li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">
                                <Link href="/register">Post a Job</Link>
                            </li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">
                                <Link href="/companies">Company Search</Link>
                            </li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">
                                <Link href="/salaries">Salaries</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-brand-text">Community</h4>
                        <ul className="space-y-4 text-sm text-brand-text/50">
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Success Stories</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Student Toolkit</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Mentorship</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Events</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-brand-text">Support</h4>
                        <ul className="space-y-4 text-sm text-brand-text/50">
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Help Center</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Safety Center</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Terms of Service</li>
                            <li className="hover:text-brand-text transition-colors cursor-pointer">Privacy Policy</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-text/30">
                    <p>© 2026 Opushire. Built with ❤️ for the student community.</p>
                    <div className="flex gap-8">
                        <span>Server Status: <span className="text-brand-cyan">Normal</span></span>
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>hello@opushire.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

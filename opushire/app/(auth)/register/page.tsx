"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { User, Mail, Lock, School, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        college: '', degree: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                college: form.college,
                degree: form.degree,
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-brand-text/30";

    return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/20 via-transparent to-brand-cyan/20 blur-3xl -z-10" />

            <ScrollReveal direction="up" duration={0.8}>
                <div className="glass-card w-full max-w-2xl p-10 flex flex-col items-center border-white/5">
                    <h1 className="text-3xl font-bold mb-2 text-brand-text">Create Account</h1>
                    <p className="text-brand-text/50 text-center mb-10">
                        Join the premium community of students and startups.
                    </p>

                    {error && (
                        <div className="w-full mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="text" placeholder="John Doe" value={form.name} onChange={set('name')} required className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="email" placeholder="john@college.edu" value={form.email} onChange={set('email')} required className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">College / University</label>
                            <div className="relative">
                                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="text" placeholder="IIIT Bangalore" value={form.college} onChange={set('college')} className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Degree</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="text" placeholder="B.Tech, 3rd Year" value={form.degree} onChange={set('degree')} className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text/70 ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30 w-5 h-5" />
                                <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required className={inputClass} />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-4">
                            <Button className="w-full h-14 text-lg" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-6 text-brand-text/50 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-brand-cyan font-bold hover:underline ml-1">Sign In</Link>
                    </p>
                </div>
            </ScrollReveal>
        </div>
    );
}

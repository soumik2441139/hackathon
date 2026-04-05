"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        college: '',
        degree: '',
        year: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({
                ...form,
                role: 'student',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[#07111b] text-slate-100 font-display selection:bg-[#1d4ed8]/30">
            <style dangerouslySetInnerHTML={{ __html: `
                .mesh-shell {
                    background:
                        radial-gradient(circle at top left, rgba(14, 116, 144, 0.28), transparent 34%),
                        radial-gradient(circle at 85% 18%, rgba(30, 64, 175, 0.24), transparent 32%),
                        radial-gradient(circle at 50% 100%, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 1) 62%);
                }
                .grid-haze {
                    background-image:
                        linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
                    background-size: 40px 40px;
                    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 92%);
                }
            ` }} />

            <div className="mesh-shell relative min-h-screen">
                <div className="grid-haze absolute inset-0 opacity-50" />
                <div className="absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute right-[-8%] top-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

                <main className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
                    <div className="grid w-full gap-10 lg:grid-cols-12 lg:gap-16">
                        <section className="rounded-[32px] border border-white/10 bg-[#081321]/85 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-12 lg:col-span-7">
                            <div className="mb-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-300/80">
                                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
                                Student Enrollment
                            </div>

                            <div className="mb-10 space-y-5">
                                <h1 className="max-w-xl text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
                                    Build your OpusHire identity.
                                </h1>
                                <p className="max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                                    New student accounts are activated with a 6-digit email code before first login. Existing accounts stay exactly as they are.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <Field
                                        label="Full Name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Aarav Sharma"
                                        autoComplete="name"
                                    />
                                    <Field
                                        label="Academic Email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="name@college.edu"
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <Field
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        autoComplete="new-password"
                                    />
                                    <Field
                                        label="Graduation Year"
                                        name="year"
                                        value={form.year}
                                        onChange={handleChange}
                                        placeholder="2027"
                                        inputMode="numeric"
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <Field
                                        label="College"
                                        name="college"
                                        value={form.college}
                                        onChange={handleChange}
                                        placeholder="KIIT University"
                                    />
                                    <Field
                                        label="Degree"
                                        name="degree"
                                        value={form.degree}
                                        onChange={handleChange}
                                        placeholder="B.Tech Computer Science"
                                    />
                                </div>

                                <div className="rounded-3xl border border-cyan-300/10 bg-[#0b1728] p-5 text-sm text-slate-300">
                                    <p className="font-semibold text-white">What happens next</p>
                                    <p className="mt-2 leading-7 text-slate-400">
                                        After submission, OpusHire sends a one-time activation code to your email. Your dashboard opens only after that code is verified.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <span>{loading ? 'Creating Account' : 'Create Account'}</span>
                                    {!loading && <span className="material-symbols-outlined text-base">north_east</span>}
                                </button>
                            </form>

                            <p className="mt-8 text-sm text-slate-400">
                                Already have access? <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">Log in here</Link>
                            </p>
                        </section>

                        <aside className="space-y-6 lg:col-span-5">
                            <div className="rounded-[32px] border border-white/10 bg-[#0a1627]/80 p-10 backdrop-blur-xl">
                                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-300/80">Activation Layer</p>
                                <div className="mt-6 space-y-6">
                                    <InfoRow
                                        title="1. Create account"
                                        body="Your profile record is created as unverified only if it is a brand new signup."
                                    />
                                    <InfoRow
                                        title="2. Receive code"
                                        body="A 6-digit email code is sent immediately and expires after a short window."
                                    />
                                    <InfoRow
                                        title="3. Unlock workspace"
                                        body="Verification completes first access and then the normal student session starts."
                                    />
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-white/10 bg-linear-to-br from-slate-900/90 to-slate-950/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                <div className="flex items-start justify-between gap-6">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-300/80">Integrity</p>
                                        <h2 className="mt-4 text-2xl font-black text-white">No migration required.</h2>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                                        Existing users safe
                                    </div>
                                </div>
                                <p className="mt-6 text-sm leading-7 text-slate-400">
                                    This rule applies only to future registrations. Existing MongoDB records are not rewritten or re-verified.
                                </p>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = 'text',
    autoComplete,
    inputMode,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
    return (
        <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</span>
            <input
                required={name === 'name' || name === 'email' || name === 'password'}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                className="w-full rounded-2xl border border-white/10 bg-[#050d18] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-[#071220]"
            />
        </label>
    );
}

function InfoRow({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/3 p-5">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-400">{body}</p>
        </div>
    );
}

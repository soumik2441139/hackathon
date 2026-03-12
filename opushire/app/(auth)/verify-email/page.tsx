"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PENDING_VERIFICATION_EMAIL_KEY = 'opushire_pending_verification_email';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailFallback />}>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const { verifyEmail, resendVerificationCode } = useAuth();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('Enter the 6-digit code sent to your inbox.');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const queryEmail = searchParams.get('email');
        const storedEmail = typeof window !== 'undefined'
            ? sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY)
            : null;

        setEmail(queryEmail || storedEmail || '');
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setSubmitting(true);

        try {
            await verifyEmail(email.trim(), code.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setInfo('');
        setResending(true);

        try {
            const response = await resendVerificationCode(email.trim());
            setInfo(response.message || 'A fresh verification code has been sent.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#061019] px-4 py-16 text-slate-100 font-display selection:bg-cyan-400/25 sm:px-6 lg:px-8">
            <style dangerouslySetInnerHTML={{ __html: `
                .activation-bg {
                    background:
                        radial-gradient(circle at 15% 20%, rgba(34, 211, 238, 0.18), transparent 26%),
                        radial-gradient(circle at 80% 12%, rgba(59, 130, 246, 0.16), transparent 28%),
                        linear-gradient(180deg, rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 1));
                }
            ` }} />

            <div className="activation-bg mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center justify-center overflow-hidden rounded-4xl border border-white/10 px-6 py-10 shadow-[0_30px_120px_rgba(2,6,23,0.55)] sm:px-10">
                <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                    <aside className="rounded-[28px] border border-white/10 bg-white/4 p-8 backdrop-blur-xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Activation</p>
                        <h1 className="mt-6 text-4xl font-black leading-none text-white">Verify your email.</h1>
                        <p className="mt-5 text-sm leading-7 text-slate-300">
                            Only newly created accounts require this step. Once the code matches, your first authenticated session starts immediately.
                        </p>

                        <div className="mt-8 space-y-4">
                            <Step title="One code, one inbox" body="Codes are delivered to the email address used during registration." />
                            <Step title="Short expiry window" body="If the code expires, request a new one and use the latest message only." />
                            <Step title="Existing accounts unchanged" body="Legacy users continue to log in normally without re-verification." />
                        </div>
                    </aside>

                    <section className="rounded-[28px] border border-white/10 bg-[#081321]/85 p-8 backdrop-blur-xl sm:p-10">
                        <div className="mb-8 space-y-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-300/80">Email Challenge</p>
                            <p className="text-sm leading-7 text-slate-400">
                                Enter your email and the 6-digit code. If you have not received it yet, resend from this screen.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        {info && !error && (
                            <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                                {info}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Email</span>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@college.edu"
                                    autoComplete="email"
                                    className="w-full rounded-2xl border border-white/10 bg-[#050d18] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-[#071220]"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Verification Code</span>
                                <input
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    className="w-full rounded-2xl border border-white/10 bg-[#050d18] px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-[#071220]"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submitting ? 'Verifying' : 'Verify Account'}
                                </button>
                                <button
                                    type="button"
                                    disabled={resending || !email.trim()}
                                    onClick={handleResend}
                                    className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {resending ? 'Sending' : 'Resend Code'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">Back to register</Link>
                            <span className="text-slate-600">/</span>
                            <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">Back to login</Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function VerifyEmailFallback() {
    return (
        <div className="min-h-screen bg-[#061019] px-4 py-16 text-slate-100 font-display sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center justify-center rounded-4xl border border-white/10 bg-[#081321]/85 px-6 py-10 shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Loading verification</p>
            </div>
        </div>
    );
}

function Step({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-white/8 bg-[#0b1626]/80 p-5">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-400">{body}</p>
        </div>
    );
}
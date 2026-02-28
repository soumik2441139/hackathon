"use client";
import React, { useState } from 'react';
import { applications } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { X, FileText, Phone, Linkedin } from 'lucide-react';

interface ApplyModalProps {
    jobId: string;
    jobTitle: string;
    company: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ApplyModal = ({ jobId, jobTitle, company, onClose, onSuccess }: ApplyModalProps) => {
    const [form, setForm] = useState({ coverLetter: '', phone: '', linkedin: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await applications.apply({ jobId, ...form });
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to apply');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative glass-card w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={20} className="text-white/50" />
                </button>

                <h2 className="text-2xl font-bold mb-1">Apply Now</h2>
                <p className="text-white/50 mb-8">{jobTitle} · {company}</p>

                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleApply} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/60 flex items-center gap-2">
                            <FileText size={14} /> Cover Letter <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <textarea
                            placeholder="Tell us why you're a great fit..."
                            value={form.coverLetter}
                            onChange={set('coverLetter')}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-white/20 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/60 flex items-center gap-2">
                            <Phone size={14} /> Phone Number <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={set('phone')}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-white/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/60 flex items-center gap-2">
                            <Linkedin size={14} /> LinkedIn Profile <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <input
                            type="url"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={form.linkedin}
                            onChange={set('linkedin')}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-brand-violet/50 transition-colors text-brand-text placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={onClose}>Cancel</Button>
                        <Button className="flex-1 h-12" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

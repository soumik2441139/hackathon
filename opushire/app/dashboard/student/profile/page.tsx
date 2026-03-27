"use client";
import React, { useState, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Save, Loader2, User as UserIcon,
    GraduationCap, Building2, Calendar, FileText,
    Phone, Linkedin, X, Plus, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { auth as authApi, linkedin as linkedinApi } from '@/lib/api';
import Link from 'next/link';

export default function ProfileEditPage() {
    const { user, refreshUser } = useAuth();

    const [form, setForm] = useState({
        name: '',
        bio: '',
        college: '',
        degree: '',
        year: '',
        phone: '',
        linkedin: '',
        skills: [] as string[],
    });

    const [skillInput, setSkillInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [enriching, setEnriching] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enrichResult, setEnrichResult] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                bio: user.bio || '',
                college: user.college || '',
                degree: user.degree || '',
                year: user.year || '',
                phone: (user as any).phone || '',
                linkedin: (user as any).linkedin || '',
                skills: user.skills || [],
            });
        }
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !form.skills.includes(trimmed)) {
            setForm(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
            setSkillInput('');
            setSaved(false);
        }
    };

    const removeSkill = (skill: string) => {
        setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
        setSaved(false);
    };

    const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await authApi.updateProfile(form);
            setSaved(true);
            if (refreshUser) refreshUser();
        } catch (err: any) {
            setError(err.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLinkedInEnrich = async () => {
        if (!form.linkedin) return;
        setEnriching(true);
        setEnrichResult(null);
        try {
            await linkedinApi.enrich(form.linkedin);
            setEnrichResult('Profile enriched successfully! Certifications have been imported.');
        } catch (err: any) {
            setEnrichResult('Enrichment failed: ' + (err.message || 'Unknown error'));
        } finally {
            setEnriching(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Full Name', icon: <UserIcon size={16} />, type: 'text', placeholder: 'Your full name' },
        { key: 'college', label: 'College / University', icon: <Building2 size={16} />, type: 'text', placeholder: 'e.g. MIT, Stanford, KIIT' },
        { key: 'degree', label: 'Degree / Program', icon: <GraduationCap size={16} />, type: 'text', placeholder: 'e.g. B.Tech CSE, M.Sc. AI' },
        { key: 'year', label: 'Graduation Year', icon: <Calendar size={16} />, type: 'text', placeholder: 'e.g. 2026' },
        { key: 'phone', label: 'Phone Number', icon: <Phone size={16} />, type: 'tel', placeholder: '+91 XXXXX XXXXX' },
        { key: 'linkedin', label: 'LinkedIn URL', icon: <Linkedin size={16} />, type: 'url', placeholder: 'https://linkedin.com/in/your-profile' },
    ];

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-32 pb-24 px-6 min-h-screen bg-[#0A0A0C] text-white relative overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/8 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full" />
                </div>

                <div className="max-w-3xl mx-auto relative z-10">
                    {/* Back Button */}
                    <Link href="/dashboard/student">
                        <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                        </button>
                    </Link>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-4">
                            <UserIcon size={10} /> Personal Profile
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3">
                            Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Profile</span>
                        </h1>
                        <p className="text-white/40 text-lg font-medium">
                            Keep your profile complete for better AI matching accuracy.
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-[2rem] p-8 md:p-10 border border-white/[0.06] bg-[#111114] space-y-6"
                    >
                        {/* Standard Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {fields.map((f) => (
                                <div key={f.key} className={f.key === 'linkedin' ? 'md:col-span-2' : ''}>
                                    <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                        {f.icon} {f.label}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type={f.type}
                                            value={(form as any)[f.key] || ''}
                                            onChange={(e) => handleChange(f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.05] transition-all text-sm"
                                        />
                                        {f.key === 'linkedin' && form.linkedin && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleLinkedInEnrich}
                                                disabled={enriching}
                                                className="px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-all flex items-center gap-2 shrink-0"
                                            >
                                                {enriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                Enrich
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* LinkedIn Enrichment Result */}
                        {enrichResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-3 p-4 rounded-2xl ${enrichResult.includes('failed') ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}
                            >
                                {enrichResult.includes('failed') ? (
                                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                                ) : (
                                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                )}
                                <p className={`text-sm font-medium ${enrichResult.includes('failed') ? 'text-red-400' : 'text-emerald-400'}`}>{enrichResult}</p>
                            </motion.div>
                        )}

                        {/* Bio */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                <FileText size={16} /> Bio
                            </label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                placeholder="Tell companies about yourself..."
                                rows={4}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.05] transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                <Sparkles size={16} /> Skills
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.skills.map((skill, i) => (
                                    <motion.span
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-bold group"
                                    >
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill)}
                                            className="text-cyan-300/40 hover:text-red-400 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </motion.span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleSkillKeyDown}
                                    placeholder="Type a skill and press Enter..."
                                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 transition-all text-sm"
                                />
                                <button
                                    onClick={addSkill}
                                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                            >
                                <AlertCircle size={18} className="text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* Save Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            {saved && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-emerald-400 text-sm font-bold"
                                >
                                    <CheckCircle2 size={16} /> Profile saved successfully
                                </motion.div>
                            )}
                            {!saved && <div />}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-shadow disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Profile</>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

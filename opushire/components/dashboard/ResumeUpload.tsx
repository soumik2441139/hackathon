"use client";
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';
import { resume as resumeApi } from '@/lib/api';

interface ResumeUploadProps {
    onUploadComplete?: () => void;
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const validateAndSetFile = (f: File) => {
        setError(null);
        if (f.type !== 'application/pdf') {
            setError('Only PDF files are accepted.');
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError('File must be under 5MB.');
            return;
        }
        setFile(f);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) validateAndSetFile(droppedFile);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) validateAndSetFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            await resumeApi.upload(file);
            setSuccess(true);
            onUploadComplete?.();
        } catch (err: any) {
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setSuccess(false);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 text-center overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <div className="relative z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    >
                        <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Resume Uploaded</h3>
                    <p className="text-white/50 text-sm mb-6">
                        Your resume is being analyzed by our AI agents. Score, matches, and career insights will appear shortly.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI Processing Active</span>
                        <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                    </div>
                    <button
                        onClick={reset}
                        className="mt-6 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-4"
                    >
                        Upload a different resume
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`
                    relative p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group overflow-hidden
                    ${isDragging
                        ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                        : file
                            ? 'border-orange-500/30 bg-orange-500/5'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }
                `}
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="relative z-10 flex flex-col items-center justify-center text-center py-6">
                    <AnimatePresence mode="wait">
                        {file ? (
                            <motion.div
                                key="file"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                                    <FileText size={28} className="text-orange-400" />
                                </div>
                                <p className="text-white font-bold text-sm mb-1">{file.name}</p>
                                <p className="text-white/30 text-xs mb-4">{(file.size / 1024).toFixed(0)} KB</p>
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                        disabled={uploading}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-shadow disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                                        ) : (
                                            <><Upload size={16} /> Upload & Analyze</>
                                        )}
                                    </motion.button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); reset(); }}
                                        className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all">
                                    <Upload size={28} className="text-white/30 group-hover:text-orange-400 transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Drop your resume here</h3>
                                <p className="text-white/30 text-sm">PDF files only, max 5MB</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                    >
                        <AlertCircle size={18} className="text-red-400 shrink-0" />
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

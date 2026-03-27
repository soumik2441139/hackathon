"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, ShieldAlert, Loader2, FileText, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { resume as resumeApi } from "@/lib/api";
import Link from "next/link";
import SecureOverlay from "../../../../components/SecureOverlay";

export default function SecureResumeViewer() {
    const { user } = useAuth();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const fetchResumeUrl = async () => {
            try {
                const res = await resumeApi.getMyFile();
                if (res.url) {
                    setPdfUrl(res.url);
                } else {
                    setError("Failed to generate secure viewing tunnel.");
                }
            } catch (e: any) {
                if (e.status === 404) {
                    setError("No resume uploaded yet. Upload one from your dashboard.");
                } else {
                    setError("Network error fetching secure link.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchResumeUrl();

        // Security hooks
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleDrag = (e: DragEvent) => e.preventDefault();
        const handleBlur = () => setIsFocused(false);
        const handleFocus = () => setIsFocused(true);

        window.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("dragstart", handleDrag);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("dragstart", handleDrag);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-32 pb-24 px-6 min-h-screen bg-[#0A0A0C] text-white relative">
                {/* Ambient Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-teal-500/5 blur-[150px] rounded-full" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
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
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-4">
                                <Shield size={10} /> End-to-End Encrypted
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
                                Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Vault</span>
                            </h1>
                            <p className="text-white/40 text-sm font-medium">
                                Secure, watermarked, focus-tracked. Your data is protected.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            {isFocused ? (
                                <span className="flex items-center gap-2 text-emerald-400 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <Eye size={14} /> Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-red-400 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse">
                                    <EyeOff size={14} /> Paused
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-white/40"
                        >
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-sm font-bold uppercase tracking-widest">Establishing Secure Environment...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 rounded-3xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 text-center"
                        >
                            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Access Error</h2>
                            <p className="text-white/50 mb-6 max-w-md mx-auto">{error}</p>
                            <Link href="/dashboard/student">
                                <button className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-colors">
                                    Return to Dashboard
                                </button>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111114] shadow-2xl"
                            style={{ height: '85vh' }}
                        >
                            {/* Security Overlay */}
                            <SecureOverlay email={user?.email || ""} userId={user?._id || ""} />

                            {/* PDF iframe */}
                            {pdfUrl && (
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                    className={`w-full h-full border-none transition-all duration-500 ${!isFocused ? "blur-xl grayscale opacity-10" : "opacity-100"}`}
                                    title="Encrypted Vault Viewer"
                                />
                            )}

                            {/* Blur Overlay when unfocused */}
                            {!isFocused && (
                                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
                                    <div className="text-center">
                                        <ShieldAlert size={48} className="text-red-400 mx-auto mb-4 animate-pulse" />
                                        <span className="text-white font-black uppercase tracking-[0.2em] text-lg block">
                                            Viewing Paused
                                        </span>
                                        <span className="text-white/40 text-sm mt-2 block">
                                            Tab out of focus — focus this window to resume viewing
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}

"use client";
import React, { useEffect, useState } from "react";
import SecureOverlay from "../../../../components/SecureOverlay";

export default function SecureResumeViewer() {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFocused, setIsFocused] = useState(true);

    const userEmail = "student@example.com"; // In Production: Retrieve from AuthContext
    const userId = "opushire-id";

    useEffect(() => {
        // Fetch the securely signed short-lived SAS proxy link
        const fetchResumeUrl = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/files/my-resume", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                
                if (data.url) {
                    setPdfUrl(data.url);
                } else {
                    setError("Failed to generate secure viewing tunnel.");
                }
            } catch (e: any) {
                setError("Network error fetching secure link.");
            } finally {
                setLoading(false);
            }
        };

        fetchResumeUrl();

        // High Security Web Hooks
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleDrag = (e: DragEvent) => e.preventDefault();
        const handleBlur = () => setIsFocused(false);
        const handleFocus = () => setIsFocused(true);

        window.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("dragstart", handleDrag);
        window.addEventListener("blur", handleBlur); // Blur triggers whenever they Alt-Tab or open Snipping Tool
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("dragstart", handleDrag);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Establishing Secure End-to-End Environment...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="relative w-full h-[85vh] overflow-hidden bg-gray-900 rounded-lg shadow-xl outline outline-1 outline-gray-800 transition-all duration-300">
            {/* The Invisible Watermark Grid */}
            <SecureOverlay email={userEmail} userId={userId} />

            {/* The Blob Stream iframe. If tab is unfocused, it destroys visibility preventing background screenshots */}
            {pdfUrl && (
                <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0`} // Disables standard PDF reader controls
                    className={`w-full h-full border-none transition-all duration-300 ${!isFocused ? "blur-xl grayscale opacity-10" : "opacity-100"}`}
                    title="Encrypted Vault Viewer"
                />
            )}
            
            {!isFocused && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                     <span className="text-white bg-red-600/90 px-6 py-3 rounded-md font-bold tracking-widest text-lg shadow-2xl">
                         VIEWING PAUSED - TAB OUT OF FOCUS
                     </span>
                 </div>
            )}
        </div>
    );
}

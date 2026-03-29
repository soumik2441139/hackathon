"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { resume as resumeApi } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_TEMPLATE = `# John Doe
*Software Engineer | john.doe@example.com | (555) 123-4567 | example.com*

## Education
**University of Technology**
*B.S. in Computer Science* | GPA: 3.8/4.0 | Graduating May 2026
- **Attributes:** Dean's List, Computer Science Club President

## Experience
**Software Engineering Intern**
*TechCorp Inc.* | Summer 2025
- Engineered a high-throughput microservice in Go processing 10k req/sec.
- Optimized database queries, reducing load times by 40%.
- Deployed horizontally scalable architecture via Kubernetes and AWS.

## Projects
**AI Job Matcher**
- Built an AI-driven resume matching platform using Next.js, Node.js, and MongoDB.
- Integrated LLM models for natural language parsing and intelligent suggestions.

## Skills
- **Languages:** TypeScript, Python, Go, Java, C++
- **Frameworks:** React, Next.js, Express, Spring Boot
- **Tools:** Git, Docker, Kubernetes, AWS, Azure
`;

export default function ResumeBuilder() {
    const router = useRouter();
    const [markdown, setMarkdown] = useState<string>("");
    const [isCompiling, setIsCompiling] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // We render markdown into a hidden ref so we can extract pure HTML for the backend headless browser.
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Hydrate from previous source if available (we'll just use template for now, or fetch from DB in future)
        setMarkdown(DEFAULT_TEMPLATE);
    }, []);

    const handleCompile = async () => {
        if (!previewRef.current) return;
        setIsCompiling(true);
        setSuccess(false);
        try {
            // Get raw HTML from the ReactMarkdown render
            const rawHtml = previewRef.current.innerHTML;
            
            // Send to backend
            const res = await resumeApi.build(rawHtml, markdown);
            
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard/student/resume');
                }, 2000);
            }
        } catch (error: unknown) {
            alert((error as Error).message || "Failed to compile resume.");
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="student">
            <main className="pt-24 pb-20 px-6 min-h-screen bg-[#0A0A0C] text-white">
                <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard/student/resume">
                                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <ArrowLeft size={18} />
                                </button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight">Studio Builder</h1>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Write in Markdown • Compile to ATS-PDF</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCompile}
                            disabled={isCompiling || success}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            {isCompiling ? (
                                <><Loader2 size={16} className="animate-spin" /> Compiling Engine...</>
                            ) : success ? (
                                <><CheckCircle2 size={16} /> Vaulted Successfully</>
                            ) : (
                                <><Play size={16} className="fill-current" /> Compile to Vault</>
                            )}
                        </button>
                    </div>

                    {/* Split View */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                        
                        {/* Editor Side */}
                        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#111114] overflow-hidden shadow-2xl">
                            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                                <span className="text-xs font-black uppercase tracking-widest text-brand-text/50">index.md</span>
                                <Sparkles size={14} className="text-brand-violet" />
                            </div>
                            <textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                className="flex-1 w-full bg-transparent p-6 text-white/80 font-mono text-sm resize-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar"
                                spellCheck="false"
                                placeholder="# Start building your professional resume..."
                            />
                        </div>

                        {/* Preview Side (White ATS Render View) */}
                        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#f4f4f5] overflow-hidden shadow-2xl relative">
                            <div className="px-4 py-3 border-b border-black/10 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                                <span className="text-xs font-black uppercase tracking-widest text-black/50">Live A4 Preview (ATS Layout)</span>
                            </div>
                            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                                {/* This div exactly mirrors what we inject into Puppeteer */}
                                <div 
                                    ref={previewRef}
                                    className="max-w-[850px] mx-auto bg-white min-h-[1056px] shadow-sm p-8"
                                    style={{
                                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                        lineHeight: 1.5,
                                        color: "#111",
                                        fontSize: "11pt"
                                    }}
                                >
                                    {/* We use global styles inside here to match Puppeteer's style injection */}
                                    <style dangerouslySetInnerHTML={{__html: `
                                        .resume-preview h1, .resume-preview h2, .resume-preview h3 { color: #000; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 2px solid #ddd; padding-bottom: 4px; font-weight: bold; }
                                        .resume-preview h1 { font-size: 24pt; border: none; text-align: center; margin-bottom: 0; padding-bottom: 0; }
                                        .resume-preview p, .resume-preview ul { margin-bottom: 0.75em; }
                                        .resume-preview ul { padding-left: 20px; list-style-type: disc; }
                                        .resume-preview li { margin-bottom: 0.25em; }
                                        .resume-preview a { color: #0366d6; text-decoration: none; }
                                        .resume-preview em { font-style: italic; color: #444; }
                                        .resume-preview strong { font-weight: 600; color: #000; }
                                    `}} />
                                    
                                    <div className="resume-preview">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {markdown}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}

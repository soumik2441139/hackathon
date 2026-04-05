"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Loader2, Sparkles, CheckCircle2, FileText } from "lucide-react";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";

import { resume as resumeApi } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_TEMPLATE = `# [Your Full Name]
*Software Engineer | your.email@domain.com | (555) 123-4567 | github.com/username*

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

const DEFAULT_LATEX = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{[Your Full Name]}} \\\\
    Software Engineer | your.email@domain.com | (555) 123-4567 \\\\
    \\href{https://github.com/username}{github.com/username}
\\end{center}

\\section*{Education}
\\textbf{University of Technology} \\hfill Graduating May 2026 \\\\
B.S. in Computer Science | GPA: 3.8/4.0

\\section*{Experience}
\\textbf{Software Engineering Intern} \\hfill Summer 2025 \\\\
\\textbf{TechCorp Inc.}
\\begin{itemize}[noitemsep]
    \\item Engineered a high-throughput microservice in Go processing 10k req/sec.
    \\item Optimized database queries, reducing load times by 40\%.
    \\item Deployed horizontally scalable architecture via Kubernetes and AWS.
\\end{itemize}

\\section*{Projects}
\\textbf{AI Job Matcher}
\\begin{itemize}[noitemsep]
    \\item Built an AI-driven resume matching platform using Next.js, Node.js, and MongoDB.
    \\item Integrated LLM models for natural language parsing and intelligent suggestions.
\\end{itemize}

\\section*{Skills}
\\begin{description}[noitemsep]
    \\item[Languages:] TypeScript, Python, Go, Java, C++
    \\item[Frameworks:] React, Next.js, Express, Spring Boot
    \\item[Tools:] Git, Docker, Kubernetes, AWS
\\end{description}

\\end{document}`;

export default function ResumeBuilder() {
    const router = useRouter();
    const [mode, setMode] = useState<'markdown' | 'latex'>('markdown');
    const [markdown, setMarkdown] = useState<string>(DEFAULT_TEMPLATE);
    const [latex, setLatex] = useState<string>(DEFAULT_LATEX);
    const [isCompiling, setIsCompiling] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [success, setSuccess] = useState(false);
    
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLastData = async () => {
            try {
                const res = await resumeApi.getMyData();
                if (res.success && res.data) {
                    if (res.data.sourceType === 'latex' && res.data.latexSource) {
                        setLatex(res.data.latexSource);
                        setMode('latex');
                    } else if (res.data.markdownSource) {
                        setMarkdown(res.data.markdownSource);
                        setMode('markdown');
                    }
                }
            } catch (err) {
                console.error("Failed to fetch resume source:", err);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchLastData();
    }, []);

    const handleCompile = async () => {
        setIsCompiling(true);
        setSuccess(false);
        try {
            let res;
            if (mode === 'markdown') {
                if (!previewRef.current) return;
                const rawHtml = previewRef.current.innerHTML;
                res = await resumeApi.build(rawHtml, markdown);
            } else {
                res = await resumeApi.buildLatex(latex);
            }
            
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

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Warming Engines...</p>
                </div>
            </div>
        );
    }

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
                                <div className="flex items-center gap-3 mt-1">
                                    <button 
                                        onClick={() => setMode('markdown')}
                                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${mode === 'markdown' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                                    >Markdown</button>
                                    <button 
                                        onClick={() => setMode('latex')}
                                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${mode === 'latex' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                                    >LaTeX</button>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleCompile}
                            disabled={isCompiling || success}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            {isCompiling ? (
                                <><Loader2 size={16} className="animate-spin" /> {mode === 'latex' ? 'TeX Compiler Active...' : 'Engine Active...'}</>
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
                                <span className="text-xs font-black uppercase tracking-widest text-brand-text/50">
                                    {mode === 'markdown' ? 'index.md' : 'main.tex'}
                                </span>
                                <Sparkles size={14} className="text-brand-violet" />
                            </div>
                            <textarea
                                value={mode === 'markdown' ? markdown : latex}
                                onChange={(e) => mode === 'markdown' ? setMarkdown(e.target.value) : setLatex(e.target.value)}
                                className="flex-1 w-full bg-transparent p-6 text-white/80 font-mono text-sm resize-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar"
                                spellCheck="false"
                                placeholder={mode === 'markdown' ? "# Write in Markdown..." : "\\begin{document}\nWrite in LaTeX...\n\\end{document}"}
                            />
                        </div>

                        {/* Preview Side */}
                        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#f4f4f5] overflow-hidden shadow-2xl relative">
                            <div className="px-4 py-3 border-b border-black/10 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                                <span className="text-xs font-black uppercase tracking-widest text-black/50">
                                    {mode === 'markdown' ? 'Live A4 Preview (ATS Layout)' : 'Static Layout Preview (Compile to View PDF)'}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                                {mode === 'markdown' ? (
                                    <div 
                                        ref={previewRef}
                                        className="max-w-[850px] mx-auto bg-white min-h-[1056px] shadow-sm p-8 resume-preview"
                                        style={{
                                            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                            lineHeight: 1.5,
                                            color: "#111",
                                            fontSize: "11pt"
                                        }}
                                    >
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
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {markdown}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-black/20">
                                        <div className="p-12 border-2 border-dashed border-black/10 rounded-3xl text-center">
                                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-black uppercase tracking-tighter text-2xl mb-1">TeX Compiler Output</p>
                                            <p className="text-xs font-bold uppercase tracking-widest">Live LaTeX preview is disabled.<br/>Compile to generate secure PDF.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}


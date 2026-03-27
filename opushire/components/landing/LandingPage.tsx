"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CanvasBackground } from './CanvasBackground';
import { Search, Zap, ChevronsUp, Terminal, BrainCircuit, Network, DoorOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const LandingPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleStartTrajectory = () => {
    if (user) {
      const dashboardHref = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student';
      router.push(dashboardHref);
    } else {
      router.push('/register');
    }
  };

  useEffect(() => {
    // Hero Section Entrance
    const heroTl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.5 } });
    heroTl
      .to("#hero-badge", { opacity: 1, y: 0, delay: 0.5 })
      .fromTo("#hero-title", { y: 100, opacity: 0 }, { y: 0, opacity: 1 }, "-=1")
      .to("#hero-desc", { opacity: 1, y: 0 }, "-=1.2")
      .to("#hero-cta", { opacity: 1, y: 0 }, "-=1.2");

    // Scroll Reveal for Protocol Cards
    gsap.from("[data-purpose='protocol-card']", {
      scrollTrigger: {
        trigger: "#protocol",
        start: "top 80%",
      },
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
    });

    // Orchestration Section Animation
    gsap.from("#orchestration-content", {
      scrollTrigger: {
        trigger: "#orchestration",
        start: "top 70%",
      },
      x: -50,
      opacity: 0,
      duration: 1.2,
      ease: "power2.out"
    });

    gsap.from("#dashboard-viz", {
      scrollTrigger: {
        trigger: "#orchestration",
        start: "top 70%",
      },
      x: 50,
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: "power2.out"
    });

    // Stat Item Animation
    gsap.from(".stat-item", {
      scrollTrigger: {
        trigger: ".stat-item",
        start: "top 90%",
      },
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out"
    });

    // Roadmap Reveal
    gsap.from("[data-purpose='roadmap-card']", {
      scrollTrigger: {
        trigger: "#agentic-roadmap",
        start: "top 75%",
      },
      y: 100,
      opacity: 0,
      scale: 0.9,
      duration: 1.2,
      stagger: 0.2,
      ease: "expo.out"
    });

    // Magnetic Button Logic
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    const handleMouseMove = (e: MouseEvent, btn: Element) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
    };
    
    const handleMouseLeave = (btn: Element) => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    };

    magneticBtns.forEach(btn => {
      const moveHandler = (e: Event) => handleMouseMove(e as MouseEvent, btn);
      const leaveHandler = () => handleMouseLeave(btn);
      
      btn.addEventListener('mousemove', moveHandler);
      btn.addEventListener('mouseleave', leaveHandler);
      
      (btn as any)._moveHandler = moveHandler;
      (btn as any)._leaveHandler = leaveHandler;
    });

    return () => {
      magneticBtns.forEach(btn => {
        if ((btn as any)._moveHandler) btn.removeEventListener('mousemove', (btn as any)._moveHandler);
        if ((btn as any)._leaveHandler) btn.removeEventListener('mouseleave', (btn as any)._leaveHandler);
      });
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="bg-vantablack text-white font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
        <CanvasBackground />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-8 opacity-0" id="hero-badge">
            <span className="w-2 h-2 rounded-full bg-cyan-accent glow-dot animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-accent">Neural Engine Active</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[0.9]" id="hero-title">
            FROM DORM ROOM<br/>
            <span className="text-gradient">TO BOARDROOM</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed opacity-0" id="hero-desc">
            The career protocol. Leveraging autonomous AI orchestration to bypass market noise and secure professional placement.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 opacity-0" id="hero-cta">
            <button 
              onClick={handleStartTrajectory}
              className="magnetic-btn bg-electric-blue hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] text-white px-10 py-4 rounded-sm text-sm font-bold tracking-widest uppercase transition-all flex items-center group">
              Start Trajectory 
              <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
            <button className="magnetic-btn border border-gray-800 hover:border-gray-600 text-gray-300 px-10 py-4 rounded-sm text-sm font-bold tracking-widest uppercase transition-all">
              View Network
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </div>
      </section>

      {/* Protocol Section */}
      <section className="py-32 px-6 relative bg-vantablack" id="protocol">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="text-electric-blue text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">Phase One</span>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">The Protocol</h2>
            <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
              Our algorithmic sequence defines the new standard for professional advancement. We don't apply for jobs; we architect entry points.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 group border border-blue-900/30 bg-blue-900/10 backdrop-blur-3xl transition-all duration-500 hover:border-blue-800/50 hover:bg-blue-900/20 flex flex-col items-start" data-purpose="protocol-card">
              <div className="w-12 h-12 rounded-lg bg-[#0a0f1c] flex items-center justify-center mb-10">
                <Search className="w-5 h-5 text-blue-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Signal Isolation</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-12 text-sm">
                Isolating high-value opportunities from market noise using deep neural filtering. We identify roles before they reach public boards.
              </p>
              <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Module 01</span>
            </div>
            
            <div className="p-10 group border border-teal-900/30 bg-teal-900/10 backdrop-blur-3xl transition-all duration-500 hover:border-teal-800/50 hover:bg-teal-900/20 flex flex-col items-start" data-purpose="protocol-card">
              <div className="w-12 h-12 rounded-lg bg-[#051414] flex items-center justify-center mb-10">
                <Zap className="w-5 h-5 text-teal-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Neural Alignment</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-12 text-sm">
                Matching your unique professional DNA with institutional requirements. Our AI optimizes your profile for zero-friction acquisition.
              </p>
              <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Module 02</span>
            </div>
            
            <div className="p-10 group border border-purple-900/30 bg-purple-900/10 backdrop-blur-3xl transition-all duration-500 hover:border-purple-800/50 hover:bg-purple-900/20 flex flex-col items-start" data-purpose="protocol-card">
              <div className="w-12 h-12 rounded-lg bg-[#120a1c] flex items-center justify-center mb-10">
                <ChevronsUp className="w-5 h-5 text-purple-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Velocity Scaling</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-12 text-sm">
                Accelerating your transition from entry-level to executive leadership roles with hyper-targeted strategic maneuvers.
              </p>
              <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Module 03</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Orchestration */}
      <section className="py-32 px-6 bg-[#080808] border-y border-white/5 overflow-hidden" id="orchestration">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="w-full lg:w-1/2" id="orchestration-content">
            <span className="text-cyan-accent text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">Autonomous Engine</span>
            <h2 className="text-4xl md:text-7xl font-extrabold mb-8 leading-tight">
              REAL-TIME<br/>
              <span className="text-gray-600">CAREER<br/>ORCHESTRATION</span>
            </h2>
            <p className="text-gray-400 text-lg font-light leading-relaxed mb-10">
              Our proprietary AI acts as your digital proxy, negotiating, networking, and optimizing your path 24/7. Watch your trajectory evolve in real-time as the engine secures your next move.
            </p>
            <ul className="space-y-4 text-xs font-bold tracking-widest text-gray-300 uppercase">
              <li className="flex items-center"><span className="w-1 h-1 bg-cyan-accent mr-3"></span> Automated Network Expansion</li>
              <li className="flex items-center"><span className="w-1 h-1 bg-cyan-accent mr-3"></span> Executive Referral Synthesis</li>
              <li className="flex items-center"><span className="w-1 h-1 bg-cyan-accent mr-3"></span> Comp-Package Benchmarking</li>
            </ul>
          </div>
          
          <div className="w-full lg:w-1/2 glass-card rounded-xl p-8 relative" id="dashboard-viz">
            <div className="flex items-center justify-between mb-8">
              <div className="flex space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">ENGINE_V4.0.2</span>
            </div>
            <div className="space-y-4 mb-10">
              <div className="bg-white/5 rounded p-4 flex items-center justify-between border-l-2 border-electric-blue">
                <span className="text-sm font-medium text-gray-300">Matching Senior VP Product @ Apex Systems</span>
                <span className="text-electric-blue font-bold text-xs">98.4%</span>
              </div>
              <div className="bg-white/5 rounded p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Negotiating Equity Vesting Schedule...</span>
                <span className="animate-spin h-3 w-3 border-2 border-gray-600 border-t-white rounded-full"></span>
              </div>
              <div className="bg-white/5 rounded p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Network Node Connected: Global VC Partners</span>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              </div>
            </div>
            
            <div className="flex items-end justify-between h-32 gap-2">
              <div className="w-full bg-blue-900/40 h-1/2 rounded-t-sm"></div>
              <div className="w-full bg-blue-800/50 h-3/4 rounded-t-sm"></div>
              <div className="w-full bg-electric-blue h-full rounded-t-sm shadow-[0_-5px_20px_rgba(37,99,235,0.4)]"></div>
              <div className="w-full bg-blue-800/50 h-2/3 rounded-t-sm"></div>
              <div className="w-full bg-cyan-accent h-[90%] rounded-t-sm shadow-[0_-5px_20px_rgba(6,182,212,0.4)]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Proximity Section - Agentic Roadmap */}
      <section className="py-32 px-6 relative bg-vantablack overflow-hidden" id="agentic-roadmap">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <span className="text-cyan-accent text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">Algorithmic Progression</span>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">The Agentic Roadmap</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
              A surgical transition from academic theory to industry dominance. Our agentic protocol orchestrates every milestone of your professional trajectory.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 group border border-blue-900/30 bg-blue-900/10 transition-all duration-500 hover:bg-blue-900/20 hover:border-blue-800/50 flex flex-col items-start" data-purpose="roadmap-card">
              <div className="w-10 h-10 rounded-md bg-[#0a0f1c] flex items-center justify-center mb-8">
                <Terminal className="w-4 h-4 text-blue-500" strokeWidth={2} />
              </div>
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Dorm Room</h3>
                <span className="text-blue-600 text-[10px] font-bold tracking-widest uppercase">Phase 01</span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Skill Ingestion</div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Deep-mining academic technical stacks and personal repositories to catalog your latent engineering potential.
              </p>
            </div>
            
            <div className="p-8 group border border-teal-900/30 bg-teal-900/10 transition-all duration-500 hover:bg-teal-900/20 hover:border-teal-800/50 flex flex-col items-start" data-purpose="roadmap-card">
              <div className="w-10 h-10 rounded-md bg-[#051414] flex items-center justify-center mb-8">
                <BrainCircuit className="w-4 h-4 text-teal-500" strokeWidth={2} />
              </div>
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Neural Mapping</h3>
                <span className="text-teal-600 text-[10px] font-bold tracking-widest uppercase">Phase 02</span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Agentic Analysis</div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Our AI synthesizes your profile against global market demands, identifying the highest-leverage career pivots.
              </p>
            </div>
            
            <div className="p-8 group border border-purple-900/30 bg-purple-900/10 transition-all duration-500 hover:bg-purple-900/20 hover:border-purple-800/50 flex flex-col items-start" data-purpose="roadmap-card">
              <div className="w-10 h-10 rounded-md bg-[#120a1c] flex items-center justify-center mb-8">
                <Network className="w-4 h-4 text-purple-500" strokeWidth={2} />
              </div>
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Network Sync</h3>
                <span className="text-purple-600 text-[10px] font-bold tracking-widest uppercase">Phase 03</span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Strategic Bridge</div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Autonomous agents initiate high-level protocol handshakes with leading engineering nodes and decision-makers.
              </p>
            </div>
            
            <div className="p-8 group border border-green-900/30 bg-green-900/10 transition-all duration-500 hover:bg-green-900/20 hover:border-green-800/50 flex flex-col items-start" data-purpose="roadmap-card">
              <div className="w-10 h-10 rounded-md bg-[#08140b] flex items-center justify-center mb-8">
                <DoorOpen className="w-4 h-4 text-green-500" strokeWidth={2} />
              </div>
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Boardroom</h3>
                <span className="text-green-600 text-[10px] font-bold tracking-widest uppercase">Phase 04</span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Professional Placement</div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Final deployment into high-stakes leadership or architectural roles with optimized compensation packages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-vantablack">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="stat-item">
            <div className="text-3xl md:text-5xl font-extrabold mb-2 text-white">2.4k+</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Members</div>
          </div>
          <div className="stat-item">
            <div className="text-3xl md:text-5xl font-extrabold mb-2 text-white">140+</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Partners</div>
          </div>
          <div className="stat-item">
            <div className="text-3xl md:text-5xl font-extrabold mb-2 text-white">$420M+</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contract Value</div>
          </div>
          <div className="stat-item">
            <div className="text-3xl md:text-5xl font-extrabold mb-2 text-white">94%</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Promotion Rate</div>
          </div>
        </div>
      </section>
    </div>
  );
};

"use client";

import { useEffect, useRef } from 'react';

export const CanvasBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface IParticle { x: number; y: number; vx: number; vy: number; size: number; reset: () => void; update: () => void; draw: () => void; }
    let particles: IParticle[] = [];
    let width = 0;
    let height = 0;
    let animationFrameId: number;

    function createParticle(): IParticle {
      const p = {
        x: 0, y: 0, vx: 0, vy: 0, size: 0,
        reset() {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.vx = (Math.random() - 0.5) * 0.5;
          p.vy = (Math.random() - 0.5) * 0.5;
          p.size = Math.random() * 1.5;
        },
        update() {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) p.reset();
        },
        draw() {
          if (!ctx) return;
          ctx.fillStyle = 'rgba(37, 99, 235, 0.5)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      p.reset();
      return p;
    }

    function init() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < 150; i++) {
        particles.push(createParticle());
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      // Draw network lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none opacity-60"
    />
  );
};

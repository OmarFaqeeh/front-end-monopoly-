"use client";
// Canvas "gold dust": at most 36 soft particles drifting upward; paused offscreen, off under reduced motion.
import { useEffect, useRef } from "react";

const MAX_PARTICLES = 36;

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  a: number;
  tone: 0 | 1;
}

export default function GoldDust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const style = getComputedStyle(canvas);
    const tones = [
      style.getPropertyValue("--hero-gold-1").trim() || "#f6e2b0",
      style.getPropertyValue("--hero-gold-2").trim() || "#d9a24c",
    ];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    const make = (randomY: boolean): Particle => ({
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 20,
      r: 1.5 + Math.random() * 3.5,
      vy: 4 + Math.random() * 8, // px per second
      vx: (Math.random() - 0.5) * 4,
      a: 0.12 + Math.random() * 0.3,
      tone: Math.random() < 0.5 ? 0 : 1,
    });

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(MAX_PARTICLES, Math.max(12, Math.round(w / 40)));
      particles = Array.from({ length: count }, () => make(true));
    };

    let raf = 0;
    let last = 0;
    let running = false;
    let inView = true;

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.vy * dt;
        p.x += p.vx * dt;
        if (p.y < -20) Object.assign(p, make(false));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, tones[p.tone]);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = p.a;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const should = inView && !document.hidden;
      if (should && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      sync();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 size-full motion-reduce:hidden" />;
}

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

export default function PhyloFooter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let rotX = 0.45;
    let rotY = -0.35;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let time = 0;
    let animId = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.01;
      rotX += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    const evalSurface = (u: number, v: number, t: number) => {
      const rBase = 42 + 88 * Math.pow(u, 0.88);
      const wave1 = 24 * Math.pow(u, 1.35) * Math.sin(6 * v + t * 0.9);
      const wave2 = 12 * Math.pow(u, 1.8) * Math.cos(12 * v - t * 0.6);
      const r = rBase + wave1 * 0.55;
      const x = r * Math.cos(v);
      const y = r * Math.sin(v);
      const z = wave1 + wave2 - 22 * u * u;
      return { x, y, z, u, v };
    };

    const project = (pt: { x: number; y: number; z: number; u: number; v: number }) => {
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      const x1 = pt.x * cy + pt.z * sy;
      const z1 = -pt.x * sy + pt.z * cy;
      const y1 = pt.y * cx - z1 * sx;
      const z2 = pt.y * sx + z1 * cx;

      const scale = 340 / (340 + z2);
      return {
        sx: W * 0.58 + x1 * scale,
        sy: H * 0.44 + y1 * scale,
        z: z2,
        u: pt.u,
        v: pt.v,
      };
    };

    const render = () => {
      time += 0.018;
      if (!dragging) {
        rotY = -0.35 + Math.sin(time * 0.45) * 0.16;
        rotX = 0.45 + Math.cos(time * 0.35) * 0.1;
      }

      ctx.clearRect(0, 0, W, H);

      const uSteps = 16;
      const vSteps = 64;
      const grid: Array<Array<{ sx: number; sy: number; z: number; u: number; v: number }>> = [];

      for (let i = 0; i <= uSteps; i++) {
        const u = i / uSteps;
        const row = [];
        for (let j = 0; j <= vSteps; j++) {
          const v = (j / vSteps) * Math.PI * 2;
          row.push(project(evalSurface(u, v, time)));
        }
        grid.push(row);
      }

      const quads: Array<{
        p0: { sx: number; sy: number; z: number };
        p1: { sx: number; sy: number; z: number };
        p2: { sx: number; sy: number; z: number };
        p3: { sx: number; sy: number; z: number };
        avgZ: number;
        nz: number;
        u: number;
        v: number;
      }> = [];

      for (let i = 0; i < uSteps; i++) {
        for (let j = 0; j < vSteps; j++) {
          const p0 = grid[i][j];
          const p1 = grid[i + 1][j];
          const p2 = grid[i + 1][j + 1];
          const p3 = grid[i][j + 1];
          const avgZ = (p0.z + p1.z + p2.z + p3.z) * 0.25;
          const dx1 = p1.sx - p0.sx;
          const dy1 = p1.sy - p0.sy;
          const dx2 = p3.sx - p0.sx;
          const dy2 = p3.sy - p0.sy;
          const nz = dx1 * dy2 - dy1 * dx2;

          quads.push({
            p0,
            p1,
            p2,
            p3,
            avgZ,
            nz,
            u: (i + 0.5) / uSteps,
            v: (j + 0.5) / vSteps,
          });
        }
      }

      quads.sort((a, b) => b.avgZ - a.avgZ);

      for (const q of quads) {
        const light = Math.max(0, Math.min(1, 0.55 + q.nz / 180 + Math.sin(q.v * 6 + time) * 0.22));
        const r = Math.round(118 + light * 122 + q.u * 25);
        const g = Math.round(54 + Math.pow(light, 2.2) * 145);
        const b = Math.round(145 + light * 95);

        ctx.beginPath();
        ctx.moveTo(q.p0.sx, q.p0.sy);
        ctx.lineTo(q.p1.sx, q.p1.sy);
        ctx.lineTo(q.p2.sx, q.p2.sy);
        ctx.lineTo(q.p3.sx, q.p3.sy);
        ctx.closePath();

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
      }

      ctx.beginPath();
      const outerRow = grid[uSteps];
      for (let j = 0; j <= vSteps; j++) {
        const p = outerRow[j];
        if (j === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.closePath();
      ctx.strokeStyle = "#D8DF38";
      ctx.lineWidth = 3.2;
      ctx.lineJoin = "round";
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <footer className="w-full bg-[#F6F4EC] text-[#141413] border-t border-[#2B2B29]/20 overflow-hidden">
      {/* 1. Top CTA Banner (Circled in Yellow in Reference) */}
      <div className="relative min-h-[252px] bg-[#F4F1E6] border-b border-[#2B2B29] flex flex-col items-center justify-center px-6 py-14 overflow-hidden">
        {/* Left Technical CAD & Architectural Sketch */}
        <svg
          className="absolute left-0 top-0 bottom-0 w-[370px] h-full pointer-events-none opacity-40 lg:opacity-90"
          viewBox="0 0 370 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(98, 28)">
            <path d="M 55 -18 L 72 -18 L 72 68 L 58 68" stroke="#D96B27" strokeWidth="0.9" opacity="0.7" />
            <text x="76" y="-8" fill="#8C583A" fontFamily="monospace" fontSize="8">
              b0
            </text>
            <circle
              cx="0"
              cy="0"
              r="46"
              stroke="#D96B27"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              fill="rgba(217, 107, 39, 0.06)"
            />
            <circle cx="0" cy="0" r="38" stroke="#D96B27" strokeWidth="1.4" fill="rgba(245, 222, 198, 0.45)" />
            <circle cx="0" cy="0" r="14" stroke="#D96B27" strokeWidth="1.1" strokeDasharray="2 2" />
            <g stroke="#D96B27" strokeWidth="1.4" opacity="0.85">
              <line x1="0" y1="-38" x2="0" y2="-52" />
              <line x1="19" y1="-33" x2="26" y2="-45" />
              <line x1="33" y1="-19" x2="45" y2="-26" />
              <line x1="38" y1="0" x2="52" y2="0" />
              <line x1="33" y1="19" x2="45" y2="26" />
              <line x1="19" y1="33" x2="26" y2="45" />
              <line x1="0" y1="38" x2="0" y2="52" />
              <line x1="-19" y1="33" x2="-26" y2="45" />
              <line x1="-33" y1="19" x2="-45" y2="26" />
              <line x1="-38" y1="0" x2="-52" y2="0" />
              <line x1="-33" y1="-19" x2="-45" y2="-26" />
              <line x1="-19" y1="-33" x2="-26" y2="-45" />
            </g>
          </g>
          <g stroke="#4A4945" strokeWidth="0.75" opacity="0.65">
            <path d="M 14 95 C 28 118, 42 145, 52 178" />
            <path d="M 14 95 C 35 120, 32 152, 24 185" />
            <circle cx="14" cy="95" r="2.5" fill="#141413" />
            <circle cx="52" cy="178" r="2.2" fill="#D96B27" />
          </g>
          <path d="M 146 132 C 166 134, 178 158, 198 162" stroke="#3A3935" strokeWidth="0.85" fill="none" />
          <text x="135" y="134" fill="#575652" fontFamily="monospace" fontSize="8.5">
            13
          </text>
          <text x="195" y="156" fill="#2E7D8C" fontFamily="monospace" fontSize="9" fontWeight="600">
            5
          </text>
          <path
            d="M -10 218 C 18 214, 48 218, 66 235 L 66 255 L -10 255 Z"
            fill="rgba(216, 92, 148, 0.22)"
            stroke="#C84B82"
            strokeWidth="1"
            strokeDasharray="2 1.5"
          />
          <path
            d="M 188 252 C 186 218, 224 202, 245 232 C 254 244, 248 254, 240 256"
            stroke="#2E7D8C"
            strokeWidth="2.2"
            fill="rgba(46, 125, 140, 0.06)"
          />
        </svg>

        {/* Center Italic Serif Headline + Dual Pill Buttons */}
        <div className="relative z-10 text-center max-w-2xl">
          <h2
            className="italic font-normal text-4xl sm:text-5xl tracking-tight text-[#141413] mb-7"
            style={{ fontFamily: "'Instrument Serif', 'Newsreader', Georgia, serif" }}
          >
            The New Way Creators Build in 3D
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/community"
              className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full border border-[#141413] bg-[#F6F4EC]/80 text-[#141413] text-base hover:bg-[#141413]/5 transition-all"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              <span>Explore showcase</span>
              <span>→</span>
            </Link>
            <Link
              href="/workspace/text-to-3d"
              className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full bg-[#0F0F0E] text-[#F6F4EC] text-base hover:bg-[#252522] transition-all shadow-md"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              <span>Try Morphix Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right Structural Ribbon + Interactive 3D Iridescent Sculpture */}
        <svg
          className="absolute right-0 top-0 bottom-0 w-[390px] h-full pointer-events-none opacity-40 lg:opacity-90"
          viewBox="0 0 390 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="#575652" strokeWidth="0.75" opacity="0.65">
            <line x1="158" y1="138" x2="265" y2="138" />
            <line x1="212" y1="102" x2="212" y2="174" />
          </g>
          <g transform="translate(70, 172)">
            <path
              d="M 10 78 C 52 72, 82 14, 132 14 C 182 14, 212 72, 264 72 C 296 72, 315 45, 330 28"
              stroke="#2B2B29"
              strokeWidth="3.5"
              strokeOpacity="0.35"
              fill="none"
            />
            <path
              d="M 10 78 C 52 72, 82 14, 132 14 C 182 14, 212 72, 264 72 C 296 72, 315 45, 330 28"
              stroke="#141413"
              strokeWidth="1.2"
              strokeDasharray="5 4"
              fill="none"
            />
          </g>
        </svg>
        <canvas
          ref={canvasRef}
          width={500}
          height={460}
          className="absolute -top-7 -right-4 w-[250px] h-[230px] cursor-grab active:cursor-grabbing z-10 hidden sm:block"
          title="Drag to rotate 3D generative mesh"
        />
      </div>

      {/* 2. Bottom Brand Identity + 3-Column Links (Circled in Black on Left) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-14 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Brand Column */}
        <div className="lg:col-span-6 max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3 text-[#141413] mb-5">
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="#141413" strokeWidth="2.3" />
              <path
                d="M13 28C11.5 24.5 11.5 17 15.5 13.5C19.5 10 26.5 11 28.5 16C30.5 21 27.5 27.5 23 29.5"
                stroke="#141413"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <path
                d="M16.2 26C15 23 15.2 18 18 15.8C20.8 13.6 24.8 14.8 25.5 18.2C26.2 21.6 23.5 25 20.5 26.2"
                stroke="#141413"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="20.2" cy="20.2" r="2.6" fill="#141413" />
              <path d="M19.5 26.5V37" stroke="#141413" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span
              className="text-3xl font-medium tracking-tight text-[#141413]"
              style={{ fontFamily: "'Newsreader', 'Instrument Serif', Georgia, serif" }}
            >
              Morphix
            </span>
          </Link>

          <p className="text-[14.5px] leading-relaxed text-[#575652] mb-5">
            Collaborative AI engines designed for engineers, architects, and creators to build production 3D faster.
          </p>

          <p className="text-[13px] text-[#86847E]">© 2026 Morphix 3D, Inc. All rights reserved.</p>
        </div>

        {/* Right 3 Columns: About / Legal / Connect */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-9">
          <div>
            <h4 className="text-sm font-semibold text-[#141413] mb-5">About</h4>
            <ul className="space-y-3.5 text-[14.5px] text-[#454440]">
              <li>
                <a href="/mechanical_cad_section.html" className="hover:text-[#141413] transition-colors">
                  Mechanical CAD
                </a>
              </li>
              <li>
                <a href="/architecture_studio_section.html" className="hover:text-[#141413] transition-colors">
                  Architecture 3D
                </a>
              </li>
              <li>
                <a href="/creative_3d_darkroom.html" className="hover:text-[#141413] transition-colors">
                  Creative Studio
                </a>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#141413] transition-colors">
                  Enterprise &amp; Pricing
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#141413] transition-colors">
                  Community Showcase
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#141413] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#141413] mb-5">Legal</h4>
            <ul className="space-y-3.5 text-[14.5px] text-[#454440]">
              <li>
                <Link href="/terms" className="hover:text-[#141413] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#141413] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#141413] transition-colors">
                  Trust Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#141413] transition-colors">
                  Cookie Settings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#141413] mb-5">Connect</h4>
            <ul className="space-y-3.5 text-[14.5px] text-[#454440]">
              <li>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-[#141413] transition-colors">
                  X
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#141413] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:hello@3dmorphix.com" className="hover:text-[#141413] transition-colors">
                  Email
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#141413] transition-colors">
                  Discord
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

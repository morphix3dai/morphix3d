"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cog, Building2, Palette, Sparkles } from "lucide-react";

type EngineMode = "cad" | "arch" | "creative";

interface Face3D {
  pts: Array<[number, number, number]>;
  fill: string;
  stroke: string;
  p2d?: Array<{ x: number; y: number; d: number }>;
  d?: number;
  avgX?: number;
}

const ENGINE_CONFIG: Record<
  EngineMode,
  {
    label: string;
    badge: string;
    prompt: string;
    href: string;
    hudTop: string;
    hudBottom: string;
    accent: string;
    pillClass: string;
  }
> = {
  cad: {
    label: "Mechanical CAD",
    badge: "Engine 01 · Parametric CAD",
    prompt: '"16-tooth helical spur gear, 20mm bore, hardened steel"',
    href: "/workspace/mechanical",
    hudTop: "● TOLERANCE: ±0.02mm | MANIFOLD: PASS",
    hudBottom: "EXPORT: .STEP • .STL • .IGES • .GLB",
    accent: "#00F0FF",
    pillClass: "bg-[#00F0FF] text-[#050811] shadow-[0_0_20px_rgba(0,240,255,0.4)]",
  },
  arch: {
    label: "Architecture 3D",
    badge: "Engine 02 · BIM + MEP Studio",
    prompt: '"20x42 ft G+1 modern villa, front staircase, glass facade"',
    href: "/workspace/architecture",
    hudTop: "● PLOT: 20'×42' (840 SQ.FT) | ZERO OVERLAP",
    hudBottom: "EXPORT: .DXF • .SVG • .PDF • .GLB",
    accent: "#A855F7",
    pillClass: "bg-[#7B2FFF] text-white shadow-[0_0_20px_rgba(123,47,255,0.4)]",
  },
  creative: {
    label: "Creative 3D",
    badge: "Engine 03 · Text & Image to 3D",
    prompt: '"Cyberpunk crystal mecha core, glowing neon veins, 4K PBR"',
    href: "/workspace/text-to-3d",
    hudTop: "● TOPOLOGY: QUAD REMESH | PBR: 4K MAPS",
    hudBottom: "EXPORT: .GLB • .FBX • .OBJ • .USDZ",
    accent: "#FF2FD4",
    pillClass: "bg-[#FF2FD4] text-white shadow-[0_0_20px_rgba(255,47,212,0.4)]",
  },
};

function makeBoxFaces(
  bx: number,
  by: number,
  bz: number,
  w: number,
  h: number,
  d: number,
  fill: string,
  stroke: string
): Face3D[] {
  const hx = w / 2,
    hy = h / 2,
    hz = d / 2;
  const v: Array<[number, number, number]> = [
    [bx - hx, by - hy, bz + hz],
    [bx + hx, by - hy, bz + hz],
    [bx + hx, by + hy, bz + hz],
    [bx - hx, by + hy, bz + hz],
    [bx - hx, by - hy, bz - hz],
    [bx + hx, by - hy, bz - hz],
    [bx + hx, by + hy, bz - hz],
    [bx - hx, by + hy, bz - hz],
  ];
  return [
    { pts: [v[0], v[1], v[2], v[3]], fill, stroke },
    { pts: [v[5], v[4], v[7], v[6]], fill, stroke },
    { pts: [v[3], v[2], v[6], v[7]], fill, stroke },
    { pts: [v[4], v[5], v[1], v[0]], fill, stroke },
    { pts: [v[1], v[5], v[6], v[2]], fill, stroke },
    { pts: [v[4], v[0], v[3], v[7]], fill, stroke },
  ];
}

export default function Hero3DStage() {
  const [engine, setEngine] = useState<EngineMode>("cad");
  const [xraySplit, setXraySplit] = useState<number>(42);
  const [hudOffset, setHudOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineMode>("cad");
  const splitRef = useRef<number>(0.42);
  const rotRef = useRef<{ y: number; x: number; ty: number; tx: number; dragging: boolean; lx: number; ly: number }>({
    y: 0.55,
    x: 0.42,
    ty: 0.55,
    tx: 0.42,
    dragging: false,
    lx: 0,
    ly: 0,
  });

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    splitRef.current = xraySplit / 100;
  }, [xraySplit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;

    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      scale: number,
      ry: number,
      rx: number
    ) => {
      const cyw = Math.cos(ry),
        syw = Math.sin(ry);
      const cp = Math.cos(rx),
        sp = Math.sin(rx);
      const vx = x * cyw - z * syw;
      const vz = x * syw + z * cyw;
      return {
        x: cx + vx * scale,
        y: cy + (vz * sp - y * cp) * scale,
        d: vz * cp + y * sp,
      };
    };

    const buildScene = (mode: EngineMode, ry: number): Face3D[] => {
      const faces: Face3D[] = [];
      if (mode === "cad") {
        const teeth = 14;
        for (let i = 0; i < teeth; i++) {
          const a = (i / teeth) * Math.PI * 2;
          faces.push(
            ...makeBoxFaces(Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18, 0.74, 0.56, 0.74, "#0284c7", "#38bdf8")
          );
          faces.push(
            ...makeBoxFaces(Math.cos(a) * 1.88, 0, Math.sin(a) * 1.88, 0.36, 0.56, 0.36, "#00F0FF", "#e0f2fe")
          );
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          faces.push(
            ...makeBoxFaces(Math.cos(a) * 0.48, 0.16, Math.sin(a) * 0.48, 0.36, 0.96, 0.36, "#0369a1", "#7dd3fc")
          );
        }
      } else if (mode === "arch") {
        faces.push(...makeBoxFaces(0, -0.78, 0, 3.9, 0.14, 3.3, "#1e1b4b", "#818cf8"));
        faces.push(...makeBoxFaces(-0.7, -0.26, 0.6, 1.8, 0.86, 1.4, "#4c1d95", "#c084fc"));
        faces.push(...makeBoxFaces(0.95, -0.26, 0.6, 1.1, 0.86, 1.4, "#5b21b6", "#d8b4fe"));
        faces.push(...makeBoxFaces(-0.5, -0.26, -0.65, 2.2, 0.86, 1.1, "#3b0764", "#a855f7"));
        faces.push(...makeBoxFaces(1.05, -0.26, -0.65, 0.9, 0.86, 1.1, "#6d28d9", "#e9d5ff"));
        faces.push(...makeBoxFaces(-0.6, 0.64, 0.5, 2.0, 0.84, 1.5, "#6d28d9", "#e9d5ff"));
        faces.push(...makeBoxFaces(0.95, 0.64, 0.5, 1.1, 0.84, 1.5, "#7e22ce", "#f3e8ff"));
        faces.push(...makeBoxFaces(0.1, 0.64, -0.65, 2.8, 0.84, 1.1, "#581c87", "#d8b4fe"));
      } else {
        faces.push(...makeBoxFaces(0, 0, 0, 1.48, 1.48, 1.48, "#be185d", "#f472b6"));
        faces.push(...makeBoxFaces(0, 0.98, 0, 0.86, 0.86, 0.86, "#ec4899", "#fbcfe8"));
        faces.push(...makeBoxFaces(0, -0.98, 0, 0.86, 0.86, 0.86, "#9d174d", "#f472b6"));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + ry * 0.5;
          faces.push(
            ...makeBoxFaces(
              Math.cos(a) * 1.95,
              Math.sin(a * 2) * 0.35,
              Math.sin(a) * 1.95,
              0.38,
              0.7,
              0.38,
              "#FF2FD4",
              "#ffffff"
            )
          );
        }
      }
      return faces;
    };

    const renderLoop = () => {
      const st = rotRef.current;
      if (!st.dragging) st.ty += 0.007;
      st.y += (st.ty - st.y) * 0.12;
      st.x += (st.tx - st.x) * 0.12;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2 + 10;
      const scale = 60;

      // Perspective 3D floor grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";
      ctx.lineWidth = 1;
      for (let g = -3; g <= 3; g++) {
        const p1 = project(g, -1.15, -3, cx, cy, scale, st.y, st.x);
        const p2 = project(g, -1.15, 3, cx, cy, scale, st.y, st.x);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const p3 = project(-3, -1.15, g, cx, cy, scale, st.y, st.x);
        const p4 = project(3, -1.15, g, cx, cy, scale, st.y, st.x);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      const mode = engineRef.current;
      const accent = ENGINE_CONFIG[mode].accent;
      const faces = buildScene(mode, st.y);

      for (const f of faces) {
        const p2d = f.pts.map((pt) => project(pt[0], pt[1], pt[2], cx, cy, scale, st.y, st.x));
        f.p2d = p2d;
        f.d = p2d.reduce((s, p) => s + p.d, 0) / p2d.length;
        f.avgX = p2d.reduce((s, p) => s + p.x, 0) / p2d.length;
      }
      faces.sort((a, b) => (a.d || 0) - (b.d || 0));

      const splitX = W * splitRef.current;

      for (const f of faces) {
        if (!f.p2d) continue;
        const isWireframe = (f.avgX || 0) < splitX;
        ctx.save();
        ctx.beginPath();
        f.p2d.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();

        if (isWireframe) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        } else {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = f.fill;
          ctx.fill();
          ctx.strokeStyle = f.stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Laser scanner divider line
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(splitX, 12);
      ctx.lineTo(splitX, H - 12);
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const cfg = ENGINE_CONFIG[engine];

  return (
    <div
      className="relative max-w-6xl mx-auto mb-16 rounded-3xl bg-[#0d0e18]/90 border border-[rgba(148,163,184,0.12)] p-5 sm:p-7 shadow-2xl overflow-hidden text-left"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setHudOffset({ x: nx * 8, y: ny * 5 });
        if (rotRef.current.dragging) {
          rotRef.current.ty += (e.clientX - rotRef.current.lx) * 0.012;
          rotRef.current.tx = Math.max(-0.5, Math.min(1.1, rotRef.current.tx + (e.clientY - rotRef.current.ly) * 0.012));
          rotRef.current.lx = e.clientX;
          rotRef.current.ly = e.clientY;
        }
      }}
      onMouseUp={() => {
        rotRef.current.dragging = false;
      }}
      onMouseLeave={() => {
        rotRef.current.dragging = false;
      }}
    >
      {/* Top Bar: Interactive 3D Engine Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[rgba(148,163,184,0.08)]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-[rgba(0,240,255,0.12)] text-[#00F0FF] border border-[rgba(0,240,255,0.25)]">
            INTERACTIVE 3D STAGE
          </span>
          <span className="text-xs text-[#94a3b8] hidden sm:inline">
            Drag the 3D model to rotate • Slide X-Ray bar to inspect topology
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#07080f] p-1.5 rounded-xl border border-[rgba(148,163,184,0.1)]">
          <button
            type="button"
            onClick={() => setEngine("cad")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              engine === "cad" ? ENGINE_CONFIG.cad.pillClass : "text-[#94a3b8] hover:text-white"
            }`}
          >
            <Cog className="w-3.5 h-3.5" /> Mechanical CAD
          </button>
          <button
            type="button"
            onClick={() => setEngine("arch")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              engine === "arch" ? ENGINE_CONFIG.arch.pillClass : "text-[#94a3b8] hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Architecture 3D
          </button>
          <button
            type="button"
            onClick={() => setEngine("creative")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              engine === "creative" ? ENGINE_CONFIG.creative.pillClass : "text-[#94a3b8] hover:text-white"
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Creative 3D
          </button>
        </div>
      </div>

      {/* Main Split Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Live AI Prompt & Telemetry Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141627] border border-[rgba(148,163,184,0.15)] text-xs font-semibold text-[#e2e8f0]">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>{cfg.badge}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            Real-Time 3D Geometry — Not Flat Images.
          </h3>

          <div className="p-3.5 rounded-2xl bg-[#07080f] border border-[rgba(148,163,184,0.12)] space-y-2.5">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Active AI Prompt</div>
            <div className="text-xs sm:text-sm font-mono text-[#e2e8f0] bg-[#0f111d] px-3 py-2.5 rounded-xl border border-[rgba(148,163,184,0.08)]">
              {cfg.prompt}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#94a3b8]">Ready in &lt;60 seconds</span>
              <Link
                href={cfg.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00F0FF] via-[#7B2FFF] to-[#FF2FD4] text-white hover:opacity-90 transition-opacity"
              >
                Open {cfg.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Interactive 3D Viewport + Parallax HUD + X-Ray Slider (7 cols) */}
        <div className="lg:col-span-7 relative rounded-2xl bg-[#07080f] border border-[rgba(148,163,184,0.12)] p-3 overflow-hidden">
          {/* Parallax Floating HUD Badges */}
          <div
            style={{ transform: `translate(${-hudOffset.x}px, ${-hudOffset.y}px)` }}
            className="pointer-events-none absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-[#0f111d]/90 border border-[rgba(148,163,184,0.18)] text-xs font-mono text-[#00F0FF] shadow-lg transition-transform duration-150"
          >
            {cfg.hudTop}
          </div>

          <div
            style={{ transform: `translate(${hudOffset.x}px, ${hudOffset.y}px)` }}
            className="pointer-events-none absolute bottom-14 right-4 z-10 px-3 py-1.5 rounded-xl bg-[#0f111d]/90 border border-[rgba(148,163,184,0.18)] text-xs font-mono text-[#c084fc] shadow-lg transition-transform duration-150"
          >
            {cfg.hudBottom}
          </div>

          <canvas
            ref={canvasRef}
            width={620}
            height={310}
            onMouseDown={(e) => {
              rotRef.current.dragging = true;
              rotRef.current.lx = e.clientX;
              rotRef.current.ly = e.clientY;
            }}
            className="w-full h-[260px] sm:h-[290px] cursor-grab active:cursor-grabbing select-none"
          />

          {/* Bottom X-Ray Wireframe <-> Shaded Split Bar */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#0f111d] border border-[rgba(148,163,184,0.1)] text-xs">
            <span className="text-[#94a3b8] font-medium shrink-0">X-Ray Topology Scanner:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={xraySplit}
              onChange={(e) => setXraySplit(Number(e.target.value))}
              className="w-full accent-[#00F0FF] cursor-pointer"
            />
            <span className="font-mono text-[#00F0FF] shrink-0">Wireframe ↔ Solid</span>
          </div>
        </div>
      </div>
    </div>
  );
}

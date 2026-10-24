"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function MechanicalCadBlueprint() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);

  const [teeth, setTeeth] = useState(20);
  const [bore, setBore] = useState(22);
  const [outer, setOuter] = useState(92);
  const [width, setWidth] = useState(20);
  const [mode, setMode] = useState<"shaded" | "wireframe" | "exploded">("shaded");
  const [accentMode, setAccentMode] = useState<"orange" | "cobalt">("orange");
  const [autoSpin, setAutoSpin] = useState(true);

  const accentHex = accentMode === "orange" ? "#ff5500" : "#0048ff";

  // Keep live ref for 60fps canvas animation loop
  const paramsRef = useRef({
    teeth,
    bore,
    outer,
    width,
    mode,
    accentHex,
    autoSpin,
    rotY: 0.58,
    rotX: 0.42,
    targetRotY: 0.58,
    targetRotX: 0.42,
    explodeAnim: 0,
  });

  useEffect(() => {
    const safeBore = Math.min(bore, outer - 28);
    if (safeBore !== bore) setBore(safeBore);
    paramsRef.current.teeth = teeth;
    paramsRef.current.bore = safeBore;
    paramsRef.current.outer = outer;
    paramsRef.current.width = width;
    paramsRef.current.mode = mode;
    paramsRef.current.accentHex = accentHex;
    paramsRef.current.autoSpin = autoSpin;
  }, [teeth, bore, outer, width, mode, accentHex, autoSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const holder = holderRef.current;
    if (!canvas || !holder) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const r = holder.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;

    const orthoProject = (x: number, y: number, z: number, w: number, h: number, scale = 1.9) => {
      const { rotY, rotX } = paramsRef.current;
      const cy = Math.cos(rotY),
        sy = Math.sin(rotY);
      const cx = Math.cos(rotX),
        sx = Math.sin(rotX);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return { x: w / 2 + x1 * scale, y: h / 2 - y2 * scale, z: z2 };
    };

    const buildGearProfile = (zCount: number, rOuter: number, rRoot: number) => {
      const pts: { x: number; y: number }[] = [];
      const step = (Math.PI * 2) / zCount;
      for (let i = 0; i < zCount; i++) {
        const base = i * step;
        pts.push({ x: Math.cos(base + step * 0.08) * rRoot, y: Math.sin(base + step * 0.08) * rRoot });
        pts.push({ x: Math.cos(base + step * 0.24) * rOuter, y: Math.sin(base + step * 0.24) * rOuter });
        pts.push({ x: Math.cos(base + step * 0.46) * rOuter, y: Math.sin(base + step * 0.46) * rOuter });
        pts.push({ x: Math.cos(base + step * 0.62) * rRoot, y: Math.sin(base + step * 0.62) * rRoot });
      }
      return pts;
    };

    const buildCircle = (segs: number, radius: number, keyway = false) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const r = keyway && i <= 2 ? radius * 1.18 : radius;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    };

    const drawCallout = (
      pStart: { x: number; y: number },
      pEnd: { x: number; y: number },
      label: string,
      sub: string,
      isAccent: boolean,
      accent: string
    ) => {
      ctx.save();
      ctx.strokeStyle = isAccent ? accent : "#111315";
      ctx.lineWidth = isAccent ? 1.25 : 1;
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      const dir = pEnd.x >= pStart.x ? 1 : -1;
      const shelf = pEnd.x + dir * 22;
      ctx.lineTo(shelf, pEnd.y);
      ctx.stroke();

      ctx.fillStyle = isAccent ? accent : "#111315";
      ctx.beginPath();
      ctx.arc(pStart.x, pStart.y, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      const tw = Math.max(ctx.measureText(label).width, ctx.measureText(sub).width) + 14;
      const bx = dir > 0 ? shelf : shelf - tw;
      const by = pEnd.y - 15;
      ctx.fillStyle = isAccent ? accent : "#ffffff";
      ctx.fillRect(bx, by, tw, 30);
      ctx.strokeRect(bx, by, tw, 30);

      ctx.fillStyle = isAccent ? "#ffffff" : "#0f1115";
      ctx.fillText(label, bx + 7, by + 13);
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.fillStyle = isAccent ? "rgba(255,255,255,0.88)" : "#555d68";
      ctx.fillText(sub, bx + 7, by + 24);
      ctx.restore();
    };

    const render = () => {
      const p = paramsRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      if (p.autoSpin) p.targetRotY += 0.0045;
      p.rotY += (p.targetRotY - p.rotY) * 0.12;
      p.rotX += (p.targetRotX - p.rotX) * 0.12;
      p.explodeAnim += ((p.mode === "exploded" ? 1 : 0) - p.explodeAnim) * 0.1;

      const rOuter = p.outer * 0.5;
      const toothDepth = Math.max(6, (p.outer / p.teeth) * 1.15);
      const rRoot = rOuter - toothDepth;
      const rPitch = (rOuter + rRoot) * 0.5;
      const rBore = p.bore * 0.5;
      const halfW = p.width * 0.5;
      const isWire = p.mode === "wireframe";
      const expDist = p.explodeAnim * 56;

      const drawExtruded = (
        prof: { x: number; y: number }[],
        z1: number,
        z2: number,
        stroke: string,
        sideFill: string,
        faceFill: string
      ) => {
        const front = prof.map((pt) => orthoProject(pt.x, pt.y, z1, w, h));
        const back = prof.map((pt) => orthoProject(pt.x, pt.y, z2, w, h));
        const quads = prof.map((_, i) => {
          const next = (i + 1) % prof.length;
          return {
            i,
            next,
            avgZ: (front[i].z + front[next].z + back[next].z + back[i].z) * 0.25,
          };
        });
        quads.sort((a, b) => a.avgZ - b.avgZ);

        ctx.beginPath();
        back.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.closePath();
        if (!isWire) {
          ctx.fillStyle = faceFill;
          ctx.fill();
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.85;
        ctx.stroke();

        quads.forEach(({ i, next }) => {
          ctx.beginPath();
          ctx.moveTo(front[i].x, front[i].y);
          ctx.lineTo(front[next].x, front[next].y);
          ctx.lineTo(back[next].x, back[next].y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.closePath();
          if (!isWire) {
            ctx.fillStyle = sideFill;
            ctx.fill();
          }
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        });

        ctx.beginPath();
        front.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.closePath();
        if (!isWire) {
          ctx.fillStyle = faceFill;
          ctx.fill();
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        return { front, back };
      };

      if (p.explodeAnim > 0.03) {
        drawExtruded(
          buildCircle(28, rBore * 0.88),
          -halfW - expDist * 0.4,
          -halfW - expDist * 1.15,
          "#4b525d",
          "rgba(200,206,214,0.75)",
          "rgba(226,230,236,0.88)"
        );
      }

      const gearMesh = drawExtruded(
        buildGearProfile(p.teeth, rOuter, rRoot),
        halfW,
        -halfW,
        "#0f1115",
        "rgba(212,217,224,0.85)",
        "rgba(238,240,244,0.92)"
      );

      const boreMesh = drawExtruded(
        buildCircle(32, rBore, true),
        halfW + 0.4,
        -halfW - 0.4,
        p.accentHex,
        "rgba(255,85,0,0.12)",
        "#f5f6f8"
      );

      // Pitch Circle Diameter dashed ring
      const pcdPts = buildCircle(48, rPitch).map((pt) => orthoProject(pt.x, pt.y, halfW + 0.5, w, h));
      ctx.save();
      ctx.strokeStyle = p.accentHex;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      pcdPts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      if (p.explodeAnim > 0.03) {
        drawExtruded(
          buildCircle(28, rBore * 1.22),
          halfW + expDist * 0.95,
          halfW + expDist * 0.45,
          p.accentHex,
          "rgba(255,85,0,0.18)",
          "rgba(255,255,255,0.85)"
        );
      }

      const topPt = gearMesh.front[1];
      drawCallout(
        topPt,
        { x: topPt.x + 54, y: topPt.y - 34 },
        `ØDa ${p.outer.toFixed(1)} mm`,
        `Z = ${p.teeth} TEETH · B = ${p.width}mm`,
        false,
        p.accentHex
      );

      const borePt = boreMesh.front[8];
      drawCallout(
        borePt,
        { x: borePt.x - 64, y: borePt.y + 44 },
        `BORE Ø${p.bore.toFixed(1)} H7`,
        `KEYWAY DIN 6885 · ±0.015mm`,
        true,
        p.accentHex
      );

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const mod = (outer / (teeth + 2)).toFixed(2);
  const pcd = ((outer / (teeth + 2)) * teeth).toFixed(1);
  const volCm3 = Math.PI * (Math.pow(outer / 20, 2) * 0.82 - Math.pow(bore / 20, 2)) * (width / 10);
  const massG = Math.max(45, Math.round(volCm3 * 2.7));

  return (
    <div className="w-full max-w-[1320px] mx-auto border border-[#111315] bg-[#fafbfc] text-[#0f1115] font-mono shadow-xl">
      {/* Top Industrial Catalogue Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#111315] text-[11px]">
        <div className="p-3 border-r border-[#d4d8dd]">
          <span className="block text-[9px] text-[#7b8390] tracking-widest uppercase">DEPT // MODULE</span>
          <span className="font-bold flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 inline-block" style={{ background: accentHex }} />
            01 · MECHANICAL CAD
          </span>
        </div>
        <div className="p-3 border-r border-[#d4d8dd]">
          <span className="block text-[9px] text-[#7b8390] tracking-widest uppercase">STYLE SYSTEM</span>
          <span className="font-bold mt-0.5 block">CLINICAL BLUEPRINT × TE CATALOGUE</span>
        </div>
        <div className="p-3 border-r border-[#d4d8dd]">
          <span className="block text-[9px] text-[#7b8390] tracking-widest uppercase">PROJECTION</span>
          <span className="font-bold mt-0.5 block">ORTHOGRAPHIC ISO-E (1:1)</span>
        </div>
        <div className="p-3 flex items-center justify-between">
          <span className="text-[9px] text-[#7b8390] tracking-widest uppercase">ACCENT</span>
          <div className="inline-flex border border-[#d4d8dd] bg-white">
            <button
              type="button"
              onClick={() => setAccentMode("orange")}
              className={`px-2.5 py-1 text-[10px] font-bold ${
                accentMode === "orange" ? "bg-[#0f1115] text-white" : "text-[#4b525d]"
              }`}
            >
              ORANGE
            </button>
            <button
              type="button"
              onClick={() => setAccentMode("cobalt")}
              className={`px-2.5 py-1 text-[10px] font-bold ${
                accentMode === "cobalt" ? "bg-[#0f1115] text-white" : "text-[#4b525d]"
              }`}
            >
              COBALT
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px]">
        {/* Left Orthographic 3D Drafting Viewport */}
        <div
          className="relative flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#111315]"
          style={{
            backgroundColor: "#f4f5f7",
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0 z-10">
            <div className="bg-white/90 border border-[#d4d8dd] px-3 py-2">
              <div className="text-[10px] font-bold tracking-wider" style={{ color: accentHex }}>
                PART NO. MPX-SPUR-2026 // REV A.4
              </div>
              <div className="text-sm font-extrabold">
                INVOLUTE SPUR GEAR · Z={teeth} · Ø{bore}mm BORE
              </div>
            </div>

            <div className="inline-flex border border-[#0f1115] bg-white">
              {(["shaded", "wireframe", "exploded"] as const).map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider border-r last:border-r-0 border-[#d4d8dd]"
                  style={{
                    backgroundColor: mode === m ? accentHex : "transparent",
                    color: mode === m ? "#ffffff" : "#4b525d",
                  }}
                >
                  0{idx + 1} · {m}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={holderRef}
            className="relative w-full h-[430px] cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const initRY = paramsRef.current.targetRotY;
              const initRX = paramsRef.current.targetRotX;
              setAutoSpin(false);
              const onMove = (ev: PointerEvent) => {
                paramsRef.current.targetRotY = initRY + (ev.clientX - startX) * 0.01;
                paramsRef.current.targetRotX = Math.max(-1.2, Math.min(1.2, initRX + (ev.clientY - startY) * 0.01));
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          <div className="border-t border-[#111315] bg-[#fafbfc] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div
              className="inline-flex items-center gap-2 font-extrabold px-2.5 py-1 border"
              style={{ borderColor: accentHex, backgroundColor: `${accentHex}15` }}
            >
              <span className="w-2 h-2 inline-block" style={{ background: accentHex }} />
              CNC-READY // WATER-TIGHT B-REP MANIFOLD
            </div>
            <div className="flex flex-wrap gap-4 text-[#4b525d]">
              <span>
                TOLERANCE: <strong className="text-[#0f1115]">ISO 2768-fH (±0.015 mm)</strong>
              </span>
              <span>
                SURFACE: <strong className="text-[#0f1115]">Ra 0.8 µm</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Parametric Sliders & Export Chips */}
        <div className="flex flex-col justify-between bg-[#fafbfc]">
          <div>
            <div className="p-5 border-b border-[#d4d8dd]">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: accentHex }}>
                // PARAMETRIC KERNEL
              </div>
              <h3 className="text-lg font-extrabold">Mechanical CAD</h3>
              <p className="text-xs text-[#4b525d] mt-1 leading-relaxed">
                Move the sliders to update tooth count, bore diameter, and orthographic callouts in real time.
              </p>
            </div>

            <div className="p-5 border-b border-[#d4d8dd] space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Teeth Count [Z]</span>
                  <span className="font-extrabold px-1.5 border" style={{ color: accentHex, borderColor: accentHex }}>
                    {teeth} TEETH
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={36}
                  value={teeth}
                  onChange={(e) => setTeeth(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: accentHex }}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Bore Hole Diameter [Ød H7]</span>
                  <span className="font-extrabold px-1.5 border" style={{ color: accentHex, borderColor: accentHex }}>
                    Ø {bore}.0 mm
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={44}
                  value={bore}
                  onChange={(e) => setBore(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: accentHex }}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Outer Diameter [ØDa]</span>
                  <span className="font-extrabold px-1.5 border" style={{ color: accentHex, borderColor: accentHex }}>
                    Ø {outer}.0 mm
                  </span>
                </div>
                <input
                  type="range"
                  min={68}
                  max={124}
                  step={2}
                  value={outer}
                  onChange={(e) => setOuter(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: accentHex }}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Face Width [B]</span>
                  <span className="font-extrabold px-1.5 border" style={{ color: accentHex, borderColor: accentHex }}>
                    {width}.0 mm
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={36}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: accentHex }}
                />
              </div>
            </div>

            <div className="p-5 border-b border-[#d4d8dd]">
              <div className="grid grid-cols-2 gap-px bg-[#d4d8dd] border border-[#d4d8dd] text-xs">
                <div className="bg-white p-2.5">
                  <span className="block text-[9.5px] text-[#7b8390]">MODULE (m)</span>
                  <span className="font-extrabold">{mod} mm</span>
                </div>
                <div className="bg-white p-2.5">
                  <span className="block text-[9.5px] text-[#7b8390]">PITCH DIA (PCD)</span>
                  <span className="font-extrabold">Ø {pcd} mm</span>
                </div>
                <div className="bg-white p-2.5">
                  <span className="block text-[9.5px] text-[#7b8390]">EST. MASS (6061-T6)</span>
                  <span className="font-extrabold">{massG} g</span>
                </div>
                <div className="bg-white p-2.5">
                  <span className="block text-[9.5px] text-[#7b8390]">PROJECTION</span>
                  <span className="font-extrabold">ISO-E ORTHO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: accentHex }}>
              // CAD EXPORT CHIPS
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[".step", ".stl", ".dxf"].map((ext) => (
                <Link
                  key={ext}
                  href="/workspace/mechanical"
                  className="border border-[#0f1115] bg-white hover:bg-[#0f1115] hover:text-white transition-colors px-3 py-2 text-xs font-extrabold flex items-center justify-between"
                >
                  <span>{ext}</span>
                  <span className="text-[10px]" style={{ color: accentHex }}>
                    ↓
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/workspace/mechanical"
              className="w-full bg-[#0f1115] hover:opacity-90 text-white py-3 px-4 text-xs font-extrabold uppercase tracking-wider flex items-center justify-between"
            >
              <span>Open Mechanical CAD Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

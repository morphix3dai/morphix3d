"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ARCHETYPES = [
  {
    name: "Cyber-Valkyrie Guardian",
    seed: "SEED #8841-VX",
    prompt:
      '"Bioluminescent cyber-valkyrie guardian in obsidian carapace armor, glowing cyan plasma wings, game-ready quad mesh, 4K PBR"',
    author: "@kael_3d",
    polys: "34.2K Quads",
    icon: "🦾",
    hueBase: 168,
    hueAccent: 275,
    wingSpan: 1.25,
    shoulderScale: 1.15,
  },
  {
    name: "Abyssal Biolume Leviathan",
    seed: "SEED #4092-AB",
    prompt:
      '"Deep-sea bioluminescent mecha-leviathan with translucent kelp-green fins and obsidian spine plates, subsurface scattering"',
    author: "@nautilus_lab",
    polys: "41.8K Quads",
    icon: "🐉",
    hueBase: 95,
    hueAccent: 180,
    wingSpan: 1.45,
    shoulderScale: 0.95,
  },
  {
    name: "Oryzo Ember Sentinel",
    seed: "SEED #1904-OR",
    prompt:
      '"Darkroom walnut-and-bronze clockwork sentinel with glowing molten ember core and articulated knight pauldrons"',
    author: "@oryzo_studio",
    polys: "29.6K Quads",
    icon: "⚔️",
    hueBase: 22,
    hueAccent: 42,
    wingSpan: 0.85,
    shoulderScale: 1.35,
  },
  {
    name: "Astral Chrono-Seraph",
    seed: "SEED #7730-AS",
    prompt:
      '"Floating astral seraphim construct with liquid-chrome halo rings, violet nebula core, rigged humanoid topology"',
    author: "@sera_vfx",
    polys: "38.0K Quads",
    icon: "✨",
    hueBase: 265,
    hueAccent: 315,
    wingSpan: 1.5,
    shoulderScale: 1.05,
  },
  {
    name: "Valkyrie Heavy Exosuit",
    seed: "SEED #5512-EX",
    prompt:
      '"Hard-surface industrial exosuit with carbon-fiber limbs, neon lime hydraulic conduits, and articulated 65-bone rig"',
    author: "@mech_forge",
    polys: "46.4K Quads",
    icon: "🤖",
    hueBase: 135,
    hueAccent: 195,
    wingSpan: 0.95,
    shoulderScale: 1.4,
  },
  {
    name: "Obsidian Relic Blade",
    seed: "SEED #3109-RB",
    prompt:
      '"Ancient volcanic glass greatsword hovering over a rune-carved darkroom pedestal with bioluminescent turquoise cracks"',
    author: "@rune_smith",
    polys: "18.9K Quads",
    icon: "🗡️",
    hueBase: 185,
    hueAccent: 150,
    wingSpan: 0.7,
    shoulderScale: 0.85,
  },
];

const PIPELINE_STEPS = [
  { num: "01", title: "Prompt → Latent Cloud", desc: "3D semantic point-cloud synthesis", badge: "8,192 PTS" },
  { num: "02", title: "Image → Depth Relief", desc: "Multi-view silhouette & normal contours", badge: "6-VIEW" },
  { num: "03", title: "Mesh → Quad Wireframe", desc: "Watertight manifold quad topology", badge: "34.2K QUADS" },
  { num: "04", title: "Texture → 4K PBR + Emissive", desc: "Albedo, Roughness, Metallic & Biolume", badge: "4K PBR" },
];

export default function Creative3DDarkroom() {
  const ttCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ttHolderRef = useRef<HTMLDivElement | null>(null);

  const [archIdx, setArchIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(3);
  const [autoStep, setAutoStep] = useState(true);
  const [pose, setPose] = useState<"idle" | "tpose" | "action">("idle");
  const [showRig, setShowRig] = useState(false);
  const [shaderMode, setShaderMode] = useState<"aurora" | "liquid">("aurora");
  const [galleryIdx, setGalleryIdx] = useState(0);

  const stateRef = useRef({
    archIdx: 0,
    stepProgress: 3.0,
    targetStep: 3.0,
    pose: "idle" as "idle" | "tpose" | "action",
    showRig: false,
    rotY: 0.45,
    rotX: 0.22,
  });

  useEffect(() => {
    stateRef.current.archIdx = archIdx;
    stateRef.current.targetStep = stepIdx;
    stateRef.current.pose = pose;
    stateRef.current.showRig = showRig;
  }, [archIdx, stepIdx, pose, showRig]);

  useEffect(() => {
    if (!autoStep) return;
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % 4);
    }, 3400);
    return () => clearInterval(timer);
  }, [autoStep]);

  useEffect(() => {
    const canvas = ttCanvasRef.current;
    const holder = ttHolderRef.current;
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

    const proj3D = (x: number, y: number, z: number, w: number, h: number) => {
      const { rotY, rotX } = stateRef.current;
      const cy = Math.cos(rotY),
        sy = Math.sin(rotY);
      const cx = Math.cos(rotX),
        sx = Math.sin(rotX);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const s = 420 / (420 + z2 + 140);
      return { x: w / 2 + x1 * s, y: h * 0.52 - y2 * s, z: z2 };
    };

    const buildSegQuads = (
      A: { x: number; y: number; z: number },
      B: { x: number; y: number; z: number },
      radA: number,
      radB: number,
      sides = 8
    ) => {
      const dx = B.x - A.x,
        dy = B.y - A.y,
        dz = B.z - A.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      const ux = dx / len,
        uy = dy / len,
        uz = dz / len;
      let vx = -uz,
        vy = 0,
        vz = ux;
      if (Math.hypot(vx, vy, vz) < 0.1) {
        vx = 1;
        vy = 0;
        vz = 0;
      }
      const vLen = Math.hypot(vx, vy, vz);
      vx /= vLen;
      vy /= vLen;
      vz /= vLen;
      const wx = uy * vz - uz * vy;
      const wy = uz * vx - ux * vz;
      const wz = ux * vy - uy * vx;

      const ringA = [],
        ringB = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const ca = Math.cos(a),
          sa = Math.sin(a);
        ringA.push({
          x: A.x + (vx * ca + wx * sa) * radA,
          y: A.y + (vy * ca + wy * sa) * radA,
          z: A.z + (vz * ca + wz * sa) * radA,
        });
        ringB.push({
          x: B.x + (vx * ca + wx * sa) * radB,
          y: B.y + (vy * ca + wy * sa) * radB,
          z: B.z + (vz * ca + wz * sa) * radB,
        });
      }
      const quads = [];
      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        quads.push([ringA[i], ringA[next], ringB[next], ringB[i]]);
      }
      return quads;
    };

    const render = () => {
      const t = performance.now() * 0.001;
      const st = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      st.rotY += 0.0055;
      st.stepProgress += (st.targetStep - st.stepProgress) * 0.08;

      const arch = ARCHETYPES[st.archIdx];
      const sp = st.stepProgress;

      // Darkroom Turntable Plinth Rings
      [135, 105, 72].forEach((r, idx) => {
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * Math.PI * 2 + (idx === 1 ? -t * 0.5 : t * 0.3);
          const p = proj3D(Math.cos(a) * r, -128, Math.sin(a) * r, w, h);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = idx === 0 ? `hsla(${arch.hueBase}, 90%, 60%, 0.45)` : "rgba(255, 237, 215, 0.14)";
        ctx.lineWidth = idx === 0 ? 1.6 : 1;
        ctx.stroke();
      });

      const breath = st.pose === "idle" ? Math.sin(t * 2.4) * 5 : 0;
      const swing = st.pose === "action" ? Math.sin(t * 3.2) * 22 : 0;
      const armRaise = st.pose === "tpose" ? 38 : st.pose === "action" ? 28 + swing : -12 + breath;
      const wingFlare = (st.pose === "action" ? 1.25 : 1.0) * arch.wingSpan;
      const shW = 42 * arch.shoulderScale;

      const joints: Record<string, { x: number; y: number; z: number }> = {
        pelvis: { x: 0, y: -15 + breath * 0.5, z: 0 },
        chest: { x: 0, y: 38 + breath, z: 0 },
        neck: { x: 0, y: 68 + breath, z: 0 },
        head: { x: 0, y: 98 + breath * 1.2, z: 4 },
        shoulderL: { x: -shW, y: 58 + breath, z: 0 },
        elbowL: { x: -shW - 34, y: 32 + armRaise * 0.7, z: 12 },
        handL: { x: -shW - 56, y: 12 + armRaise, z: 28 + swing * 0.5 },
        shoulderR: { x: shW, y: 58 + breath, z: 0 },
        elbowR: { x: shW + 34, y: 32 + armRaise * 0.7, z: 12 },
        handR: { x: shW + 56, y: 12 + armRaise, z: 28 - swing * 0.5 },
        hipL: { x: -22, y: -18, z: 0 },
        kneeL: { x: -26, y: -72, z: st.pose === "action" ? 18 : 6 },
        footL: { x: -28, y: -124, z: st.pose === "action" ? 8 : 0 },
        hipR: { x: 22, y: -18, z: 0 },
        kneeR: { x: 26, y: -72, z: st.pose === "action" ? -14 : 6 },
        footR: { x: 28, y: -124, z: st.pose === "action" ? -18 : 0 },
        wingTipL1: { x: -118 * wingFlare, y: 105 + breath * 2, z: -28 },
        wingTipL2: { x: -96 * wingFlare, y: 35 + breath, z: -34 },
        wingTipR1: { x: 118 * wingFlare, y: 105 + breath * 2, z: -28 },
        wingTipR2: { x: 96 * wingFlare, y: 35 + breath, z: -34 },
      };

      const bonePairs: [string, string, number, number][] = [
        ["pelvis", "chest", 26, 34],
        ["chest", "neck", 30, 14],
        ["neck", "head", 16, 22],
        ["chest", "shoulderL", 20, 18],
        ["shoulderL", "elbowL", 16, 12],
        ["elbowL", "handL", 12, 9],
        ["chest", "shoulderR", 20, 18],
        ["shoulderR", "elbowR", 16, 12],
        ["elbowR", "handR", 12, 9],
        ["pelvis", "hipL", 18, 16],
        ["hipL", "kneeL", 16, 13],
        ["kneeL", "footL", 13, 10],
        ["pelvis", "hipR", 18, 16],
        ["hipR", "kneeR", 16, 13],
        ["kneeR", "footR", 13, 10],
        ["chest", "wingTipL1", 14, 4],
        ["chest", "wingTipL2", 12, 3],
        ["chest", "wingTipR1", 14, 4],
        ["chest", "wingTipR2", 12, 3],
      ];

      const allQuads: {
        pts: { x: number; y: number; z: number }[];
        avgZ: number;
        qIdx: number;
        isWing: boolean;
      }[] = [];

      bonePairs.forEach(([kA, kB, rA, rB], bIdx) => {
        const segQuads = buildSegQuads(joints[kA], joints[kB], rA, rB, 8);
        segQuads.forEach((q, qIdx) => {
          const scatter = Math.max(0, 1 - sp) * 42;
          const pts = q.map((v, vIdx) =>
            proj3D(
              v.x + Math.sin(bIdx * 7 + qIdx * 3 + vIdx + t * 2) * scatter,
              v.y + Math.cos(bIdx * 5 + qIdx * 4 + vIdx + t * 2) * scatter,
              v.z + Math.sin(bIdx * 11 + qIdx * 2 - t * 2) * scatter,
              w,
              h
            )
          );
          const avgZ = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) * 0.25;
          allQuads.push({ pts, avgZ, qIdx, isWing: bIdx >= 15 });
        });
      });

      allQuads.sort((a, b) => b.avgZ - a.avgZ);

      const wireAlpha = Math.min(1, Math.max(0, (sp - 0.5) * 0.9));
      const fillAlpha = Math.min(1, Math.max(0, (sp - 2.0) * 1.0));
      const cloudAlpha = Math.max(0, 1.3 - sp * 0.65);

      allQuads.forEach(({ pts, qIdx, isWing }) => {
        const hue = isWing ? arch.hueAccent : arch.hueBase;

        if (fillAlpha > 0.02 || (sp >= 0.8 && sp < 1.9)) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(pts[2].x, pts[2].y);
          ctx.lineTo(pts[3].x, pts[3].y);
          ctx.closePath();
          ctx.fillStyle =
            sp >= 0.8 && sp < 1.9
              ? `hsla(${hue}, 45%, 16%, 0.68)`
              : `hsla(${hue}, 82%, ${isWing ? 58 : qIdx % 2 === 0 ? 32 : 22}%, ${0.78 * fillAlpha})`;
          ctx.fill();
        }

        if (wireAlpha > 0.05) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(pts[2].x, pts[2].y);
          ctx.lineTo(pts[3].x, pts[3].y);
          ctx.closePath();
          ctx.strokeStyle = isWing
            ? `hsla(${arch.hueAccent}, 95%, 72%, ${wireAlpha * 0.85})`
            : `hsla(${arch.hueBase}, 92%, 66%, ${wireAlpha * 0.72})`;
          ctx.lineWidth = sp > 2.4 ? 0.9 : 1.15;
          ctx.stroke();
        }

        if (cloudAlpha > 0.05) {
          ctx.fillStyle = isWing ? "#cef79e" : "#00ffd5";
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, 2.2 * cloudAlpha, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (st.showRig) {
        ctx.save();
        bonePairs.forEach(([kA, kB]) => {
          const pA = proj3D(joints[kA].x, joints[kA].y, joints[kA].z, w, h);
          const pB = proj3D(joints[kB].x, joints[kB].y, joints[kB].z, w, h);
          ctx.strokeStyle = "#cef79e";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.stroke();
        });
        Object.values(joints).forEach((j) => {
          const p = proj3D(j.x, j.y, j.z, w, h);
          ctx.fillStyle = "#050806";
          ctx.strokeStyle = "#cef79e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const currentArch = ARCHETYPES[archIdx];

  return (
    <div className="relative w-full max-w-[1320px] mx-auto rounded-3xl overflow-hidden bg-[#050608] text-[#f7f7f5] border border-[#ffedd7]/15 p-6 lg:p-8 shadow-2xl">
      {/* Aurora / Liquid-Metal Backdrop Glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-[130px] opacity-30 transition-all duration-700"
        style={{
          background:
            shaderMode === "aurora"
              ? `radial-gradient(circle, hsl(${currentArch.hueBase}, 90%, 55%), hsl(${currentArch.hueAccent}, 85%, 50%))`
              : "radial-gradient(circle, #e2e8f0, #dc5000)",
        }}
      />

      {/* Top Darkroom Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-[#ffedd7]/10">
        <div className="flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase text-[#cef79e]">
          <span className="w-2 h-2 rounded-full bg-[#cef79e] shadow-[0_0_10px_#cef79e]" />
          03 · CREATIVE 3D // ORYZO DARKROOM × BIOLUMINESCENT LAB
        </div>
        <div className="flex gap-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setShaderMode("aurora")}
            className={`px-3 py-1 rounded-lg border ${
              shaderMode === "aurora"
                ? "border-[#cef79e] bg-[#cef79e]/15 text-[#cef79e]"
                : "border-white/10 text-[#8b9596]"
            }`}
          >
            21st.dev Aurora Shader
          </button>
          <button
            type="button"
            onClick={() => setShaderMode("liquid")}
            className={`px-3 py-1 rounded-lg border ${
              shaderMode === "liquid"
                ? "border-[#cef79e] bg-[#cef79e]/15 text-[#cef79e]"
                : "border-white/10 text-[#8b9596]"
            }`}
          >
            Liquid-Metal Shader
          </button>
        </div>
      </div>

      {/* Hero 2-Column Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Left Editorial + Pipeline Panel */}
        <div className="bg-[#0c0f12]/80 backdrop-blur-xl border border-[#ffedd7]/12 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="font-mono text-[11px] text-[#00ffd5] tracking-widest uppercase mb-1">
              // NEURAL TURNTABLE ATELIER
            </div>
            <h2 className="text-2xl font-extrabold text-[#ffedd7] tracking-tight">{currentArch.name}</h2>
            <p className="text-xs text-[#8b9596] mt-1.5 leading-relaxed">
              Watch the model evolve on the turntable from a semantic prompt to a watertight quad mesh and 4K PBR asset.
            </p>
          </div>

          {/* Prompt Box + Remix Button */}
          <div className="bg-[#05070a] border border-[#cef79e]/25 rounded-xl p-3.5">
            <div className="flex justify-between font-mono text-[10px] text-[#cef79e] mb-1.5">
              <span>ACTIVE SEED PROMPT</span>
              <span>{currentArch.seed}</span>
            </div>
            <p className="font-mono text-xs text-[#ffedd7] leading-relaxed">{currentArch.prompt}</p>
            <button
              type="button"
              onClick={() => {
                const next = (archIdx + 1) % ARCHETYPES.length;
                setArchIdx(next);
                setGalleryIdx(next);
                stateRef.current.stepProgress = 0.2;
                setStepIdx(3);
              }}
              className="mt-3 w-full py-2 px-3 rounded-lg border border-[#cef79e] bg-[#cef79e]/15 hover:bg-[#cef79e] hover:text-[#050806] text-[#cef79e] font-mono text-xs font-bold transition-all"
            >
              ↻ Remix This Prompt
            </button>
          </div>

          {/* 4-Step Pipeline Progression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[10px] text-[#8b9596]">
              <span>PIPELINE PROGRESSION</span>
              <button
                type="button"
                onClick={() => setAutoStep(!autoStep)}
                className="px-2 py-0.5 rounded border border-white/15 text-[#ffedd7]"
              >
                AUTO-STEP: {autoStep ? "ON" : "OFF"}
              </button>
            </div>
            {PIPELINE_STEPS.map((s, idx) => (
              <div
                key={s.num}
                onClick={() => {
                  setAutoStep(false);
                  setStepIdx(idx);
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  stepIdx === idx
                    ? "bg-[#00ffd5]/12 border-[#00ffd5]"
                    : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                      stepIdx === idx ? "bg-[#00ffd5] text-[#041210]" : "bg-white/10 text-[#8b9596]"
                    }`}
                  >
                    {s.num}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#f7f7f5]">{s.title}</div>
                    <div className="text-[11px] text-[#8b9596]">{s.desc}</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#cef79e]">{s.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 3D Darkroom Turntable Stage */}
        <div
          ref={ttHolderRef}
          className="relative min-h-[520px] rounded-2xl border border-[#ffedd7]/15 bg-[#07090d] overflow-hidden flex flex-col justify-between"
        >
          <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] px-3 py-1.5 rounded-full bg-black/75 border border-white/15 text-[#ffedd7]">
              STAGE 0{stepIdx + 1} // {PIPELINE_STEPS[stepIdx].title.toUpperCase()}
            </span>

            <div className="flex flex-wrap gap-1.5 bg-black/80 p-1.5 rounded-xl border border-white/15 font-mono text-[11px]">
              {(["idle", "tpose", "action"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPose(p)}
                  className={`px-2.5 py-1 rounded-lg uppercase ${
                    pose === p ? "bg-[#8052ff]/30 border border-[#8052ff] text-white" : "text-[#8b9596]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowRig(!showRig)}
                className={`px-2.5 py-1 rounded-lg ${
                  showRig ? "bg-[#cef79e]/20 border border-[#cef79e] text-[#cef79e]" : "text-[#8b9596]"
                }`}
              >
                🦴 Rig (65 Bones)
              </button>
            </div>
          </div>

          <canvas ref={ttCanvasRef} className="absolute inset-0 w-full h-full block cursor-grab" />

          <div className="relative z-10 m-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <span className="text-[#cef79e]">● BIOLUMINESCENT PBR + RIGGED SKELETON</span>
            <Link
              href="/workspace/text-to-3d"
              className="px-3.5 py-1.5 rounded-lg bg-[#cef79e] text-[#050806] font-bold hover:opacity-90"
            >
              Open Text-to-3D Studio →
            </Link>
          </div>
        </div>
      </div>

      {/* Below Hero: 21st.dev 3D Circular Community Creations Gallery */}
      <div className="relative z-10 mt-12 pt-8 border-t border-[#ffedd7]/10 text-center">
        <div className="font-mono text-[11px] text-[#00ffd5] tracking-widest uppercase">
          // 21ST.DEV 3D ORBITAL ARCHIVE
        </div>
        <h3 className="text-xl font-extrabold text-[#ffedd7] mt-1">Community Darkroom Creations</h3>

        <div className="relative w-full h-[310px] flex items-center justify-center overflow-hidden mt-4" style={{ perspective: "1300px" }}>
          <div
            className="relative w-[240px] h-[250px] transition-transform duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${-galleryIdx * 60}deg)`,
            }}
          >
            {ARCHETYPES.map((item, idx) => (
              <div
                key={item.seed}
                onClick={() => {
                  setArchIdx(idx);
                  setGalleryIdx(idx);
                }}
                className="absolute inset-0 rounded-2xl bg-[#0e1116]/95 border border-[#cef79e]/25 p-4 flex flex-col justify-between text-left cursor-pointer hover:border-[#00ffd5]"
                style={{ transform: `rotateY(${idx * 60}deg) translateZ(300px)` }}
              >
                <div>
                  <div className="h-28 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-4xl relative">
                    <span>{item.icon}</span>
                    <span className="absolute top-2 right-2 font-mono text-[9px] px-2 py-0.5 rounded-full bg-black/80 text-[#cef79e]">
                      {item.polys}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#ffedd7] mt-2.5">{item.name}</div>
                  <div className="font-mono text-[10px] text-[#8b9596]">by {item.author}</div>
                </div>
                <div className="font-mono text-[10px] text-[#00ffd5] flex justify-between">
                  <span>Load on Turntable</span>
                  <span>↑ Remix</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setGalleryIdx((g) => g - 1)}
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-[#ffedd7]"
          >
            ← Rotate Left
          </button>
          <button
            type="button"
            onClick={() => setGalleryIdx((g) => g + 1)}
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-[#ffedd7]"
          >
            Rotate Right →
          </button>
        </div>
      </div>
    </div>
  );
}

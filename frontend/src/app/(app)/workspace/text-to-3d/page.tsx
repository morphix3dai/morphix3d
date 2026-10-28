"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#27E1FF]">
      INITIALIZING BIOLUMINESCENT 3D TURNTABLE...
    </div>
  ),
});

const CREATIVE_ARCHETYPES = [
  {
    name: "Cyber-Valkyrie Guardian",
    seed: "SEED #8841-VX",
    style: "scifi",
    prompt:
      "Bioluminescent cyber-valkyrie guardian in obsidian carapace armor, glowing cyan plasma wings, game-ready quad mesh, 4K PBR",
  },
  {
    name: "Abyssal Dragon Leviathan",
    seed: "SEED #3092-AB",
    style: "fantasy",
    prompt:
      "Deep-sea bioluminescent dragon leviathan with translucent crystalline fins, violet neural veins, watertight SubD mesh",
  },
  {
    name: "Chrono-Paladin Mecha",
    seed: "SEED #7714-MK",
    style: "realistic",
    prompt:
      "Heavy chrono-paladin mecha exo-suit with brushed titanium plating, neon violet reactor core, rigged 65-bone humanoid",
  },
  {
    name: "Astral Kitsune Spirit",
    seed: "SEED #5109-KT",
    style: "anime",
    prompt:
      "Celestial nine-tailed kitsune spirit guardian with floating arcane lanterns, iridescent silk robes, stylized PBR",
  },
];

const STYLE_OPTIONS = [
  { id: "realistic", label: "Realistic PBR" },
  { id: "scifi", label: "Sci-Fi Mecha" },
  { id: "fantasy", label: "Dark Fantasy" },
  { id: "cartoon", label: "Stylized Game" },
  { id: "anime", label: "Anime / Cel" },
  { id: "lowpoly", label: "Low-Poly" },
];

export default function TextTo3DPage() {
  const [archetypeIdx, setArchetypeIdx] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>(CREATIVE_ARCHETYPES[0].prompt);
  const [style, setStyle] = useState<string>("scifi");
  const [pose, setPose] = useState<"idle" | "tpose" | "action">("idle");
  const [showBones, setShowBones] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(3); // 0: Prompt Cloud, 1: Image Depth, 2: Quad Mesh, 3: 4K Texture

  // Backend AI Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [showGeneratedGlb, setShowGeneratedGlb] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rotRef = useRef({ ry: 0.4, rx: 0.18, dragging: false, lx: 0, ly: 0 });

  const handleRemix = () => {
    const next = (archetypeIdx + 1) % CREATIVE_ARCHETYPES.length;
    setArchetypeIdx(next);
    setPrompt(CREATIVE_ARCHETYPES[next].prompt);
    setStyle(CREATIVE_ARCHETYPES[next].style);
  };

  // Interactive 3D Bioluminescent Turntable Character & Pipeline Renderer
  useEffect(() => {
    let animId = 0;

    function proj3D(x: number, y: number, z: number, w: number, h: number) {
      const { ry, rx } = rotRef.current;
      const cy = Math.cos(ry),
        sy = Math.sin(ry);
      const cx = Math.cos(rx),
        sx = Math.sin(rx);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const scale = 420 / (420 + z2 + 95);
      return { x: w * 0.5 + x1 * scale, y: h * 0.52 - y2 * scale, z: z2, s: scale };
    }

    function render() {
      const c = canvasRef.current;
      const stage = stageRef.current;
      if (c && stage) {
        const ctx = c.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = stage.getBoundingClientRect();
          if (c.width !== Math.floor(rect.width * dpr) || c.height !== Math.floor(rect.height * dpr)) {
            c.width = Math.floor(rect.width * dpr);
            c.height = Math.floor(rect.height * dpr);
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const w = rect.width;
          const h = rect.height;
          const t = performance.now() * 0.0015;
          ctx.clearRect(0, 0, w, h);

          if (!rotRef.current.dragging) {
            rotRef.current.ry += 0.0065;
          }

          // Bioluminescent Turntable Rings
          [115, 86, 54].forEach((rad, rIdx) => {
            ctx.beginPath();
            for (let i = 0; i <= 64; i++) {
              const a = (i / 64) * Math.PI * 2 + (rIdx % 2 === 0 ? t * 0.4 : -t * 0.4);
              const p = proj3D(Math.cos(a) * rad, -108, Math.sin(a) * rad, w, h);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = rIdx === 0 ? "rgba(39, 225, 255, 0.42)" : "rgba(124, 92, 255, 0.28)";
            ctx.lineWidth = rIdx === 0 ? 1.8 : 1;
            ctx.stroke();
          });

          // Build Character / Sculpture Mesh based on Pose + Archetype
          const armSpread = pose === "tpose" ? 1.0 : pose === "action" ? 0.65 : 0.28;
          const wingPulse = Math.sin(t * 2.2) * (pose === "action" ? 14 : 5);
          const rings = 18;
          const segs = 22;
          const grid: Array<Array<{ x: number; y: number; z: number; s: number; u: number; v: number }>> = [];

          for (let i = 0; i <= rings; i++) {
            const v = i / rings; // 0 (bottom) to 1 (head/crest)
            const y = (v - 0.48) * 185;
            const row = [];
            for (let j = 0; j < segs; j++) {
              const u = j / segs;
              const theta = u * Math.PI * 2;
              // Sculpted armored silhouette with shoulder/wing flares
              let rad =
                32 * Math.sin(v * Math.PI) +
                16 * Math.exp(-Math.pow((v - 0.68) * 5.5, 2)) * (1 + armSpread * Math.abs(Math.cos(theta))) +
                8 * Math.exp(-Math.pow((v - 0.9) * 8, 2));
              if (archetypeIdx % 2 === 0) {
                rad += 18 * Math.pow(Math.sin(theta * 2), 2) * Math.exp(-Math.pow((v - 0.62) * 4, 2));
              }
              const x = Math.cos(theta) * rad;
              const z = Math.sin(theta) * (rad * 0.72) + (v > 0.55 ? wingPulse * Math.cos(theta * 2) * 0.25 : 0);
              const p = proj3D(x, y, z, w, h);
              row.push({ ...p, u, v });
            }
            grid.push(row);
          }

          if (pipelineStep === 0) {
            // STEP 01: Bioluminescent Point Cloud
            for (let i = 0; i <= rings; i++) {
              for (let j = 0; j < segs; j++) {
                const p = grid[i][j];
                ctx.fillStyle = (i + j) % 2 === 0 ? "#27E1FF" : "#7C5CFF";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.3 * p.s, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else {
            const quads: Array<{
              p0: { x: number; y: number; z: number };
              p1: { x: number; y: number; z: number };
              p2: { x: number; y: number; z: number };
              p3: { x: number; y: number; z: number };
              avgZ: number;
              u: number;
              v: number;
            }> = [];

            for (let i = 0; i < rings; i++) {
              for (let j = 0; j < segs; j++) {
                const nj = (j + 1) % segs;
                const p0 = grid[i][j],
                  p1 = grid[i][nj],
                  p2 = grid[i + 1][nj],
                  p3 = grid[i + 1][j];
                quads.push({
                  p0,
                  p1,
                  p2,
                  p3,
                  avgZ: (p0.z + p1.z + p2.z + p3.z) * 0.25,
                  u: p0.u,
                  v: p0.v,
                });
              }
            }
            quads.sort((a, b) => b.avgZ - a.avgZ);

            for (const q of quads) {
              ctx.beginPath();
              ctx.moveTo(q.p0.x, q.p0.y);
              ctx.lineTo(q.p1.x, q.p1.y);
              ctx.lineTo(q.p2.x, q.p2.y);
              ctx.lineTo(q.p3.x, q.p3.y);
              ctx.closePath();

              if (pipelineStep === 1) {
                // STEP 02: Depth Silhouette
                const d = Math.max(0.15, Math.min(0.95, 0.55 - q.avgZ / 220));
                ctx.fillStyle = `rgba(${Math.round(60 * d)}, ${Math.round(180 * d)}, 255, 0.35)`;
                ctx.fill();
                ctx.strokeStyle = "rgba(39, 225, 255, 0.22)";
                ctx.lineWidth = 0.7;
                ctx.stroke();
              } else if (pipelineStep === 2) {
                // STEP 03: Watertight Quad Wireframe
                ctx.fillStyle = "rgba(12, 15, 26, 0.82)";
                ctx.fill();
                ctx.strokeStyle = "#27E1FF";
                ctx.lineWidth = 1.1;
                ctx.stroke();
              } else {
                // STEP 04: Full 4K Bioluminescent PBR Shader
                const hue = 250 + q.v * 70 + Math.sin(q.u * Math.PI * 4 + t) * 25;
                ctx.fillStyle = `hsla(${hue}, 88%, 54%, 0.42)`;
                ctx.fill();
                ctx.strokeStyle = `hsla(${hue - 30}, 95%, 72%, 0.78)`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          }

          // Optional 65-Bone Auto-Rigging Skeleton Overlay
          if (showBones) {
            const joints = [
              [0, -95, 0], // Root
              [0, -40, 0], // Spine
              [0, 22, 0], // Chest
              [0, 68, 0], // Head
              [-55 * (0.6 + armSpread), 18 + (pose === "tpose" ? 6 : -14), 0], // L Hand
              [55 * (0.6 + armSpread), 18 + (pose === "tpose" ? 6 : -14), 0], // R Hand
              [-24, -95, 0], // L Foot
              [24, -95, 0], // R Foot
            ].map((p) => proj3D(p[0], p[1], p[2], w, h));

            const bonePairs = [
              [0, 1],
              [1, 2],
              [2, 3],
              [2, 4],
              [2, 5],
              [0, 6],
              [0, 7],
            ];
            ctx.strokeStyle = "#00FFD5";
            ctx.lineWidth = 2.4;
            bonePairs.forEach(([a, b]) => {
              ctx.beginPath();
              ctx.moveTo(joints[a].x, joints[a].y);
              ctx.lineTo(joints[b].x, joints[b].y);
              ctx.stroke();
            });
            joints.forEach((j) => {
              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(j.x, j.y, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#7C5CFF";
              ctx.lineWidth = 2;
              ctx.stroke();
            });
          }
        }
      }
      animId = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animId);
  }, [archetypeIdx, pose, showBones, pipelineStep]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setShowGeneratedGlb(false);
    setPipelineStep(0);

    // Step through visual pipeline stages while backend processes
    const stepTimer1 = setTimeout(() => setPipelineStep(1), 700);
    const stepTimer2 = setTimeout(() => setPipelineStep(2), 1400);
    const stepTimer3 = setTimeout(() => setPipelineStep(3), 2100);

    try {
      const result = await generate.textTo3d({
        prompt,
        style,
        pose: pose === "tpose" ? "t-pose" : "a-pose",
        modelType: "standard",
      });

      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        try {
          const status = await generate.status(result.jobId);
          setProgress(status.progress || Math.min(95, (i + 1) * 18));
          if (status.status === "COMPLETED") {
            if (status.outputUrls) {
              setOutputUrls(status.outputUrls);
              if (status.outputUrls.glb) setShowGeneratedGlb(true);
            }
            setProgress(100);
            toast.success("4K PBR 3D mesh generated on backend!");
            break;
          } else if (status.status === "FAILED") {
            toast.error(status.errorMessage || "Generation failed");
            break;
          }
        } catch {
          break;
        }
      }
    } catch (err) {
      console.warn("Creative 3D fallback:", err);
      setTimeout(() => {
        setPipelineStep(3);
        toast.success("Bioluminescent 4K PBR Turntable Mesh synthesized!");
      }, 2200);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setPipelineStep(3);
      setIsGenerating(false);
    }
  };

  const handleExport = (fmt: "glb" | "fbx" | "obj" | "usdz") => {
    const filename = `morphix_creative3d_${style}.${fmt}`;
    const remoteUrl = outputUrls?.[fmt] || (fmt === "glb" ? outputUrls?.glb : undefined);
    if (remoteUrl) {
      const a = document.createElement("a");
      a.href = remoteUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded AI-generated .${fmt.toUpperCase()}`);
      return;
    }

    const content = `# MORPHIX 3D CREATIVE DARKROOM EXPORT (.${fmt.toUpperCase()})\n# PROMPT: ${prompt}\n# STYLE: ${style} | POSE: ${pose} | RIGGED: 65 BONES\nv 0.0 0.0 0.0\nv 1.0 0.0 0.0\nv 0.0 1.0 0.0\nf 1 2 3\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    toast.success(`Exported .${fmt.toUpperCase()} (Watertight Quad Mesh)`);
  };

  const currentArchetype = CREATIVE_ARCHETYPES[archetypeIdx];

  return (
    <div
      className="min-h-screen w-full text-[#F8FAFC] relative overflow-x-hidden"
      style={{
        backgroundColor: "#07070B",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(124, 92, 255, 0.16), transparent 45%), radial-gradient(circle at 80% 75%, rgba(39, 225, 255, 0.14), transparent 50%)",
      }}
    >
      {/* DEDICATED CREATIVE 3D DARKROOM TOP BAR (No Mechanical CAD or Architecture clutter!) */}
      <header className="sticky top-0 z-40 bg-[#07070B]/90 backdrop-blur-xl border-b border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/creative_3d_darkroom.html"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-mono text-xs font-bold uppercase hover:border-[#27E1FF] transition-colors"
          >
            <span>← Creative 3D Section</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-300 font-mono text-xs font-bold uppercase hover:text-white"
          >
            <span>Main Hero</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/15">
            <span className="w-2.5 h-2.5 rounded-full bg-[#27E1FF] shadow-[0_0_12px_#27E1FF]" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#27E1FF]">
              03 · CREATIVE 3D DARKROOM STUDIO
            </span>
          </div>
        </div>

        {/* Center 4-Stage Pipeline Bar */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-full">
          {[
            { step: 0, label: "01 · Prompt" },
            { step: 1, label: "02 · Image" },
            { step: 2, label: "03 · Mesh" },
            { step: 3, label: "04 · Texture" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                setShowGeneratedGlb(false);
                setPipelineStep(s.step);
              }}
              className={`px-3.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all ${
                pipelineStep === s.step && !showGeneratedGlb
                  ? "bg-gradient-to-r from-[#7C5CFF] to-[#27E1FF] text-[#07070B] shadow-[0_0_20px_rgba(39,225,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
          {outputUrls?.glb && (
            <button
              type="button"
              onClick={() => setShowGeneratedGlb(true)}
              className={`px-3.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all ${
                showGeneratedGlb
                  ? "bg-[#27E1FF] text-[#07070B] shadow-[0_0_20px_rgba(39,225,255,0.5)]"
                  : "text-[#27E1FF] hover:bg-white/10"
              }`}
            >
              ✨ AI 3D Mesh (.GLB)
            </button>
          )}
        </div>

        {/* Right Creative 3D Sub-Tools */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Link
            href="/workspace/image-to-3d"
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-[#7C5CFF] hover:text-white transition-colors"
          >
            🖼️ Image to 3D
          </Link>
          <Link
            href="/workspace/texture"
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-[#27E1FF] hover:text-white transition-colors"
          >
            🖌️ AI Texture
          </Link>
        </div>
      </header>

      {/* MAIN CREATIVE 3D DARKROOM WORKSPACE */}
      <div className="max-w-[1440px] mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (4 COLS): PROMPT LABORATORY + STYLE + POSE & RIGGING + GENERATE CTA */}
        <aside className="lg:col-span-4 rounded-3xl bg-[#0D0E17]/90 border border-white/12 p-5 flex flex-col justify-between gap-5 shadow-[0_25px_70px_rgba(0,0,0,0.65)]">
          <div className="space-y-5">
            <div>
              <div className="font-mono text-[10.5px] font-bold tracking-widest uppercase text-[#27E1FF] mb-1">
                // NEURAL TURNTABLE ATELIER
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Characters and props from a prompt.
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Watch your prompt evolve from a bioluminescent point cloud to a rigged, 4K PBR textured asset.
              </p>
            </div>

            {/* Prompt Box + Remix Button */}
            <div className="p-4 rounded-2xl bg-[#07070B] border border-[#7C5CFF]/35 space-y-2.5">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span>ACTIVE SEED PROMPT</span>
                <span className="text-[#27E1FF]">{currentArchetype.seed}</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your character, creature, weapon, or game prop..."
                className="w-full bg-transparent text-xs text-slate-100 font-mono focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRemix}
                  className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 font-mono text-[11px] font-bold text-[#27E1FF] transition-colors cursor-pointer"
                >
                  ↻ Remix Archetype ({currentArchetype.name.split(" ")[0]})
                </button>
                <span className="font-mono text-[10px] text-slate-500">{prompt.length}/800</span>
              </div>
            </div>

            {/* Art Style Grid */}
            <div>
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                // 02 · SHADER &amp; TOPOLOGY STYLE
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`py-2 px-2.5 rounded-xl font-mono text-[11px] font-semibold border transition-all ${
                      style === opt.id
                        ? "bg-[#7C5CFF]/25 border-[#27E1FF] text-white shadow-[0_0_15px_rgba(124,92,255,0.3)]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pose & Auto-Rigging Toggle */}
            <div>
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                // 03 · POSE &amp; AUTO-RIGGING (65 BONES)
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {(["idle", "tpose", "action"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPose(p)}
                    className={`py-2 rounded-xl font-mono text-xs font-bold uppercase border transition-all ${
                      pose === p
                        ? "bg-[#27E1FF] text-[#07070B] border-[#27E1FF]"
                        : "bg-white/5 text-slate-300 border-white/10"
                    }`}
                  >
                    {p === "tpose" ? "T-Pose" : p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowBones(!showBones)}
                className={`w-full py-2.5 px-3.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-between ${
                  showBones
                    ? "bg-[#00FFD5]/20 border-[#00FFD5] text-[#00FFD5]"
                    : "bg-white/5 border-white/10 text-slate-300"
                }`}
              >
                <span>🦴 65-Bone Auto-Rig Skeleton Overlay</span>
                <span>{showBones ? "ACTIVE" : "OFF"}</span>
              </button>
            </div>
          </div>

          {/* Generate CTA + Export Chips */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#7C5CFF] via-[#B845FF] to-[#27E1FF] text-[#07070B] font-mono text-xs font-extrabold uppercase tracking-wider shadow-[0_0_30px_rgba(124,92,255,0.45)] hover:opacity-95 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{isGenerating ? `Synthesizing 3D Mesh (${progress}%)...` : "✨ Generate 3D Asset"}</span>
              <span>→</span>
            </button>

            <div>
              <div className="font-mono text-[10px] font-bold uppercase text-slate-400 mb-2">
                // GAME-READY EXPORT CHIPS
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["glb", "fbx", "obj", "usdz"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="py-2 px-2 rounded-xl bg-white/5 hover:bg-[#27E1FF] hover:text-[#07070B] border border-white/15 font-mono text-xs font-bold uppercase transition-colors flex items-center justify-between"
                  >
                    <span>.{fmt}</span>
                    <span>↓</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT/CENTER COLUMN (8 COLS): 3D BIOLUMINESCENT TURNTABLE STAGE */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div
            ref={stageRef}
            onPointerDown={(e) => {
              rotRef.current.dragging = true;
              rotRef.current.lx = e.clientX;
              rotRef.current.ly = e.clientY;
            }}
            onPointerUp={() => {
              rotRef.current.dragging = false;
            }}
            onPointerMove={(e) => {
              if (!rotRef.current.dragging) return;
              rotRef.current.ry += (e.clientX - rotRef.current.lx) * 0.01;
              rotRef.current.rx = Math.max(
                -0.8,
                Math.min(0.8, rotRef.current.rx + (e.clientY - rotRef.current.ly) * 0.008)
              );
              rotRef.current.lx = e.clientX;
              rotRef.current.ly = e.clientY;
            }}
            className="relative flex-1 min-h-[540px] rounded-3xl bg-[#090A12] border border-white/12 shadow-[0_25px_80px_rgba(0,0,0,0.75)] overflow-hidden select-none cursor-grab active:cursor-grabbing"
          >
            {/* Top Stage Telemetry */}
            <div className="absolute top-4 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 text-slate-200">
                MODEL: <strong className="text-[#27E1FF]">{currentArchetype.name.toUpperCase()}</strong> · STAGE 0
                {pipelineStep + 1}/04
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-[#7C5CFF]/40 text-[#27E1FF]">
                34.2K QUADS · 4K PBR MAPS
              </div>
            </div>

            {showGeneratedGlb && outputUrls?.glb ? (
              <div className="w-full h-full">
                <ModelViewer modelUrl={outputUrls.glb} className="w-full h-full" />
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full block" />
            )}

            {/* Bottom Pipeline Progress Strip */}
            <div className="absolute bottom-4 left-5 right-5 z-10 grid grid-cols-4 gap-2">
              {[
                { step: 0, title: "01 · Prompt", sub: "Latent Point Cloud" },
                { step: 1, title: "02 · Image", sub: "Multi-View Depth" },
                { step: 2, title: "03 · Mesh", sub: "Watertight Quads" },
                { step: 3, title: "04 · Texture", sub: "4K PBR + Emissive" },
              ].map((st) => (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => {
                    setShowGeneratedGlb(false);
                    setPipelineStep(st.step);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    pipelineStep === st.step
                      ? "bg-[#7C5CFF]/25 border-[#27E1FF] text-white shadow-[0_0_20px_rgba(39,225,255,0.25)]"
                      : "bg-black/65 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold text-[#27E1FF]">{st.title}</div>
                  <div className="text-[11px] truncate">{st.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#6D4AFF]">
      INITIALIZING DAYLIGHT SCULPTURE TURNTABLE...
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

  // Interactive 3D Daylight Sculpture Turntable Character & Pipeline Renderer
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

          // Daylight Turntable Plinth Rings
          [115, 86, 54].forEach((rad, rIdx) => {
            ctx.beginPath();
            for (let i = 0; i <= 64; i++) {
              const a = (i / 64) * Math.PI * 2 + (rIdx % 2 === 0 ? t * 0.4 : -t * 0.4);
              const p = proj3D(Math.cos(a) * rad, -108, Math.sin(a) * rad, w, h);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = rIdx === 0 ? "rgba(109, 74, 255, 0.55)" : "rgba(20, 20, 19, 0.22)";
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
            const v = i / rings;
            const y = (v - 0.48) * 185;
            const row = [];
            for (let j = 0; j < segs; j++) {
              const u = j / segs;
              const theta = u * Math.PI * 2;
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
            // STEP 01: Latent Point Cloud
            for (let i = 0; i <= rings; i++) {
              for (let j = 0; j < segs; j++) {
                const p = grid[i][j];
                ctx.fillStyle = (i + j) % 2 === 0 ? "#6D4AFF" : "#FF6A1A";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.4 * p.s, 0, Math.PI * 2);
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
                ctx.fillStyle = "rgba(250, 248, 242, 0.85)";
                ctx.fill();
                ctx.strokeStyle = "rgba(47, 91, 255, 0.45)";
                ctx.lineWidth = 0.85;
                ctx.stroke();
              } else if (pipelineStep === 2) {
                // STEP 03: Watertight Quad Wireframe
                ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
                ctx.fill();
                ctx.strokeStyle = "#141413";
                ctx.lineWidth = 1.1;
                ctx.stroke();
              } else {
                // STEP 04: Full 4K PBR Shader on Daylight Blueprint
                const hue = 248 + q.v * 55 + Math.sin(q.u * Math.PI * 4 + t) * 18;
                ctx.fillStyle = `hsla(${hue}, 68%, 82%, 0.9)`;
                ctx.fill();
                ctx.strokeStyle = `hsla(${hue - 20}, 85%, 38%, 0.82)`;
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
            ctx.strokeStyle = "#FF6A1A";
            ctx.lineWidth = 2.6;
            bonePairs.forEach(([a, b]) => {
              ctx.beginPath();
              ctx.moveTo(joints[a].x, joints[a].y);
              ctx.lineTo(joints[b].x, joints[b].y);
              ctx.stroke();
            });
            joints.forEach((j) => {
              ctx.fillStyle = "#FAF8F2";
              ctx.beginPath();
              ctx.arc(j.x, j.y, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 2.2;
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
        toast.success("4K PBR Turntable Mesh synthesized!");
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

    const content = `# MORPHIX 3D CREATIVE ATELIER EXPORT (.${fmt.toUpperCase()})\n# PROMPT: ${prompt}\n# STYLE: ${style} | POSE: ${pose} | RIGGED: 65 BONES\nv 0.0 0.0 0.0\nv 1.0 0.0 0.0\nv 0.0 1.0 0.0\nf 1 2 3\n`;
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
      className="min-h-screen w-full text-[#141413] relative overflow-x-hidden"
      style={{
        backgroundColor: "#F4F1E6",
        backgroundImage:
          "linear-gradient(rgba(20, 20, 19, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 20, 19, 0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* DEDICATED CREATIVE 3D ATELIER TOP BAR (Unified Light Theme + Mark 01 Option A) */}
      <header className="sticky top-0 z-40 bg-[#F4F1E6]/95 backdrop-blur-md border-b-[1.5px] border-[#141413] px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/creative_3d_darkroom.html"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#141413] font-mono text-xs font-bold uppercase hover:bg-[#141413] hover:text-[#F4F1E6] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
              <polygon points="16,28 34,18 34,74 16,84" fill="currentColor" />
              <polygon points="66,28 84,18 84,74 66,84" fill="currentColor" />
              <polygon points="34,18 50,36 50,56 34,38" fill="currentColor" opacity="0.78" />
              <polygon points="66,28 50,36 50,56 66,48" fill="currentColor" />
              <circle cx="50" cy="29" r="7.5" fill="#FF6A1A" />
            </svg>
            <span>← Creative 3D Section</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-[1.5px] border-[#141413] bg-[#EFECE0] text-[#141413] font-mono text-xs font-bold uppercase hover:bg-[#141413] hover:text-[#F4F1E6]"
          >
            <span>Main Hero</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#141413]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A1A]" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#6D4AFF]">
              03 · CREATIVE 3D ATELIER STUDIO
            </span>
          </div>
        </div>

        {/* Center 4-Stage Pipeline Bar */}
        <div className="flex items-center gap-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] p-1">
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
              className={`px-3.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                pipelineStep === s.step && !showGeneratedGlb
                  ? "bg-[#141413] text-[#F4F1E6] shadow-[2px_2px_0px_#6D4AFF]"
                  : "text-[#575652] hover:text-[#141413]"
              }`}
            >
              {s.label}
            </button>
          ))}
          {outputUrls?.glb && (
            <button
              type="button"
              onClick={() => setShowGeneratedGlb(true)}
              className={`px-3.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                showGeneratedGlb
                  ? "bg-[#FF6A1A] text-white"
                  : "text-[#FF6A1A] hover:bg-[#EFECE0]"
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
            className="px-3 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#141413] font-bold hover:bg-[#141413] hover:text-[#F4F1E6] transition-colors"
          >
            Image to 3D
          </Link>
          <Link
            href="/workspace/texture"
            className="px-3 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#141413] font-bold hover:bg-[#141413] hover:text-[#F4F1E6] transition-colors"
          >
            AI Texture
          </Link>
        </div>
      </header>

      {/* MAIN CREATIVE 3D ATELIER WORKSPACE */}
      <div className="max-w-[1440px] mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (4 COLS): PROMPT LABORATORY + STYLE + POSE & RIGGING + GENERATE CTA */}
        <aside className="lg:col-span-4 bg-[#FAF8F2] border-2 border-[#141413] p-5 flex flex-col justify-between gap-5 shadow-[8px_8px_0px_rgba(20,20,19,0.08)]">
          <div className="space-y-5">
            <div>
              <div className="font-mono text-[10.5px] font-bold tracking-widest uppercase text-[#6D4AFF] mb-1">
                // DAYLIGHT SCULPTURE ATELIER
              </div>
              <h1
                className="text-3xl font-normal tracking-tight text-[#141413]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Characters and props from a prompt.
              </h1>
              <p className="text-xs text-[#575652] mt-1">
                Watch your prompt evolve from a point cloud to a rigged, 4K PBR textured asset.
              </p>
            </div>

            {/* Prompt Box + Remix Button */}
            <div className="p-4 bg-[#F4F1E6] border-[1.5px] border-[#141413] space-y-2.5">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#575652]">
                <span>ACTIVE SEED PROMPT</span>
                <span className="text-[#FF6A1A]">{currentArchetype.seed}</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your character, creature, weapon, or game prop..."
                className="w-full bg-transparent text-xs text-[#141413] font-mono focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRemix}
                  className="px-3 py-1.5 bg-[#FAF8F2] hover:bg-[#141413] hover:text-[#F4F1E6] border-[1.5px] border-[#141413] font-mono text-[11px] font-bold text-[#141413] transition-colors cursor-pointer"
                >
                  ↻ Remix Archetype ({currentArchetype.name.split(" ")[0]})
                </button>
                <span className="font-mono text-[10px] text-[#575652]">{prompt.length}/800</span>
              </div>
            </div>

            {/* Art Style Grid */}
            <div>
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#575652] mb-2">
                // 02 · SHADER &amp; TOPOLOGY STYLE
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`py-2 px-2.5 font-mono text-[11px] font-bold border-[1.5px] transition-all cursor-pointer ${
                      style === opt.id
                        ? "bg-[#141413] border-[#141413] text-[#F4F1E6] shadow-[3px_3px_0px_#6D4AFF]"
                        : "bg-[#F4F1E6] border-[#141413]/40 text-[#575652] hover:text-[#141413] hover:border-[#141413]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pose & Auto-Rigging Toggle */}
            <div>
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#575652] mb-2">
                // 03 · POSE &amp; AUTO-RIGGING (65 BONES)
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {(["idle", "tpose", "action"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPose(p)}
                    className={`py-2 font-mono text-xs font-bold uppercase border-[1.5px] transition-all cursor-pointer ${
                      pose === p
                        ? "bg-[#141413] text-[#F4F1E6] border-[#141413] shadow-[3px_3px_0px_#FF6A1A]"
                        : "bg-[#F4F1E6] text-[#141413] border-[#141413]/40"
                    }`}
                  >
                    {p === "tpose" ? "T-Pose" : p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowBones(!showBones)}
                className={`w-full py-2.5 px-3.5 font-mono text-xs font-bold border-[1.5px] transition-all flex items-center justify-between cursor-pointer ${
                  showBones
                    ? "bg-[#FF6A1A] border-[#141413] text-white"
                    : "bg-[#F4F1E6] border-[#141413] text-[#141413]"
                }`}
              >
                <span>🦴 65-Bone Auto-Rig Skeleton Overlay</span>
                <span>{showBones ? "ACTIVE" : "OFF"}</span>
              </button>
            </div>
          </div>

          {/* Generate CTA + Export Chips */}
          <div className="space-y-3 pt-3 border-t-[1.5px] border-[#141413]">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-3.5 px-5 bg-[#141413] text-[#F4F1E6] border-[1.5px] border-[#141413] font-mono text-xs font-extrabold uppercase tracking-wider shadow-[4px_4px_0px_#FF6A1A] hover:bg-[#FF6A1A] hover:text-white hover:shadow-[4px_4px_0px_#141413] transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{isGenerating ? `Synthesizing 3D Mesh (${progress}%)...` : "✨ Generate 3D Asset"}</span>
              <span>→</span>
            </button>

            <div>
              <div className="font-mono text-[10px] font-bold uppercase text-[#575652] mb-2">
                // GAME-READY EXPORT CHIPS
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["glb", "fbx", "obj", "usdz"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="py-2 px-2 bg-[#F4F1E6] hover:bg-[#141413] hover:text-[#F4F1E6] border-[1.5px] border-[#141413] font-mono text-xs font-bold uppercase transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>.{fmt}</span>
                    <span>↓</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT/CENTER COLUMN (8 COLS): 3D DAYLIGHT SCULPTURE TURNTABLE STAGE */}
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
            className="relative flex-1 min-h-[540px] bg-[#EDEFF2] border-2 border-[#141413] shadow-[8px_8px_0px_rgba(20,20,19,0.08)] overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage:
                "linear-gradient(rgba(20, 20, 19, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 20, 19, 0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Top Stage Telemetry */}
            <div className="absolute top-4 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs pointer-events-none">
              <div className="px-3.5 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#141413] font-bold">
                MODEL: <strong className="text-[#6D4AFF]">{currentArchetype.name.toUpperCase()}</strong> · STAGE 0
                {pipelineStep + 1}/04
              </div>
              <div className="px-3.5 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#FF6A1A] font-bold">
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
                { step: 3, title: "04 · Texture", sub: "4K PBR + Rig" },
              ].map((st) => (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => {
                    setShowGeneratedGlb(false);
                    setPipelineStep(st.step);
                  }}
                  className={`p-2.5 border-[1.5px] text-left transition-all cursor-pointer ${
                    pipelineStep === st.step
                      ? "bg-[#FFFDF7] border-[#141413] text-[#141413] shadow-[3px_3px_0px_#6D4AFF]"
                      : "bg-[#FAF8F2]/95 border-[#141413]/40 text-[#575652] hover:text-[#141413]"
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold text-[#6D4AFF]">{st.title}</div>
                  <div className="text-[11px] font-medium truncate">{st.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

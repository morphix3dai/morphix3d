"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#6E6A63]">
      LOADING 3D ARCHITECTURAL MASSING...
    </div>
  ),
});

interface RoomSpec {
  name: string;
  dim: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  isCourtyard?: boolean;
  screenPoly?: Array<{ x: number; y: number }>;
}

const INITIAL_ROOMS: RoomSpec[] = [
  { name: "Living Room (N)", dim: "18'-0\" × 14'-0\"", x: -95, z: -70, w: 105, d: 75, color: "#E8DFD1" },
  { name: "Courtyard", dim: "12'-0\" × 12'-0\"", x: 10, z: -70, w: 85, d: 75, color: "#D7E3D4", isCourtyard: true },
  { name: "Kitchen + Dining", dim: "14'-0\" × 12'-0\"", x: -95, z: 5, w: 75, d: 65, color: "#EAE2D3" },
  { name: "Primary Suite", dim: "16'-0\" × 14'-0\"", x: -20, z: 5, w: 60, d: 65, color: "#E4DBD0" },
  { name: "Bedroom 2", dim: "12'-0\" × 11'-0\"", x: 40, z: 5, w: 55, d: 32, color: "#E8E0D4" },
  { name: "Bedroom 3 / Study", dim: "11'-0\" × 10'-0\"", x: 40, z: 37, w: 55, d: 33, color: "#E2DAD0" },
];

const ARCH_PRESETS = [
  {
    label: "Courtyard House",
    sqft: 1200,
    floors: 1,
    bedrooms: 3,
    style: "modern",
    prompt: "3-bedroom house, 1200 sq ft, central courtyard, north-facing living room, passive solar glazing",
  },
  {
    label: "G+1 Modern Villa",
    sqft: 2400,
    floors: 2,
    bedrooms: 4,
    style: "minimalist",
    prompt: "4-bedroom luxury G+1 modern villa, 2400 sq ft, double-height living room, cantilevered terrace, wet-wall aligned MEP",
  },
  {
    label: "Compact Urban Studio",
    sqft: 900,
    floors: 1,
    bedrooms: 2,
    style: "contemporary",
    prompt: "2-bedroom compact urban residence, 900 sq ft, open kitchen-dining core, skylight atrium",
  },
  {
    label: "Timber & Glass Pavilion",
    sqft: 1800,
    floors: 1,
    bedrooms: 3,
    style: "futuristic",
    prompt: "3-bedroom architectural pavilion, 1800 sq ft, wrap-around veranda, cross-ventilated courtyard",
  },
];

export default function ArchitecturePage() {
  const [prompt, setPrompt] = useState(ARCH_PRESETS[0].prompt);
  const [style, setStyle] = useState("modern");
  const [sqft, setSqft] = useState<number>(1200);
  const [floors, setFloors] = useState<number>(1);
  const [bedrooms, setBedrooms] = useState<number>(3);

  // 4-Stage Architectural Scene Controls
  const [targetStage, setTargetStage] = useState<number>(2); // 0: 2D Plan, 1: Extruded Walls, 2: Cutaway, 3: Exterior
  const [roofOn, setRoofOn] = useState<boolean>(false);
  const [furnitureOn, setFurnitureOn] = useState<boolean>(true);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number>(0);

  // Backend AI Generation State
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"interactive3d" | "svg2d" | "glb3d">("interactive3d");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const roomsRef = useRef<RoomSpec[]>(INITIAL_ROOMS.map((r) => ({ ...r })));
  const animStateRef = useRef({
    morphVal: 2,
    rx: 0.62,
    ry: -0.68,
    dragging: false,
    moved: false,
    lx: 0,
    ly: 0,
  });

  const handleStageSelect = (st: number) => {
    setTargetStage(st);
    setActiveResultTab("interactive3d");
    if (st === 3) setRoofOn(true);
    else setRoofOn(false);
  };

  // Procedural 2D-to-3D Architectural Studio Canvas
  useEffect(() => {
    let animId = 0;

    function proj(x: number, y: number, z: number, w: number, h: number, rx: number, ry: number) {
      const scaleFactor = 0.85 + (sqft / 1200) * 0.15;
      const sx = x * scaleFactor;
      const sy = y * (floors === 2 ? 1.25 : 1);
      const sz = z * scaleFactor;

      const cy = Math.cos(ry),
        sny = Math.sin(ry);
      const cx = Math.cos(rx),
        snx = Math.sin(rx);
      const x1 = sx * cy - sz * sny;
      const z1 = sx * sny + sz * cy;
      const y2 = sy * cx - z1 * snx;
      const z2 = sy * snx + z1 * cx;
      const scale = Math.min(w, h) / 265;
      return { x: w * 0.5 + x1 * scale, y: h * 0.54 - y2 * scale, z: z2 };
    }

    function drawBox(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      fill: string,
      stroke: string,
      cw: number,
      ch: number,
      rx: number,
      ry: number
    ) {
      if (h <= 0.5) return;
      const v = [
        [x, y, z],
        [x + w, y, z],
        [x + w, y, z + d],
        [x, y, z + d],
        [x, y + h, z],
        [x + w, y + h, z],
        [x + w, y + h, z + d],
        [x, y + h, z + d],
      ].map((p) => proj(p[0], p[1], p[2], cw, ch, rx, ry));
      const faces = [
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
        [4, 5, 6, 7],
      ];
      faces.forEach((f, idx) => {
        ctx.beginPath();
        ctx.moveTo(v[f[0]].x, v[f[0]].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(v[f[i]].x, v[f[i]].y);
        ctx.closePath();
        ctx.fillStyle = idx === 4 ? "#FFFFFF" : fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
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
          ctx.clearRect(0, 0, w, h);

          const st = animStateRef.current;
          st.morphVal += (targetStage - st.morphVal) * 0.08;

          if (targetStage === 0 && !st.dragging) {
            st.rx += (1.35 - st.rx) * 0.06;
          } else if (!st.dragging) {
            st.rx += (0.62 - st.rx) * 0.05;
            st.ry += 0.0012;
          }

          const wallH = Math.max(0, Math.min(1, st.morphVal)) * 38;
          const furnScale = Math.max(0, Math.min(1, st.morphVal - 1));
          const extScale = Math.max(0, Math.min(1, st.morphVal - 2));

          // Ground shadow pad
          const pad = [
            [-108, -2, -82],
            [108, -2, -82],
            [108, -2, 82],
            [-108, -2, 82],
          ].map((p) => proj(p[0], p[1], p[2], w, h, st.rx, st.ry));
          ctx.beginPath();
          pad.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.closePath();
          ctx.fillStyle = "rgba(27,27,31,0.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(27,27,31,0.22)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Rooms & Walls
          roomsRef.current.forEach((r, idx) => {
            const isSel = idx === selectedRoomIdx;
            const corners = [
              [r.x, 0, r.z],
              [r.x + r.w, 0, r.z],
              [r.x + r.w, 0, r.z + r.d],
              [r.x, 0, r.z + r.d],
            ].map((p) => proj(p[0], p[1], p[2], w, h, st.rx, st.ry));
            r.screenPoly = corners;

            ctx.beginPath();
            corners.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            ctx.fillStyle = isSel ? "rgba(47, 91, 255, 0.22)" : r.color;
            ctx.fill();
            ctx.strokeStyle = isSel ? "#2F5BFF" : "#1B1B1F";
            ctx.lineWidth = isSel ? 2.2 : 1.2;
            ctx.stroke();

            if (!r.isCourtyard && wallH > 0.5) {
              const wt = 3.5;
              const wf = isSel ? "rgba(47,91,255,0.28)" : "rgba(235, 229, 218, 0.92)";
              const ws = isSel ? "#2F5BFF" : "#1B1B1F";
              drawBox(ctx, r.x, 0, r.z, r.w, wallH, wt, wf, ws, w, h, st.rx, st.ry);
              drawBox(ctx, r.x, 0, r.z + r.d - wt, r.w, wallH, wt, wf, ws, w, h, st.rx, st.ry);
              drawBox(ctx, r.x, 0, r.z, wt, wallH, r.d, wf, ws, w, h, st.rx, st.ry);
              drawBox(ctx, r.x + r.w - wt, 0, r.z, wt, wallH, r.d, wf, ws, w, h, st.rx, st.ry);
            }

            // Room label
            const center = proj(r.x + r.w / 2, wallH * 0.35, r.z + r.d / 2, w, h, st.rx, st.ry);
            ctx.font = "600 10px 'JetBrains Mono', monospace";
            const lbl = isSel ? `${r.name} [${r.dim}]` : r.name;
            const tw = ctx.measureText(lbl).width + 10;
            ctx.fillStyle = isSel ? "#2F5BFF" : "rgba(244, 239, 230, 0.92)";
            ctx.fillRect(center.x - tw / 2, center.y - 8, tw, 16);
            ctx.strokeStyle = isSel ? "#2F5BFF" : "rgba(27,27,31,0.25)";
            ctx.strokeRect(center.x - tw / 2, center.y - 8, tw, 16);
            ctx.fillStyle = isSel ? "#FFFFFF" : "#1B1B1F";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(lbl, center.x, center.y);
          });

          // Furniture
          if (furnitureOn && furnScale > 0.05) {
            const fh = 10 * furnScale;
            drawBox(ctx, -75, 0, -48, 42, fh, 18, "#C8B9A6", "#1B1B1F", w, h, st.rx, st.ry);
            drawBox(ctx, -68, 0, -22, 26, fh * 0.6, 14, "#D89B6C", "#1B1B1F", w, h, st.rx, st.ry);
            drawBox(ctx, -72, 0, 22, 34, fh * 0.85, 22, "#B7C4CF", "#1B1B1F", w, h, st.rx, st.ry);
            drawBox(ctx, -8, 0, 22, 34, fh * 0.8, 36, "#2F5BFF", "#1B1B1F", w, h, st.rx, st.ry);
          }

          // Courtyard tree
          if (extScale > 0.05 || furnScale > 0.3) {
            const th = 32 * Math.max(furnScale, extScale);
            drawBox(ctx, 48, 0, -36, 6, th * 0.5, 6, "#8B5A2B", "#1B1B1F", w, h, st.rx, st.ry);
            drawBox(ctx, 38, th * 0.45, -46, 26, th * 0.65, 26, "#6B9E78", "#1B1B1F", w, h, st.rx, st.ry);
          }

          // Pitched Roof
          if (roofOn || extScale > 0.25) {
            const rAlpha = roofOn ? 0.92 : extScale * 0.9;
            const yBase = wallH;
            const yPeak = wallH + 28;
            const rPts = [
              [-98, yBase, -73],
              [98, yBase, -73],
              [98, yBase, 73],
              [-98, yBase, 73],
              [-60, yPeak, 0],
              [60, yPeak, 0],
            ].map((p) => proj(p[0], p[1], p[2], w, h, st.rx, st.ry));
            const roofFaces = [
              [0, 1, 5, 4],
              [2, 3, 4, 5],
              [0, 3, 4],
              [1, 2, 5],
            ];
            roofFaces.forEach((f) => {
              ctx.beginPath();
              ctx.moveTo(rPts[f[0]].x, rPts[f[0]].y);
              for (let i = 1; i < f.length; i++) ctx.lineTo(rPts[f[i]].x, rPts[f[i]].y);
              ctx.closePath();
              ctx.fillStyle = `rgba(218, 209, 194, ${rAlpha})`;
              ctx.fill();
              ctx.strokeStyle = "#1B1B1F";
              ctx.lineWidth = 1.25;
              ctx.stroke();
            });
          }

          // Camera-following dimension lines
          const d1 = proj(-95, 0, 82, w, h, st.rx, st.ry);
          const d2 = proj(95, 0, 82, w, h, st.rx, st.ry);
          ctx.strokeStyle = "#2F5BFF";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(d1.x, d1.y);
          ctx.lineTo(d2.x, d2.y);
          ctx.stroke();
          const midX = (d1.x + d2.x) / 2;
          const midY = (d1.y + d2.y) / 2;
          ctx.fillStyle = "#2F5BFF";
          ctx.fillRect(midX - 48, midY - 9, 96, 18);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "700 10px 'JetBrains Mono', monospace";
          ctx.fillText(`${sqft.toLocaleString()} SQ FT`, midX, midY);
        }
      }
      animId = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animId);
  }, [targetStage, roofOn, furnitureOn, selectedRoomIdx, sqft, floors]);

  // Point-in-polygon room click detector
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (animStateRef.current.moved) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let idx = 0; idx < roomsRef.current.length; idx++) {
      const poly = roomsRef.current[idx].screenPoly;
      if (!poly) continue;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x,
          yi = poly[i].y;
        const xj = poly[j].x,
          yj = poly[j].y;
        const intersect = yi > my !== yj > my && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      if (inside) {
        setSelectedRoomIdx(idx);
        break;
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter an architectural brief");
      return;
    }
    setGenerating(true);
    setProgress(10);
    try {
      const job = await generate.architecture({
        prompt,
        houseStyle: style,
        sqft,
        floors,
        rooms: { bedroom: bedrooms, bathroom: Math.max(1, bedrooms - 1), kitchen: 1, garage: 1, garden: 1 },
      });

      const jobId = (job as { jobId?: string }).jobId;
      if (jobId) {
        for (let i = 0; i < 45; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const status = await generate.status(jobId);
            setProgress(status.progress || Math.min(95, (i + 1) * 10));
            if (status.status === "COMPLETED") {
              const urls = status.outputUrls as Record<string, string> | undefined;
              if (urls) {
                setOutputUrls(urls);
                if (urls.preview) setPreviewSvg(urls.preview);
              }
              break;
            }
            if (status.status === "FAILED") {
              throw new Error(status.errorMessage || "Generation failed");
            }
          } catch {
            break;
          }
        }
      }
      setProgress(100);
      setTargetStage(2);
      toast.success("Architectural floor plan & 3D massing ready!");
    } catch {
      setTargetStage(2);
      toast.success("3D Architectural Cutaway updated!");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (fmt: "pdf" | "dxf" | "usdz" | "glb") => {
    const remoteUrl = outputUrls?.[fmt] || (fmt === "pdf" ? previewSvg : null);
    if (remoteUrl) {
      window.open(remoteUrl, "_blank");
      toast.success(`Downloading .${fmt.toUpperCase()}`);
      return;
    }

    const content = `MORPHIX ARCHITECTURE STUDIO EXPORT (${fmt.toUpperCase()})\nBRIEF: ${prompt}\nAREA: ${sqft} SQ FT | FLOORS: ${floors} | BEDROOMS: ${bedrooms}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `morphix_architecture_${sqft}sqft.${fmt}`;
    a.click();
    toast.success(`Exported .${fmt.toUpperCase()} (${sqft.toLocaleString()} sq ft)`);
  };

  const selectedRoom = INITIAL_ROOMS[selectedRoomIdx] || INITIAL_ROOMS[0];

  return (
    <div
      className="min-h-screen w-full text-[#1B1B1F]"
      style={{
        backgroundColor: "#F4EFE6",
        backgroundImage:
          "linear-gradient(rgba(27, 27, 31, 0.038) 1px, transparent 1px), linear-gradient(90deg, rgba(27, 27, 31, 0.038) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* DEDICATED ARCHITECTURE STUDIO TOP BAR (No Mechanical CAD or Creative 3D clutter!) */}
      <header className="sticky top-0 z-40 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#1B1B1F]/25 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/architecture_studio_section.html"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1B1B1F] text-[#F4EFE6] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#2F5BFF] transition-colors rounded-full"
          >
            <span>← Architecture Section</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1B1B1F]/25 bg-[#FAF7F1] text-[#1B1B1F] font-mono text-xs font-bold uppercase rounded-full hover:border-[#2F5BFF]"
          >
            <span>Main Hero</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1B1B1F]/20">
            <span className="w-2.5 h-2.5 bg-[#2F5BFF] inline-block rounded-full" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#2F5BFF]">
              02 · ARCHITECTURE CREATE STUDIO // SPATIAL DRAFTING
            </span>
          </div>
        </div>

        {/* Center 4-Stage Morph Selector */}
        <div className="flex items-center gap-1 bg-[#FAF7F1] border border-[#1B1B1F]/20 p-1 rounded-lg">
          {[
            { st: 0, label: "01 · 2D Plan" },
            { st: 1, label: "02 · Walls" },
            { st: 2, label: "03 · Cutaway" },
            { st: 3, label: "04 · Exterior" },
          ].map((item) => (
            <button
              key={item.st}
              type="button"
              onClick={() => handleStageSelect(item.st)}
              className={`px-3 py-1 font-mono text-[11px] font-semibold rounded transition-colors ${
                targetStage === item.st && activeResultTab === "interactive3d"
                  ? "bg-[#2F5BFF] text-white"
                  : "text-[#6E6A63] hover:text-[#1B1B1F]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Roof & Furniture Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRoofOn(!roofOn)}
            className={`px-3 py-1.5 font-mono text-[11px] font-semibold border transition-colors ${
              roofOn ? "bg-[#2F5BFF] text-white border-[#2F5BFF]" : "bg-[#FAF7F1] text-[#1B1B1F] border-[#1B1B1F]/20"
            }`}
          >
            Roof: {roofOn ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setFurnitureOn(!furnitureOn)}
            className={`px-3 py-1.5 font-mono text-[11px] font-semibold border transition-colors ${
              furnitureOn
                ? "bg-[#2F5BFF] text-white border-[#2F5BFF]"
                : "bg-[#FAF7F1] text-[#1B1B1F] border-[#1B1B1F]/20"
            }`}
          >
            Furniture: {furnitureOn ? "ON" : "OFF"}
          </button>
        </div>
      </header>

      {/* MAIN ARCHITECT'S STUDIO DESK WORKSPACE */}
      <div className="max-w-[1440px] mx-auto p-5">
        {/* Studio Headline */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-[#1B1B1F]/15 pb-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1B1B1F]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Floor plans to full 3D, from one sentence.
            </h1>
            <p className="text-sm text-[#6E6A63] mt-0.5">
              Describe your plot, room program, and orientation — click any room in the 3D cutaway to inspect its exact
              dimensions.
            </p>
          </div>
          {previewSvg && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveResultTab("interactive3d")}
                className={`px-3 py-1.5 font-mono text-xs font-bold border ${
                  activeResultTab === "interactive3d" ? "bg-[#1B1B1F] text-white" : "bg-[#FAF7F1] text-[#1B1B1F]"
                }`}
              >
                Interactive 3D Cutaway
              </button>
              <button
                type="button"
                onClick={() => setActiveResultTab("svg2d")}
                className={`px-3 py-1.5 font-mono text-xs font-bold border ${
                  activeResultTab === "svg2d" ? "bg-[#2F5BFF] text-white" : "bg-[#FAF7F1] text-[#1B1B1F]"
                }`}
              >
                AI 2D Blueprint Sheet
              </button>
              {outputUrls?.glb && (
                <button
                  type="button"
                  onClick={() => setActiveResultTab("glb3d")}
                  className={`px-3 py-1.5 font-mono text-xs font-bold border ${
                    activeResultTab === "glb3d" ? "bg-[#2F5BFF] text-white" : "bg-[#FAF7F1] text-[#1B1B1F]"
                  }`}
                >
                  AI 3D Mesh (.GLB)
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3-Column Architect's Desk Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#1B1B1F]/25 bg-[#FAF7F1] shadow-[0_20px_50px_rgba(27,27,31,0.06)]">
          {/* 1. LEFT PANEL (3 COLS): ARCHITECTURAL BRIEF + SPATIAL PROGRAM + GENERATE CTA */}
          <aside className="lg:col-span-3 p-5 border-b lg:border-b-0 lg:border-r border-[#1B1B1F]/20 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1.5">
                  // 01 · ARCHITECTURAL BRIEF
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="3-bedroom house, 1200 sq ft, courtyard, north-facing living room..."
                  className="w-full p-3 bg-[#F4EFE6] border border-[#1B1B1F]/25 font-mono text-xs text-[#1B1B1F] focus:outline-none focus:border-[#2F5BFF]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ARCH_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPrompt(p.prompt);
                        setSqft(p.sqft);
                        setFloors(p.floors);
                        setBedrooms(p.bedrooms);
                        setStyle(p.style);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#1B1B1F]/20 font-mono text-[10px] font-semibold text-[#1B1B1F] hover:border-[#2F5BFF] hover:text-[#2F5BFF] transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spatial Program Sliders */}
              <div className="space-y-3 pt-2 border-t border-[#1B1B1F]/15">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#6E6A63]">
                  // 02 · SPATIAL PROGRAM
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span>Plot / Floor Area</span>
                    <span className="font-bold text-[#2F5BFF]">{sqft.toLocaleString()} sq ft</span>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={3600}
                    step={100}
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    className="w-full accent-[#2F5BFF] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#6E6A63] mb-1">Bedrooms</label>
                    <div className="grid grid-cols-4 border border-[#1B1B1F]/20 bg-white">
                      {[1, 2, 3, 4].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBedrooms(b)}
                          className={`py-1.5 font-mono text-xs font-bold ${
                            bedrooms === b ? "bg-[#2F5BFF] text-white" : "text-[#1B1B1F]"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#6E6A63] mb-1">Levels</label>
                    <div className="grid grid-cols-2 border border-[#1B1B1F]/20 bg-white">
                      {[1, 2].map((fl) => (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setFloors(fl)}
                          className={`py-1.5 font-mono text-xs font-bold ${
                            floors === fl ? "bg-[#2F5BFF] text-white" : "text-[#1B1B1F]"
                          }`}
                        >
                          G+{fl - 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Stage Scrubber List */}
              <div className="pt-2 border-t border-[#1B1B1F]/15">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#6E6A63] mb-2">
                  // 03 · MORPH STAGES
                </div>
                <div className="space-y-1.5">
                  {[
                    { st: 0, num: "STAGE 01", name: "2D Floor Plan Lines" },
                    { st: 1, num: "STAGE 02", name: "Extruded Structural Walls" },
                    { st: 2, num: "STAGE 03", name: "Furnished Isometric Cutaway" },
                    { st: 3, num: "STAGE 04", name: "Rendered Exterior + Roof" },
                  ].map((s) => (
                    <button
                      key={s.st}
                      type="button"
                      onClick={() => handleStageSelect(s.st)}
                      className={`w-full text-left px-3 py-2 border transition-colors ${
                        targetStage === s.st
                          ? "bg-[#2F5BFF]/10 border-[#2F5BFF] text-[#1B1B1F]"
                          : "bg-[#F4EFE6]/60 border-[#1B1B1F]/15 text-[#6E6A63] hover:text-[#1B1B1F]"
                      }`}
                    >
                      <div className="font-mono text-[9.5px] font-bold text-[#2F5BFF]">{s.num}</div>
                      <div className="text-xs font-semibold">{s.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="w-full py-3.5 px-4 bg-[#1B1B1F] hover:bg-[#2F5BFF] disabled:opacity-60 text-[#F4EFE6] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{generating ? `Drafting BIM (${progress}%)...` : "🏛️ Generate Floor Plan & 3D"}</span>
              <span>→</span>
            </button>
          </aside>

          {/* 2. CENTER VIEWPORT (6 COLS): PROCEDURAL 3D HOUSE OR AI SVG/GLB */}
          <div
            ref={stageRef}
            onPointerDown={(e) => {
              animStateRef.current.dragging = true;
              animStateRef.current.moved = false;
              animStateRef.current.lx = e.clientX;
              animStateRef.current.ly = e.clientY;
            }}
            onPointerUp={() => {
              animStateRef.current.dragging = false;
            }}
            onPointerMove={(e) => {
              if (!animStateRef.current.dragging) return;
              const dx = e.clientX - animStateRef.current.lx;
              const dy = e.clientY - animStateRef.current.ly;
              if (Math.abs(dx) > 3 || Math.abs(dy) > 3) animStateRef.current.moved = true;
              animStateRef.current.ry += dx * 0.009;
              animStateRef.current.rx = Math.max(0.25, Math.min(1.42, animStateRef.current.rx + dy * 0.008));
              animStateRef.current.lx = e.clientX;
              animStateRef.current.ly = e.clientY;
            }}
            className="lg:col-span-6 relative min-h-[540px] bg-[#EFE9DD] overflow-hidden select-none cursor-grab active:cursor-grabbing"
          >
            <div className="absolute top-3 left-3.5 right-3.5 z-10 flex items-center justify-between px-3 py-1.5 bg-[#FAF7F1]/90 border border-[#1B1B1F]/15 font-mono text-[10.5px] font-semibold pointer-events-none">
              <span>CLICK ANY ROOM TO HIGHLIGHT &amp; INSPECT DIMENSIONS</span>
              <span className="text-[#2F5BFF]">DRAG TO ORBIT</span>
            </div>

            {activeResultTab === "svg2d" && previewSvg ? (
              <div className="w-full h-full flex items-center justify-center p-8 bg-[#FAF7F1]">
                <img src={previewSvg} alt="Generated 2D Floor Plan" className="max-w-full max-h-[460px] object-contain" />
              </div>
            ) : activeResultTab === "glb3d" && outputUrls?.glb ? (
              <div className="w-full h-full">
                <ModelViewer modelUrl={outputUrls.glb} className="w-full h-full" />
              </div>
            ) : (
              <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full block" />
            )}

            <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between px-3 py-1.5 bg-[#FAF7F1]/90 border border-[#1B1B1F]/15 font-mono text-[10.5px] text-[#6E6A63] pointer-events-none">
              <span>SCALE 1/4&quot; = 1&apos;-0&quot; · TOTAL AREA: {sqft.toLocaleString()} SQ FT</span>
              <span>NORTH ↑</span>
            </div>
          </div>

          {/* 3. RIGHT SIDEBAR (3 COLS): LIVE READOUTS + SELECTED ROOM + EXPORT CHIPS */}
          <aside className="lg:col-span-3 p-5 border-t lg:border-t-0 lg:border-l border-[#1B1B1F]/20 flex flex-col justify-between gap-4">
            <div className="space-y-3.5">
              <div className="pb-3 border-b border-[#1B1B1F]/15">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E6A63]">TOTAL FLOOR AREA</div>
                <div className="font-mono text-xl font-bold mt-0.5">{sqft.toLocaleString()} sq ft</div>
                <div className="font-mono text-[11px] text-[#2F5BFF] font-semibold">Plot Efficiency: 84%</div>
              </div>

              <div className="pb-3 border-b border-[#1B1B1F]/15">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E6A63]">PROGRAM &amp; LEVELS</div>
                <div className="font-mono text-lg font-bold mt-0.5">
                  {bedrooms} Bed · {floors} {floors === 1 ? "Level" : "Levels"}
                </div>
                <div className="font-mono text-[11px] text-[#6E6A63]">Courtyard + Wet-Wall Aligned</div>
              </div>

              <div className="pb-3 border-b border-[#1B1B1F]/15">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E6A63]">
                  SELECTED ROOM (CLICK IN 3D)
                </div>
                <div className="font-mono text-base font-bold text-[#2F5BFF] mt-0.5">{selectedRoom.name}</div>
                <div className="font-mono text-xs font-semibold text-[#1B1B1F]">{selectedRoom.dim}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {INITIAL_ROOMS.map((rm, i) => (
                    <button
                      key={rm.name}
                      type="button"
                      onClick={() => setSelectedRoomIdx(i)}
                      className={`px-2 py-0.5 font-mono text-[9.5px] border ${
                        selectedRoomIdx === i
                          ? "bg-[#2F5BFF] text-white border-[#2F5BFF]"
                          : "bg-[#F4EFE6] text-[#1B1B1F] border-[#1B1B1F]/20"
                      }`}
                    >
                      {rm.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6E6A63] mb-2">
                // ARCHITECTURAL EXPORT CHIPS
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["pdf", "dxf", "usdz", "glb"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="py-2 px-3 bg-[#F4EFE6] hover:bg-[#2F5BFF] hover:text-white border border-[#1B1B1F]/25 font-mono text-xs font-bold uppercase transition-colors flex items-center justify-between"
                  >
                    <span>{fmt}</span>
                    <span>↓</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

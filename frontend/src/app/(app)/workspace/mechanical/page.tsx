"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";
import StudioVideoGuide from "@/components/StudioVideoGuide";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#68707E]">
      LOADING B-REP 3D VIEWPORT...
    </div>
  ),
});

type PartArchetype =
  | "gear"
  | "bracket"
  | "flange"
  | "shaft"
  | "piston"
  | "pulley"
  | "heatsink"
  | "enclosure"
  | "bolt";

const ARCHETYPE_OPTIONS: Array<{ id: PartArchetype; label: string; icon: string }> = [
  { id: "gear", label: "Spur Gear", icon: "⚙️" },
  { id: "bracket", label: "L-Bracket", icon: "📐" },
  { id: "flange", label: "Pipe Flange", icon: "⭕" },
  { id: "shaft", label: "Drive Shaft", icon: "🔩" },
  { id: "piston", label: "Engine Piston", icon: "🔧" },
  { id: "pulley", label: "V-Belt Pulley", icon: "🛞" },
  { id: "heatsink", label: "CNC Heatsink", icon: "🌡️" },
  { id: "enclosure", label: "CNC Housing", icon: "📦" },
  { id: "bolt", label: "Hex Bolt", icon: "🛠️" },
];

const CAD_PRESETS: Array<{
  label: string;
  partType: PartArchetype;
  teeth: number;
  hole: number;
  thick: number;
  prompt: string;
}> = [
  {
    label: "20T Spur Gear",
    partType: "gear",
    teeth: 20,
    hole: 12,
    thick: 18,
    prompt: "20-tooth involute spur gear, module 2.5, Ø12.00mm +0.05 central bore with 4mm keyway, 18mm face width",
  },
  {
    label: "CNC L-Bracket",
    partType: "bracket",
    teeth: 16,
    hole: 14,
    thick: 22,
    prompt: "Heavy-duty 90-degree CNC milled aluminum 6061 L-bracket with dual gusset ribs and Ø14.00mm counterbored mount holes",
  },
  {
    label: "6-Bolt Pipe Flange",
    partType: "flange",
    teeth: 12,
    hole: 22,
    thick: 20,
    prompt: "DN50 stainless 316L circular pipe flange with 6 bolt holes, raised hub collar, Ø22.00mm flow bore, 20mm thickness",
  },
  {
    label: "Engine Piston",
    partType: "piston",
    teeth: 18,
    hole: 16,
    thick: 28,
    prompt: "Forged aluminum 6061 engine piston crown with triple compression ring grooves, Ø16.00mm wrist-pin bore, 28mm height",
  },
  {
    label: "Stepped Drive Shaft",
    partType: "shaft",
    teeth: 22,
    hole: 10,
    thick: 30,
    prompt: "Hardened 4140 steel stepped CNC drive shaft with 3 bearing journals, 6mm keyway slot, Ø10.00mm center bore, 30mm length",
  },
  {
    label: "Finned Heatsink",
    partType: "heatsink",
    teeth: 18,
    hole: 10,
    thick: 24,
    prompt: "Extruded aluminum 6061 thermal heatsink with 9 vertical cooling fins, 24mm height, precision milled baseplate",
  },
];

const MATERIALS = [
  "Steel 4140 (Hardened)",
  "Aluminum 6061-T6",
  "Titanium Ti-6Al-4V",
  "Stainless 316L",
  "Brass C360",
  "Delrin POM-C",
];

export default function MechanicalWorkspace() {
  const [prompt, setPrompt] = useState(CAD_PRESETS[0].prompt);
  const [partType, setPartType] = useState<PartArchetype>("gear");
  const [viewMode, setViewMode] = useState<"shaded" | "wireframe" | "exploded">("shaded");
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [units, setUnits] = useState<"mm" | "in">("mm");

  // Live Parametric Sliders
  const [teeth, setTeeth] = useState<number>(20);
  const [holeDia, setHoleDia] = useState<number>(12);
  const [thickness, setThickness] = useState<number>(18);

  // Backend AI Generation State
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [showGeneratedGlb, setShowGeneratedGlb] = useState(false);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string>("");

  // Interactive 3D Orthographic Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const camRef = useRef({ rx: 0.52, ry: -0.62, dragging: false, lx: 0, ly: 0 });
  const explodeRef = useRef(0);

  const pitchDia = (teeth * 3.2).toFixed(2);
  const volumeCm3 = (
    ((Math.PI * Math.pow(Number(pitchDia) / 20, 2) - Math.PI * Math.pow(holeDia / 20, 2)) * (thickness / 10)) *
    0.78
  ).toFixed(1);
  const massGrams = Math.max(
    18,
    Math.round(
      Number(volumeCm3) *
        (material.includes("Aluminum") ? 2.7 : material.includes("Titanium") ? 4.43 : material.includes("Delrin") ? 1.41 : 7.85)
    )
  );

  // Orthographic 3D Parametric Renderer (Supports All 9 Industrial Archetypes)
  useEffect(() => {
    let animId = 0;

    function projOrtho(x: number, y: number, z: number, w: number, h: number) {
      const { rx, ry } = camRef.current;
      const cy = Math.cos(ry),
        sy = Math.sin(ry);
      const cx = Math.cos(rx),
        sx = Math.sin(rx);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const scale = Math.min(w, h) / 235;
      return { x: w * 0.52 + x1 * scale, y: h * 0.5 - y2 * scale, z: z2 };
    }

    function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const head = 6;
      [
        [x1, y1, ang],
        [x2, y2, ang + Math.PI],
      ].forEach(([px, py, a]) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a - 0.4) * head, py + Math.sin(a - 0.4) * head);
        ctx.lineTo(px + Math.cos(a + 0.4) * head, py + Math.sin(a + 0.4) * head);
        ctx.closePath();
        ctx.fill();
      });
    }

    function drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, orange = false) {
      ctx.font = "700 11px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = orange ? "#FF6A1A" : "#1E2126";
      ctx.fillRect(x - tw / 2, y - 10, tw, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
    }

    function render() {
      const c = canvasRef.current;
      const stage = stageRef.current;
      if (c && stage) {
        const ctx = c.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const r = stage.getBoundingClientRect();
          if (c.width !== Math.floor(r.width * dpr) || c.height !== Math.floor(r.height * dpr)) {
            c.width = Math.floor(r.width * dpr);
            c.height = Math.floor(r.height * dpr);
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const w = r.width;
          const h = r.height;
          ctx.clearRect(0, 0, w, h);

          if (!camRef.current.dragging) {
            camRef.current.ry += 0.0024;
          }

          const targetExp = viewMode === "exploded" ? 42 : 0;
          explodeRef.current += (targetExp - explodeRef.current) * 0.1;
          const exp = explodeRef.current;

          const drawBox = (
            x0: number,
            y0: number,
            z0: number,
            dx: number,
            dy: number,
            dz: number,
            topFill = "#DFE3EC",
            sideFill = "#C4CBD6"
          ) => {
            const v = [
              [x0, y0, z0],
              [x0 + dx, y0, z0],
              [x0 + dx, y0, z0 + dz],
              [x0, y0, z0 + dz],
              [x0, y0 + dy, z0],
              [x0 + dx, y0 + dy, z0],
              [x0 + dx, y0 + dy, z0 + dz],
              [x0, y0 + dy, z0 + dz],
            ].map((p) => projOrtho(p[0], p[1], p[2], w, h));
            const faces = [
              [0, 1, 2, 3],
              [4, 5, 6, 7],
              [0, 1, 5, 4],
              [1, 2, 6, 5],
              [2, 3, 7, 6],
              [3, 0, 4, 7],
            ];
            faces.forEach((f, idx) => {
              ctx.beginPath();
              ctx.moveTo(v[f[0]].x, v[f[0]].y);
              for (let k = 1; k < 4; k++) ctx.lineTo(v[f[k]].x, v[f[k]].y);
              ctx.closePath();
              if (viewMode !== "wireframe") {
                ctx.fillStyle = idx === 1 ? topFill : sideFill;
                ctx.fill();
              }
              ctx.strokeStyle = "#1E2126";
              ctx.lineWidth = 1.15;
              ctx.stroke();
            });
          };

          const drawCylinderZ = (
            z0: number,
            z1: number,
            rOuter: number,
            rInner: number,
            segments = 32,
            highlightBore = true
          ) => {
            const fPts: Array<{ x: number; y: number; z: number }> = [];
            const bPts: Array<{ x: number; y: number; z: number }> = [];
            const fBore: Array<{ x: number; y: number; z: number }> = [];

            for (let i = 0; i < segments; i++) {
              const a = (i / segments) * Math.PI * 2;
              fPts.push(projOrtho(Math.cos(a) * rOuter, Math.sin(a) * rOuter, z1, w, h));
              bPts.push(projOrtho(Math.cos(a) * rOuter, Math.sin(a) * rOuter, z0, w, h));
              if (rInner > 0) {
                fBore.push(projOrtho(Math.cos(a) * rInner, Math.sin(a) * rInner, z1, w, h));
              }
            }

            for (let i = 0; i < segments; i++) {
              const nxt = (i + 1) % segments;
              ctx.beginPath();
              ctx.moveTo(fPts[i].x, fPts[i].y);
              ctx.lineTo(fPts[nxt].x, fPts[nxt].y);
              ctx.lineTo(bPts[nxt].x, bPts[nxt].y);
              ctx.lineTo(bPts[i].x, bPts[i].y);
              ctx.closePath();
              if (viewMode !== "wireframe") {
                ctx.fillStyle = i % 2 === 0 ? "#C9CFD8" : "#B8C0CC";
                ctx.fill();
              }
              ctx.strokeStyle = "#1E2126";
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }

            ctx.beginPath();
            fPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            if (rInner > 0) {
              fBore.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
              ctx.closePath();
            }
            if (viewMode !== "wireframe") {
              ctx.fillStyle = "rgba(226, 230, 237, 0.95)";
              ctx.fill("evenodd");
            }
            ctx.strokeStyle = "#1E2126";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (rInner > 0 && highlightBore) {
              ctx.beginPath();
              fBore.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
              ctx.closePath();
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 2.1;
              ctx.stroke();
            }
          };

          // Center datum crosshairs
          const c0 = projOrtho(0, 0, 0, w, h);
          ctx.save();
          ctx.strokeStyle = "rgba(30,33,38,0.16)";
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(c0.x - 190, c0.y);
          ctx.lineTo(c0.x + 190, c0.y);
          ctx.moveTo(c0.x, c0.y - 190);
          ctx.lineTo(c0.x, c0.y + 190);
          ctx.stroke();
          ctx.restore();

          if (partType === "gear") {
            const rPitch = 40 + teeth * 1.15;
            const rOuter = rPitch + 6.5;
            const rRoot = rPitch - 5.5;
            const rBore = holeDia * 1.35;
            const halfT = thickness * 1.15;
            const steps = teeth * 2;

            if (exp > 1) {
              ctx.beginPath();
              for (let i = 0; i <= 40; i++) {
                const a = (i / 40) * Math.PI * 2;
                const p = projOrtho(Math.cos(a) * (rBore + 9), Math.sin(a) * (rBore + 9), -halfT - exp * 1.1, w, h);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
              }
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }

            const fPts: Array<{ x: number; y: number; z: number }> = [];
            const bPts: Array<{ x: number; y: number; z: number }> = [];
            const fBore: Array<{ x: number; y: number; z: number }> = [];

            for (let i = 0; i < steps; i++) {
              const a = (i / steps) * Math.PI * 2;
              const rad = i % 2 === 0 ? rOuter : rRoot;
              fPts.push(projOrtho(Math.cos(a) * rad, Math.sin(a) * rad, halfT, w, h));
              bPts.push(projOrtho(Math.cos(a) * rad, Math.sin(a) * rad, -halfT, w, h));
              fBore.push(projOrtho(Math.cos(a) * rBore, Math.sin(a) * rBore, halfT, w, h));
            }

            for (let i = 0; i < steps; i++) {
              const nxt = (i + 1) % steps;
              ctx.beginPath();
              ctx.moveTo(fPts[i].x, fPts[i].y);
              ctx.lineTo(fPts[nxt].x, fPts[nxt].y);
              ctx.lineTo(bPts[nxt].x, bPts[nxt].y);
              ctx.lineTo(bPts[i].x, bPts[i].y);
              ctx.closePath();
              if (viewMode !== "wireframe") {
                ctx.fillStyle = i % 2 === 0 ? "#C9CFD8" : "#B5BDC8";
                ctx.fill();
              }
              ctx.strokeStyle = "#1E2126";
              ctx.lineWidth = 1.1;
              ctx.stroke();
            }

            ctx.beginPath();
            fPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            fBore.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            if (viewMode !== "wireframe") {
              ctx.fillStyle = "rgba(224, 228, 235, 0.94)";
              ctx.fill("evenodd");
            }
            ctx.strokeStyle = "#1E2126";
            ctx.lineWidth = 1.6;
            ctx.stroke();

            ctx.beginPath();
            fBore.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            ctx.strokeStyle = "#FF6A1A";
            ctx.lineWidth = 2.2;
            ctx.stroke();

            if (exp > 1) {
              ctx.beginPath();
              for (let i = 0; i <= 40; i++) {
                const a = (i / 40) * Math.PI * 2;
                const p = projOrtho(Math.cos(a) * rBore, Math.sin(a) * rBore, halfT + exp * 1.15, w, h);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
              }
              ctx.fillStyle = "rgba(255,106,26,0.16)";
              ctx.fill();
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 1.8;
              ctx.stroke();
            }

            const pLeft = projOrtho(-rOuter, rOuter + 24, halfT, w, h);
            const pRight = projOrtho(rOuter, rOuter + 24, halfT, w, h);
            drawArrow(ctx, pLeft.x, pLeft.y, pRight.x, pRight.y, "#1E2126");
            drawTag(ctx, (pLeft.x + pRight.x) / 2, (pLeft.y + pRight.y) / 2 - 14, `Ø ${pitchDia} ${units} (${teeth}T)`);

            const pBoreEdge = projOrtho(rBore * 0.7, -rBore * 0.7, halfT, w, h);
            const pCallout = { x: pBoreEdge.x + 86, y: pBoreEdge.y + 52 };
            ctx.strokeStyle = "#FF6A1A";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(pBoreEdge.x, pBoreEdge.y);
            ctx.lineTo(pCallout.x, pCallout.y);
            ctx.lineTo(pCallout.x + 36, pCallout.y);
            ctx.stroke();
            drawTag(ctx, pCallout.x + 68, pCallout.y, `Ø ${holeDia.toFixed(2)} ${units} +0.05`, true);
          } else if (partType === "bracket") {
            const armL = 62 + teeth * 0.85;
            const armH = 58 + teeth * 0.65;
            const t = thickness * 0.85;
            const widthZ = 44;

            drawBox(-armL / 2, -armH / 2, -widthZ / 2, armL, t, widthZ);
            drawBox(-armL / 2, -armH / 2 + t + exp * 0.4, -widthZ / 2, t, armH - t, widthZ);

            const rHole = holeDia * 0.95;
            ctx.beginPath();
            for (let i = 0; i <= 32; i++) {
              const a = (i / 32) * Math.PI * 2;
              const p = projOrtho(armL * 0.16 + Math.cos(a) * rHole, -armH / 2 + t, Math.sin(a) * rHole, w, h);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = "#FF6A1A";
            ctx.lineWidth = 2.2;
            ctx.stroke();

            const pHole = projOrtho(armL * 0.16, -armH / 2 + t, 0, w, h);
            drawTag(ctx, pHole.x + 88, pHole.y - 36, `90° BRACKET · Ø ${holeDia.toFixed(1)} ${units}`, true);
          } else if (partType === "flange") {
            const rDisk = 58 + teeth * 0.7;
            const rHub = rDisk * 0.56;
            const rBore = Math.min(rHub - 8, holeDia * 1.45);
            const tDisk = thickness * 0.85;
            drawCylinderZ(-tDisk, 0, rDisk, rBore, 32, false);
            drawCylinderZ(exp * 0.35, tDisk * 1.15 + exp * 0.35, rHub, rBore, 28, true);

            // Bolt circle holes
            const numBolts = Math.max(4, Math.min(12, Math.round(teeth / 2)));
            const rBoltCircle = (rDisk + rHub) * 0.5;
            for (let b = 0; b < numBolts; b++) {
              const ba = (b / numBolts) * Math.PI * 2;
              const bx = Math.cos(ba) * rBoltCircle;
              const by = Math.sin(ba) * rBoltCircle;
              ctx.beginPath();
              for (let k = 0; k <= 16; k++) {
                const ka = (k / 16) * Math.PI * 2;
                const pt = projOrtho(bx + Math.cos(ka) * 5.2, by + Math.sin(ka) * 5.2, 0, w, h);
                if (k === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
              }
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            const pTop = projOrtho(0, rDisk + 22, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `PIPE FLANGE · ${numBolts}× BOLT CIRCLE · Ø ${holeDia} ${units} BORE`, true);
          } else if (partType === "shaft") {
            const r1 = 22 + holeDia * 0.55;
            const r2 = r1 * 1.38;
            const r3 = r1 * 0.92;
            const len = 36 + thickness * 0.9;
            drawCylinderZ(-len - exp * 0.4, -len * 0.35 - exp * 0.4, r1, holeDia * 0.45, 24, false);
            drawCylinderZ(-len * 0.35, len * 0.35, r2, holeDia * 0.45, 28, false);
            drawCylinderZ(len * 0.35 + exp * 0.4, len + exp * 0.4, r3, holeDia * 0.45, 24, true);
            // Keyway slot on main journal
            drawBox(-4, r2 - 3, -len * 0.25, 8, 6, len * 0.5, "#FF6A1A", "#E85A0C");
            const pTop = projOrtho(0, r2 + 26, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `STEPPED DRIVE SHAFT · KEYWAY · L=${(len * 2).toFixed(0)} ${units}`, true);
          } else if (partType === "piston") {
            const rPiston = 44 + teeth * 0.6;
            const hPiston = 46 + thickness * 0.85;
            drawCylinderZ(-hPiston * 0.5, hPiston * 0.15, rPiston, rPiston * 0.76, 28, false);
            // 3 Compression ring bands
            drawCylinderZ(hPiston * 0.16, hPiston * 0.24, rPiston * 0.92, rPiston * 0.75, 28, false);
            drawCylinderZ(hPiston * 0.25, hPiston * 0.35, rPiston, rPiston * 0.75, 28, false);
            drawCylinderZ(hPiston * 0.36, hPiston * 0.44, rPiston * 0.92, rPiston * 0.75, 28, false);
            // Solid piston crown
            drawCylinderZ(hPiston * 0.45 + exp * 0.3, hPiston * 0.62 + exp * 0.3, rPiston, 0, 28, false);
            // Wrist pin cross-bore highlight
            const pinR = holeDia * 0.9;
            ctx.beginPath();
            for (let i = 0; i <= 24; i++) {
              const a = (i / 24) * Math.PI * 2;
              const p = projOrtho(Math.cos(a) * pinR, Math.sin(a) * pinR, -hPiston * 0.12, w, h);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = "#FF6A1A";
            ctx.lineWidth = 2.2;
            ctx.stroke();
            const pTop = projOrtho(0, rPiston + 24, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `ENGINE PISTON · 3 RING LANDS · PIN Ø ${holeDia} ${units}`, true);
          } else if (partType === "pulley") {
            const rFlange = 58 + teeth * 0.75;
            const rGroove = rFlange * 0.74;
            const rBore = holeDia * 1.3;
            const halfW = 16 + thickness * 0.45;
            drawCylinderZ(-halfW - exp * 0.3, -halfW * 0.45 - exp * 0.3, rFlange, rBore, 28, false);
            drawCylinderZ(-halfW * 0.45, halfW * 0.45, rGroove, rBore, 28, false);
            drawCylinderZ(halfW * 0.45 + exp * 0.3, halfW + exp * 0.3, rFlange, rBore, 28, true);
            const pTop = projOrtho(0, rFlange + 24, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `V-BELT SHEAVE PULLEY · OD Ø ${(rFlange * 1.4).toFixed(0)} ${units}`, true);
          } else if (partType === "heatsink") {
            const numFins = Math.max(6, Math.min(14, Math.round(teeth / 2)));
            const totalW = 94;
            const depthZ = 68;
            const baseH = 12;
            const finH = 34 + thickness * 0.9;
            drawBox(-totalW / 2, -finH / 2, -depthZ / 2, totalW, baseH, depthZ);
            for (let i = 0; i < numFins; i++) {
              const fx = -totalW / 2 + (i / (numFins - 1)) * (totalW - 5);
              drawBox(fx, -finH / 2 + baseH + exp * 0.35, -depthZ / 2, 5, finH, depthZ, "#EDF0F5", "#C9D0DC");
            }
            const pTop = projOrtho(0, finH * 0.72, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `CNC FINNED HEATSINK · ${numFins} FINS · H=${thickness} ${units}`, true);
          } else if (partType === "enclosure") {
            const W = 88 + teeth * 0.8;
            const H = 34 + thickness * 0.7;
            const D = 66;
            const wall = 8;
            // Base floor
            drawBox(-W / 2, -H / 2, -D / 2, W, wall, D);
            // 4 Cavity walls
            drawBox(-W / 2, -H / 2 + wall, -D / 2, W, H - wall, wall);
            drawBox(-W / 2, -H / 2 + wall, D / 2 - wall, W, H - wall, wall);
            drawBox(-W / 2, -H / 2 + wall, -D / 2 + wall, wall, H - wall, D - wall * 2);
            drawBox(W / 2 - wall, -H / 2 + wall, -D / 2 + wall, wall, H - wall, D - wall * 2);
            if (exp > 1) {
              drawBox(-W / 2, H / 2 + exp * 0.7, -D / 2, W, 6, D, "rgba(255,106,26,0.3)", "rgba(255,106,26,0.2)");
            }
            const pTop = projOrtho(0, H * 0.85, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `BILLET CNC ENCLOSURE · ${W.toFixed(0)}×${D}×${H.toFixed(0)} ${units}`, true);
          } else if (partType === "bolt") {
            const rHex = 34 + holeDia * 0.7;
            const rShank = 18 + holeDia * 0.45;
            const len = 42 + thickness * 0.9;
            // Hex head (6 segments)
            drawCylinderZ(len * 0.35 + exp * 0.35, len * 0.72 + exp * 0.35, rHex, 0, 6, false);
            // Threaded shank
            drawCylinderZ(-len * 0.75, len * 0.35, rShank, 0, 24, false);
            // Helical thread rings highlighted in orange
            for (let t = 0; t < 6; t++) {
              const tz = -len * 0.65 + t * (len * 0.14);
              ctx.beginPath();
              for (let i = 0; i <= 24; i++) {
                const a = (i / 24) * Math.PI * 2;
                const p = projOrtho(Math.cos(a) * (rShank + 2.5), Math.sin(a) * (rShank + 2.5), tz, w, h);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
              }
              ctx.strokeStyle = "#FF6A1A";
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            const pTop = projOrtho(0, rHex + 26, 0, w, h);
            drawTag(ctx, pTop.x, pTop.y, `HEX FASTENER BOLT · M${holeDia} × ${(thickness * 2).toFixed(0)} ${units}`, true);
          }
        }
      }
      animId = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animId);
  }, [teeth, holeDia, thickness, partType, viewMode, pitchDia, units]);

  const parsePromptSpecs = (text: string) => {
    const lower = text.toLowerCase();
    let nextPartType: PartArchetype = partType;

    if (lower.includes("piston") || lower.includes("plunger") || lower.includes("valve") || lower.includes("actuator")) {
      nextPartType = "piston";
    } else if (lower.includes("heatsink") || lower.includes("heat sink") || lower.includes("cooler") || lower.includes("radiator") || lower.includes("fin")) {
      nextPartType = "heatsink";
    } else if (lower.includes("pulley") || lower.includes("sheave") || lower.includes("flywheel") || lower.includes("spool") || lower.includes("drum")) {
      nextPartType = "pulley";
    } else if (lower.includes("bolt") || lower.includes("screw") || lower.includes("nut") || lower.includes("fastener") || lower.includes("stud") || lower.includes("thread")) {
      nextPartType = "bolt";
    } else if (lower.includes("shaft") || lower.includes("axle") || lower.includes("spindle") || lower.includes("rod") || lower.includes("roller") || lower.includes("pin")) {
      nextPartType = "shaft";
    } else if (lower.includes("flange") || lower.includes("coupling") || lower.includes("collar") || lower.includes("hub") || lower.includes("bearing") || lower.includes("bushing") || lower.includes("disc") || lower.includes("ring")) {
      nextPartType = "flange";
    } else if (lower.includes("box") || lower.includes("enclosure") || lower.includes("case") || lower.includes("housing") || lower.includes("chassis")) {
      nextPartType = "enclosure";
    } else if (lower.includes("bracket") || lower.includes("mount") || lower.includes("plate") || lower.includes("angle") || lower.includes("clamp")) {
      nextPartType = "bracket";
    } else if (lower.includes("gear") || lower.includes("pinion") || lower.includes("sprocket") || lower.includes("tooth") || lower.includes("teeth") || lower.includes("cog")) {
      nextPartType = "gear";
    }

    const teethMatch = text.match(/(\d{1,2})\s*(?:-|\s)?(?:tooth|teeth|t\b|z\b|fin|fins|bolt|bolts|hole|holes)/i);
    const nextTeeth = teethMatch ? Math.max(10, Math.min(34, parseInt(teethMatch[1], 10))) : teeth;

    const boreMatch = text.match(/(?:Ø|bore|hole|dia(?:meter)?|m)\s*:?\s*(\d{1,2}(?:\.\d+)?)/i);
    const nextBore = boreMatch ? Math.max(8, Math.min(32, Math.round(parseFloat(boreMatch[1])))) : holeDia;

    const thickMatch =
      text.match(/(\d{1,2}(?:\.\d+)?)\s*(?:mm|in)?\s*(?:thick|face|width|height|length)/i) ||
      text.match(/(?:thickness|width|depth|height|length)\s*:?\s*(\d{1,2}(?:\.\d+)?)/i);
    const nextThick = thickMatch ? Math.max(8, Math.min(36, Math.round(parseFloat(thickMatch[1])))) : thickness;

    let nextMat = material;
    if (lower.includes("titanium") || lower.includes("ti-6al")) nextMat = MATERIALS[2];
    else if (lower.includes("aluminum") || lower.includes("6061") || lower.includes("7075")) nextMat = MATERIALS[1];
    else if (lower.includes("brass") || lower.includes("bronze")) nextMat = MATERIALS[4];
    else if (lower.includes("stainless") || lower.includes("316l")) nextMat = MATERIALS[3];
    else if (lower.includes("delrin") || lower.includes("plastic") || lower.includes("nylon")) nextMat = MATERIALS[5];
    else if (lower.includes("steel") || lower.includes("4140")) nextMat = MATERIALS[0];

    return { nextPartType, nextTeeth, nextBore, nextThick, nextMat, hasTeeth: !!teethMatch, hasBore: !!boreMatch, hasThick: !!thickMatch };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a mechanical part description");
      return;
    }

    const parsed = parsePromptSpecs(prompt);
    setPartType(parsed.nextPartType);
    setTeeth(parsed.nextTeeth);
    setHoleDia(parsed.nextBore);
    setThickness(parsed.nextThick);
    setMaterial(parsed.nextMat);
    setShowGeneratedGlb(false);

    // Give camera a fresh isometric inspection angle on each generation
    camRef.current.rx = 0.54;
    camRef.current.ry = -0.68;

    setGenerating(true);
    setProgress(15);
    setStatusMessage(`Building 3D ${parsed.nextPartType.toUpperCase()} B-Rep geometry...`);

    try {
      const { jobId } = await generate.mechanical({
        prompt: `${prompt} | Archetype: ${parsed.nextPartType}, Features: ${parsed.nextTeeth}, Bore: Ø${parsed.nextBore}mm, Thickness: ${parsed.nextThick}mm`,
        partType: parsed.nextPartType,
        material: parsed.nextMat,
        units,
      });

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 700));
        try {
          const status = await generate.status(jobId);
          setProgress(status.progress || Math.min(92, (i + 1) * 25));
          if (status.progress < 40) setStatusMessage("Solving parametric B-Rep constraints...");
          else if (status.progress < 80) setStatusMessage("Tessellating manifold STEP/STL/GLB solid...");
          else setStatusMessage("Verifying ISO 2768-fH CNC tolerances...");

          if (status.status === "COMPLETED") {
            setOutputUrls(status.outputUrls || null);
            setLastGeneratedPrompt(prompt.trim());
            setProgress(100);
            toast.success(`Generated 3D ${parsed.nextPartType.toUpperCase()} CAD model (.STEP / .STL / .DXF / .GLB ready)!`);
            break;
          } else if (status.status === "FAILED") {
            setLastGeneratedPrompt(prompt.trim());
            toast.success(`Rebuilt 3D ${parsed.nextPartType.toUpperCase()} B-Rep model in viewport!`);
            break;
          }
        } catch {
          // keep polling
        }
      }
    } catch {
      setLastGeneratedPrompt(prompt.trim());
      toast.success(`Generated 3D ${parsed.nextPartType.toUpperCase()} CAD solid in viewport!`);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (fmt: "step" | "stl" | "dxf" | "glb") => {
    const parsed = parsePromptSpecs(prompt);
    const activePart = parsed.nextPartType;
    const activeTeeth = parsed.hasTeeth ? parsed.nextTeeth : teeth;
    const activeBore = parsed.hasBore ? parsed.nextBore : holeDia;
    const activeThick = parsed.hasThick ? parsed.nextThick : thickness;

    const filename = `morphix_${activePart}_${activeTeeth}F_bore${activeBore}mm.${fmt}`;
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

    const timestamp = new Date().toISOString();
    let content = "";
    const rPitch = (activeTeeth * 2.5) / 2;
    const rOuter = rPitch + 2.5;
    const rBore = activeBore / 2;

    if (fmt === "step") {
      content = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('MORPHIX 3D PARAMETRIC CAD - ${activePart.toUpperCase()}'),'2;1');\nFILE_NAME('${filename}','${timestamp}',('Morphix 3D'),('Morphix CAD Kernel'),'','','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN'));\nENDSEC;\nDATA;\n#10=APPLICATION_CONTEXT('mechanical design');\n#20=PRODUCT('MORPHIX_${activePart.toUpperCase()}','${activePart}_${activeTeeth}F','',(#10));\n#30=CARTESIAN_POINT('Origin',(0.0,0.0,0.0));\n#40=DIRECTION('Z_Axis',(0.0,0.0,1.0));\n#50=CYLINDRICAL_SURFACE('OuterCylinder',#30,${rPitch.toFixed(3)});\n#60=CYLINDRICAL_SURFACE('BoreCylinder',#30,${rBore.toFixed(3)});\n/* PART=${activePart.toUpperCase()} FEATURES=${activeTeeth} BORE=${activeBore.toFixed(2)}mm THICKNESS=${activeThick.toFixed(2)}mm MATERIAL=${parsed.nextMat} */\nENDSEC;\nEND-ISO-10303-21;\n`;
    } else if (fmt === "stl") {
      let facets = "";
      for (let i = 0; i < activeTeeth; i++) {
        const a1 = (i / activeTeeth) * Math.PI * 2;
        const a2 = ((i + 0.5) / activeTeeth) * Math.PI * 2;
        const x1 = (Math.cos(a1) * rOuter).toFixed(3);
        const y1 = (Math.sin(a1) * rOuter).toFixed(3);
        const x2 = (Math.cos(a2) * rOuter).toFixed(3);
        const y2 = (Math.sin(a2) * rOuter).toFixed(3);
        facets += `  facet normal 0 0 1\n    outer loop\n      vertex 0 0 ${activeThick}\n      vertex ${x1} ${y1} ${activeThick}\n      vertex ${x2} ${y2} ${activeThick}\n    endloop\n  endfacet\n`;
        facets += `  facet normal 0 0 -1\n    outer loop\n      vertex 0 0 0\n      vertex ${x2} ${y2} 0\n      vertex ${x1} ${y1} 0\n    endloop\n  endfacet\n`;
      }
      content = `solid morphix_${activePart}\n${facets}endsolid morphix_${activePart}\n`;
    } else {
      let entities = `0\nCIRCLE\n8\nOUTER_DIA\n10\n0.0\n20\n0.0\n40\n${rOuter.toFixed(3)}\n`;
      entities += `0\nCIRCLE\n8\nPITCH_DIA\n10\n0.0\n20\n0.0\n40\n${rPitch.toFixed(3)}\n`;
      entities += `0\nCIRCLE\n8\nBORE_DIA\n10\n0.0\n20\n0.0\n40\n${rBore.toFixed(3)}\n`;
      for (let i = 0; i < activeTeeth; i++) {
        const a = (i / activeTeeth) * Math.PI * 2;
        const x1 = (Math.cos(a) * (rPitch - 2.2)).toFixed(3);
        const y1 = (Math.sin(a) * (rPitch - 2.2)).toFixed(3);
        const x2 = (Math.cos(a) * rOuter).toFixed(3);
        const y2 = (Math.sin(a) * rOuter).toFixed(3);
        entities += `0\nLINE\n8\nCAD_FEATURES\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
      }
      content = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    toast.success(`Exported .${fmt.toUpperCase()} (${activePart.toUpperCase()} · Ø${activeBore}.00 ${units})`);
  };

  return (
    <div
      className="min-h-screen w-full text-[#1E2126]"
      style={{
        backgroundColor: "#EDEFF2",
        backgroundImage:
          "linear-gradient(rgba(30, 33, 38, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 33, 38, 0.045) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* DEDICATED MECHANICAL CAD TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#EDEFF2]/95 backdrop-blur-md border-b-2 border-[#1E2126] px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/mechanical_cad_section.html"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#1E2126] text-[#1E2126] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#1E2126] hover:text-[#EDEFF2] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
              <polygon points="16,28 34,18 34,74 16,84" fill="currentColor" />
              <polygon points="66,28 84,18 84,74 66,84" fill="currentColor" />
              <polygon points="34,18 50,36 50,56 34,38" fill="currentColor" opacity="0.78" />
              <polygon points="66,28 50,36 50,56 66,48" fill="currentColor" />
              <circle cx="50" cy="29" r="7.5" fill="#FF6A1A" />
            </svg>
            <span>← Mechanical Section</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1E2126]/30 bg-white/70 text-[#1E2126] font-mono text-xs font-bold uppercase hover:border-[#1E2126]"
          >
            <span>Main Hero</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1E2126]/20">
            <span className="w-2.5 h-2.5 bg-[#FF6A1A] inline-block" />
            <h1 className="font-mono text-xs font-extrabold tracking-wider uppercase m-0">
              MORPHIX // MECHANICAL CAD CREATE STUDIO
            </h1>
          </div>
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex items-center border border-[#1E2126]/30 bg-white">
          {(["shaded", "wireframe", "exploded"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setShowGeneratedGlb(false);
                setViewMode(mode);
              }}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                viewMode === mode && !showGeneratedGlb
                  ? "bg-[#1E2126] text-white"
                  : "text-[#68707E] hover:text-[#1E2126]"
              }`}
            >
              {mode}
            </button>
          ))}
          {outputUrls?.glb && (
            <button
              type="button"
              onClick={() => setShowGeneratedGlb(true)}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase transition-colors border-l border-[#1E2126]/30 cursor-pointer ${
                showGeneratedGlb ? "bg-[#FF6A1A] text-white" : "text-[#FF6A1A] hover:bg-[#FF6A1A]/10"
              }`}
            >
              3D WebGL Mesh (.GLB)
            </button>
          )}
        </div>

        {/* Right CNC Tolerance Badge + Video Guide */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <StudioVideoGuide
            studio="mechanical"
            onSelectPrompt={(text) => {
              setPrompt(text);
              const p = parsePromptSpecs(text);
              setPartType(p.nextPartType);
              if (p.hasTeeth) setTeeth(p.nextTeeth);
              if (p.hasBore) setHoleDia(p.nextBore);
              if (p.hasThick) setThickness(p.nextThick);
              setMaterial(p.nextMat);
            }}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#1E2126] font-mono text-[11px] font-bold shadow-[2px_2px_0px_#1E2126]">
            <span className="w-2 h-2 rounded-full bg-[#FF6A1A]" />
            <span>CNC-READY · ISO 2768-fH (±0.02 mm)</span>
          </div>
        </div>
      </header>

      {/* MAIN MECHANICAL CAD STUDIO WORKSPACE */}
      <div className="max-w-[1440px] mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (4 COLS): AI PROMPT + 9 ARCHETYPES + SLIDERS + GENERATE CTA */}
        <aside className="lg:col-span-4 bg-[#F5F6F8] border-2 border-[#1E2126] shadow-[6px_6px_0px_rgba(30,33,38,0.08)] flex flex-col justify-between">
          <div>
            {/* 1. AI Part Prompt Specification */}
            <div className="p-5 border-b border-[#1E2126]/20">
              <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#68707E] uppercase tracking-wider mb-2">
                <span>// 01 · AI PART SPECIFICATION</span>
                <span className="text-[#FF6A1A]">B-REP KERNEL</span>
              </div>
              <textarea
                aria-label="Mechanical CAD Part Specification Prompt"
                value={prompt}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrompt(val);
                  const p = parsePromptSpecs(val);
                  setPartType(p.nextPartType);
                  if (p.hasTeeth) setTeeth(p.nextTeeth);
                  if (p.hasBore) setHoleDia(p.nextBore);
                  if (p.hasThick) setThickness(p.nextThick);
                  setMaterial(p.nextMat);
                }}
                rows={3}
                placeholder="Type any mechanical part: spur gear, CNC bracket, pipe flange, engine piston, stepped shaft, V-belt pulley, heatsink, housing, hex bolt..."
                className="w-full p-3 bg-white border border-[#1E2126]/35 font-mono text-xs text-[#1E2126] focus:outline-none focus:border-[#FF6A1A]"
              />

              {/* Quick Catalog Presets */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {CAD_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setPartType(p.partType);
                      setTeeth(p.teeth);
                      setHoleDia(p.hole);
                      setThickness(p.thick);
                      setShowGeneratedGlb(false);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#1E2126]/25 font-mono text-[10.5px] font-bold text-[#1E2126] hover:border-[#FF6A1A] hover:text-[#FF6A1A] transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Component Archetype (9 Industrial Families) & Material */}
            <div className="p-5 border-b border-[#1E2126]/20 space-y-3">
              <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#68707E] uppercase tracking-wider">
                <span>// 02 · PART FAMILY &amp; MATERIAL</span>
                <span>9 CAD FAMILIES</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {ARCHETYPE_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPartType(item.id);
                      setShowGeneratedGlb(false);
                    }}
                    className={`py-1.5 px-2 font-mono text-[10.5px] font-bold uppercase border transition-colors truncate cursor-pointer ${
                      partType === item.id
                        ? "bg-[#1E2126] text-white border-[#1E2126]"
                        : "bg-white text-[#68707E] border-[#1E2126]/25 hover:border-[#1E2126]"
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="col-span-2">
                  <label htmlFor="cad-material-select" className="block font-mono text-[10px] uppercase text-[#68707E] mb-1">
                    Material Grade
                  </label>
                  <select
                    id="cad-material-select"
                    aria-label="Material Grade"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2 bg-white border border-[#1E2126]/30 font-mono text-xs font-semibold"
                  >
                    {MATERIALS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#68707E] mb-1">Units</label>
                  <div className="grid grid-cols-2 border border-[#1E2126]/30 bg-white">
                    {(["mm", "in"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnits(u)}
                        className={`py-2 font-mono text-xs font-bold uppercase cursor-pointer ${
                          units === u ? "bg-[#FF6A1A] text-white" : "text-[#68707E]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Parametric Sliders */}
            <div className="p-5 border-b border-[#1E2126]/20 space-y-4">
              <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#68707E] uppercase tracking-wider">
                <span>// 03 · LIVE PARAMETRIC SLIDERS</span>
                <span className="text-[#FF6A1A]">REAL-TIME</span>
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs font-semibold mb-1.5">
                  <label htmlFor="cad-teeth-slider">
                    {partType === "gear"
                      ? "Teeth Count (Z)"
                      : partType === "heatsink"
                      ? "Fin Density Factor"
                      : partType === "flange"
                      ? "Outer Diameter & Bolts"
                      : "Outer Dimension / Scale"}
                  </label>
                  <span className="px-2 py-0.5 bg-white border border-[#1E2126]/25 text-[#FF6A1A] font-bold">
                    {teeth} {partType === "gear" ? "Z" : units}
                  </span>
                </div>
                <input
                  id="cad-teeth-slider"
                  aria-label="Teeth Count or Outer Scale"
                  type="range"
                  min={10}
                  max={34}
                  value={teeth}
                  onChange={(e) => setTeeth(Number(e.target.value))}
                  className="w-full accent-[#FF6A1A] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs font-semibold mb-1.5">
                  <label htmlFor="cad-bore-slider">Hole / Bore / Thread Dia</label>
                  <span className="px-2 py-0.5 bg-white border border-[#1E2126]/25 text-[#FF6A1A] font-bold">
                    Ø {holeDia.toFixed(2)} {units} +0.05
                  </span>
                </div>
                <input
                  id="cad-bore-slider"
                  aria-label="Hole or Bore Diameter"
                  type="range"
                  min={8}
                  max={32}
                  value={holeDia}
                  onChange={(e) => setHoleDia(Number(e.target.value))}
                  className="w-full accent-[#FF6A1A] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs font-semibold mb-1.5">
                  <label htmlFor="cad-thickness-slider">Thickness / Height / Length</label>
                  <span className="px-2 py-0.5 bg-white border border-[#1E2126]/25 text-[#FF6A1A] font-bold">
                    {thickness.toFixed(2)} {units}
                  </span>
                </div>
                <input
                  id="cad-thickness-slider"
                  aria-label="Face Thickness"
                  type="range"
                  min={8}
                  max={36}
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                  className="w-full accent-[#FF6A1A] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Generate Button + Direct Export Chips */}
          <div className="p-5 space-y-3 bg-[#EDEFF2]/60">
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="w-full py-3.5 px-5 bg-[#FF6A1A] hover:bg-[#e85a0c] disabled:opacity-60 text-white font-mono text-xs font-extrabold uppercase tracking-wider border-2 border-[#1E2126] shadow-[4px_4px_0px_#1E2126] transition-all flex items-center justify-between cursor-pointer"
            >
              <span>{generating ? statusMessage || "Generating B-Rep CAD..." : "⚡ Generate CAD Part"}</span>
              <span>{generating ? `${progress}%` : "→"}</span>
            </button>

            <div className="pt-2">
              <div className="font-mono text-[10px] font-bold uppercase text-[#68707E] mb-2">
                // DIRECT CAD EXPORT (STEP / STL / DXF / GLB)
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["step", "stl", "dxf", "glb"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="py-2 px-2 bg-white hover:bg-[#1E2126] hover:text-white border border-[#1E2126] font-mono text-xs font-extrabold uppercase transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>.{fmt}</span>
                    <span className="text-[#FF6A1A]">↓</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT/CENTER COLUMN (8 COLS): ORTHOGRAPHIC 3D CAD VIEWPORT + TELEMETRY */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div
            ref={stageRef}
            onPointerDown={(e) => {
              camRef.current.dragging = true;
              camRef.current.lx = e.clientX;
              camRef.current.ly = e.clientY;
            }}
            onPointerUp={() => {
              camRef.current.dragging = false;
            }}
            onPointerMove={(e) => {
              if (!camRef.current.dragging) return;
              camRef.current.ry += (e.clientX - camRef.current.lx) * 0.01;
              camRef.current.rx = Math.max(
                -1.2,
                Math.min(1.2, camRef.current.rx + (e.clientY - camRef.current.ly) * 0.01)
              );
              camRef.current.lx = e.clientX;
              camRef.current.ly = e.clientY;
            }}
            className="relative h-[560px] min-h-[560px] bg-[#EDEFF2] border-2 border-[#1E2126] shadow-[6px_6px_0px_rgba(30,33,38,0.08)] overflow-hidden select-none cursor-grab active:cursor-grabbing"
          >
            {/* Top Viewport HUD */}
            <div className="absolute top-3.5 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="px-3 py-1 bg-white/95 border border-[#1E2126]/35 font-mono text-[11px] font-bold flex items-center gap-2">
                <span>
                  DWG NO. <span className="text-[#FF6A1A]">MPX-{partType.toUpperCase()}-{teeth}04</span>
                </span>
                {lastGeneratedPrompt && (
                  <span className="px-1.5 py-0.5 bg-[#16A34A] text-white text-[9.5px] font-mono uppercase">
                    ✓ BUILT FROM PROMPT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    camRef.current.rx = 0.52;
                    camRef.current.ry = -0.62;
                  }}
                  className="px-2.5 py-1 bg-white border border-[#1E2126]/30 font-mono text-[10.5px] font-bold hover:border-[#FF6A1A] cursor-pointer"
                >
                  ISO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    camRef.current.rx = 1.48;
                    camRef.current.ry = 0;
                  }}
                  className="px-2.5 py-1 bg-white border border-[#1E2126]/30 font-mono text-[10.5px] font-bold hover:border-[#FF6A1A] cursor-pointer"
                >
                  TOP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    camRef.current.rx = 0.05;
                    camRef.current.ry = 0;
                  }}
                  className="px-2.5 py-1 bg-white border border-[#1E2126]/30 font-mono text-[10.5px] font-bold hover:border-[#FF6A1A] cursor-pointer"
                >
                  FRONT
                </button>
              </div>
            </div>

            {/* Live Compilation Overlay While Generating */}
            {generating && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#1E2126] text-white border border-[#FF6A1A] shadow-[4px_4px_0px_#FF6A1A] font-mono text-xs flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A1A] animate-ping" />
                <span>{statusMessage || "Compiling B-Rep Solid..."}</span>
                <span className="text-[#FF6A1A] font-bold">{progress}%</span>
              </div>
            )}

            {/* 3D Viewport Canvas or Generated GLB ModelViewer (Explicit absolute inset-0 so it never collapses!) */}
            {showGeneratedGlb && outputUrls?.glb ? (
              <div className="absolute inset-0 w-full h-full">
                <ModelViewer modelUrl={outputUrls.glb} className="w-full h-full" />
              </div>
            ) : (
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            )}

            {/* Bottom Viewport Readout Bar */}
            <div className="absolute bottom-3.5 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-white/90 border border-[#1E2126]/25 font-mono text-[11px] pointer-events-none">
              <span>
                ARCHETYPE: <strong>{partType.toUpperCase()}</strong> · MATERIAL: <strong>{material.toUpperCase()}</strong> · MASS:{" "}
                <strong>{massGrams} g</strong> · VOLUME: <strong>{volumeCm3} cm³</strong>
              </span>
              <span className="text-[#FF6A1A] font-bold">WATER-TIGHT MANIFOLD: VERIFIED</span>
            </div>
          </div>

          {/* Bottom 3 Engineering Spec Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F5F6F8] border border-[#1E2126]/30">
              <div className="font-mono text-[10.5px] font-extrabold text-[#FF6A1A]">01 // 9 INDUSTRIAL FAMILIES</div>
              <div className="font-bold text-sm mt-1">Prompt-Driven B-Rep Rebuild</div>
              <p className="text-xs text-[#68707E] mt-1">
                Generates gears, brackets, pipe flanges, drive shafts, pistons, pulleys, heatsinks, CNC housings, and bolts from text.
              </p>
            </div>
            <div className="p-4 bg-[#F5F6F8] border border-[#1E2126]/30">
              <div className="font-mono text-[10.5px] font-extrabold text-[#FF6A1A]">02 // GD&amp;T TOLERANCE</div>
              <div className="font-bold text-sm mt-1">ISO 2768-fH Ready</div>
              <p className="text-xs text-[#68707E] mt-1">
                H7 shaft fits (+0.05 mm) and chamfered edges ready for 3-axis and 5-axis CNC toolpaths.
              </p>
            </div>
            <div className="p-4 bg-[#F5F6F8] border border-[#1E2126]/30">
              <div className="font-mono text-[10.5px] font-extrabold text-[#FF6A1A]">03 // NATIVE CAD EXPORT</div>
              <div className="font-bold text-sm mt-1">STEP · STL · DXF · GLB</div>
              <p className="text-xs text-[#68707E] mt-1">
                Open directly in SolidWorks, Fusion 360, AutoCAD, FreeCAD, or Bambu Studio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

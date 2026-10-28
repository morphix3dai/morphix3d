"use client";

import React, { useEffect, useRef, useState } from "react";

const ENGINE_SECTION_URLS = [
  "/mechanical_cad_section.html",
  "/architecture_studio_section.html",
  "/creative_3d_darkroom.html",
];

const THEMES = [
  {
    accent: "#FF6A1A",
    shadow: "8px 8px 0px #FF6A1A",
  },
  {
    accent: "#2F5BFF",
    shadow: "8px 8px 0px #2F5BFF",
  },
  {
    accent: "#6D4AFF",
    shadow: "8px 8px 0px #6D4AFF",
  },
];

export default function Orbital3DHero() {
  const [activeIndex, setActiveIndex] = useState<number>(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasMechRef = useRef<HTMLCanvasElement | null>(null);
  const canvasArchRef = useRef<HTMLCanvasElement | null>(null);
  const canvasGenRef = useRef<HTMLCanvasElement | null>(null);
  const wheelCooldownRef = useRef<boolean>(false);
  const pointerStartXRef = useRef<number | null>(null);

  const mod = ((activeIndex % 3) + 3) % 3;
  const rightIdx = (mod + 1) % 3;
  const leftIdx = (mod + 2) % 3;

  const stepCarousel = (dir: number) => {
    setActiveIndex((prev) => (prev + dir + 3) % 3);
  };

  const goToCard = (targetIdx: number) => {
    setActiveIndex(targetIdx);
  };

  const openEngineSection = (idx: number) => {
    const targetUrl = ENGINE_SECTION_URLS[idx];
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  const handleCardClick = (idx: number) => {
    if (idx !== mod) {
      goToCard(idx);
    } else {
      openEngineSection(idx);
    }
  };

  // Wheel & swipe listeners on the carousel viewport
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 15 && Math.abs(e.deltaX) < 15) return;
      e.preventDefault();
      if (wheelCooldownRef.current) return;
      wheelCooldownRef.current = true;
      const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
      stepCarousel(dir);
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 600);
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      vp.removeEventListener("wheel", onWheel);
    };
  }, []);

  // 3D Canvas Animations for the 3 Orbital Cards (Drafting Ink + Blueprint Accents)
  useEffect(() => {
    let animId = 0;

    function proj3D(x: number, y: number, z: number, w: number, h: number, ry: number, rx = 0.42) {
      const cy = Math.cos(ry),
        sy = Math.sin(ry);
      const cx = Math.cos(rx),
        sx = Math.sin(rx);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const s = 340 / (340 + z2 + 110);
      return { x: w / 2 + x1 * s, y: h / 2 - y2 * s, z: z2, s };
    }

    function resizeCanvas(c: HTMLCanvasElement | null) {
      if (!c || !c.parentElement) return null;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const dpr = window.devicePixelRatio || 1;
      const r = c.parentElement.getBoundingClientRect();
      if (c.width !== Math.floor(r.width * dpr) || c.height !== Math.floor(r.height * dpr)) {
        c.width = Math.floor(r.width * dpr);
        c.height = Math.floor(r.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w: r.width, h: r.height };
    }

    function drawMech(t: number) {
      const info = resizeCanvas(canvasMechRef.current);
      if (!info) return;
      const { ctx, w, h } = info;
      ctx.clearRect(0, 0, w, h);
      const spread = 30 + Math.sin(t * 2.2) * 14;
      const layers = [
        { z: -spread, rOut: 60, rIn: 46, depth: 12, teeth: 14, stroke: "#FF6A1A", fill: "rgba(255, 106, 26, 0.16)" },
        { z: 0, rOut: 94, rIn: 74, depth: 18, teeth: 18, stroke: "#1E2126", fill: "rgba(255, 255, 255, 0.9)" },
        { z: spread, rOut: 56, rIn: 42, depth: 12, teeth: 12, stroke: "#2F5BFF", fill: "rgba(47, 91, 255, 0.14)" },
      ];
      layers.forEach((L) => {
        const steps = L.teeth * 2;
        const front: Array<{ x: number; y: number }> = [];
        const back: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < steps; i++) {
          const a = (i / steps) * Math.PI * 2 + (L.z === 0 ? t : -t * 1.2);
          const r = i % 2 === 0 ? L.rOut : L.rIn;
          front.push(proj3D(Math.cos(a) * r, Math.sin(a) * r, L.z + L.depth / 2, w, h, t * 0.7, 0.45));
          back.push(proj3D(Math.cos(a) * r, Math.sin(a) * r, L.z - L.depth / 2, w, h, t * 0.7, 0.45));
        }
        for (let i = 0; i < steps; i++) {
          const next = (i + 1) % steps;
          ctx.beginPath();
          ctx.moveTo(front[i].x, front[i].y);
          ctx.lineTo(front[next].x, front[next].y);
          ctx.lineTo(back[next].x, back[next].y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.closePath();
          ctx.fillStyle = L.fill;
          ctx.fill();
          ctx.strokeStyle = L.stroke;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
        ctx.beginPath();
        front.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = L.fill;
        ctx.fill();
        ctx.strokeStyle = L.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    function drawArch(t: number) {
      const info = resizeCanvas(canvasArchRef.current);
      if (!info) return;
      const { ctx, w, h } = info;
      ctx.clearRect(0, 0, w, h);
      const ry = t * 0.55,
        rx = 0.48;
      function drawSolidBox(
        x0: number,
        y0: number,
        z0: number,
        dx: number,
        dy: number,
        dz: number,
        stroke: string,
        fill: string
      ) {
        const v = [
          [x0, y0, z0],
          [x0 + dx, y0, z0],
          [x0 + dx, y0, z0 + dz],
          [x0, y0, z0 + dz],
          [x0, y0 + dy, z0],
          [x0 + dx, y0 + dy, z0],
          [x0 + dx, y0 + dy, z0 + dz],
          [x0, y0 + dy, z0 + dz],
        ].map((p) => proj3D(p[0], p[1], p[2], w, h, ry, rx));
        const faces = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 1, 5, 4],
          [1, 2, 6, 5],
          [2, 3, 7, 6],
          [3, 0, 4, 7],
        ];
        faces.forEach((f) => {
          ctx.beginPath();
          ctx.moveTo(v[f[0]].x, v[f[0]].y);
          for (let i = 1; i < 4; i++) ctx.lineTo(v[f[i]].x, v[f[i]].y);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        });
        return v[5];
      }
      const lift = 18 + Math.sin(t * 2) * 12;
      drawSolidBox(-85, -65, -70, 170, 8, 140, "#141413", "#EAE3D5");
      drawSolidBox(-80, -57, -65, 82, 36, 75, "#141413", "rgba(255, 255, 255, 0.92)");
      drawSolidBox(6, -57, -65, 74, 36, 130, "#2F5BFF", "rgba(47, 91, 255, 0.12)");
      const y1 = -18 + lift;
      drawSolidBox(-88, y1, -72, 176, 7, 144, "#141413", "#EAE3D5");
      const topPin = drawSolidBox(-82, y1 + 7, -65, 95, 38, 130, "#2F5BFF", "rgba(47, 91, 255, 0.14)");
      drawSolidBox(18, y1 + 7, -65, 64, 38, 85, "#FF6A1A", "rgba(255, 106, 26, 0.16)");
      ctx.fillStyle = "#FF6A1A";
      ctx.beginPath();
      ctx.arc(topPin.x, topPin.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGen(t: number) {
      const info = resizeCanvas(canvasGenRef.current);
      if (!info) return;
      const { ctx, w, h } = info;
      ctx.clearRect(0, 0, w, h);
      const ry = t * 0.75,
        rx = 0.35 + Math.sin(t * 0.8) * 0.15;
      const rings = 9,
        segs = 14;
      const grid: Array<Array<{ x: number; y: number; z: number }>> = [];
      for (let r = 0; r <= rings; r++) {
        const phi = (r / rings - 0.5) * Math.PI;
        const row = [];
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * Math.PI * 2;
          const rad = 84 * (1 + 0.25 * Math.sin(theta * 3 + t * 2) * Math.cos(phi * 2));
          row.push(
            proj3D(
              Math.cos(phi) * Math.cos(theta) * rad,
              Math.sin(phi) * rad * 1.12,
              Math.cos(phi) * Math.sin(theta) * rad,
              w,
              h,
              ry,
              rx
            )
          );
        }
        grid.push(row);
      }
      const quads: Array<{
        p0: { x: number; y: number; z: number };
        p1: { x: number; y: number; z: number };
        p2: { x: number; y: number; z: number };
        p3: { x: number; y: number; z: number };
        avgZ: number;
      }> = [];
      for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segs; s++) {
          const ns = (s + 1) % segs;
          const p0 = grid[r][s],
            p1 = grid[r][ns],
            p2 = grid[r + 1][ns],
            p3 = grid[r + 1][s];
          quads.push({ p0, p1, p2, p3, avgZ: (p0.z + p1.z + p2.z + p3.z) * 0.25 });
        }
      }
      quads.sort((a, b) => b.avgZ - a.avgZ);
      const scanY = h / 2 + Math.sin(t * 2.2) * 70;
      quads.forEach((q) => {
        const cy = (q.p0.y + q.p2.y) * 0.5;
        const nearScan = Math.abs(cy - scanY) < 16;
        ctx.beginPath();
        ctx.moveTo(q.p0.x, q.p0.y);
        ctx.lineTo(q.p1.x, q.p1.y);
        ctx.lineTo(q.p2.x, q.p2.y);
        ctx.lineTo(q.p3.x, q.p3.y);
        ctx.closePath();
        ctx.fillStyle = nearScan ? "rgba(255, 106, 26, 0.28)" : "rgba(255, 255, 255, 0.85)";
        ctx.fill();
        ctx.strokeStyle = nearScan ? "#FF6A1A" : "#6D4AFF";
        ctx.lineWidth = nearScan ? 1.6 : 0.9;
        ctx.stroke();
      });
    }

    function animate() {
      const t = performance.now() * 0.0012;
      drawMech(t);
      drawArch(t);
      drawGen(t);
      animId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const getCardPositionClass = (idx: number) => {
    if (idx === mod) return "pos-front";
    if (idx === rightIdx) return "pos-right";
    if (idx === leftIdx) return "pos-left";
    return "";
  };

  return (
    <section className="orbital-hero-root">
      <style jsx>{`
        .orbital-hero-root {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 94px 20px 56px;
          overflow: hidden;
          background-color: #f4f1e6;
          color: #141413;
          border-bottom: 1.5px solid #141413;
          background-image: linear-gradient(rgba(20, 20, 19, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 20, 19, 0.04) 1px, transparent 1px),
            linear-gradient(rgba(20, 20, 19, 0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 20, 19, 0.018) 1px, transparent 1px);
          background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px;
        }
        .hero-top-meta {
          width: 100%;
          max-width: 1320px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 14px;
          margin-bottom: 22px;
          border-bottom: 1px dashed rgba(20, 20, 19, 0.25);
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: #575652;
          z-index: 10;
        }
        .header-box {
          position: relative;
          z-index: 10;
          text-align: center;
          margin-bottom: 20px;
          max-width: 920px;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 15px;
          background: #faf8f2;
          border: 1.5px solid #141413;
          box-shadow: 3px 3px 0px rgba(20, 20, 19, 0.12);
          color: #141413;
          margin-bottom: 14px;
        }
        .eyebrow-dot {
          width: 8px;
          height: 8px;
          background: #ff6a1a;
          border-radius: 50%;
        }
        .hero-mega-slogan {
          font-family: "Instrument Serif", Georgia, serif;
          font-size: clamp(42px, 6.2vw, 76px);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.02;
          margin-bottom: 12px;
          color: #141413;
        }
        .slogan-slash {
          color: #ff6a1a;
          font-weight: 400;
          margin: 0 4px;
        }
        .slogan-highlight {
          font-style: italic;
          color: #ff6a1a;
        }
        .header-sub {
          font-size: 15.5px;
          color: #575652;
          max-width: 680px;
          margin: 0 auto;
        }
        .swipe-bar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .swipe-pill {
          border: 1.5px solid #141413;
          background: #faf8f2;
          color: #141413;
          font-family: "JetBrains Mono", monospace;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 9px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .swipe-pill.active-0 {
          background: #141413;
          color: #f4f1e6;
          box-shadow: 3px 3px 0px #ff6a1a;
        }
        .swipe-pill.active-1 {
          background: #141413;
          color: #f4f1e6;
          box-shadow: 3px 3px 0px #2f5bff;
        }
        .swipe-pill.active-2 {
          background: #141413;
          color: #f4f1e6;
          box-shadow: 3px 3px 0px #6d4aff;
        }
        .carousel-viewport {
          position: relative;
          width: 100%;
          max-width: 1360px;
          height: 580px;
          perspective: 1600px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          user-select: none;
          cursor: grab;
        }
        .carousel-viewport:active {
          cursor: grabbing;
        }
        .orbital-floor-ring {
          position: absolute;
          width: 980px;
          height: 980px;
          border-radius: 50%;
          border: 1.5px dashed rgba(20, 20, 19, 0.25);
          transform: translateY(240px) rotateX(78deg);
          pointer-events: none;
          transition: border-color 0.6s ease;
        }
        .carousel-stage {
          position: relative;
          width: 470px;
          height: 545px;
          transform-style: preserve-3d;
        }
        .orbital-card {
          position: absolute;
          inset: 0;
          padding: 24px;
          background: #faf8f2;
          border: 2px solid #141413;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.8s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          will-change: transform, filter, opacity;
          cursor: pointer;
        }
        .orbital-card.pos-front {
          transform: translate3d(0px, 0px, 110px) rotateY(0deg) scale(1.03);
          filter: blur(0px);
          opacity: 1;
          z-index: 30;
          box-shadow: 12px 12px 0px #141413;
        }
        .orbital-card.pos-right {
          transform: translate3d(395px, -12px, -150px) rotateY(-26deg) rotateZ(1.2deg) scale(0.85);
          filter: blur(2.5px);
          opacity: 0.76;
          z-index: 15;
          box-shadow: 6px 6px 0px rgba(20, 20, 19, 0.18);
        }
        .orbital-card.pos-left {
          transform: translate3d(-395px, -12px, -150px) rotateY(26deg) rotateZ(-1.2deg) scale(0.85);
          filter: blur(2.5px);
          opacity: 0.76;
          z-index: 15;
          box-shadow: 6px 6px 0px rgba(20, 20, 19, 0.18);
        }
        .orbital-card.pos-right:hover,
        .orbital-card.pos-left:hover {
          filter: blur(0.8px);
          opacity: 0.92;
        }
        .back-focus-hint {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #141413;
          border: 1.5px solid #141413;
          color: #f4f1e6;
          font-size: 10px;
          font-family: "JetBrains Mono", monospace;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          white-space: nowrap;
        }
        .orbital-card:hover .back-focus-hint {
          opacity: 1;
        }
        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #141413;
          font-family: "JetBrains Mono", monospace;
          font-size: 10.5px;
          font-weight: 700;
          color: #575652;
        }
        .badge-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 9px;
          color: #fff;
        }
        .mini-3d-stage {
          position: relative;
          width: 100%;
          height: 235px;
          background-color: #edeff2;
          background-image: linear-gradient(rgba(20, 20, 19, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 20, 19, 0.06) 1px, transparent 1px);
          background-size: 20px 20px;
          border: 1.5px solid #141413;
          overflow: hidden;
          margin: 12px 0;
        }
        .mini-3d-stage canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .mini-hud-top {
          position: absolute;
          top: 8px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          font-family: "JetBrains Mono", monospace;
          font-size: 9.5px;
          font-weight: 700;
          color: #141413;
          pointer-events: none;
        }
        .mini-hud {
          position: absolute;
          bottom: 8px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          font-family: "JetBrains Mono", monospace;
          font-size: 9.5px;
          font-weight: 700;
          color: #141413;
          pointer-events: none;
        }
        .card-title {
          font-family: "Instrument Serif", Georgia, serif;
          font-size: 30px;
          font-weight: 400;
          line-height: 1.05;
          color: #141413;
        }
        .card-sub {
          font-family: "JetBrains Mono", monospace;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #575652;
          margin-bottom: 6px;
        }
        .card-desc {
          font-size: 13.5px;
          line-height: 1.48;
          color: #575652;
          margin-bottom: 12px;
        }
        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .tag-chip {
          font-size: 10.5px;
          font-family: "JetBrains Mono", monospace;
          font-weight: 700;
          padding: 3px 8px;
          background: #efece0;
          border: 1px solid #141413;
          color: #141413;
        }
        .cta-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 11px 16px;
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          color: #f4f1e6;
          background: #141413;
          border: 1.5px solid #141413;
          transition: all 0.2s ease;
        }
        .cta-link:hover {
          background: #ff6a1a;
          color: #ffffff;
        }
        .controls-footer {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 14px;
        }
        .nav-arrow {
          width: 42px;
          height: 42px;
          border: 1.5px solid #141413;
          background: #faf8f2;
          color: #141413;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .nav-arrow:hover {
          background: #141413;
          color: #f4f1e6;
        }
        .scroll-hint {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          font-weight: 600;
          color: #575652;
        }
        @media (max-width: 960px) {
          .carousel-stage {
            width: 345px;
            height: 540px;
          }
          .orbital-card.pos-right {
            transform: translate3d(195px, -12px, -180px) rotateY(-24deg) scale(0.78);
          }
          .orbital-card.pos-left {
            transform: translate3d(-195px, -12px, -180px) rotateY(24deg) scale(0.78);
          }
        }
      `}</style>

      <div className="hero-top-meta">
        <span>DWG // MPX-2026-UNIFIED · SCALE 1:1</span>
        <span>TRI-ENGINE SPATIAL SYNTHESIS — CAD · BIM · MESH</span>
        <span>TOLERANCE: ISO 2768-fH (±0.02 mm)</span>
      </div>

      <div className="header-box">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          <span>UNIFIED AI 3D ENGINE · MECHANICAL CAD · ARCHITECTURE · CREATIVE 3D</span>
        </div>
        <h1 className="hero-mega-slogan">
          Type it <span className="slogan-slash">/</span> See it —{" "}
          <span className="slogan-highlight">Just Morphix it</span>
        </h1>
        <p className="header-sub">
          One unified drafting table for precision Mechanical CAD, Architectural floor-to-3D massing, and rigged 4K PBR
          meshes — click any card to open its studio.
        </p>
      </div>

      <div className="swipe-bar">
        <button
          type="button"
          className={`swipe-pill ${mod === 0 ? "active-0" : ""}`}
          onClick={() => (mod === 0 ? openEngineSection(0) : goToCard(0))}
        >
          <span>01 · Mechanical CAD</span>
        </button>
        <button
          type="button"
          className={`swipe-pill ${mod === 1 ? "active-1" : ""}`}
          onClick={() => (mod === 1 ? openEngineSection(1) : goToCard(1))}
        >
          <span>02 · Architecture Studio</span>
        </button>
        <button
          type="button"
          className={`swipe-pill ${mod === 2 ? "active-2" : ""}`}
          onClick={() => (mod === 2 ? openEngineSection(2) : goToCard(2))}
        >
          <span>03 · Creative 3D Atelier</span>
        </button>
      </div>

      <div
        className="carousel-viewport"
        ref={viewportRef}
        onPointerDown={(e) => {
          pointerStartXRef.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (pointerStartXRef.current === null) return;
          const dx = e.clientX - pointerStartXRef.current;
          if (Math.abs(dx) > 40) stepCarousel(dx < 0 ? 1 : -1);
          pointerStartXRef.current = null;
        }}
      >
        <div className="orbital-floor-ring" />

        <div className="carousel-stage">
          {/* CARD 0: MECHANICAL CAD */}
          <div
            className={`orbital-card ${getCardPositionClass(0)}`}
            onClick={() => handleCardClick(0)}
            style={{
              boxShadow: mod === 0 ? `10px 10px 0px #141413, ${THEMES[0].shadow}` : undefined,
            }}
          >
            <div className="back-focus-hint">
              {mod === 0 ? "Click to Open Mechanical CAD Studio" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <span>ENGINE 01 // B-REP CAD</span>
              <span className="badge-tag" style={{ background: "#FF6A1A" }}>
                CNC-READY
              </span>
            </div>

            <div className="mini-3d-stage" style={{ backgroundColor: "#EDEFF2" }}>
              <div className="mini-hud-top">
                <span>PLANETARY TURBINE ASSY</span>
                <span style={{ color: "#FF6A1A" }}>GD&amp;T ±0.02mm</span>
              </div>
              <canvas ref={canvasMechRef} />
              <div className="mini-hud">
                <span style={{ color: "#FF6A1A" }}>● ISO 2768-fH MANIFOLD</span>
                <span>.STEP / .STL / .GLB</span>
              </div>
            </div>

            <div>
              <div className="card-title">Mechanical CAD</div>
              <div className="card-sub">Engineering &amp; Manufacturing</div>
              <p className="card-desc">
                Design precision-engineered parts, planetary gears, housings, brackets, and CNC assemblies with
                parametric AI.
              </p>
              <div className="tag-row">
                <span className="tag-chip">.STEP</span>
                <span className="tag-chip">.STL</span>
                <span className="tag-chip">.DXF</span>
                <span className="tag-chip">Parametric</span>
              </div>
              <a
                href="/mechanical_cad_section.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
              >
                <span>Open Mechanical Studio</span> <span>→</span>
              </a>
            </div>
          </div>

          {/* CARD 1: ARCHITECTURE STUDIO */}
          <div
            className={`orbital-card ${getCardPositionClass(1)}`}
            onClick={() => handleCardClick(1)}
            style={{
              boxShadow: mod === 1 ? `10px 10px 0px #141413` : undefined,
            }}
          >
            <div className="back-focus-hint">
              {mod === 1 ? "Click to Open Architecture Studio" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <span>ENGINE 02 // SPATIAL BIM</span>
              <span className="badge-tag" style={{ background: "#2F5BFF" }}>
                1:100 PLAN
              </span>
            </div>

            <div className="mini-3d-stage" style={{ backgroundColor: "#F4EFE6" }}>
              <div className="mini-hud-top">
                <span>G+2 BIM MASSING + MEP</span>
                <span style={{ color: "#2F5BFF" }}>WET-WALL: ALIGNED</span>
              </div>
              <canvas ref={canvasArchRef} />
              <div className="mini-hud">
                <span style={{ color: "#2F5BFF" }}>● CODE CHECK: PASS</span>
                <span>1,200 SQ.FT · DXF + GLB</span>
              </div>
            </div>

            <div>
              <div className="card-title">Architecture Studio</div>
              <div className="card-sub">Floor Plans to Full 3D</div>
              <p className="card-desc">
                Watch 2D drafting lines extrude into structural walls, furnished cutaways, and full architectural
                exteriors.
              </p>
              <div className="tag-row">
                <span className="tag-chip">.PDF</span>
                <span className="tag-chip">.DXF</span>
                <span className="tag-chip">.USDZ</span>
                <span className="tag-chip">.GLB</span>
              </div>
              <a
                href="/architecture_studio_section.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
              >
                <span>Open Architecture Studio</span> <span>→</span>
              </a>
            </div>
          </div>

          {/* CARD 2: CREATIVE 3D ATELIER */}
          <div
            className={`orbital-card ${getCardPositionClass(2)}`}
            onClick={() => handleCardClick(2)}
            style={{
              boxShadow: mod === 2 ? `10px 10px 0px #141413` : undefined,
            }}
          >
            <div className="back-focus-hint">
              {mod === 2 ? "Click to Open Creative 3D Atelier" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <span>ENGINE 03 // MESH ATELIER</span>
              <span className="badge-tag" style={{ background: "#6D4AFF" }}>
                4K PBR + RIG
              </span>
            </div>

            <div className="mini-3d-stage" style={{ backgroundColor: "#F2EFE9" }}>
              <div className="mini-hud-top">
                <span>PBR SCULPTURE + LASER SCAN</span>
                <span style={{ color: "#6D4AFF" }}>WATERTIGHT MESH</span>
              </div>
              <canvas ref={canvasGenRef} />
              <div className="mini-hud">
                <span style={{ color: "#FF6A1A" }}>● 65-BONE AUTO-RIG</span>
                <span>48.2K QUADS · 4K PBR</span>
              </div>
            </div>

            <div>
              <div className="card-title">Creative 3D Atelier</div>
              <div className="card-sub">Assets &amp; Characters</div>
              <p className="card-desc">
                Create game assets, rigged characters, and shaded 4K PBR sculptures on a daylight sculpture turntable.
              </p>
              <div className="tag-row">
                <span className="tag-chip">.GLB</span>
                <span className="tag-chip">.FBX</span>
                <span className="tag-chip">.OBJ</span>
                <span className="tag-chip">.USDZ</span>
              </div>
              <a
                href="/creative_3d_darkroom.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
              >
                <span>Open Creative 3D Studio</span> <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-footer">
        <button type="button" className="nav-arrow" onClick={() => stepCarousel(-1)} title="Previous Engine">
          ←
        </button>
        <div className="scroll-hint">
          <span>SCROLL OR SWIPE TO ORBIT 3D ENGINES · CLICK ACTIVE CARD TO LAUNCH STUDIO</span>
        </div>
        <button type="button" className="nav-arrow" onClick={() => stepCarousel(1)} title="Next Engine">
          →
        </button>
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";

const ENGINE_SECTION_URLS = [
  "/mechanical_cad_section.html",
  "/architecture_studio_section.html",
  "/creative_3d_darkroom.html",
];

const THEMES = [
  {
    glow: "radial-gradient(circle, #00F0FF, transparent 70%)",
    border: "rgba(0,240,255,0.55)",
    shadow: "0 30px 75px rgba(0,240,255,0.25)",
  },
  {
    glow: "radial-gradient(circle, #F15534, transparent 70%)",
    border: "rgba(241,85,52,0.55)",
    shadow: "0 30px 75px rgba(241,85,52,0.25)",
  },
  {
    glow: "radial-gradient(circle, #FF2FD4, transparent 70%)",
    border: "rgba(255,47,212,0.55)",
    shadow: "0 30px 75px rgba(255,47,212,0.25)",
  },
];

export default function Orbital3DHero() {
  const [activeIndex, setActiveIndex] = useState<number>(2); // Start on Creative 3D or cycle freely
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

  // 3D Canvas Animations for the 3 Orbital Cards
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
      const spread = 34 + Math.sin(t * 2.2) * 18;
      const layers = [
        { z: -spread, rOut: 62, rIn: 48, depth: 12, teeth: 14, stroke: "#ff5900", fill: "rgba(255, 89, 0, 0.24)" },
        { z: 0, rOut: 98, rIn: 76, depth: 20, teeth: 20, stroke: "#00F0FF", fill: "rgba(0, 240, 255, 0.22)" },
        { z: spread, rOut: 58, rIn: 44, depth: 12, teeth: 12, stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.25)" },
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
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        front.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = L.fill;
        ctx.fill();
        ctx.strokeStyle = L.stroke;
        ctx.lineWidth = 1.6;
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
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
        return v[5];
      }
      const lift = 18 + Math.sin(t * 2) * 12;
      drawSolidBox(-85, -65, -70, 170, 8, 140, "#F15534", "rgba(241, 85, 52, 0.25)");
      drawSolidBox(-80, -57, -65, 82, 36, 75, "#F15534", "rgba(241, 85, 52, 0.22)");
      drawSolidBox(6, -57, -65, 74, 36, 130, "#fb923c", "rgba(251, 146, 60, 0.18)");
      const y1 = -18 + lift;
      drawSolidBox(-88, y1, -72, 176, 7, 144, "#00E5FF", "rgba(0, 229, 255, 0.25)");
      const topPin = drawSolidBox(-82, y1 + 7, -65, 95, 38, 130, "#00E5FF", "rgba(0, 229, 255, 0.18)");
      drawSolidBox(18, y1 + 7, -65, 64, 38, 85, "#a855f7", "rgba(168, 85, 247, 0.24)");
      ctx.fillStyle = "#F15534";
      ctx.beginPath();
      ctx.arc(topPin.x, topPin.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGen(t: number) {
      const info = resizeCanvas(canvasGenRef.current);
      if (!info) return;
      const { ctx, w, h } = info;
      ctx.clearRect(0, 0, w, h);
      const ry = t * 0.75,
        rx = 0.35 + Math.sin(t * 0.8) * 0.15;
      const rings = 10,
        segs = 16;
      const grid: Array<Array<{ x: number; y: number; z: number }>> = [];
      for (let r = 0; r <= rings; r++) {
        const phi = (r / rings - 0.5) * Math.PI;
        const row = [];
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * Math.PI * 2;
          const rad = 88 * (1 + 0.28 * Math.sin(theta * 3 + t * 2) * Math.cos(phi * 2));
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
        r: number;
        s: number;
      }> = [];
      for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segs; s++) {
          const ns = (s + 1) % segs;
          const p0 = grid[r][s],
            p1 = grid[r][ns],
            p2 = grid[r + 1][ns],
            p3 = grid[r + 1][s];
          quads.push({ p0, p1, p2, p3, avgZ: (p0.z + p1.z + p2.z + p3.z) * 0.25, r, s });
        }
      }
      quads.sort((a, b) => b.avgZ - a.avgZ);
      const scanY = h / 2 + Math.sin(t * 2.2) * 75;
      quads.forEach((q) => {
        const cy = (q.p0.y + q.p2.y) * 0.5;
        const nearScan = Math.abs(cy - scanY) < 18;
        const hue = (q.s / segs) * 90 + (q.r / rings) * 60 + 265;
        ctx.beginPath();
        ctx.moveTo(q.p0.x, q.p0.y);
        ctx.lineTo(q.p1.x, q.p1.y);
        ctx.lineTo(q.p2.x, q.p2.y);
        ctx.lineTo(q.p3.x, q.p3.y);
        ctx.closePath();
        ctx.fillStyle = nearScan ? "rgba(0, 255, 213, 0.52)" : `hsla(${hue}, 88%, 56%, 0.26)`;
        ctx.fill();
        ctx.strokeStyle = nearScan ? "#00FFD5" : `hsla(${hue}, 95%, 70%, 0.72)`;
        ctx.lineWidth = nearScan ? 1.8 : 0.95;
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
          padding: 96px 20px 56px;
          overflow: hidden;
          background: #06060b;
          background-image: linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .ambient-glow {
          position: absolute;
          width: 820px;
          height: 820px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.28;
          pointer-events: none;
          transition: background 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 0;
        }
        .header-box {
          position: relative;
          z-index: 10;
          text-align: center;
          margin-bottom: 16px;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          margin-bottom: 12px;
        }
        .hero-mega-slogan {
          font-size: clamp(32px, 5.2vw, 66px);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1.06;
          margin-bottom: 10px;
          color: #ffffff;
          text-shadow: 0 12px 42px rgba(0, 0, 0, 0.65);
        }
        .slogan-slash {
          color: #00f0ff;
          font-weight: 400;
          margin: 0 4px;
        }
        .slogan-highlight {
          background: linear-gradient(90deg, #00f0ff 0%, #9e7bff 48%, #ff2fd4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-sub {
          font-size: 14.5px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .swipe-bar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 15, 24, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px;
          border-radius: 999px;
          margin-bottom: 22px;
          backdrop-filter: blur(12px);
          flex-wrap: wrap;
          justify-content: center;
        }
        .swipe-pill {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 12.5px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .swipe-pill.active-0 {
          background: linear-gradient(135deg, #00f0ff, #0ea5e9);
          color: #041019;
          box-shadow: 0 0 24px rgba(0, 240, 255, 0.45);
        }
        .swipe-pill.active-1 {
          background: linear-gradient(135deg, #f15534, #a855f7);
          color: #ffffff;
          box-shadow: 0 0 24px rgba(241, 85, 52, 0.45);
        }
        .swipe-pill.active-2 {
          background: linear-gradient(135deg, #ff2fd4, #8052ff);
          color: #ffffff;
          box-shadow: 0 0 24px rgba(255, 47, 212, 0.45);
        }
        .carousel-viewport {
          position: relative;
          width: 100%;
          max-width: 1360px;
          height: 600px;
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
          width: 1020px;
          height: 1020px;
          border-radius: 50%;
          border: 1.5px dashed rgba(255, 255, 255, 0.16);
          transform: translateY(250px) rotateX(78deg);
          pointer-events: none;
          box-shadow: inset 0 0 110px rgba(255, 255, 255, 0.04);
          transition: border-color 0.6s ease, box-shadow 0.6s ease;
        }
        .carousel-stage {
          position: relative;
          width: 490px;
          height: 565px;
          transform-style: preserve-3d;
        }
        .orbital-card {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          padding: 26px;
          background: rgba(12, 13, 22, 0.94);
          backdrop-filter: blur(22px);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          transform-style: preserve-3d;
          transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.85s ease,
            border-color 0.6s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          will-change: transform, filter, opacity;
          cursor: pointer;
        }
        .orbital-card.pos-front {
          transform: translate3d(0px, 0px, 120px) rotateY(0deg) scale(1.04);
          filter: blur(0px) brightness(1.05) saturate(1.08);
          opacity: 1;
          z-index: 30;
        }
        .orbital-card.pos-right {
          transform: translate3d(410px, -16px, -160px) rotateY(-28deg) rotateZ(1.5deg) scale(0.84);
          filter: blur(5.5px) brightness(0.58) saturate(0.82);
          opacity: 0.68;
          z-index: 15;
        }
        .orbital-card.pos-left {
          transform: translate3d(-410px, -16px, -160px) rotateY(28deg) rotateZ(-1.5deg) scale(0.84);
          filter: blur(5.5px) brightness(0.58) saturate(0.82);
          opacity: 0.68;
          z-index: 15;
        }
        .orbital-card.pos-right:hover,
        .orbital-card.pos-left:hover {
          filter: blur(2.5px) brightness(0.78);
          opacity: 0.86;
        }
        .back-focus-hint {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          font-size: 10px;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: 999px;
          opacity: 0;
          transition: opacity 0.25s;
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
        }
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .badge-tag {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          color: #fff;
        }
        .mini-3d-stage {
          position: relative;
          width: 100%;
          height: 245px;
          border-radius: 20px;
          background: radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.08), rgba(3, 4, 9, 0.96));
          border: 1px solid rgba(255, 255, 255, 0.12);
          overflow: hidden;
          margin: 12px 0;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.75);
        }
        .mini-3d-stage canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .mini-hud-top {
          position: absolute;
          top: 10px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          font-family: monospace;
          font-size: 10px;
          color: #94a3b8;
          pointer-events: none;
        }
        .mini-hud {
          position: absolute;
          bottom: 10px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          font-family: monospace;
          font-size: 10px;
          color: #cbd5e1;
          pointer-events: none;
        }
        .card-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .card-sub {
          font-size: 12.5px;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .card-desc {
          font-size: 13.5px;
          line-height: 1.5;
          color: #cbd5e1;
          margin-bottom: 12px;
        }
        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .tag-chip {
          font-size: 11px;
          font-family: monospace;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #cbd5e1;
        }
        .cta-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          color: #fff;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.14);
          transition: all 0.25s ease;
        }
        .cta-link:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
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
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(15, 16, 26, 0.85);
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .nav-arrow:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: scale(1.08);
        }
        .scroll-hint {
          font-family: monospace;
          font-size: 11.5px;
          color: #94a3b8;
        }
        @media (max-width: 960px) {
          .carousel-stage {
            width: 350px;
            height: 545px;
          }
          .orbital-card.pos-right {
            transform: translate3d(200px, -12px, -180px) rotateY(-24deg) scale(0.78);
          }
          .orbital-card.pos-left {
            transform: translate3d(-200px, -12px, -180px) rotateY(24deg) scale(0.78);
          }
        }
      `}</style>

      <div className="ambient-glow" style={{ background: THEMES[mod].glow }} />

      <div className="header-box">
        <div className="eyebrow">✨ Unified AI 3D Engine · Mechanical CAD · Architecture · Creative 3D</div>
        <h1 className="hero-mega-slogan">
          Type it <span className="slogan-slash">/</span> See it —{" "}
          <span className="slogan-highlight">Just Morphix it</span>
        </h1>
        <p className="header-sub">
          Scroll or swipe to orbit the 3D engines — click any engine card to open its dedicated 3D Studio!
        </p>
      </div>

      <div className="swipe-bar">
        <button
          type="button"
          className={`swipe-pill ${mod === 0 ? "active-0" : ""}`}
          onClick={() => (mod === 0 ? openEngineSection(0) : goToCard(0))}
        >
          <span>1st Swipe · ⚙️ Mechanical CAD</span>
        </button>
        <button
          type="button"
          className={`swipe-pill ${mod === 1 ? "active-1" : ""}`}
          onClick={() => (mod === 1 ? openEngineSection(1) : goToCard(1))}
        >
          <span>2nd Swipe · 🏛️ Architecture (Heron AI)</span>
        </button>
        <button
          type="button"
          className={`swipe-pill ${mod === 2 ? "active-2" : ""}`}
          onClick={() => (mod === 2 ? openEngineSection(2) : goToCard(2))}
        >
          <span>3rd Swipe · 🎨 Creative 3D</span>
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
        <div className="orbital-floor-ring" style={{ borderColor: THEMES[mod].border }} />

        <div className="carousel-stage">
          {/* CARD 0: MECHANICAL CAD */}
          <div
            className={`orbital-card ${getCardPositionClass(0)}`}
            onClick={() => handleCardClick(0)}
            style={{
              borderColor: "rgba(0,240,255,0.55)",
              boxShadow: mod === 0 ? THEMES[0].shadow : "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div className="back-focus-hint">
              {mod === 0 ? "Click to Open Mechanical CAD Studio" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <div className="icon-box" style={{ background: "linear-gradient(135deg, #00F0FF, #0EA5E9)" }}>
                ⚙️
              </div>
              <span
                className="badge-tag"
                style={{ background: "linear-gradient(90deg, #00F0FF, #0EA5E9)", color: "#03121a" }}
              >
                CAD · SWIPE 1
              </span>
            </div>

            <div className="mini-3d-stage">
              <div className="mini-hud-top">
                <span>PLANETARY TURBINE ASSY</span>
                <span style={{ color: "#ff5900" }}>GD&amp;T ±0.01mm</span>
              </div>
              <canvas ref={canvasMechRef} />
              <div className="mini-hud">
                <span style={{ color: "#00F0FF" }}>● ISO 2768-m MANIFOLD</span>
                <span>Ø120mm · STEP / STL / GLB</span>
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
                <span className="tag-chip">STEP Export</span>
                <span className="tag-chip">Parametric</span>
                <span className="tag-chip">CNC Ready</span>
              </div>
              <a
                href="/mechanical_cad_section.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
                style={{ borderColor: "rgba(0,240,255,0.45)" }}
              >
                <span>Open Mechanical CAD</span> <span>→</span>
              </a>
            </div>
          </div>

          {/* CARD 1: ARCHITECTURE HERON AI */}
          <div
            className={`orbital-card ${getCardPositionClass(1)}`}
            onClick={() => handleCardClick(1)}
            style={{
              borderColor: "rgba(241,85,52,0.55)",
              boxShadow: mod === 1 ? THEMES[1].shadow : "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div className="back-focus-hint">
              {mod === 1 ? "Click to Open Architecture Studio" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <div className="icon-box" style={{ background: "linear-gradient(135deg, #F15534, #7B2FFF)" }}>
                🏛️
              </div>
              <span className="badge-tag" style={{ background: "linear-gradient(90deg, #F15534, #7B2FFF)" }}>
                ARCH · SWIPE 2
              </span>
            </div>

            <div className="mini-3d-stage">
              <div className="mini-hud-top">
                <span>G+2 BIM MASSING + MEP</span>
                <span style={{ color: "#00E5FF" }}>WET-WALL: ALIGNED</span>
              </div>
              <canvas ref={canvasArchRef} />
              <div className="mini-hud">
                <span style={{ color: "#F15534" }}>● HERON CODE CHECK: PASS</span>
                <span>2,400 SQ.FT · DXF + 3D GLB</span>
              </div>
            </div>

            <div>
              <div className="card-title">Architecture</div>
              <div className="card-sub">Buildings, BIM &amp; MEP Interiors</div>
              <p className="card-desc">
                Generate collision-free floor plans, 3D extruded villas, MEP plumbing stacks, and code-checked layouts.
              </p>
              <div className="tag-row">
                <span className="tag-chip">Floor Plans</span>
                <span className="tag-chip">MEP Stack</span>
                <span className="tag-chip">DXF/GLB Export</span>
              </div>
              <a
                href="/architecture_studio_section.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
                style={{ borderColor: "rgba(241,85,52,0.45)" }}
              >
                <span>Open Architecture Studio</span> <span>→</span>
              </a>
            </div>
          </div>

          {/* CARD 2: CREATIVE 3D */}
          <div
            className={`orbital-card ${getCardPositionClass(2)}`}
            onClick={() => handleCardClick(2)}
            style={{
              borderColor: "rgba(255,47,212,0.55)",
              boxShadow: mod === 2 ? THEMES[2].shadow : "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div className="back-focus-hint">
              {mod === 2 ? "Click to Open Creative 3D Darkroom" : "Click or Swipe to Focus"}
            </div>
            <div className="card-top">
              <div className="icon-box" style={{ background: "linear-gradient(135deg, #FF2FD4, #8052FF)" }}>
                🎨
              </div>
              <span className="badge-tag" style={{ background: "linear-gradient(90deg, #FF2FD4, #8052FF)" }}>
                3D · SWIPE 3
              </span>
            </div>

            <div className="mini-3d-stage">
              <div className="mini-hud-top">
                <span>PBR SCULPTURE + LASER SCAN</span>
                <span style={{ color: "#FF2FD4" }}>WATERTIGHT MESH</span>
              </div>
              <canvas ref={canvasGenRef} />
              <div className="mini-hud">
                <span style={{ color: "#00FFD5" }}>● SHADED QUAD TOPOLOGY</span>
                <span>48.2K QUADS · 4K PBR MAPS</span>
              </div>
            </div>

            <div>
              <div className="card-title">Creative 3D</div>
              <div className="card-sub">Assets &amp; Characters</div>
              <p className="card-desc">
                Create game assets, characters, props, and shaded 3D sculptures from text prompts or reference images.
              </p>
              <div className="tag-row">
                <span className="tag-chip">Text to 3D</span>
                <span className="tag-chip">Image to 3D</span>
                <span className="tag-chip">AI Texture</span>
              </div>
              <a
                href="/creative_3d_darkroom.html"
                onClick={(e) => e.stopPropagation()}
                className="cta-link"
                style={{ borderColor: "rgba(255,47,212,0.45)" }}
              >
                <span>Open Creative 3D</span> <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-footer">
        <button type="button" className="nav-arrow" onClick={() => stepCarousel(-1)} title="Previous Swipe">
          ←
        </button>
        <div className="scroll-hint">
          <span>🖱️ Scroll inside carousel to Orbit 3D · Click active card to open its Studio ↓</span>
        </div>
        <button type="button" className="nav-arrow" onClick={() => stepCarousel(1)} title="Next Swipe">
          →
        </button>
      </div>
    </section>
  );
}

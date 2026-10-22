/**
 * AI Pipeline: Architecture (BIM + MEP + 3D Extrusion Engine)
 * Supports: OpenAI (GPT-4o-mini) OR Google Gemini (Gemini 3.5/2.5 Flash) + Parametric Solver
 * Exports: SVG Blueprint (with Dimensions, Plumbing & Electrical), DXF (CAD), and Real 3D GLB Model
 */

import fs from "fs";
import path from "path";
import { prisma } from "../../lib/prisma";
import { buildGlbFromBoxes, BoxPrimitive } from "../gltfBuilder";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function updateJob(id: string, data: Record<string, unknown>) {
  return prisma.generation.update({ where: { id }, data }).catch(() => {});
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface Door {
  roomId: string;
  wall: "N" | "S" | "E" | "W";
  position: number; // 0-1 along wall
}

interface FloorPlan {
  totalWidth: number;
  totalHeight: number;
  floors: number;
  rooms: Room[];
  doors: Door[];
  externalWallThickness: number;
  style: string;
}

// ─── AI Architect Brain (OpenAI GPT-4o-mini OR Google Gemini Flash) ───────────

async function generateFloorPlanJSON(
  prompt: string,
  houseStyle: string,
  sqft: number,
  floors: number,
  rooms: Record<string, number>
): Promise<FloorPlan> {
  const roomList = Object.entries(rooms)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}(s)`)
    .join(", ");

  // Parse explicit plot dimensions if user wrote e.g. "20x42" or "30 x 40"
  const plotMatch = prompt.match(/(\d{2,3})\s*[x×*]\s*(\d{2,3})/i);
  const targetW = plotMatch ? parseInt(plotMatch[1], 10) : Math.round(Math.sqrt(sqft / Math.max(floors, 1)) * 0.85);
  const targetH = plotMatch ? parseInt(plotMatch[2], 10) : Math.round((sqft / Math.max(floors, 1)) / Math.max(targetW, 20));

  const systemPrompt = `You are a licensed architect and MEP engineer for 3dmorphix.com.
Generate a non-overlapping architectural floor plan as valid JSON matching this exact schema:
{
  "totalWidth": ${targetW},
  "totalHeight": ${targetH},
  "floors": ${floors},
  "style": "${houseStyle}",
  "externalWallThickness": 0.5,
  "rooms": [
    {"id": "r1", "name": "Living Room", "x": 0, "y": 0, "width": 14, "height": 12, "type": "living"}
  ],
  "doors": [
    {"roomId": "r1", "wall": "S", "position": 0.5}
  ]
}
Strict Rules:
1. Every room must fit inside totalWidth (${targetW} ft) x totalHeight (${targetH} ft).
2. ZERO room overlaps: for any two rooms, their bounding boxes [x, x+width] and [y, y+height] must NOT intersect.
3. Align wet areas (kitchen, bathroom) along the same side wall for clean plumbing stacks.
4. Include staircase if floors > 1.
5. Room types must be one of: living, stair, dining, kitchen, bedroom, bathroom, passage, garage, garden, utility.
6. Return ONLY valid JSON.`;

  const userMessage = `Design a ${floors}-floor ${houseStyle} building (${prompt}). Plot: ${targetW}x${targetH} ft. Rooms requested: ${roomList}.`;

  // 1. Try OpenAI GPT-4o-mini if key is configured
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 1800,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices: { message: { content: string } }[] };
        const parsed = JSON.parse(data.choices[0].message.content) as FloorPlan;
        return validateAndSanitizePlan(parsed, houseStyle, floors);
      }
    } catch (e) {
      console.warn("[Architecture] OpenAI call failed, trying Gemini/Parametric fallback:", e);
    }
  }

  // 2. Try Google Gemini Flash if GEMINI_API_KEY is configured
  if (GEMINI_API_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as FloorPlan;
          return validateAndSanitizePlan(parsed, houseStyle, floors);
        }
      }
    } catch (e) {
      console.warn("[Architecture] Gemini call failed, using Parametric Solver:", e);
    }
  }

  // 3. Deterministic Parametric Solver (Zero overlap guaranteed)
  return getParametricFloorPlan(prompt, houseStyle, targetW, targetH, floors, rooms);
}

// ─── Collision Validator & Parametric Grid Solver ─────────────────────────────

function validateAndSanitizePlan(plan: FloorPlan, style: string, floors: number): FloorPlan {
  const W = Math.max(plan.totalWidth || 20, 16);
  const H = Math.max(plan.totalHeight || 42, 20);
  const validRooms: Room[] = [];

  for (const r of plan.rooms || []) {
    const rx = Math.max(0, Math.min(W - 3, Number(r.x) || 0));
    const ry = Math.max(0, Math.min(H - 3, Number(r.y) || 0));
    const rw = Math.max(3, Math.min(W - rx, Number(r.width) || 8));
    const rh = Math.max(3, Math.min(H - ry, Number(r.height) || 8));

    // Check overlap against already accepted rooms
    const overlaps = validRooms.some(
      (o) => rx < o.x + o.width - 0.1 && rx + rw > o.x + 0.1 && ry < o.y + o.height - 0.1 && ry + rh > o.y + 0.1
    );
    if (!overlaps) {
      validRooms.push({
        id: r.id || `r${validRooms.length + 1}`,
        name: r.name || "Room",
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        type: (r.type || "living").toLowerCase(),
      });
    }
  }

  if (validRooms.length < 3) {
    return getParametricFloorPlan("", style, W, H, floors, { bedroom: 2, bathroom: 2, kitchen: 1 });
  }

  return {
    totalWidth: W,
    totalHeight: H,
    floors: plan.floors || floors || 2,
    style: plan.style || style,
    externalWallThickness: 0.5,
    rooms: validRooms,
    doors: plan.doors || [],
  };
}

function getParametricFloorPlan(
  prompt: string,
  style: string,
  plotW: number,
  plotH: number,
  floors: number,
  rooms: Record<string, number>
): FloorPlan {
  // Check if user requested compact narrow plot (like 20x42 ft) or wide plot
  const isCompact = plotW <= 26 || /20\s*[x×]\s*42|g\+1|rental/i.test(prompt);
  const W = isCompact ? 20 : Math.max(plotW, 30);
  const H = isCompact ? 42 : Math.max(plotH, 40);

  const splitX1 = Math.round(W * 0.7); // e.g., 14 ft on 20ft plot
  const splitX2 = Math.round(W * 0.6); // e.g., 12 ft on 20ft plot
  const passW = Math.max(3, Math.round(W * 0.15)); // e.g., 3 ft passage
  const bathW = W - splitX2 - passW; // e.g., 5 ft on 20ft plot

  const y1 = Math.round(H * 0.285); // 12 ft on 42ft plot
  const y2 = y1 + Math.round(H * 0.215); // 21 ft on 42ft plot
  const rearH = H - y2; // 21 ft on 42ft plot
  const bed1H = Math.round(rearH * 0.52); // 11 ft
  const bed2H = rearH - bed1H; // 10 ft
  const bathH = Math.round(rearH / 3); // 7 ft

  const bedrooms = rooms.bedroom || 2;

  const generatedRooms: Room[] = [
    { id: "GF_1", name: "Living Room", x: 0, y: 0, width: splitX1, height: y1, type: "living" },
    { id: "GF_2", name: floors > 1 ? "Indep. Staircase" : "Foyer / Porch", x: splitX1, y: 0, width: W - splitX1, height: y1, type: "stair" },
    { id: "GF_3", name: "Dining Area", x: 0, y: y1, width: splitX2, height: y2 - y1, type: "dining" },
    { id: "GF_4", name: "Kitchen", x: splitX2, y: y1, width: W - splitX2, height: y2 - y1, type: "kitchen" },
    { id: "GF_5", name: "Master Bedroom", x: 0, y: y2, width: splitX2, height: bed1H, type: "bedroom" },
    { id: "GF_6", name: bedrooms >= 2 ? "Bedroom 2" : "Study / Guest", x: 0, y: y2 + bed1H, width: splitX2, height: bed2H, type: "bedroom" },
    { id: "GF_7", name: "Passage", x: splitX2, y: y2, width: passW, height: rearH, type: "passage" },
    { id: "GF_8", name: "Bath/WC 1", x: splitX2 + passW, y: y2, width: bathW, height: bathH, type: "bathroom" },
    { id: "GF_9", name: "Bath/WC 2", x: splitX2 + passW, y: y2 + bathH, width: bathW, height: bathH, type: "bathroom" },
    { id: "GF_10", name: "Utility / Shaft", x: splitX2 + passW, y: y2 + bathH * 2, width: bathW, height: rearH - bathH * 2, type: "utility" },
  ];

  return {
    totalWidth: W,
    totalHeight: H,
    floors: Math.max(floors, 1),
    style,
    externalWallThickness: 0.5,
    rooms: generatedRooms,
    doors: [
      { roomId: "GF_1", wall: "S", position: 0.5 },
      { roomId: "GF_2", wall: "S", position: 0.5 },
      { roomId: "GF_4", wall: "W", position: 0.5 },
      { roomId: "GF_5", wall: "E", position: 0.5 },
      { roomId: "GF_6", wall: "E", position: 0.5 },
      { roomId: "GF_8", wall: "W", position: 0.5 },
      { roomId: "GF_9", wall: "W", position: 0.5 },
    ],
  };
}

// ─── Render High-Detail CAD + MEP Blueprint SVG ──────────────────────────────

function renderFloorPlanSVG(plan: FloorPlan): string {
  const scale = 12; // 1 ft = 12px
  const padX = 48;
  const padY = 46;
  const plotW = plan.totalWidth * scale;
  const plotH = plan.totalHeight * scale;
  const gap = 56;
  const showSecondFloor = plan.floors >= 2;
  const canvasW = showSecondFloor ? padX * 2 + plotW * 2 + gap : padX * 2 + plotW + 220;
  const canvasH = padY + plotH + 135;

  const roomColors: Record<string, string> = {
    living: "#1e3a5f",
    stair: "#2d3748",
    dining: "#1e3a4c",
    kitchen: "#3b2f1e",
    bedroom: "#272343",
    passage: "#1a202c",
    bathroom: "#133b3b",
    bath: "#133b3b",
    utility: "#1f2937",
    garage: "#262626",
    garden: "#143326",
    default: "#1e293b",
  };

  function drawSingleFloor(offsetX: number, title: string, isGround: boolean): string {
    const toX = (x: number) => offsetX + x * scale;
    const toY = (y: number, h = 0) => padY + (plan.totalHeight - y - h) * scale;

    let g = `<g>`;
    g += `<text x="${offsetX + plotW / 2}" y="28" fill="#f8fafc" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${title}</text>`;
    g += `<rect x="${offsetX - 3}" y="${padY - 3}" width="${plotW + 6}" height="${plotH + 6}" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>`;

    for (const r of plan.rooms) {
      const rx = toX(r.x);
      const ry = toY(r.y, r.height);
      const rw = r.width * scale;
      const rh = r.height * scale;
      const fill = roomColors[r.type] || roomColors.default;
      const label = !isGround && r.name === "Living Room" ? "Rental Living" : !isGround && r.name.includes("Stair") ? "Stair Landing" : r.name;

      g += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.8"/>`;

      if (r.type === "stair") {
        for (let s = 1; s < 8; s++) {
          const sy = ry + (rh / 8) * s;
          g += `<line x1="${rx + 4}" y1="${sy}" x2="${rx + rw - 4}" y2="${sy}" stroke="#64748b" stroke-width="1"/>`;
        }
      }

      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      if (r.type === "passage" && r.width <= 4) {
        g += `<text x="${cx}" y="${cy}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" transform="rotate(-90 ${cx} ${cy})">${label} (${r.width}'x${r.height}')</text>`;
      } else {
        const fs = r.width <= 5 ? 8.5 : 10;
        g += `<text x="${cx}" y="${cy - 4}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="${fs}" font-weight="bold" text-anchor="middle">${label}</text>`;
        g += `<text x="${cx}" y="${cy + 9}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="${fs - 1}" text-anchor="middle">${r.width}'x${r.height}' (${(r.width * r.height).toFixed(0)}sf)</text>`;
      }

      // Electrical symbol (Fan / LED + Conduit)
      if (r.type !== "passage" && r.type !== "stair") {
        g += `<circle cx="${cx}" cy="${cy - 16}" r="4.5" fill="#0f172a" stroke="#fbbf24" stroke-width="1.3"/>`;
      }
    }

    // Plumbing: Underground Water Sump (UGWT) + Cold Water Supply (Blue) + Soil/Waste Stack (Green Dashed)
    const sumpX = toX(1.2);
    const sumpY = toY(1, 3);
    if (isGround) {
      g += `<rect x="${sumpX}" y="${sumpY}" width="${4 * scale}" height="${3 * scale}" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,2"/>`;
      g += `<text x="${sumpX + 2 * scale}" y="${sumpY + 1.7 * scale}" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">UGWT SUMP</text>`;
    }
    const pipeX = toX(plan.totalWidth - 1.2);
    g += `<line x1="${pipeX}" y1="${toY(2)}" x2="${pipeX}" y2="${toY(plan.totalHeight - 3)}" stroke="#38bdf8" stroke-width="2"/>`;
    g += `<line x1="${pipeX + 6}" y1="${toY(10)}" x2="${pipeX + 6}" y2="${toY(plan.totalHeight - 2)}" stroke="#34d399" stroke-width="1.8" stroke-dasharray="4,3"/>`;

    // Main Electrical DB
    const dbX = toX(plan.totalWidth * 0.65);
    const dbY = toY(plan.totalHeight * 0.25);
    g += `<rect x="${dbX - 7}" y="${dbY - 5}" width="15" height="10" fill="#f43f5e" stroke="#ffffff" stroke-width="1"/>`;
    g += `<text x="${dbX}" y="${dbY + 3}" fill="#ffffff" font-family="Arial, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">${isGround ? "DB" : "1F"}</text>`;

    // Plot Dimensions & Front Road
    g += `<text x="${offsetX + plotW / 2}" y="${padY + plotH + 16}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" text-anchor="middle">Plot Width: ${plan.totalWidth}'-0"</text>`;
    g += `<text x="${offsetX - 12}" y="${padY + plotH / 2}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" transform="rotate(-90 ${offsetX - 12} ${padY + plotH / 2})">Plot Depth: ${plan.totalHeight}'-0"</text>`;

    const roadY = padY + plotH + 24;
    g += `<rect x="${offsetX - 4}" y="${roadY}" width="${plotW + 8}" height="18" fill="#1e293b" stroke="#475569"/>`;
    g += `<text x="${offsetX + plotW / 2}" y="${roadY + 12}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">20 FT FRONT ACCESS ROAD (SOUTH)</text>`;
    g += `</g>`;
    return g;
  }

  let body = drawSingleFloor(padX, "GROUND FLOOR PLAN (ARCHITECTURAL + MEP)", true);
  if (showSecondFloor) {
    body += drawSingleFloor(padX + plotW + gap, "FIRST FLOOR PLAN (G+1 RENTAL / UPPER UNIT)", false);
  }

  // Title Block & Symbol Legend Footer
  const legendY = padY + plotH + 52;
  body += `
    <rect x="${padX - 4}" y="${legendY}" width="${canvasW - padX * 2 + 8}" height="68" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="${padX + 12}" y="${legendY + 20}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="11" font-weight="bold">
      3DMORPHIX.COM — BIM &amp; MEP SHEET (${plan.totalWidth}' × ${plan.totalHeight}' • ${(plan.totalWidth * plan.totalHeight).toFixed(0)} SQ.FT/FLOOR • ${plan.style.toUpperCase()})
    </text>
    <text x="${padX + 12}" y="${legendY + 38}" fill="#38bdf8" font-family="Arial, sans-serif" font-size="9.5">
      ■ UGWT = Underground Water Sump   ─── Blue Line = Cold Water Pipe (CW-R)   - - - Green Dashed = Soil/Waste Drain Stack (SW-S)
    </text>
    <text x="${padX + 12}" y="${legendY + 54}" fill="#fbbf24" font-family="Arial, sans-serif" font-size="9.5">
      ■ Red DB = Main / 1F Distribution Board   ● Yellow Circle = Ceiling Fan / LED Point   Scale: 1' = 12px (Zero-Overlap Verified)
    </text>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <rect width="100%" height="100%" fill="#070b14"/>
  ${body}
</svg>`;
}

// ─── Build Real AutoCAD DXF File from FloorPlan ───────────────────────────────

function renderFloorPlanDXF(plan: FloorPlan): string {
  const lines: string[] = [
    "0", "SECTION", "2", "ENTITIES",
  ];
  for (const r of plan.rooms) {
    const x0 = r.x, y0 = r.y, x1 = r.x + r.width, y1 = r.y + r.height;
    const edges = [
      [x0, y0, x1, y0],
      [x1, y0, x1, y1],
      [x1, y1, x0, y1],
      [x0, y1, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      lines.push("0", "LINE", "8", "WALLS", "10", String(ax), "20", String(ay), "30", "0.0", "11", String(bx), "21", String(by), "31", "0.0");
    }
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}

// ─── Extrude FloorPlan into a Real 3D Binary .GLB Building Model ──────────────

function buildArchitecture3DGlb(plan: FloorPlan): Buffer {
  const boxes: BoxPrimitive[] = [];
  const scale = 0.25; // 1 ft = 0.25 units in Three.js viewport so 20x42ft = 5x10.5 units
  const cx = plan.totalWidth / 2;
  const cz = plan.totalHeight / 2;
  const wallH = 9.5 * scale;
  const wallT = 0.45 * scale;
  const slabT = 0.5 * scale;

  const colorMap: Record<string, [number, number, number]> = {
    living: [0.22, 0.45, 0.72],
    stair: [0.45, 0.52, 0.62],
    dining: [0.20, 0.55, 0.68],
    kitchen: [0.75, 0.52, 0.24],
    bedroom: [0.48, 0.38, 0.78],
    passage: [0.32, 0.38, 0.46],
    bathroom: [0.18, 0.62, 0.58],
    bath: [0.18, 0.62, 0.58],
    utility: [0.38, 0.44, 0.52],
  };

  // Ground Plot Base Pad
  boxes.push({
    x: 0,
    y: -slabT / 2,
    z: 0,
    w: (plan.totalWidth + 4) * scale,
    h: slabT,
    d: (plan.totalHeight + 4) * scale,
    color: [0.14, 0.18, 0.24],
  });

  const numFloors = Math.min(Math.max(plan.floors || 1, 1), 4);

  for (let f = 0; f < numFloors; f++) {
    const baseY = f * (wallH + slabT);

    for (const r of plan.rooms) {
      const rx = (r.x + r.width / 2 - cx) * scale;
      const rz = (r.y + r.height / 2 - cz) * scale;
      const rw = r.width * scale;
      const rd = r.height * scale;
      const roomColor = colorMap[r.type] || [0.35, 0.45, 0.60];

      // Colored Floor Slab for Room
      boxes.push({
        x: rx,
        y: baseY + slabT / 2,
        z: rz,
        w: rw,
        h: slabT,
        d: rd,
        color: roomColor,
      });

      const wallColor: [number, number, number] = f === 0 ? [0.85, 0.88, 0.92] : [0.78, 0.84, 0.94];
      const wy = baseY + slabT + wallH / 2;

      // North & South Walls of Room
      boxes.push({ x: rx, y: wy, z: (r.y - cz) * scale, w: rw, h: wallH, d: wallT, color: wallColor });
      boxes.push({ x: rx, y: wy, z: (r.y + r.height - cz) * scale, w: rw, h: wallH, d: wallT, color: wallColor });

      // West & East Walls of Room
      boxes.push({ x: (r.x - cx) * scale, y: wy, z: rz, w: wallT, h: wallH, d: rd, color: wallColor });
      boxes.push({ x: (r.x + r.width - cx) * scale, y: wy, z: rz, w: wallT, h: wallH, d: rd, color: wallColor });
    }
  }

  return buildGlbFromBoxes(boxes);
}

// ─── MAIN PIPELINE ────────────────────────────────────────────────────────────

export async function runArchitecture(
  generationId: string,
  prompt: string,
  houseStyle: string,
  sqft: number,
  floors: number,
  rooms: Record<string, number>
): Promise<void> {
  try {
    await updateJob(generationId, { status: "PROCESSING", progress: 10 });

    // Step 1: Generate & validate collision-free FloorPlan JSON
    console.log(`[Architecture] Generating floor plan for: "${prompt}" (${floors} floors)`);
    const floorPlan = await generateFloorPlanJSON(prompt, houseStyle, sqft, floors, rooms);
    await updateJob(generationId, { progress: 45 });

    // Step 2: Render Architectural + MEP SVG Blueprint & AutoCAD DXF
    const svgContent = renderFloorPlanSVG(floorPlan);
    const dxfContent = renderFloorPlanDXF(floorPlan);
    await updateJob(generationId, { progress: 70 });

    // Step 3: Extrude Real 3D Building .GLB Model
    const glbBuffer = buildArchitecture3DGlb(floorPlan);
    await updateJob(generationId, { progress: 90 });

    // Save GLB and SVG to uploads directory so direct links work too
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const glbFilename = `arch-${generationId}.glb`;
    fs.writeFileSync(path.join(uploadDir, glbFilename), glbBuffer);

    const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
    const dxfDataUri = `data:application/dxf;base64,${Buffer.from(dxfContent).toString("base64")}`;
    const glbDataUri = `data:model/gltf-binary;base64,${glbBuffer.toString("base64")}`;

    const outputUrls: Record<string, string> = {
      svg: svgDataUri,
      preview: svgDataUri,
      dxf: dxfDataUri,
      pdf: svgDataUri,
      glb: glbDataUri,
    };

    await updateJob(generationId, {
      status: "COMPLETED",
      progress: 100,
      outputUrls,
      completedAt: new Date(),
    });

    console.log(`[Architecture] Generation ${generationId} complete (${floorPlan.rooms.length} rooms, ${floorPlan.floors} floors)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Architecture] Fatal error:", msg);
    await updateJob(generationId, {
      status: "FAILED",
      errorMessage: msg,
      completedAt: new Date(),
    });
  }
}

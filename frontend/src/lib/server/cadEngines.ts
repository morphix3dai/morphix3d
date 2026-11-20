/**
 * Pure-TypeScript Mechanical CAD & Architecture BIM Engines for Vercel Serverless
 */

import { buildGlbFromBoxes, buildStlFromBoxes, BoxPrimitive } from "./gltfBuilder";

export type MechanicalArchetype =
  | "gear"
  | "bracket"
  | "flange"
  | "shaft"
  | "piston"
  | "pulley"
  | "heatsink"
  | "enclosure"
  | "bolt";

export function detectMechanicalArchetype(prompt: string, partType: string): MechanicalArchetype {
  const text = `${prompt} ${partType}`.toLowerCase();
  if (text.includes("piston") || text.includes("plunger") || text.includes("valve") || text.includes("actuator")) return "piston";
  if (text.includes("heatsink") || text.includes("heat sink") || text.includes("cooler") || text.includes("radiator") || text.includes("fin")) return "heatsink";
  if (text.includes("pulley") || text.includes("sheave") || text.includes("flywheel") || text.includes("spool") || text.includes("drum")) return "pulley";
  if (text.includes("bolt") || text.includes("screw") || text.includes("nut") || text.includes("fastener") || text.includes("stud") || text.includes("thread")) return "bolt";
  if (text.includes("shaft") || text.includes("axle") || text.includes("spindle") || text.includes("rod") || text.includes("roller") || text.includes("pin")) return "shaft";
  if (text.includes("flange") || text.includes("coupling") || text.includes("collar") || text.includes("hub") || text.includes("bearing") || text.includes("bushing") || text.includes("disc") || text.includes("ring")) return "flange";
  if (text.includes("box") || text.includes("enclosure") || text.includes("case") || text.includes("housing") || text.includes("chassis")) return "enclosure";
  if (text.includes("bracket") || text.includes("mount") || text.includes("plate") || text.includes("angle") || text.includes("clamp")) return "bracket";
  return "gear";
}

export function buildMechanicalOutputs(
  prompt: string,
  partType = "gear",
  material = "Steel"
): Record<string, string> {
  const archetype = detectMechanicalArchetype(prompt, partType);
  const matText = `${material} ${prompt}`.toLowerCase();

  let baseColor: [number, number, number] = [0.68, 0.72, 0.78];
  if (matText.includes("aluminum") || matText.includes("6061")) baseColor = [0.82, 0.85, 0.89];
  else if (matText.includes("titanium") || matText.includes("ti-6al")) baseColor = [0.55, 0.58, 0.63];
  else if (matText.includes("brass") || matText.includes("bronze")) baseColor = [0.85, 0.68, 0.25];
  else if (matText.includes("copper")) baseColor = [0.84, 0.48, 0.31];
  else if (matText.includes("delrin") || matText.includes("plastic") || matText.includes("nylon")) baseColor = [0.25, 0.55, 0.88];

  const accentColor: [number, number, number] = [
    Math.max(0.12, baseColor[0] * 0.78),
    Math.max(0.12, baseColor[1] * 0.78),
    Math.max(0.12, baseColor[2] * 0.78),
  ];
  const orangeHighlight: [number, number, number] = [0.96, 0.42, 0.12];

  const teethMatch = prompt.match(/(\d{1,2})\s*(?:-|\s)?(?:tooth|teeth|t\b|z\b|fin|bolt|hole)/i);
  const countParam = teethMatch ? Math.max(6, Math.min(36, parseInt(teethMatch[1], 10))) : 20;

  const boxes: BoxPrimitive[] = [];

  const addCylinderRing = (
    yCenter: number,
    outerR: number,
    innerR: number,
    height: number,
    segments: number,
    color: [number, number, number]
  ) => {
    const midR = (outerR + innerR) / 2;
    const radialThick = Math.max(0.18, outerR - innerR);
    const arcLen = Math.max(0.2, ((Math.PI * 2 * midR) / segments) * 1.15);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      boxes.push({
        x: Math.cos(a) * midR,
        y: yCenter,
        z: Math.sin(a) * midR,
        w: radialThick,
        h: height,
        d: arcLen,
        color,
      });
    }
  };

  if (archetype === "bracket") {
    boxes.push({ x: 0, y: 0.22, z: 0, w: 3.4, h: 0.44, d: 2.5, color: baseColor });
    boxes.push({ x: -1.48, y: 1.7, z: 0, w: 0.44, h: 2.95, d: 2.5, color: baseColor });
    boxes.push({ x: -0.65, y: 0.95, z: -1.08, w: 1.25, h: 1.25, d: 0.26, color: accentColor });
    boxes.push({ x: -0.65, y: 0.95, z: 1.08, w: 1.25, h: 1.25, d: 0.26, color: accentColor });
    addCylinderRing(0.46, 0.42, 0.22, 0.14, 12, orangeHighlight);
  } else if (archetype === "enclosure") {
    const W = 3.6, H = 1.45, D = 2.6, t = 0.24;
    boxes.push({ x: 0, y: 0, z: 0, w: W, h: t, d: D, color: accentColor });
    boxes.push({ x: 0, y: H / 2, z: D / 2 - t / 2, w: W, h: H, d: t, color: baseColor });
    boxes.push({ x: 0, y: H / 2, z: -D / 2 + t / 2, w: W, h: H, d: t, color: baseColor });
    boxes.push({ x: W / 2 - t / 2, y: H / 2, z: 0, w: t, h: H, d: D, color: baseColor });
    boxes.push({ x: -W / 2 + t / 2, y: H / 2, z: 0, w: t, h: H, d: D, color: baseColor });
    boxes.push({ x: W / 2 + 0.32, y: 0, z: 0, w: 0.64, h: t, d: 1.3, color: accentColor });
    boxes.push({ x: -W / 2 - 0.32, y: 0, z: 0, w: 0.64, h: t, d: 1.3, color: accentColor });
  } else if (archetype === "flange") {
    addCylinderRing(0.25, 2.1, 0.75, 0.45, 24, baseColor);
    addCylinderRing(0.75, 1.15, 0.75, 0.65, 20, accentColor);
    addCylinderRing(1.08, 0.85, 0.72, 0.08, 16, orangeHighlight);
  } else if (archetype === "shaft") {
    addCylinderRing(0.4, 0.65, 0.15, 0.8, 16, accentColor);
    addCylinderRing(1.4, 0.92, 0.2, 1.2, 20, baseColor);
    addCylinderRing(2.4, 0.72, 0.15, 0.8, 16, accentColor);
    boxes.push({ x: 0.92, y: 1.4, z: 0, w: 0.22, h: 0.9, d: 0.24, color: orangeHighlight });
  } else if (archetype === "piston") {
    addCylinderRing(2.1, 1.55, 0.0, 0.38, 24, baseColor);
    addCylinderRing(1.72, 1.42, 1.1, 0.14, 20, orangeHighlight);
    addCylinderRing(1.52, 1.55, 1.1, 0.18, 24, baseColor);
    addCylinderRing(1.32, 1.42, 1.1, 0.14, 20, orangeHighlight);
    addCylinderRing(0.72, 1.52, 1.22, 1.1, 24, accentColor);
    boxes.push({ x: 0, y: 0.75, z: 0, w: 3.1, h: 0.42, d: 0.42, color: orangeHighlight });
  } else if (archetype === "pulley") {
    addCylinderRing(0.2, 2.0, 0.5, 0.26, 24, baseColor);
    addCylinderRing(0.55, 1.55, 0.5, 0.44, 24, accentColor);
    addCylinderRing(0.9, 2.0, 0.5, 0.26, 24, baseColor);
    addCylinderRing(0.55, 0.65, 0.35, 1.15, 16, orangeHighlight);
  } else if (archetype === "heatsink") {
    const numFins = Math.max(7, Math.min(15, Math.round(countParam / 2)));
    const W = 3.4, D = 2.8, baseH = 0.35, finH = 1.55;
    boxes.push({ x: 0, y: baseH / 2, z: 0, w: W, h: baseH, d: D, color: baseColor });
    for (let i = 0; i < numFins; i++) {
      const fx = -W / 2 + 0.15 + (i / (numFins - 1)) * (W - 0.3);
      boxes.push({ x: fx, y: baseH + finH / 2, z: 0, w: 0.11, h: finH, d: D, color: accentColor });
    }
  } else if (archetype === "bolt") {
    addCylinderRing(2.35, 1.15, 0.0, 0.55, 6, baseColor);
    addCylinderRing(1.2, 0.58, 0.0, 1.8, 16, accentColor);
    for (let k = 0; k < 6; k++) {
      addCylinderRing(0.35 + k * 0.22, 0.66, 0.45, 0.09, 16, orangeHighlight);
    }
  } else {
    const numTeeth = Math.max(10, Math.min(32, countParam));
    const radius = 1.85;
    const thickness = 0.68;
    addCylinderRing(0.5, radius, 0.55, thickness, 24, baseColor);
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const tx = Math.cos(angle) * (radius + 0.22);
      const tz = Math.sin(angle) * (radius + 0.22);
      boxes.push({ x: tx, y: 0.5, z: tz, w: 0.34, h: thickness, d: 0.34, color: accentColor });
    }
    addCylinderRing(0.58, 0.68, 0.42, thickness * 1.35, 16, orangeHighlight);
  }

  const glbBuf = buildGlbFromBoxes(boxes);
  const stlStr = buildStlFromBoxes(boxes, "MorphixCADPart");
  const stepStr = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Morphix 3D Parametric CAD - ${prompt.replace(/'/g, "")}'),'2;1');\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;`;

  let dxfStr = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";
  for (const b of boxes) {
    const x1 = ((b.x - b.w / 2) * 20).toFixed(3);
    const y1 = ((b.z - b.d / 2) * 20).toFixed(3);
    const x2 = ((b.x + b.w / 2) * 20).toFixed(3);
    const y2 = ((b.z + b.d / 2) * 20).toFixed(3);
    dxfStr += `0\nLINE\n8\nCAD_GEOMETRY\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y1}\n`;
    dxfStr += `0\nLINE\n8\nCAD_GEOMETRY\n10\n${x2}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
    dxfStr += `0\nLINE\n8\nCAD_GEOMETRY\n10\n${x2}\n20\n${y2}\n11\n${x1}\n21\n${y2}\n`;
    dxfStr += `0\nLINE\n8\nCAD_GEOMETRY\n10\n${x1}\n20\n${y2}\n11\n${x1}\n21\n${y1}\n`;
  }
  dxfStr += "0\nENDSEC\n0\nEOF\n";

  const glbDataUri = `data:model/gltf-binary;base64,${glbBuf.toString("base64")}`;
  const stlDataUri = `data:model/stl;base64,${Buffer.from(stlStr).toString("base64")}`;
  const stepDataUri = `data:application/step;base64,${Buffer.from(stepStr).toString("base64")}`;
  const dxfDataUri = `data:application/dxf;base64,${Buffer.from(dxfStr).toString("base64")}`;

  return {
    glb: glbDataUri,
    stl: stlDataUri,
    step: stepDataUri,
    dxf: dxfDataUri,
    obj: stlDataUri,
  };
}

// ─── Architecture BIM Engine ──────────────────────────────────────────────────

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface FloorPlan {
  totalWidth: number;
  totalHeight: number;
  floors: number;
  rooms: Room[];
  externalWallThickness: number;
  style: string;
}

function getParametricFloorPlan(
  prompt: string,
  style: string,
  plotW: number,
  plotH: number,
  floors: number,
  rooms: Record<string, number>
): FloorPlan {
  const isCompact = plotW <= 26 || /20\s*[x×]\s*42|g\+1|rental/i.test(prompt);
  const W = isCompact ? 20 : Math.max(plotW, 30);
  const H = isCompact ? 42 : Math.max(plotH, 40);

  const splitX1 = Math.round(W * 0.7);
  const splitX2 = Math.round(W * 0.6);
  const passW = Math.max(3, Math.round(W * 0.15));
  const bathW = W - splitX2 - passW;

  const y1 = Math.round(H * 0.285);
  const y2 = y1 + Math.round(H * 0.215);
  const rearH = H - y2;
  const bed1H = Math.round(rearH * 0.52);
  const bed2H = rearH - bed1H;
  const bathH = Math.round(rearH / 3);
  const bedrooms = rooms?.bedroom || 2;

  return {
    totalWidth: W,
    totalHeight: H,
    floors: Math.max(floors, 1),
    style,
    externalWallThickness: 0.5,
    rooms: [
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
    ],
  };
}

function renderFloorPlanSVG(plan: FloorPlan): string {
  const scale = 12;
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
    }

    const pipeX = toX(plan.totalWidth - 1.2);
    g += `<line x1="${pipeX}" y1="${toY(2)}" x2="${pipeX}" y2="${toY(plan.totalHeight - 3)}" stroke="#38bdf8" stroke-width="2"/>`;
    g += `<line x1="${pipeX + 6}" y1="${toY(10)}" x2="${pipeX + 6}" y2="${toY(plan.totalHeight - 2)}" stroke="#34d399" stroke-width="1.8" stroke-dasharray="4,3"/>`;
    g += `<text x="${offsetX + plotW / 2}" y="${padY + plotH + 16}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" text-anchor="middle">Plot Width: ${plan.totalWidth}'-0"</text>`;
    g += `</g>`;
    return g;
  }

  let body = drawSingleFloor(padX, "GROUND FLOOR PLAN (ARCHITECTURAL + MEP)", true);
  if (showSecondFloor) {
    body += drawSingleFloor(padX + plotW + gap, "FIRST FLOOR PLAN (G+1 UPPER UNIT)", false);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <rect width="100%" height="100%" fill="#070b14"/>
  ${body}
</svg>`;
}

function renderFloorPlanDXF(plan: FloorPlan): string {
  const lines: string[] = ["0", "SECTION", "2", "ENTITIES"];
  for (const r of plan.rooms) {
    const x0 = r.x,
      y0 = r.y,
      x1 = r.x + r.width,
      y1 = r.y + r.height;
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

function buildArchitecture3DGlb(plan: FloorPlan): Buffer {
  const boxes: BoxPrimitive[] = [];
  const scale = 0.25;
  const cx = plan.totalWidth / 2;
  const cz = plan.totalHeight / 2;
  const wallH = 9.5 * scale;
  const wallT = 0.45 * scale;
  const slabT = 0.5 * scale;

  const colorMap: Record<string, [number, number, number]> = {
    living: [0.22, 0.45, 0.72],
    stair: [0.45, 0.52, 0.62],
    dining: [0.2, 0.55, 0.68],
    kitchen: [0.75, 0.52, 0.24],
    bedroom: [0.48, 0.38, 0.78],
    passage: [0.32, 0.38, 0.46],
    bathroom: [0.18, 0.62, 0.58],
    utility: [0.38, 0.44, 0.52],
  };

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
      const roomColor = colorMap[r.type] || [0.35, 0.45, 0.6];

      boxes.push({ x: rx, y: baseY + slabT / 2, z: rz, w: rw, h: slabT, d: rd, color: roomColor });

      const wallColor: [number, number, number] = f === 0 ? [0.85, 0.88, 0.92] : [0.78, 0.84, 0.94];
      const wy = baseY + slabT + wallH / 2;

      boxes.push({ x: rx, y: wy, z: (r.y - cz) * scale, w: rw, h: wallH, d: wallT, color: wallColor });
      boxes.push({ x: rx, y: wy, z: (r.y + r.height - cz) * scale, w: rw, h: wallH, d: wallT, color: wallColor });
      boxes.push({ x: (r.x - cx) * scale, y: wy, z: rz, w: wallT, h: wallH, d: rd, color: wallColor });
      boxes.push({ x: (r.x + r.width - cx) * scale, y: wy, z: rz, w: wallT, h: wallH, d: rd, color: wallColor });
    }
  }

  return buildGlbFromBoxes(boxes);
}

export async function buildArchitectureOutputs(
  prompt: string,
  houseStyle = "modern",
  sqft = 1500,
  floors = 2,
  rooms: Record<string, number> = { bedroom: 3, bathroom: 2, kitchen: 1 }
): Promise<Record<string, string>> {
  const plotMatch = prompt.match(/(\d{2,3})\s*[x×*]\s*(\d{2,3})/i);
  const targetW = plotMatch ? parseInt(plotMatch[1], 10) : Math.round(Math.sqrt(sqft / Math.max(floors, 1)) * 0.85);
  const targetH = plotMatch ? parseInt(plotMatch[2], 10) : Math.round(sqft / Math.max(floors, 1) / Math.max(targetW, 20));

  const floorPlan = getParametricFloorPlan(prompt, houseStyle, targetW, targetH, floors, rooms);
  const svgContent = renderFloorPlanSVG(floorPlan);
  const dxfContent = renderFloorPlanDXF(floorPlan);
  const glbBuffer = buildArchitecture3DGlb(floorPlan);

  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
  const dxfDataUri = `data:application/dxf;base64,${Buffer.from(dxfContent).toString("base64")}`;
  const glbDataUri = `data:model/gltf-binary;base64,${glbBuffer.toString("base64")}`;

  return {
    svg: svgDataUri,
    preview: svgDataUri,
    dxf: dxfDataUri,
    pdf: svgDataUri,
    glb: glbDataUri,
  };
}

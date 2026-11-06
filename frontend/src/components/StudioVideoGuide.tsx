"use client";

import { useState } from "react";
import { PlayCircle, X, Copy, Check, Sparkles, Download } from "lucide-react";
import toast from "react-hot-toast";

export type StudioGuideId =
  | "mechanical"
  | "architecture"
  | "text-to-3d"
  | "image-to-3d"
  | "texture"
  | "remesh"
  | "rig";

interface StudioGuideConfig {
  title: string;
  accentColor: string;
  videoUrl: string;
  formula: string;
  tips: string[];
  bestPrompts: {
    label: string;
    prompt: string;
  }[];
}

const STUDIO_GUIDES: Record<StudioGuideId, StudioGuideConfig> = {
  mechanical: {
    title: "Mechanical CAD Studio — Video & Prompt Guide",
    accentColor: "#FF6A1A",
    videoUrl: "/videos/mechanical-demo.webm",
    formula: "[Part Type] + [Overall Dimensions (mm/in)] + [Teeth / Bore Ø / Fasteners] + [Material & Tolerance]",
    tips: [
      "Specify exact teeth count (e.g. '24-tooth'), bore diameter ('16mm bore'), and thickness ('18mm thick') to auto-sync the B-Rep parametric sliders.",
      "Include machining callouts like 'M6 counterbored holes', '2mm chamfer', or '3mm fillet' for CadQuery Python code generation.",
      "Switch between Shaded, Wireframe, and Exploded views before exporting to .STEP, .STL, .DXF, or .GLB.",
    ],
    bestPrompts: [
      {
        label: "Involute Spur Gear",
        prompt:
          "24-tooth involute spur gear, module 2.0, 20-deg pressure angle, 18mm face thickness, 16mm center bore with 4mm keyway, CNC Steel",
      },
      {
        label: "Heavy-Duty CNC L-Bracket",
        prompt:
          "Heavy-duty 90-degree CNC L-bracket mount, 80x50x12mm flange thickness, dual triangular gusset ribs, 4x M8 counterbored mounting holes, Aluminum 6061",
      },
      {
        label: "IP65 Electronics Enclosure",
        prompt:
          "IP65 CNC aluminum electronics enclosure housing, 120x80x45mm outer dimensions, 3mm wall thickness, 4 corner M3 standoffs, external mounting ears",
      },
    ],
  },
  architecture: {
    title: "Architecture & Floor Plan AI — Video & Prompt Guide",
    accentColor: "#2F5BFF",
    videoUrl: "/videos/architecture-demo.webm",
    formula: "[Plot Size WxH ft] + [Building Style & Floors] + [Room List & Dimensions] + [Wet-Wall Plumbing Alignment]",
    tips: [
      "Always start with your plot size in WxH format (e.g. '20x42 ft' or '30x50 ft') so the BIM solver locks exact plot boundaries.",
      "Mention 'wet areas aligned on east/west wall' to stack kitchen and bathroom plumbing lines cleanly.",
      "Use Stage 01–04 buttons to inspect 2D Blueprint lines, Extruded Structural Walls, Furnished Cutaway, and Exterior Roof.",
    ],
    bestPrompts: [
      {
        label: "20×42 ft Urban Duplex",
        prompt:
          "20x42 ft modern 2-floor residential duplex, 1680 sq ft, front living room 14x12 ft, central staircase, rear open kitchen, wet areas aligned on east wall, 3 bedrooms",
      },
      {
        label: "30×50 ft Courtyard Villa",
        prompt:
          "30x50 ft contemporary 2-floor courtyard villa, 2400 sq ft, double-height living room, island kitchen with utility, 4 bedrooms with attached baths, front 2-car garage",
      },
      {
        label: "35×50 ft Studio Office",
        prompt:
          "35x50 ft open-plan architectural studio office, 1750 sq ft, south reception lobby, 12-seat glass conference room, 2 executive cabins, pantry and restrooms on north wall",
      },
    ],
  },
  "text-to-3d": {
    title: "Creative 3D (Text to 3D) — Video & Prompt Guide",
    accentColor: "#6D4AFF",
    videoUrl: "/videos/text-to-3d-demo.webm",
    formula: "[Single Isolated Hero Subject] + [Silhouette & Pose] + [Surface Materials & Wear] + [4K PBR Art Style]",
    tips: [
      "Describe a single standalone object or character rather than a multi-object background scene.",
      "Include material contrast (e.g. 'matte carbon fiber', 'glowing magma cracks', 'brushed anodized titanium') for richer 4K PBR maps.",
      "Toggle the 65-Bone Auto-Rig Skeleton Overlay to verify joint placement in Idle, T-Pose, and Action stances.",
    ],
    bestPrompts: [
      {
        label: "Obsidian Guardian Mech",
        prompt:
          "Armored obsidian guardian mech with glowing magma cracks between plates, weathered titanium joints, symmetrical front stance, isolated 4K PBR game asset",
      },
      {
        label: "Cyberpunk Recon Drone",
        prompt:
          "Cyberpunk tactical recon drone with dual folding rotors, matte carbon-fiber chassis, safety-orange hydraulic struts, emissive blue optical lens, 4K PBR prop",
      },
      {
        label: "Dark Fantasy Runeblade",
        prompt:
          "Ancient Valyrian steel greatsword with glowing blue rune engravings on the fuller, leather-wrapped grip, wolf-head bronze pommel, stylized PBR weapon prop",
      },
    ],
  },
  "image-to-3d": {
    title: "Image to 3D Reconstruction — Video & Prompt Guide",
    accentColor: "#6D4AFF",
    videoUrl: "/videos/image-to-3d-demo.webm",
    formula: "[Crisp 3/4 Isometric Reference Photo] + [Auto-Remove Background ON] + [High 50K Faces + 4K PBR]",
    tips: [
      "Use a well-lit 3/4 front-isometric photo where the entire object silhouette is visible without cropped edges.",
      "Use Multi-View mode (2–4 angles: Front, Side, Back) when reconstructing complex asymmetrical characters or industrial products.",
      "Enable Auto-Remove Background and High (50K Faces) for watertight quad/triangle geometry.",
    ],
    bestPrompts: [
      {
        label: "Single Photo Best Practice",
        prompt: "Upload a front-3/4 studio product or character photo on a clean background with Auto-Remove Background enabled.",
      },
      {
        label: "Multi-View (Front + Left + Right + Back)",
        prompt: "Switch to Multi-View mode and drop 2–4 orthographic or turntable shots for full 360° volumetric fidelity.",
      },
    ],
  },
  texture: {
    title: "AI PBR Texturing — Video & Prompt Guide",
    accentColor: "#FF6A1A",
    videoUrl: "/videos/texture-demo.webm",
    formula: "[Primary Base Material] + [Secondary Trim/Accents] + [Roughness/Metallic Finish] + [Edge Wear & Patina]",
    tips: [
      "Focus your prompt 100% on surface materials, micro-roughness, metallic reflectance, and weathering rather than object geometry.",
      "Specify contrast between base surfaces and edges (e.g. 'chipped orange paint on sharp edges', 'green verdigris patina in crevices').",
      "Choose 4K resolution to generate crisp Albedo, Normal, Metallic, and Roughness maps.",
    ],
    bestPrompts: [
      {
        label: "Weathered Mecha Titanium",
        prompt:
          "Weathered gunmetal titanium armor plating, brushed metallic finish, chipped safety-orange paint on sharp edges, subtle oil smudges in recessed panel lines, 4K PBR",
      },
      {
        label: "Kintsugi Jade & Gold",
        prompt:
          "Ancient carved imperial jade stone with luminous gold kintsugi veins filling the cracks, polished semi-translucent surface with mossy crevices, high normal depth",
      },
      {
        label: "Aged Bronze & Verdigris",
        prompt:
          "Hammered antique bronze with turquoise green verdigris patina in deep recesses, polished golden highlights on raised edges, realistic metallic roughness maps",
      },
    ],
  },
  remesh: {
    title: "Smart Remesh & Retopology — Video & Prompt Guide",
    accentColor: "#16A34A",
    videoUrl: "/videos/remesh-demo.webm",
    formula: "[Quad Dominant (10K–25K) for Animation] OR [Uniform Tri (2.5K–10K) for Real-Time Engines] + [Auto-Fix Non-Manifold]",
    tips: [
      "Select Quad Dominant topology (10K–25K target polygons) when preparing characters for subdivision or skeletal deformation in Blender/Maya.",
      "Select Uniform Triangulated or Adaptive topology (2.5K–10K) when optimizing high-poly scans for WebGL, Unity, or mobile AR.",
      "Keep Auto-Fix Non-Manifold and 3D Print Watertight Check enabled to close holes and repair flipped normals.",
    ],
    bestPrompts: [
      {
        label: "Animation-Ready Quads (15K)",
        prompt: "Topology: Quad Dominant · Target Polygons: 15,000 · Auto-Fix Non-Manifold: ON",
      },
      {
        label: "Game Engine LOD (5K Triangles)",
        prompt: "Topology: Uniform Tri · Target Polygons: 5,000 · Auto-Fix Non-Manifold: ON",
      },
    ],
  },
  rig: {
    title: "Auto Rigging & Skinning — Video & Prompt Guide",
    accentColor: "#FF6A1A",
    videoUrl: "/videos/rig-demo.webm",
    formula: "[Symmetrical A-Pose / T-Pose Mesh] + [Humanoid 65-Bone or Quadruped 48-Bone Preset] + [Motion Cycles]",
    tips: [
      "Upload character meshes in a symmetrical A-Pose or T-Pose facing forward (+Z) with arms and fingers slightly separated.",
      "Choose Humanoid (65 Bones) for full Unity Humanoid, Unreal Mannequin, and Mixamo compatibility (includes 30 finger bones).",
      "Choose Quadruped (48 Bones) for 4-legged animals and creatures, or Custom (18 Bones) for mechanical props.",
    ],
    bestPrompts: [
      {
        label: "Biped Game Character (65 Bones)",
        prompt: "Character Type: Humanoid · Animations: Idle, Walk, Run, Jump, Attack",
      },
      {
        label: "Creature / Animal (48 Bones)",
        prompt: "Character Type: Quadruped · Animations: Idle, Walk, Run",
      },
    ],
  },
};

export default function StudioVideoGuide({
  studio,
  onSelectPrompt,
}: {
  studio: StudioGuideId;
  onSelectPrompt?: (promptText: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const cfg = STUDIO_GUIDES[studio];

  const handleCopyOrApply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
    if (onSelectPrompt) {
      onSelectPrompt(text);
      toast.success("Best prompt applied to studio!");
      setOpen(false);
    } else {
      toast.success("Prompt copied to clipboard!");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F2] hover:bg-[#141413] text-[#141413] hover:text-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[2px_2px_0px_#FF6A1A] font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
      >
        <PlayCircle className="w-3.5 h-3.5 text-[#FF6A1A]" />
        <span>Watch Video &amp; Prompt Guide</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-[#FAF8F2] border-2 border-[#141413] shadow-[10px_10px_0px_#141413] rounded-2xl overflow-hidden flex flex-col text-[#141413]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F4F1E6] border-b-[1.5px] border-[#141413] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full border border-[#141413]"
                  style={{ backgroundColor: cfg.accentColor }}
                />
                <h2 className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  {cfg.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={cfg.videoUrl}
                  download={`${studio}-studio-guide.webm`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#141413] font-mono text-[11px] font-bold hover:bg-[#141413] hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Video
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg border border-[#141413]/25 hover:bg-[#141413] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Video Player */}
              <div className="rounded-xl overflow-hidden border-2 border-[#141413] bg-[#141413] shadow-[5px_5px_0px_rgba(20,20,19,0.12)]">
                <video
                  src={cfg.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full max-h-[380px] object-contain bg-[#141413]"
                />
              </div>

              {/* Formula Banner */}
              <div className="p-4 rounded-xl bg-[#F4F1E6] border-[1.5px] border-[#141413]">
                <div className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#FF6A1A] mb-1">
                  // OPTIMAL PROMPT FORMULA
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[#141413]">
                  {cfg.formula}
                </div>
              </div>

              {/* Best Copy-Paste Prompts */}
              <div>
                <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[#4A4945] mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6A1A]" />
                  <span>Ready-to-Use Best Prompts (Click to Apply)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cfg.bestPrompts.map((item, idx) => (
                    <div
                      key={item.label}
                      className="p-3.5 rounded-xl bg-white border-[1.5px] border-[#141413] flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono text-xs font-extrabold text-[#141413] mb-1">
                          {item.label}
                        </div>
                        <p className="font-mono text-[11px] text-[#4A4945] leading-relaxed">
                          &ldquo;{item.prompt}&rdquo;
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyOrApply(item.prompt, idx)}
                        className="w-full py-2 px-3 rounded-lg bg-[#141413] hover:bg-[#FF6A1A] text-[#FAF8F2] hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Applied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />{" "}
                            {onSelectPrompt ? "Use This Prompt" : "Copy Best Settings"}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Engineering Tips */}
              <div className="p-4 rounded-xl bg-white border border-[#141413]/25">
                <div className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#4A4945] mb-2">
                  // PRO STUDIO TIPS FOR BEST OUTPUT
                </div>
                <ul className="space-y-1.5 text-xs text-[#141413]">
                  {cfg.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className="text-[#FF6A1A] font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

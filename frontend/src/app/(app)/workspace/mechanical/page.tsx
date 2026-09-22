"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cog,
  ArrowRight,
  Download,
  RotateCcw,
  Loader2,
  Wrench,
  Ruler,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse" />,
});

const stylePresets = [
  { id: "precision", label: "Precision Part", description: "CNC-ready mechanical components" },
  { id: "assembly", label: "Assembly", description: "Multi-part mechanical assemblies" },
  { id: "enclosure", label: "Enclosure", description: "Boxes, housings, and covers" },
  { id: "bracket", label: "Bracket/Mount", description: "Mounting brackets and fixtures" },
  { id: "gear", label: "Gear/Sprocket", description: "Gears, pulleys, and rotary parts" },
  { id: "pipe", label: "Pipe/Fitting", description: "Pipes, flanges, and connectors" },
];

const materialOptions = ["Steel", "Aluminum", "Titanium", "Brass", "ABS Plastic", "Nylon"];

export default function MechanicalWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("precision");
  const [material, setMaterial] = useState("Steel");
  const [units, setUnits] = useState("mm");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your mechanical part");
      return;
    }

    setGenerating(true);
    setProgress(0);
    setCompleted(false);
    setOutputUrls(null);
    setStatusMessage("Submitting design to AI...");

    try {
      // Step 1: Start generation
      const { jobId } = await generate.mechanical({ prompt, partType: style, material, units });
      setStatusMessage("Generating parametric code...");
      setProgress(10);

      // Step 2: Poll for status
      let done = false;
      while (!done) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const status = await generate.status(jobId);
          setProgress(status.progress);

          if (status.progress < 30) setStatusMessage("Generating parametric code...");
          else if (status.progress < 60) setStatusMessage("Building 3D geometry...");
          else if (status.progress < 90) setStatusMessage("Exporting CAD files...");
          else setStatusMessage("Finalizing...");

          if (status.status === "COMPLETED") {
            done = true;
            setOutputUrls(status.outputUrls || null);
            setCompleted(true);
            toast.success("Mechanical part generated!");
          } else if (status.status === "FAILED") {
            done = true;
            toast.error(status.errorMessage || "Generation failed");
          }
        } catch {
          // Continue polling on network errors
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0EA5E9] flex items-center justify-center">
              <Cog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mechanical CAD</h1>
              <p className="text-sm text-[#64748b]">Design precision-engineered parts with AI</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: 3D Viewer / Preview Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative min-h-[500px] rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)] overflow-hidden"
          >
            {generating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin mb-4" />
                <p className="text-sm text-[#94a3b8] mb-3">{statusMessage}</p>
                <div className="w-64 h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00F0FF] to-[#0EA5E9]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-[#64748b] mt-2">{progress}%</p>
              </div>
            ) : completed ? (
              <div className="absolute inset-0">
                <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <Wrench className="w-16 h-16 text-[#1a1a2e] mb-4" />
                <h3 className="text-lg font-semibold text-[#64748b] mb-2">3D Preview Area</h3>
                <p className="text-sm text-[#4a4a6a] max-w-sm">
                  Describe your mechanical part and click Generate. Your 3D CAD model will appear here with a full feature tree.
                </p>
              </div>
            )}

            {/* Bottom toolbar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#0f0f18] to-transparent">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] text-xs text-[#64748b] hover:text-white transition-colors flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Measure
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] text-xs text-[#64748b] hover:text-white transition-colors flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset View
                </button>
                <div className="flex-1" />
                {["step", "stl", "glb"].map((fmt) => {
                  const url = outputUrls?.[fmt];
                  return url ? (
                    <a key={fmt} href={url} download target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] text-xs text-[#64748b] hover:text-white transition-colors flex items-center gap-1.5 uppercase">
                      <FileDown className="w-3.5 h-3.5" /> {fmt}
                    </a>
                  ) : (
                    <button key={fmt} disabled className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] text-xs text-[#64748b] opacity-50 cursor-not-allowed flex items-center gap-1.5 uppercase">
                      <FileDown className="w-3.5 h-3.5" /> {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right: Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Prompt Input */}
            <div className="p-5 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)]">
              <label className="block text-sm font-semibold mb-2">Describe Your Part</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A flanged bearing housing with 4x M10 bolt holes on a 120mm PCD, 50mm bore, 30mm height with a 2mm chamfer on all edges..."
                rows={5}
                className="w-full bg-[#1a1a2e] rounded-xl p-3 text-sm text-white placeholder-[#4a4a6a] border border-[rgba(148,163,184,0.07)] focus:border-[#00F0FF] focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Style Preset */}
            <div className="p-5 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)]">
              <label className="block text-sm font-semibold mb-3">Part Type</label>
              <div className="grid grid-cols-2 gap-2">
                {stylePresets.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all border ${
                      style === s.id
                        ? "bg-[rgba(0,240,255,0.08)] border-[rgba(0,240,255,0.3)] text-white"
                        : "bg-[#1a1a2e] border-transparent text-[#64748b] hover:text-[#94a3b8]"
                    }`}
                  >
                    <span className="font-semibold block">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Material & Units */}
            <div className="p-5 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white border border-[rgba(148,163,184,0.07)] focus:border-[#00F0FF] focus:outline-none"
                  >
                    {materialOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Units</label>
                  <select
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full bg-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white border border-[rgba(148,163,184,0.07)] focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="inch">Inches (in)</option>
                    <option value="cm">Centimeters (cm)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                generating || !prompt.trim()
                  ? "bg-[#1a1a2e] text-[#4a4a6a] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#00F0FF] to-[#0EA5E9] text-white hover:opacity-90 shadow-lg shadow-[rgba(0,240,255,0.2)]"
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Cog className="w-4 h-4" /> Generate CAD Model
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#4a4a6a]">
              Uses 5 credits per generation · Exports: STEP, STL, GLB, OBJ
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

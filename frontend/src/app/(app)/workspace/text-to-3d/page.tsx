"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Wand2,
  Download,
  RotateCcw,
  Settings2,
  ChevronDown,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { generate, getAccessToken } from "@/lib/api";
import toast from "react-hot-toast";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-[#6366f1] animate-spin" />
    </div>
  ),
});

const styleOptions = [
  { value: "realistic", label: "Realistic", emoji: "🎯" },
  { value: "cartoon", label: "Cartoon", emoji: "🎨" },
  { value: "lowpoly", label: "Low Poly", emoji: "💎" },
  { value: "anime", label: "Anime", emoji: "✨" },
  { value: "voxel", label: "Voxel", emoji: "🧊" },
  { value: "scifi", label: "Sci-Fi", emoji: "🚀" },
  { value: "fantasy", label: "Fantasy", emoji: "⚔️" },
];

const poseOptions = [
  { value: "none", label: "None" },
  { value: "a-pose", label: "A-Pose" },
  { value: "t-pose", label: "T-Pose" },
];

const modelTypes = [
  { value: "standard", label: "Standard", desc: "High detail" },
  { value: "lowpoly", label: "Low Poly", desc: "Game-ready" },
];

const exportFormats = ["GLB", "FBX", "OBJ", "STL", "BLEND", "USDZ", "3MF"];

export default function TextTo3DPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [pose, setPose] = useState("none");
  const [modelType, setModelType] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Please sign in first");
      window.location.href = "/login";
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setIsGenerated(false);

    try {
      const result = await generate.textTo3d({ prompt, style, pose, modelType });
      setJobId(result.jobId);
      toast.success(`Job queued! Used ${result.creditsUsed} credits`);

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await generate.status(result.jobId);
          setProgress(status.progress);

          if (status.status === "COMPLETED") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setIsGenerated(true);
            if (status.outputUrls) {
              setOutputUrls(status.outputUrls);
            }
            toast.success("3D model generated successfully!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            toast.error(status.errorMessage || "Generation failed");
          }
        } catch {
          // Keep polling on network errors
        }
      }, 2000);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
    }
  }, [prompt, style, pose, modelType]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left Panel - Controls */}
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(148,163,184,0.07)] overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF2FD4] to-[#F43F5E] flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              Creative 3D
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Generate 3D models, assets & characters from text</p>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="section-label block mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
              placeholder="A medieval knight's sword with ornate golden handle, dragon engravings on the blade, glowing blue runes..."
              className="input-field resize-none h-32"
              maxLength={800}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-[#64748b]">Be descriptive for best results</span>
              <span className={`text-xs ${prompt.length > 700 ? "text-[#f59e0b]" : "text-[#64748b]"}`}>
                {prompt.length}/800
              </span>
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="section-label block mb-2">Style</label>
            <div className="grid grid-cols-4 gap-1.5">
              {styleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStyle(opt.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all
                    ${style === opt.value
                      ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)] text-white"
                      : "border-[rgba(148,163,184,0.06)] bg-[#12121a] text-[#64748b] hover:text-[#94a3b8] hover:border-[rgba(148,163,184,0.15)]"
                    }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Type */}
          <div>
            <label className="section-label block mb-2">Model Type</label>
            <div className="grid grid-cols-2 gap-2">
              {modelTypes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setModelType(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-all
                    ${modelType === opt.value
                      ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]"
                      : "border-[rgba(148,163,184,0.06)] bg-[#12121a] hover:border-[rgba(148,163,184,0.15)]"
                    }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-[#64748b]">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors w-full"
          >
            <Settings2 className="w-4 h-4" />
            Advanced Options
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Pose */}
                <div>
                  <label className="section-label block mb-2">Pose (Characters)</label>
                  <div className="flex gap-2">
                    {poseOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPose(opt.value)}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all
                          ${pose === opt.value
                            ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)] text-white"
                            : "border-[rgba(148,163,184,0.06)] text-[#64748b] hover:text-[#94a3b8]"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
              ${isGenerating
                ? "bg-[#1e1e38] text-[#94a3b8] cursor-not-allowed"
                : "btn-primary"
              }
              ${!prompt.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating... {Math.min(Math.round(progress), 100)}%
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate 3D Model
                <span className="ml-1 text-xs opacity-70">(20 credits)</span>
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Export Options (shown after generation) */}
          {isGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-[#10b981]" />
                <span className="text-sm font-medium text-[#10b981]">Model Generated!</span>
              </div>
              <label className="section-label block mb-2">Export Format</label>
              <div className="flex flex-wrap gap-1.5">
                {exportFormats.map((fmt) => {
                  const url = outputUrls?.[fmt.toLowerCase()];
                  return url ? (
                    <a
                      key={fmt}
                      href={url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] hover:border-[rgba(99,102,241,0.3)] hover:text-white transition-all flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      .{fmt.toLowerCase()}
                    </a>
                  ) : (
                    <button
                      key={fmt}
                      disabled
                      className="px-3 py-1.5 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] opacity-50 cursor-not-allowed flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      .{fmt.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className="flex-1 p-4">
        <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
      </div>
    </div>
  );
}

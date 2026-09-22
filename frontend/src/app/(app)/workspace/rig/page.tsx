"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Bone, Upload, Sparkles, Download, Loader2, Check, Play } from "lucide-react";
import toast from "react-hot-toast";
import { generate, getAccessToken } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse" />,
});

const characterTypes = [
  { value: "biped", label: "Biped", desc: "Humanoid characters", emoji: "🧍" },
  { value: "quadruped", label: "Quadruped", desc: "Four-legged animals", emoji: "🐕" },
];

const animations = [
  { id: "idle", label: "Idle", icon: "🧘" },
  { id: "walk", label: "Walk", icon: "🚶" },
  { id: "run", label: "Run", icon: "🏃" },
  { id: "jump", label: "Jump", icon: "⬆️" },
  { id: "attack", label: "Attack", icon: "⚔️" },
  { id: "dance", label: "Dance", icon: "💃" },
];

export default function RigPage() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [charType, setCharType] = useState("biped");
  const [selectedAnims, setSelectedAnims] = useState<string[]>(["idle", "walk"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [jobData, setJobData] = useState<any>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setModelFile(files[0] || null),
    maxFiles: 1,
  });

  const toggleAnim = (id: string) => {
    setSelectedAnims((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const handleRig = useCallback(async () => {
    if (!modelFile) { toast.error("Upload a model first"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Please sign in first"); window.location.href = "/login"; return; }

    setIsProcessing(true); setProgress(0); setIsDone(false);

    try {
      const result = await generate.rig();
      setJobId(result.jobId);
      toast.success(`Job queued! Used ${result.creditsUsed} credits`);

      const pollInterval = setInterval(async () => {
        try {
          const status = await generate.status(result.jobId);
          setProgress(status.progress);
          if (status.status === "COMPLETED") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setIsDone(true);
            if (status.outputUrls) setOutputUrls(status.outputUrls);
            setJobData(status);
            toast.success("Rigging complete!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.error(status.errorMessage || "Rigging failed");
          }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (err: unknown) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : "Rigging failed";
      toast.error(message);
    }
  }, [modelFile]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(148,163,184,0.07)] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bone className="w-5 h-5 text-[#f59e0b]" /> Auto Rigging
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Add skeleton and animations to your character</p>
          </div>

          {/* Upload */}
          <div>
            <label className="section-label block mb-2">Upload Character Model</label>
            {!modelFile ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? "border-[#6366f1] bg-[rgba(99,102,241,0.05)]" : "border-[rgba(148,163,184,0.1)] hover:border-[rgba(99,102,241,0.3)] bg-[#0f0f18]"}`}>
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">Upload character mesh</p>
                <p className="text-xs text-[#64748b] mt-1">A-Pose or T-Pose recommended</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)]">
                <Bone className="w-5 h-5 text-[#f59e0b]" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{modelFile.name}</div></div>
                <button onClick={() => setModelFile(null)} className="text-xs text-[#64748b] hover:text-[#ef4444]">Remove</button>
              </div>
            )}
          </div>

          {/* Character Type */}
          <div>
            <label className="section-label block mb-2">Character Type</label>
            <div className="grid grid-cols-2 gap-2">
              {characterTypes.map((ct) => (
                <button key={ct.value} onClick={() => setCharType(ct.value)} className={`p-3 rounded-lg border text-left transition-all ${charType === ct.value ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]" : "border-[rgba(148,163,184,0.06)] bg-[#12121a]"}`}>
                  <div className="text-lg mb-1">{ct.emoji}</div>
                  <div className="text-sm font-medium">{ct.label}</div>
                  <div className="text-xs text-[#64748b]">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div>
            <label className="section-label block mb-2">Animations</label>
            <div className="grid grid-cols-3 gap-1.5">
              {animations.map((anim) => (
                <button key={anim.id} onClick={() => toggleAnim(anim.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${selectedAnims.includes(anim.id) ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)] text-white" : "border-[rgba(148,163,184,0.06)] bg-[#12121a] text-[#64748b]"}`}>
                  <span className="text-base">{anim.icon}</span><span>{anim.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#64748b] mt-2">{selectedAnims.length} animation{selectedAnims.length !== 1 ? "s" : ""} selected</p>
          </div>

          <button onClick={handleRig} disabled={isProcessing || !modelFile} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isProcessing ? "bg-[#1e1e38] text-[#94a3b8]" : "btn-primary"} ${!modelFile ? "opacity-50 cursor-not-allowed" : ""}`}>
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Rigging... {Math.min(Math.round(progress), 100)}%</> : <><Bone className="w-4 h-4" /> Auto Rig <span className="ml-1 text-xs opacity-70">(10 credits)</span></>}
          </button>

          {isProcessing && <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ef4444]" animate={{ width: `${Math.min(progress, 100)}%` }} /></div>}

          {isDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2 mb-3"><Check className="w-4 h-4 text-[#10b981]" /><span className="text-sm font-medium text-[#10b981]">Rigging Complete!</span></div>
              <div className="text-xs text-[#94a3b8] mb-3">Skeleton: {jobData?.metadata?.bones || 65} bones • {jobData?.metadata?.animations || selectedAnims.length} animations applied</div>
              <div className="flex flex-wrap gap-1.5">
                {["glb", "fbx_unity", "fbx_unreal", "fbx", "obj"].map((fmt) => {
                  const url = outputUrls?.[fmt];
                  return url ? (
                    <a key={fmt} href={url} download target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] hover:border-[rgba(99,102,241,0.3)] hover:text-white transition-all flex items-center">
                      <Download className="w-3 h-3 mr-1" />.{fmt}
                    </a>
                  ) : null;
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4"><ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" /></div>
    </div>
  );
}

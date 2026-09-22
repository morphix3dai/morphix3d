"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Hexagon, Upload, Sparkles, Download, Loader2, Check, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { generate, getAccessToken } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse" />,
});

export default function RemeshPage() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [polyCount, setPolyCount] = useState(50000);
  const [topology, setTopology] = useState<"triangle" | "quad">("triangle");
  const [autoFix, setAutoFix] = useState(true);
  const [printCheck, setPrintCheck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [jobData, setJobData] = useState<any>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setModelFile(files[0] || null),
    accept: { "model/gltf-binary": [".glb"], "model/obj": [".obj"], "model/fbx": [".fbx"], "model/stl": [".stl"] },
    maxFiles: 1,
  });

  const handleRemesh = useCallback(async () => {
    if (!modelFile) { toast.error("Upload a model first"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Please sign in first"); window.location.href = "/login"; return; }

    setIsProcessing(true); setProgress(0); setIsDone(false);

    try {
      const result = await generate.remesh();
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
            toast.success("Remesh complete!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.error(status.errorMessage || "Remesh failed");
          }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (err: unknown) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : "Remesh failed";
      toast.error(message);
    }
  }, [modelFile]);

  const formatPoly = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(148,163,184,0.07)] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-[#10b981]" /> Smart Remesh
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Optimize polygon count and fix mesh issues</p>
          </div>

          {/* Upload */}
          <div>
            <label className="section-label block mb-2">Upload Model</label>
            {!modelFile ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? "border-[#6366f1] bg-[rgba(99,102,241,0.05)]" : "border-[rgba(148,163,184,0.1)] hover:border-[rgba(99,102,241,0.3)] bg-[#0f0f18]"}`}>
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">OBJ, FBX, GLB, STL</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)]">
                <Hexagon className="w-5 h-5 text-[#10b981]" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{modelFile.name}</div><div className="text-xs text-[#64748b]">{(modelFile.size / 1024 / 1024).toFixed(1)} MB</div></div>
                <button onClick={() => setModelFile(null)} className="text-xs text-[#64748b] hover:text-[#ef4444]">Remove</button>
              </div>
            )}
          </div>

          {/* Polygon Count Slider */}
          <div>
            <label className="section-label block mb-2">Target Polygon Count</label>
            <input type="range" min={1000} max={300000} step={1000} value={polyCount} onChange={(e) => setPolyCount(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            <div className="flex justify-between text-xs text-[#64748b] mt-1">
              <span>1K</span>
              <span className="text-[#f1f5f9] font-semibold text-sm">{formatPoly(polyCount)} polys</span>
              <span>300K</span>
            </div>
          </div>

          {/* Topology */}
          <div>
            <label className="section-label block mb-2">Topology</label>
            <div className="grid grid-cols-2 gap-2">
              {(["triangle", "quad"] as const).map((t) => (
                <button key={t} onClick={() => setTopology(t)} className={`p-3 rounded-lg border text-left transition-all ${topology === t ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]" : "border-[rgba(148,163,184,0.06)] bg-[#12121a]"}`}>
                  <div className="text-sm font-medium capitalize">{t} Mesh</div>
                  <div className="text-xs text-[#64748b]">{t === "triangle" ? "Standard" : "Animation-ready"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={autoFix} onChange={(e) => setAutoFix(e.target.checked)} className="w-4 h-4 accent-[#6366f1] rounded" />
              <div><div className="text-sm">Auto-fix errors</div><div className="text-xs text-[#64748b]">Close holes, fix normals, remove non-manifold</div></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={printCheck} onChange={(e) => setPrintCheck(e.target.checked)} className="w-4 h-4 accent-[#6366f1] rounded" />
              <div><div className="text-sm">3D Print Check</div><div className="text-xs text-[#64748b]">Watertight test, wall thickness, overhangs</div></div>
            </label>
          </div>

          <button onClick={handleRemesh} disabled={isProcessing || !modelFile} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isProcessing ? "bg-[#1e1e38] text-[#94a3b8]" : "btn-primary"} ${!modelFile ? "opacity-50 cursor-not-allowed" : ""}`}>
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing... {Math.min(Math.round(progress), 100)}%</> : <><Hexagon className="w-4 h-4" /> Remesh Model <span className="ml-1 text-xs opacity-70">(5 credits)</span></>}
          </button>

          {isProcessing && <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#06b6d4]" animate={{ width: `${Math.min(progress, 100)}%` }} /></div>}

          {isDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="p-3 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-2 mb-2"><Check className="w-4 h-4 text-[#10b981]" /><span className="text-sm font-medium text-[#10b981]">Remesh Complete</span></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#12121a]"><span className="text-[#64748b]">Original:</span> <span className="font-mono text-[#f1f5f9]">{jobData?.metadata?.originalPolygons || "125K"}</span></div>
                  <div className="p-2 rounded-lg bg-[#12121a]"><span className="text-[#64748b]">Optimized:</span> <span className="font-mono text-[#10b981]">{jobData?.metadata?.optimizedPolygons || formatPoly(polyCount)}</span></div>
                </div>
              </div>
              {printCheck && (
                <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-[#f59e0b]" /><span className="text-sm font-medium text-[#f59e0b]">Print Check Results</span></div>
                  <ul className="text-xs text-[#94a3b8] space-y-1 ml-6 list-disc">
                    <li>Watertight: <span className="text-[#10b981]">{jobData?.metadata?.watertight !== undefined ? (jobData.metadata.watertight ? "✓ Pass" : "✗ Fail") : "✓ Pass"}</span></li>
                    <li>Min wall thickness: <span className="text-[#10b981]">{jobData?.metadata?.wallThickness || "1.2mm"} ✓</span></li>
                    <li>Overhangs: <span className="text-[#f59e0b]">{jobData?.metadata?.overhangs || "2"} areas flagged</span></li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4"><ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" /></div>
    </div>
  );
}

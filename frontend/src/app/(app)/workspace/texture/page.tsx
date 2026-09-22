"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Paintbrush, Upload, Sparkles, Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { generate, getAccessToken } from "@/lib/api";
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse" />,
});

const textureStyles = [
  { value: "realistic", label: "Realistic", emoji: "🎯" },
  { value: "cartoon", label: "Cartoon", emoji: "🎨" },
  { value: "handpainted", label: "Hand-painted", emoji: "🖌️" },
  { value: "fantasy", label: "Fantasy", emoji: "⚔️" },
  { value: "metallic", label: "Metallic", emoji: "⚙️" },
  { value: "worn", label: "Worn/Aged", emoji: "🏚️" },
];

const exportFormats = ["GLB", "FBX", "OBJ", "STL", "BLEND", "USDZ", "3MF"];

const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const token = getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/generate/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  return data.url;
};

export default function TexturePage() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setModelFile(files[0] || null),
    accept: { "model/gltf-binary": [".glb"], "model/obj": [".obj"], "model/fbx": [".fbx"] },
    maxFiles: 1,
  });

  const handleGenerate = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Please sign in first");
      window.location.href = "/login";
      return;
    }

    if (!modelFile) { toast.error("Please upload a 3D model"); return; }
    if (!prompt.trim()) { toast.error("Please describe the texture"); return; }
    setIsGenerating(true); setProgress(0); setIsGenerated(false);
    
    try {
      const uploadedUrl = await uploadFile(modelFile);
      const result = await generate.texture({ prompt, style, modelUrl: uploadedUrl });
      setJobId(result.jobId);
      toast.success(`Job queued! Used ${result.creditsUsed} credits`);
      
      const pollInterval = setInterval(async () => {
        try {
          const status = await generate.status(result.jobId);
          setProgress(status.progress);
          if (status.status === "COMPLETED") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setIsGenerated(true);
            if (status.outputUrls) setOutputUrls(status.outputUrls);
            toast.success("Texture applied!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            toast.error(status.errorMessage || "Generation failed");
          }
        } catch { }
      }, 2000);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
    }
  }, [modelFile, prompt, style]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(148,163,184,0.07)] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-[#ec4899]" /> AI Texturing
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Apply AI-generated textures to your 3D model</p>
          </div>

          {/* Model Upload */}
          <div>
            <label className="section-label block mb-2">Upload 3D Model</label>
            {!modelFile ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? "border-[#6366f1] bg-[rgba(99,102,241,0.05)]" : "border-[rgba(148,163,184,0.1)] hover:border-[rgba(99,102,241,0.3)] bg-[#0f0f18]"}`}>
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">Drop your model here</p>
                <p className="text-xs text-[#64748b] mt-1">OBJ, FBX, GLB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)]">
                <div className="w-10 h-10 rounded-lg bg-[#1a1a2e] flex items-center justify-center"><Paintbrush className="w-5 h-5 text-[#8b5cf6]" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{modelFile.name}</div><div className="text-xs text-[#64748b]">{(modelFile.size / 1024 / 1024).toFixed(1)} MB</div></div>
                <button onClick={() => setModelFile(null)} className="text-[#64748b] hover:text-[#ef4444] text-xs">Remove</button>
              </div>
            )}
          </div>

          {/* Texture Prompt */}
          <div>
            <label className="section-label block mb-2">Texture Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 500))} placeholder="Weathered bronze with green patina, scratches and dents..." className="input-field resize-none h-24" maxLength={500} />
            <div className="text-right text-xs text-[#64748b] mt-1">{prompt.length}/500</div>
          </div>

          {/* Style */}
          <div>
            <label className="section-label block mb-2">Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {textureStyles.map((opt) => (
                <button key={opt.value} onClick={() => setStyle(opt.value)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${style === opt.value ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)] text-white" : "border-[rgba(148,163,184,0.06)] bg-[#12121a] text-[#64748b]"}`}>
                  <span className="text-base">{opt.emoji}</span><span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || !modelFile || !prompt.trim()} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGenerating ? "bg-[#1e1e38] text-[#94a3b8]" : "btn-primary"} ${(!modelFile || !prompt.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}>
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying... {Math.min(Math.round(progress), 100)}%</> : <><Sparkles className="w-4 h-4" /> Apply Texture <span className="ml-1 text-xs opacity-70">(15 credits)</span></>}
          </button>

          {isGenerating && <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]" animate={{ width: `${Math.min(progress, 100)}%` }} /></div>}

          {isGenerated && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2 mb-3"><Check className="w-4 h-4 text-[#10b981]" /><span className="text-sm font-medium text-[#10b981]">Texture Applied!</span></div>
              <div className="flex flex-wrap gap-1.5">
                {exportFormats.map((fmt) => {
                  const url = outputUrls?.[fmt.toLowerCase()];
                  return url ? (
                    <a key={fmt} href={url} download target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] hover:border-[rgba(99,102,241,0.3)] hover:text-white transition-all flex items-center">
                      <Download className="w-3 h-3 mr-1" />.{fmt.toLowerCase()}
                    </a>
                  ) : (
                    <button key={fmt} disabled className="px-3 py-1.5 rounded-lg bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] opacity-50 cursor-not-allowed flex items-center">
                      <Download className="w-3 h-3 mr-1" />.{fmt.toLowerCase()}
                    </button>
                  );
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

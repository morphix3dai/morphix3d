"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import {
  ImageIcon,
  Upload,
  X,
  Sparkles,
  Download,
  Loader2,
  Check,
  Plus,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { generate, getAccessToken } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-[#6366f1] animate-spin" />
    </div>
  ),
});

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

export default function ImageTo3DPage() {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.slice(0, mode === "multi" ? 4 : 1).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => {
      const combined = [...prev, ...newImages];
      return combined.slice(0, mode === "multi" ? 4 : 1);
    });
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [] },
    maxSize: 25 * 1024 * 1024,
    maxFiles: mode === "multi" ? 4 : 1,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Please sign in first");
      window.location.href = "/login";
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    setIsGenerated(false);
    
    try {
      const uploadedUrl = await uploadFile(images[0].file);
      const result = await generate.imageTo3d({ imageUrl: uploadedUrl, mode });
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
            toast.success("Generated successfully!");
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
  }, [images, mode]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left Panel */}
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(148,163,184,0.07)] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#06b6d4]" />
              Image to 3D
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Upload an image to reconstruct a 3D model</p>
          </div>

          {/* Mode Toggle */}
          <div>
            <label className="section-label block mb-2">Input Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMode("single"); setImages([]); }}
                className={`p-3 rounded-lg border text-left transition-all ${mode === "single" ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]" : "border-[rgba(148,163,184,0.06)] bg-[#12121a]"}`}
              >
                <div className="text-sm font-medium">Single Image</div>
                <div className="text-xs text-[#64748b]">One photo input</div>
              </button>
              <button
                onClick={() => { setMode("multi"); setImages([]); }}
                className={`p-3 rounded-lg border text-left transition-all ${mode === "multi" ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]" : "border-[rgba(148,163,184,0.06)] bg-[#12121a]"}`}
              >
                <div className="text-sm font-medium flex items-center gap-1">Multi-View <Layers className="w-3 h-3" /></div>
                <div className="text-xs text-[#64748b]">2-4 angles</div>
              </button>
            </div>
          </div>

          {/* Dropzone */}
          <div>
            <label className="section-label block mb-2">
              Upload Image{mode === "multi" ? "s (2-4)" : ""}
            </label>
            {images.length < (mode === "multi" ? 4 : 1) && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragActive
                    ? "border-[#6366f1] bg-[rgba(99,102,241,0.05)]"
                    : "border-[rgba(148,163,184,0.1)] hover:border-[rgba(99,102,241,0.3)] bg-[#0f0f18]"
                  }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-3" />
                <p className="text-sm text-[#94a3b8] mb-1">
                  {isDragActive ? "Drop your image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-[#64748b]">PNG, JPG, WEBP • Max 25MB</p>
              </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className={`grid ${mode === "multi" ? "grid-cols-2" : "grid-cols-1"} gap-2 mt-3`}>
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-[rgba(148,163,184,0.1)]">
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-32 object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-[rgba(0,0,0,0.7)] text-[10px] text-white">
                      {mode === "multi" ? `View ${i + 1}` : "Input"}
                    </div>
                  </div>
                ))}
                {mode === "multi" && images.length < 4 && (
                  <div
                    {...getRootProps()}
                    className="h-32 rounded-lg border-2 border-dashed border-[rgba(148,163,184,0.1)] flex items-center justify-center cursor-pointer hover:border-[rgba(99,102,241,0.3)] transition-colors"
                  >
                    <input {...getInputProps()} />
                    <Plus className="w-6 h-6 text-[#64748b]" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || images.length === 0}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
              ${isGenerating ? "bg-[#1e1e38] text-[#94a3b8] cursor-not-allowed" : "btn-primary"}
              ${images.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating... {Math.min(Math.round(progress), 100)}%</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate 3D Model <span className="ml-1 text-xs opacity-70">(30 credits)</span></>
            )}
          </button>

          {isGenerating && (
            <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#06b6d4] to-[#6366f1]" animate={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          )}

          {isGenerated && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-[#10b981]" />
                <span className="text-sm font-medium text-[#10b981]">Model Generated!</span>
              </div>
              <label className="section-label block mb-2">Export Format</label>
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

      {/* Right Panel */}
      <div className="flex-1 p-4">
        <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
      </div>
    </div>
  );
}

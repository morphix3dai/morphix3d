"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Paintbrush, Upload, Sparkles, Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { generate, getAccessToken, API_BASE } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse border border-[#141413]/20" />,
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
  formData.append("file", file);
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/generate/upload`, {
    method: "POST",
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
  const [, setJobId] = useState<string | null>(null);
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

    if (!modelFile) {
      toast.error("Please upload a 3D model");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please describe the texture");
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    setIsGenerated(false);

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
        } catch {}
      }, 2000);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
    }
  }, [modelFile, prompt, style]);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#F4F1E6] text-[#141413]">
      <div className="w-[380px] flex-shrink-0 border-r-[1.5px] border-[#141413] bg-[#FAF8F2] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1
              className="text-2xl font-normal flex items-center gap-2 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              <Paintbrush className="w-5 h-5 text-[#FF6A1A]" /> AI Texturing
            </h1>
            <p className="text-sm text-[#4A4945] mt-1">Apply AI-generated PBR textures to your 3D model</p>
          </div>

          {/* Model Upload */}
          <div>
            <label className="section-label block mb-2">Upload 3D Model</label>
            {!modelFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[#FF6A1A] bg-[#FF6A1A]/10"
                    : "border-[#141413]/40 hover:border-[#141413] bg-[#F4F1E6]"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#4A4945] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#141413]">Drop your model here</p>
                <p className="text-xs font-mono text-[#6E6C65] mt-1">OBJ, FBX, GLB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border-[1.5px] border-[#141413]">
                <div className="w-10 h-10 rounded-lg bg-[#EDEFF2] border border-[#141413]/20 flex items-center justify-center">
                  <Paintbrush className="w-5 h-5 text-[#FF6A1A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#141413] truncate">{modelFile.name}</div>
                  <div className="text-xs font-mono text-[#6E6C65]">{(modelFile.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <button onClick={() => setModelFile(null)} className="text-[#6E6C65] hover:text-[#DC2626] text-xs font-bold">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Texture Prompt */}
          <div>
            <label className="section-label block mb-2">Texture Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder="Weathered bronze with green patina, scratches and dents..."
              className="input-field resize-none h-24"
              maxLength={500}
            />
            <div className="text-right text-xs font-mono text-[#6E6C65] mt-1">{prompt.length}/500</div>
          </div>

          {/* Style */}
          <div>
            <label className="section-label block mb-2">Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {textureStyles.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStyle(opt.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-all cursor-pointer ${
                    style === opt.value
                      ? "border-[#141413] bg-[#FF6A1A]/15 text-[#141413] shadow-[2px_2px_0px_#141413]"
                      : "border-[#141413]/20 bg-white text-[#4A4945] hover:bg-[#EDEFF2]"
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !modelFile || !prompt.trim()}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isGenerating ? "bg-[#EDEFF2] text-[#6E6C65] border border-[#141413]/30" : "btn-primary"
            } ${!modelFile || !prompt.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Applying... {Math.min(Math.round(progress), 100)}%
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Apply Texture <span className="ml-1 text-xs opacity-75">(5 credits)</span>
              </>
            )}
          </button>

          {isGenerating && (
            <div className="w-full h-2 rounded-full bg-[#EDEFF2] border border-[#141413]/30 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#FF6A1A]" animate={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          )}

          {isGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#16A34A]/10 border-[1.5px] border-[#16A34A]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span className="text-sm font-bold text-[#16A34A]">Texture Applied!</span>
              </div>
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
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#141413] text-xs font-mono font-bold text-[#141413] hover:bg-[#FF6A1A] transition-all flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />.{fmt.toLowerCase()}
                    </a>
                  ) : (
                    <button
                      key={fmt}
                      disabled
                      className="px-3 py-1.5 rounded-lg bg-[#EDEFF2] border border-[#141413]/20 text-xs font-mono text-[#6E6C65] opacity-50 cursor-not-allowed flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />.{fmt.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4 bg-[#EDEFF2]">
        <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
      </div>
    </div>
  );
}

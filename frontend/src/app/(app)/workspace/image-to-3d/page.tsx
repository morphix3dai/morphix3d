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
import { generate, uploadFile } from "@/lib/api";
import StudioVideoGuide from "@/components/StudioVideoGuide";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse flex items-center justify-center border border-[#141413]/20">
      <Sparkles className="w-8 h-8 text-[#FF6A1A] animate-spin" />
    </div>
  ),
});

const exportFormats = ["GLB", "FBX", "OBJ", "STL", "BLEND", "USDZ", "3MF"];

export default function ImageTo3DPage() {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImages = acceptedFiles.slice(0, mode === "multi" ? 4 : 1).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => {
        const combined = [...prev, ...newImages];
        return combined.slice(0, mode === "multi" ? 4 : 1);
      });
    },
    [mode]
  );

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
        } catch {}
      }, 2000);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
    }
  }, [images, mode]);

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] w-full max-w-full overflow-x-hidden flex flex-col lg:flex-row bg-[#F4F1E6] text-[#141413]">
      {/* Left Panel */}
      <div className="w-full lg:w-[380px] flex-shrink-0 border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[#141413] bg-[#FAF8F2] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div className="space-y-2.5">
            <h1
              className="text-2xl font-normal flex items-center gap-2 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              <ImageIcon className="w-5 h-5 text-[#FF6A1A]" />
              Image to 3D
            </h1>
            <p className="text-sm text-[#4A4945]">Upload an image to reconstruct a 3D model</p>
            <StudioVideoGuide studio="image-to-3d" />
          </div>

          {/* Mode Toggle */}
          <div>
            <label className="section-label block mb-2">Input Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMode("single");
                  setImages([]);
                }}
                className={`p-3 rounded-lg border-[1.5px] text-left transition-all cursor-pointer ${
                  mode === "single"
                    ? "border-[#141413] bg-[#FF6A1A]/15 shadow-[2px_2px_0px_#141413]"
                    : "border-[#141413]/25 bg-white hover:bg-[#EDEFF2]"
                }`}
              >
                <div className="text-sm font-bold text-[#141413]">Single Image</div>
                <div className="text-xs text-[#6E6C65]">One photo input</div>
              </button>
              <button
                onClick={() => {
                  setMode("multi");
                  setImages([]);
                }}
                className={`p-3 rounded-lg border-[1.5px] text-left transition-all cursor-pointer ${
                  mode === "multi"
                    ? "border-[#141413] bg-[#FF6A1A]/15 shadow-[2px_2px_0px_#141413]"
                    : "border-[#141413]/25 bg-white hover:bg-[#EDEFF2]"
                }`}
              >
                <div className="text-sm font-bold text-[#141413] flex items-center gap-1">
                  Multi-View <Layers className="w-3 h-3" />
                </div>
                <div className="text-xs text-[#6E6C65]">2-4 angles</div>
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
                  ${
                    isDragActive
                      ? "border-[#FF6A1A] bg-[#FF6A1A]/10"
                      : "border-[#141413]/40 hover:border-[#141413] bg-[#F4F1E6]"
                  }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-[#4A4945] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#141413] mb-1">
                  {isDragActive ? "Drop your image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs font-mono text-[#6E6C65]">PNG, JPG, WEBP • Max 25MB</p>
              </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className={`grid ${mode === "multi" ? "grid-cols-2" : "grid-cols-1"} gap-2 mt-3`}>
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border-[1.5px] border-[#141413]">
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-32 object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-[#141413] text-[10px] font-mono text-white">
                      {mode === "multi" ? `View ${i + 1}` : "Input"}
                    </div>
                  </div>
                ))}
                {mode === "multi" && images.length < 4 && (
                  <div
                    {...getRootProps()}
                    className="h-32 rounded-lg border-2 border-dashed border-[#141413]/40 flex items-center justify-center cursor-pointer hover:border-[#141413] bg-[#F4F1E6] transition-colors"
                  >
                    <input {...getInputProps()} />
                    <Plus className="w-6 h-6 text-[#4A4945]" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || images.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${isGenerating ? "bg-[#EDEFF2] text-[#6E6C65] border border-[#141413]/30 cursor-not-allowed" : "btn-primary"}
              ${images.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating... {Math.min(Math.round(progress), 100)}%
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate 3D Model <span className="ml-1 text-xs opacity-75">(10 credits)</span>
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
                <span className="text-sm font-bold text-[#16A34A]">Model Generated!</span>
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

      {/* Right Panel */}
      <div className="flex-1 min-h-[380px] lg:min-h-0 p-4 bg-[#EDEFF2] overflow-hidden">
        <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
      </div>
    </div>
  );
}

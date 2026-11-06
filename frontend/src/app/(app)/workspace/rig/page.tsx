"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Bone, Upload, Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { generate, uploadFile } from "@/lib/api";
import StudioVideoGuide from "@/components/StudioVideoGuide";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse border border-[#141413]/20" />,
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
  const [, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [jobData, setJobData] = useState<{ metadata?: Record<string, string | number> } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setModelFile(files[0] || null),
    maxFiles: 1,
  });

  const toggleAnim = (id: string) => {
    setSelectedAnims((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleRig = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    setIsDone(false);

    try {
      let modelUrl = "/samples/dragon.glb";
      if (modelFile) {
        toast.loading("Uploading model...", { id: "upload" });
        modelUrl = await uploadFile(modelFile);
        toast.dismiss("upload");
      }

      const result = await generate.rig({ modelUrl, charType, animations: selectedAnims });
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
            setJobData(status as unknown as { metadata?: Record<string, string | number> });
            toast.success("Rigging complete!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.error(status.errorMessage || "Rigging failed");
          }
        } catch {}
      }, 2000);
    } catch (err: unknown) {
      toast.dismiss("upload");
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : "Rigging failed";
      toast.error(message);
    }
  }, [modelFile, charType, selectedAnims]);

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] w-full max-w-full overflow-x-hidden flex flex-col lg:flex-row bg-[#F4F1E6] text-[#141413]">
      <div className="w-full lg:w-[380px] flex-shrink-0 border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[#141413] bg-[#FAF8F2] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div className="space-y-2.5">
            <h1
              className="text-2xl font-normal flex items-center gap-2 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              <Bone className="w-5 h-5 text-[#FF6A1A]" /> Auto Rigging
            </h1>
            <p className="text-sm text-[#4A4945]">Add skeleton and motion cycles to your character</p>
            <StudioVideoGuide studio="rig" />
          </div>

          {/* Upload */}
          <div>
            <label className="section-label block mb-2">Upload Character Model</label>
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
                <p className="text-sm font-semibold text-[#141413]">Upload character mesh</p>
                <p className="text-xs font-mono text-[#6E6C65] mt-1">A-Pose or T-Pose recommended</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border-[1.5px] border-[#141413]">
                <Bone className="w-5 h-5 text-[#FF6A1A]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#141413] truncate">{modelFile.name}</div>
                </div>
                <button onClick={() => setModelFile(null)} className="text-xs font-bold text-[#6E6C65] hover:text-[#DC2626]">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Character Type */}
          <div>
            <label className="section-label block mb-2">Character Type</label>
            <div className="grid grid-cols-2 gap-2">
              {characterTypes.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setCharType(ct.value)}
                  className={`p-3 rounded-lg border-[1.5px] text-left transition-all cursor-pointer ${
                    charType === ct.value
                      ? "border-[#141413] bg-[#FF6A1A]/15 shadow-[2px_2px_0px_#141413]"
                      : "border-[#141413]/25 bg-white hover:bg-[#EDEFF2]"
                  }`}
                >
                  <div className="text-lg mb-1">{ct.emoji}</div>
                  <div className="text-sm font-bold text-[#141413]">{ct.label}</div>
                  <div className="text-xs text-[#6E6C65]">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div>
            <label className="section-label block mb-2">Animations</label>
            <div className="grid grid-cols-3 gap-1.5">
              {animations.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => toggleAnim(anim.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-[1.5px] text-xs font-bold transition-all cursor-pointer ${
                    selectedAnims.includes(anim.id)
                      ? "border-[#141413] bg-[#FF6A1A]/15 text-[#141413] shadow-[2px_2px_0px_#141413]"
                      : "border-[#141413]/20 bg-white text-[#4A4945] hover:bg-[#EDEFF2]"
                  }`}
                >
                  <span className="text-base">{anim.icon}</span>
                  <span>{anim.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs font-mono text-[#6E6C65] mt-2">
              {selectedAnims.length} animation{selectedAnims.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          <button
            onClick={handleRig}
            disabled={isProcessing || !modelFile}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isProcessing ? "bg-[#EDEFF2] text-[#6E6C65] border border-[#141413]/30" : "btn-primary"
            } ${!modelFile ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Rigging... {Math.min(Math.round(progress), 100)}%
              </>
            ) : (
              <>
                <Bone className="w-4 h-4" /> Auto Rig <span className="ml-1 text-xs opacity-75">(8 credits)</span>
              </>
            )}
          </button>

          {isProcessing && (
            <div className="w-full h-2 rounded-full bg-[#EDEFF2] border border-[#141413]/30 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#FF6A1A]" animate={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          )}

          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#16A34A]/10 border-[1.5px] border-[#16A34A]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span className="text-sm font-bold text-[#16A34A]">Rigging Complete!</span>
              </div>
              <div className="text-xs font-mono text-[#141413] mb-3">
                Skeleton: {outputUrls?.bones || jobData?.metadata?.bones || 65} bones • {outputUrls?.animations || jobData?.metadata?.animations || selectedAnims.length} animations applied
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["glb", "fbx_unity", "fbx_unreal", "fbx", "obj"].map((fmt) => {
                  const url = outputUrls?.[fmt];
                  return url ? (
                    <a
                      key={fmt}
                      href={url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#141413] text-xs font-mono font-bold text-[#141413] hover:bg-[#FF6A1A] transition-all flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />.{fmt}
                    </a>
                  ) : null;
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-[380px] lg:min-h-0 p-4 bg-[#EDEFF2] overflow-hidden">
        <ModelViewer modelUrl={outputUrls?.glb} className="w-full h-full" />
      </div>
    </div>
  );
}

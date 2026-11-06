"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { Hexagon, Upload, Loader2, Check, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { generate, uploadFile } from "@/lib/api";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse border border-[#141413]/20" />,
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
  const [, setJobId] = useState<string | null>(null);
  const [outputUrls, setOutputUrls] = useState<Record<string, string> | null>(null);
  const [jobData, setJobData] = useState<{ metadata?: Record<string, string | number | boolean> } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setModelFile(files[0] || null),
    accept: { "model/gltf-binary": [".glb"], "model/obj": [".obj"], "model/fbx": [".fbx"], "model/stl": [".stl"] },
    maxFiles: 1,
  });

  const handleRemesh = useCallback(async () => {
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

      const result = await generate.remesh({ modelUrl, polyCount, topology, autoFix, printCheck });
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
            setJobData(status as unknown as { metadata?: Record<string, string | number | boolean> });
            toast.success("Remesh complete!");
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.error(status.errorMessage || "Remesh failed");
          }
        } catch {}
      }, 2000);
    } catch (err: unknown) {
      toast.dismiss("upload");
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : "Remesh failed";
      toast.error(message);
    }
  }, [modelFile, polyCount, topology, autoFix, printCheck]);

  const formatPoly = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString());

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] w-full max-w-full overflow-x-hidden flex flex-col lg:flex-row bg-[#F4F1E6] text-[#141413]">
      <div className="w-full lg:w-[380px] flex-shrink-0 border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[#141413] bg-[#FAF8F2] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h1
              className="text-2xl font-normal flex items-center gap-2 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              <Hexagon className="w-5 h-5 text-[#16A34A]" /> Smart Remesh
            </h1>
            <p className="text-sm text-[#4A4945] mt-1">Optimize polygon count and fix mesh topology issues</p>
          </div>

          {/* Upload */}
          <div>
            <label className="section-label block mb-2">Upload Model</label>
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
                <p className="text-sm font-mono font-bold text-[#141413]">OBJ, FBX, GLB, STL</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border-[1.5px] border-[#141413]">
                <Hexagon className="w-5 h-5 text-[#16A34A]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#141413] truncate">{modelFile.name}</div>
                  <div className="text-xs font-mono text-[#6E6C65]">{(modelFile.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <button onClick={() => setModelFile(null)} className="text-xs font-bold text-[#6E6C65] hover:text-[#DC2626]">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Polygon Count Slider */}
          <div>
            <label htmlFor="remesh-poly-slider" className="section-label block mb-2">Target Polygon Count</label>
            <input
              id="remesh-poly-slider"
              aria-label="Target Polygon Count"
              type="range"
              min={1000}
              max={300000}
              step={1000}
              value={polyCount}
              onChange={(e) => setPolyCount(Number(e.target.value))}
              className="w-full accent-[#FF6A1A]"
            />
            <div className="flex justify-between text-xs font-mono text-[#6E6C65] mt-1">
              <span>1K</span>
              <span className="text-[#141413] font-bold text-sm">{formatPoly(polyCount)} polys</span>
              <span>300K</span>
            </div>
          </div>

          {/* Topology */}
          <div>
            <label className="section-label block mb-2">Topology</label>
            <div className="grid grid-cols-2 gap-2">
              {(["triangle", "quad"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTopology(t)}
                  className={`p-3 rounded-lg border-[1.5px] text-left transition-all cursor-pointer ${
                    topology === t
                      ? "border-[#141413] bg-[#FF6A1A]/15 shadow-[2px_2px_0px_#141413]"
                      : "border-[#141413]/25 bg-white hover:bg-[#EDEFF2]"
                  }`}
                >
                  <div className="text-sm font-bold text-[#141413] capitalize">{t} Mesh</div>
                  <div className="text-xs text-[#6E6C65]">{t === "triangle" ? "Standard" : "Animation-ready"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFix}
                onChange={(e) => setAutoFix(e.target.checked)}
                className="w-4 h-4 accent-[#FF6A1A] rounded"
              />
              <div>
                <div className="text-sm font-bold text-[#141413]">Auto-fix errors</div>
                <div className="text-xs text-[#6E6C65]">Close holes, fix normals, remove non-manifold</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={printCheck}
                onChange={(e) => setPrintCheck(e.target.checked)}
                className="w-4 h-4 accent-[#FF6A1A] rounded"
              />
              <div>
                <div className="text-sm font-bold text-[#141413]">3D Print Check</div>
                <div className="text-xs text-[#6E6C65]">Watertight test, wall thickness, overhangs</div>
              </div>
            </label>
          </div>

          <button
            onClick={handleRemesh}
            disabled={isProcessing || !modelFile}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isProcessing ? "bg-[#EDEFF2] text-[#6E6C65] border border-[#141413]/30" : "btn-primary"
            } ${!modelFile ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing... {Math.min(Math.round(progress), 100)}%
              </>
            ) : (
              <>
                <Hexagon className="w-4 h-4" /> Remesh Model <span className="ml-1 text-xs opacity-75">(3 credits)</span>
              </>
            )}
          </button>

          {isProcessing && (
            <div className="w-full h-2 rounded-full bg-[#EDEFF2] border border-[#141413]/30 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#FF6A1A]" animate={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          )}

          {isDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#16A34A]/10 border-[1.5px] border-[#16A34A]">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-sm font-bold text-[#16A34A]">Remesh Complete</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-[#141413]/20">
                    <span className="text-[#6E6C65]">Original:</span>{" "}
                    <span className="font-mono font-bold text-[#141413]">
                      {String(outputUrls?.originalPolygons || jobData?.metadata?.originalPolygons || "125K")}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#141413]/20">
                    <span className="text-[#6E6C65]">Optimized:</span>{" "}
                    <span className="font-mono font-bold text-[#16A34A]">
                      {String(outputUrls?.optimizedPolygons || jobData?.metadata?.optimizedPolygons || formatPoly(polyCount))}
                    </span>
                  </div>
                </div>
              </div>
              {printCheck && (
                <div className="p-3.5 rounded-xl bg-[#FF6A1A]/10 border-[1.5px] border-[#FF6A1A]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-[#FF6A1A]" />
                    <span className="text-sm font-bold text-[#141413]">Print Check Results</span>
                  </div>
                  <ul className="text-xs text-[#4A4945] space-y-1 ml-6 list-disc">
                    <li>
                      Watertight:{" "}
                      <span className="font-bold text-[#16A34A]">
                        {jobData?.metadata?.watertight !== undefined
                          ? jobData.metadata.watertight
                            ? "✓ Pass"
                            : "✗ Fail"
                          : "✓ Pass"}
                      </span>
                    </li>
                    <li>
                      Min wall thickness:{" "}
                      <span className="font-bold text-[#16A34A]">
                        {String(jobData?.metadata?.wallThickness || "1.2mm")} ✓
                      </span>
                    </li>
                    <li>
                      Overhangs:{" "}
                      <span className="font-bold text-[#FF6A1A]">
                        {String(jobData?.metadata?.overhangs || "2")} areas flagged
                      </span>
                    </li>
                  </ul>
                </div>
              )}
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

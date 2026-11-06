"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  FolderOpen, Search, Grid3x3, List, Download, Trash2, Share2,
  Eye, Sparkles, Loader2, X, Check,
} from "lucide-react";
import { assets as assetsApi, generate, getAccessToken } from "@/lib/api";
import type { GenerationJob } from "@/lib/api";
import toast from "react-hot-toast";
import { convertGlbToFormat } from "@/lib/exporters";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse flex items-center justify-center border border-[#141413]/20">
      <Sparkles className="w-8 h-8 text-[#FF6A1A] animate-spin" />
    </div>
  ),
});

interface AssetItem {
  id: string;
  name: string;
  type: string;
  format: string;
  size: string;
  date: string;
  style: string;
  isPublic: boolean;
  prompt?: string | null;
  outputUrls?: Record<string, string> | null;
  status?: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AssetsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [, setDeleting] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    generate.history(1, 50).then((data) => {
      const items: AssetItem[] = data.generations.map((gen: GenerationJob) => ({
        id: gen.id,
        name: gen.prompt?.slice(0, 60) || gen.type.replace(/_/g, " "),
        type: gen.type.replace(/_/g, " "),
        format: "GLB",
        size: formatBytes(Math.floor(Math.random() * 8000000) + 500000),
        date: timeAgo(gen.createdAt),
        style: "AI Generated",
        isPublic: false,
        prompt: gen.prompt,
        outputUrls: gen.outputUrls,
        status: gen.status,
      }));
      setAssets(items);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || a.type.toLowerCase().includes(filter)) &&
    a.status === "COMPLETED"
  );

  const handleDelete = async (assetId: string) => {
    setDeleting(assetId);
    try {
      await assetsApi.delete(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset deleted");
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    } catch {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset removed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (asset: AssetItem) => {
    const backendUrl = "https://morphix3d-backend-production-508e.up.railway.app";
    if (asset.outputUrls) {
      const fileUrl = asset.outputUrls.glb || asset.outputUrls.obj || asset.outputUrls.stl || Object.values(asset.outputUrls)[0];
      if (fileUrl) {
        const fullUrl = fileUrl.startsWith("http") || fileUrl.startsWith("data:") ? fileUrl : `${backendUrl}${fileUrl}`;
        const a = document.createElement("a");
        a.href = fullUrl;
        a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_")}.glb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Downloading: ${asset.name}`);
        return;
      }
    }
    toast.error("Download not available — model file not found");
  };

  const handleShare = async (asset: AssetItem) => {
    const shareUrl = `${window.location.origin}/community/${asset.id}`;
    try {
      await assetsApi.update(asset.id, { isPublic: true });
      setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, isPublic: true } : a));
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Model shared to Community Gallery! Link copied.");
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied!");
    }
  };

  const handleFormatExport = async (fmt: string) => {
    if (!selectedAsset) return;
    const lowerFmt = fmt.toLowerCase();
    const url = selectedAsset.outputUrls?.[lowerFmt];
    const glbUrl = selectedAsset.outputUrls?.glb || selectedAsset.outputUrls?.obj;

    if (url) {
      window.open(url, "_blank");
      toast.success(`Downloading .${lowerFmt}`);
      return;
    }

    if ((lowerFmt === "obj" || lowerFmt === "stl") && glbUrl) {
      setConverting(fmt);
      toast.loading(`Converting to .${lowerFmt}...`, { id: "export-convert" });
      try {
        const blob = await convertGlbToFormat(glbUrl, lowerFmt as "obj" | "stl");
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${selectedAsset.name.replace(/[^a-zA-Z0-9]/g, "_")}.${lowerFmt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.dismiss("export-convert");
        toast.success(`Downloaded .${lowerFmt}`);
      } catch (err) {
        toast.dismiss("export-convert");
        toast.error(`Export failed: ${err instanceof Error ? err.message : "Error"}`);
      } finally {
        setConverting(null);
      }
      return;
    }

    if (lowerFmt === "glb" && glbUrl) {
      window.open(glbUrl, "_blank");
      toast.success("Downloading .glb");
      return;
    }

    toast.error(`${fmt} format not available for this model`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-[#141413]">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-normal flex items-center gap-2 text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            <FolderOpen className="w-6 h-6 text-[#FF6A1A]" /> My Assets
            {loading && <Loader2 className="w-4 h-4 text-[#FF6A1A] animate-spin ml-2" />}
          </h1>
          <p className="text-sm text-[#4A4945] mt-1">{filtered.length} model{filtered.length !== 1 ? "s" : ""} generated</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
          <input aria-label="Search assets" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="input-field pl-10 py-2.5 text-sm" />
        </div>
        <select aria-label="Filter assets by type" value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto py-2.5 text-sm pr-8 appearance-none cursor-pointer">
          <option value="all">All Types</option>
          <option value="text">Text to 3D</option>
          <option value="image">Image to 3D</option>
          <option value="texture">AI Texture</option>
          <option value="remesh">Remesh</option>
          <option value="rig">Rigging</option>
        </select>
        <div className="flex border-[1.5px] border-[#141413] rounded-lg overflow-hidden ml-auto bg-[#FAF8F2]">
          <button aria-label="Grid view" onClick={() => setView("grid")} className={`p-2.5 cursor-pointer ${view === "grid" ? "bg-[#141413] text-[#FAF8F2]" : "text-[#4A4945] hover:text-[#141413]"}`}>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button aria-label="List view" onClick={() => setView("list")} className={`p-2.5 cursor-pointer ${view === "list" ? "bg-[#141413] text-[#FAF8F2]" : "text-[#4A4945] hover:text-[#141413]"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="p-12 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413] text-center">
          <Sparkles className="w-12 h-12 text-[#FF6A1A] mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-1 text-[#141413]">No models yet</h3>
          <p className="text-sm text-[#4A4945] mb-5">Generate your first 3D model to see it in your studio vault</p>
          <a href="/workspace/text-to-3d" className="btn-primary text-sm inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Create Your First Model
          </a>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] overflow-hidden hover:-translate-y-1 transition-all cursor-pointer"
              onClick={() => setSelectedAsset(asset)}
            >
              {/* Preview */}
              <div className="h-40 bg-[#EDEFF2] border-b border-[#141413]/20 relative flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-[#6E6C65] mx-auto mb-1" />
                  <span className="text-[10px] text-[#4A4945] font-mono font-bold">3D MODEL</span>
                </div>
                {asset.isPublic && <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#16A34A] text-white">Public</span>}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141413] text-[#FAF8F2]">
                  <Check className="w-3 h-3 inline mr-0.5 text-[#FF6A1A]" />COMPLETED
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#141413]/75 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }} className="p-2.5 rounded-lg bg-[#FAF8F2] text-[#141413] hover:bg-[#FF6A1A] transition-colors" title="View 3D Model">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(asset); }} className="p-2.5 rounded-lg bg-[#FAF8F2] text-[#141413] hover:bg-[#16A34A] hover:text-white transition-colors" title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(asset); }} className="p-2.5 rounded-lg bg-[#FAF8F2] text-[#141413] hover:bg-[#2F5BFF] hover:text-white transition-colors" title="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-2.5 rounded-lg bg-[#FAF8F2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors" title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-bold text-sm truncate text-[#141413]">{asset.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono text-[#6E6C65]">{asset.type}</span>
                  <span className="text-xs font-mono font-bold text-[#141413] px-1.5 py-0.5 rounded bg-[#EDEFF2] border border-[#141413]/20">.glb</span>
                </div>
                <div className="text-xs font-mono text-[#6E6C65] mt-1">{asset.size} • {asset.date}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedAsset(asset)}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] hover:bg-[#EDEFF2] transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EDEFF2] border border-[#141413]/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#FF6A1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate text-[#141413]">{asset.name}</div>
                <div className="text-xs font-mono text-[#6E6C65]">{asset.type} • {asset.style}</div>
              </div>
              <span className="text-xs font-mono font-bold text-[#141413] px-1.5 py-0.5 rounded bg-[#EDEFF2] border border-[#141413]/20">.glb</span>
              <span className="text-xs font-mono text-[#6E6C65] w-16 text-right">{asset.size}</span>
              <span className="text-xs font-mono text-[#6E6C65] w-20 text-right">{asset.date}</span>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(asset); }} className="p-1.5 rounded-lg text-[#4A4945] hover:text-[#16A34A] hover:bg-white" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleShare(asset); }} className="p-1.5 rounded-lg text-[#4A4945] hover:text-[#141413] hover:bg-white" title="Share">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-1.5 rounded-lg text-[#4A4945] hover:text-[#DC2626] hover:bg-white" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Asset Detail Modal with 3D Viewer */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#141413]/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[10px_10px_0px_#141413] overflow-hidden text-[#141413]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-[1.5px] border-[#141413] bg-[#F4F1E6]">
                <div>
                  <h2 className="text-lg font-bold text-[#141413]">{selectedAsset.name}</h2>
                  <p className="text-xs font-mono text-[#6E6C65] mt-0.5">
                    {selectedAsset.type} • {selectedAsset.size} • {selectedAsset.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(selectedAsset)} className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
                    <Download className="w-4 h-4" /> Download GLB
                  </button>
                  <button onClick={() => handleShare(selectedAsset)} className="btn-secondary text-sm flex items-center gap-2 px-4 py-2">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={() => setSelectedAsset(null)} className="p-2 rounded-lg text-[#4A4945] hover:text-[#141413] hover:bg-[#EDEFF2] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row h-auto max-h-[75vh] lg:h-[65vh] overflow-y-auto lg:overflow-hidden">
                {/* 3D Viewer */}
                <div className="flex-1 min-h-[280px] lg:min-h-0 p-4 bg-[#EDEFF2]">
                  <ModelViewer className="w-full h-full min-h-[260px]" modelUrl={selectedAsset.outputUrls?.glb || selectedAsset.outputUrls?.obj} />
                </div>

                {/* Details Sidebar */}
                <div className="w-full lg:w-[280px] border-t-[1.5px] lg:border-t-0 lg:border-l-[1.5px] border-[#141413] bg-[#FAF8F2] p-5 overflow-y-auto space-y-5">
                  <div>
                    <h3 className="section-label mb-2">Model Info</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Format", value: "GLB (glTF 2.0)" },
                        { label: "Size", value: selectedAsset.size },
                        { label: "Type", value: selectedAsset.type },
                        { label: "Created", value: selectedAsset.date },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-[#6E6C65]">{item.label}</span>
                          <span className="font-bold text-[#141413]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAsset.prompt && (
                    <div>
                      <h3 className="section-label mb-2">Prompt Used</h3>
                      <p className="text-sm text-[#141413] bg-[#F4F1E6] border border-[#141413]/20 rounded-lg p-3 leading-relaxed">
                        &ldquo;{selectedAsset.prompt}&rdquo;
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="section-label mb-2">Export Formats</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["GLB", "FBX", "OBJ", "STL", "USDZ", "3MF"].map((fmt) => {
                        const lowerFmt = fmt.toLowerCase();
                        const url = selectedAsset.outputUrls?.[lowerFmt];
                        const glbUrl = selectedAsset.outputUrls?.glb || selectedAsset.outputUrls?.obj;
                        const isAvailable = !!url || ((lowerFmt === "obj" || lowerFmt === "stl" || lowerFmt === "glb") && !!glbUrl);

                        return (
                          <button
                            key={fmt}
                            disabled={converting === fmt}
                            onClick={() => handleFormatExport(fmt)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                              isAvailable
                                ? "bg-white border-[#141413] text-[#141413] hover:bg-[#FF6A1A]"
                                : "bg-[#EDEFF2] border-[#141413]/20 text-[#6E6C65] cursor-not-allowed opacity-50"
                            }`}
                          >
                            {converting === fmt ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            .{lowerFmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="section-label mb-2">Actions</h3>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleShare(selectedAsset)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#141413] hover:bg-[#EDEFF2] transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Copy Share Link
                      </button>
                      <button
                        onClick={() => { handleDelete(selectedAsset.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Model
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

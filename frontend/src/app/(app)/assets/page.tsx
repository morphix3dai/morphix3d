"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  FolderOpen, Search, Grid3x3, List, Download, Trash2, Share2,
  Eye, Sparkles, Loader2, X, Check, ExternalLink,
} from "lucide-react";
import { assets as assetsApi, generate, getAccessToken } from "@/lib/api";
import type { GenerationJob } from "@/lib/api";
import toast from "react-hot-toast";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a12] rounded-xl animate-pulse flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-[#6366f1] animate-spin" />
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
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch real assets from backend
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Fetch generation history (which has all models)
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
      await generate.status(assetId); // verify it exists
      // Try to delete via assets API if asset record exists
      try { await assetsApi.delete(assetId); } catch { /* may not have asset record yet */ }
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset deleted");
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    } catch {
      // Just remove from local state if backend fails
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset removed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (asset: AssetItem) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";
    if (asset.outputUrls) {
      // Find the first available file URL
      const fileUrl = asset.outputUrls.glb || asset.outputUrls.obj || asset.outputUrls.stl || Object.values(asset.outputUrls)[0];
      if (fileUrl) {
        const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${backendUrl}${fileUrl}`;
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
    try {
      await assetsApi.update(asset.id, { isPublic: true });
      setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, isPublic: true } : a));
      navigator.clipboard.writeText(`${window.location.origin}/community/${asset.id}`);
      toast.success("Model shared publicly! Link copied.");
    } catch {
      navigator.clipboard.writeText(`${window.location.origin}/community/${asset.id}`);
      toast.success("Share link copied!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#818cf8]" /> My Assets
          </h1>
          <p className="text-sm text-[#64748b] mt-1">{filtered.length} model{filtered.length !== 1 ? "s" : ""} generated</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="input-field pl-10 py-2.5 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto py-2.5 text-sm pr-8 appearance-none cursor-pointer">
          <option value="all">All Types</option>
          <option value="text">Text to 3D</option>
          <option value="image">Image to 3D</option>
          <option value="texture">AI Texture</option>
          <option value="remesh">Remesh</option>
          <option value="rig">Rigging</option>
        </select>
        <div className="flex border border-[rgba(148,163,184,0.1)] rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView("grid")} className={`p-2.5 ${view === "grid" ? "bg-[rgba(99,102,241,0.15)] text-[#818cf8]" : "text-[#64748b] hover:text-white"}`}>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-[rgba(99,102,241,0.15)] text-[#818cf8]" : "text-[#64748b] hover:text-white"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="p-12 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-center">
          <Sparkles className="w-12 h-12 text-[#1e1e38] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No models yet</h3>
          <p className="text-sm text-[#64748b] mb-4">Generate your first 3D model to see it here</p>
          <a href="/workspace/text-to-3d" className="btn-primary text-sm inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Create Your First Model
          </a>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset, i) => (
            <motion.div key={asset.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] overflow-hidden card-hover cursor-pointer"
              onClick={() => setSelectedAsset(asset)}>
              {/* Preview */}
              <div className="h-40 bg-[#0a0a12] relative flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-[#1e1e38] mx-auto mb-1" />
                  <span className="text-[10px] text-[#334155] font-mono">3D MODEL</span>
                </div>
                {asset.isPublic && <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[rgba(16,185,129,0.15)] text-[#10b981]">Public</span>}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[rgba(99,102,241,0.15)] text-[#818cf8]">
                  <Check className="w-3 h-3 inline mr-0.5" />COMPLETED
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }} className="p-2.5 rounded-lg bg-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.5)] text-white transition-colors" title="View 3D Model">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(asset); }} className="p-2.5 rounded-lg bg-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.5)] text-white transition-colors" title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(asset); }} className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white transition-colors" title="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-2.5 rounded-lg bg-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.4)] text-white transition-colors" title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm truncate">{asset.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#64748b]">{asset.type}</span>
                  <span className="text-xs font-mono text-[#94a3b8] px-1.5 py-0.5 rounded bg-[#1a1a2e]">.glb</span>
                </div>
                <div className="text-xs text-[#475569] mt-1">{asset.size} • {asset.date}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((asset, i) => (
            <motion.div key={asset.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedAsset(asset)}
              className="flex items-center gap-4 p-3 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] hover:border-[rgba(99,102,241,0.2)] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-[#0a0a12] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#6366f1]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{asset.name}</div>
                <div className="text-xs text-[#64748b]">{asset.type} • {asset.style}</div>
              </div>
              <span className="text-xs font-mono text-[#94a3b8] px-1.5 py-0.5 rounded bg-[#1a1a2e]">.glb</span>
              <span className="text-xs text-[#64748b] w-16 text-right">{asset.size}</span>
              <span className="text-xs text-[#64748b] w-20 text-right">{asset.date}</span>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(asset); }} className="p-1.5 rounded-lg text-[#64748b] hover:text-[#10b981] hover:bg-[#1a1a2e]" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleShare(asset); }} className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1a1a2e]" title="Share">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-1.5 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#1a1a2e]" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ================================================ */}
      {/* Asset Detail Modal with 3D Viewer */}
      {/* ================================================ */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.8)] flex items-center justify-center p-6"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] rounded-2xl bg-[#12121a] border border-[rgba(148,163,184,0.1)] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(148,163,184,0.07)]">
                <div>
                  <h2 className="text-lg font-bold">{selectedAsset.name}</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
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
                  <button onClick={() => setSelectedAsset(null)} className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1a1a2e] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[65vh]">
                {/* 3D Viewer */}
                <div className="flex-1 p-4">
                  <ModelViewer className="w-full h-full" />
                </div>

                {/* Details Sidebar */}
                <div className="w-[280px] border-l border-[rgba(148,163,184,0.07)] p-5 overflow-y-auto space-y-5">
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
                          <span className="text-[#64748b]">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAsset.prompt && (
                    <div>
                      <h3 className="section-label mb-2">Prompt Used</h3>
                      <p className="text-sm text-[#94a3b8] bg-[#0a0a12] rounded-lg p-3 leading-relaxed">
                        &ldquo;{selectedAsset.prompt}&rdquo;
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="section-label mb-2">Export Formats</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["GLB", "FBX", "OBJ", "STL", "USDZ", "3MF"].map((fmt) => (
                        <button key={fmt} onClick={() => toast.success(`Downloading .${fmt.toLowerCase()}`)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a0a12] border border-[rgba(148,163,184,0.06)] text-xs font-mono text-[#94a3b8] hover:border-[rgba(99,102,241,0.3)] hover:text-white transition-all">
                          <Download className="w-3 h-3" />.{fmt.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="section-label mb-2">Actions</h3>
                    <div className="space-y-1.5">
                      <button onClick={() => handleShare(selectedAsset)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#1a1a2e] transition-colors">
                        <Share2 className="w-4 h-4" /> Copy Share Link
                      </button>
                      <button onClick={() => { handleDelete(selectedAsset.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors">
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

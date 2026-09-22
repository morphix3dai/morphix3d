"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, Heart, Share2, ZoomIn, X, Loader2, ImageIcon, Wand2, Settings2, ChevronRight, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { generate } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
type BuildingType = { id: string; label: string };
type StyleOption  = { id: string; label: string; desc: string };

// ── Static Data ────────────────────────────────────────────────────────────────
const BUILDING_TYPES: BuildingType[] = [
  { id: "villa",    label: "Villa"      },
  { id: "library",  label: "Library"    },
  { id: "museum",   label: "Museum"     },
  { id: "mall",     label: "Mall"       },
  { id: "school",   label: "School"     },
  { id: "park",     label: "Park"       },
  { id: "office",   label: "Office"     },
  { id: "hotel",    label: "Hotel"      },
];

const STYLES: StyleOption[] = [
  { id: "modern",       label: "Modern",       desc: "Clean lines, glass, steel" },
  { id: "minimalist",   label: "Minimalist",   desc: "Simple, functional" },
  { id: "contemporary", label: "Contemporary", desc: "Current trends" },
  { id: "futuristic",   label: "Futuristic",   desc: "Parametric, organic" },
  { id: "classical",    label: "Classical",    desc: "Traditional forms" },
  { id: "industrial",   label: "Industrial",   desc: "Raw materials, exposed" },
];

const GALLERY_ITEMS = [
  { id: 1, label: "Modern Villa", style: "Modern", prompt: "luxury modern villa, pool, glass facade, hillside", bg: "from-slate-800 to-slate-900", span: "row-span-2" },
  { id: 2, label: "Urban Museum", style: "Futuristic", prompt: "futuristic museum, curved steel, urban plaza", bg: "from-zinc-800 to-neutral-900", span: "" },
  { id: 3, label: "Glass Library", style: "Contemporary", prompt: "glass library, airy, natural light, books", bg: "from-stone-800 to-stone-900", span: "" },
  { id: 4, label: "Minimalist Office", style: "Minimalist", prompt: "minimalist office tower, concrete, greenery", bg: "from-gray-800 to-gray-900", span: "row-span-2" },
  { id: 5, label: "School Campus", style: "Modern", prompt: "modern school campus, open spaces, sustainable", bg: "from-neutral-800 to-zinc-900", span: "" },
  { id: 6, label: "Boutique Hotel", style: "Classical", prompt: "classical boutique hotel, ornate facade, garden", bg: "from-slate-700 to-slate-900", span: "" },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  const [tab, setTab]               = useState<"generate" | "gallery">("generate");
  const [buildingType, setBuildingType] = useState("villa");
  const [style, setStyle]           = useState("modern");
  const [prompt, setPrompt]         = useState("");
  const [baseImage, setBaseImage]   = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [result, setResult]         = useState<string | null>(null);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState("");
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [zoomItem, setZoomItem]     = useState<(typeof GALLERY_ITEMS)[0] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBaseImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !baseImage) {
      toast.error("Add a prompt or upload a base image");
      return;
    }
    setGenerating(true);
    setProgress(0);
    setResult(null);
    setPreviewSvg(null);
    try {
      const bt = BUILDING_TYPES.find(b => b.id === buildingType)?.label || buildingType;
      const st = STYLES.find(s => s.id === style)?.label || style;
      const fullPrompt = `${bt}, ${st} style, ${prompt}`.trim();
      setResultLabel(`${bt} · ${st}`);

      const job = await generate.architecture({
        prompt: fullPrompt,
        houseStyle: style,
        sqft: 2000,
        floors: 2,
        rooms: { bedroom: 3, bathroom: 2, kitchen: 1, garage: 1, garden: 1 },
      });

      // Poll for completion
      const jobId = (job as { jobId?: string }).jobId;
      if (jobId) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const status = await generate.status(jobId);
            setProgress(status.progress || 0);
            if (status.status === "COMPLETED") {
              // Use SVG preview if backend provided it
              const urls = status.outputUrls as Record<string, string> | undefined;
              if (urls?.preview) {
                setPreviewSvg(urls.preview);
              }
              break;
            }
            if (status.status === "FAILED") {
              throw new Error(status.errorMessage || "Generation failed");
            }
          } catch { break; }
        }
      }

      setProgress(100);
      setResult("generated");
      toast.success("Floor plan generated!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const toggleLike = (id: number) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e040fb] to-[#ff4081] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Architecture AI</h1>
            <p className="text-xs text-white/40">Render stunning architectural designs</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {(["generate", "gallery"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-gradient-to-r from-[#e040fb] to-[#ff4081] text-white shadow" : "text-white/50 hover:text-white"
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === "generate" && (
        <div className="flex h-[calc(100vh-130px)]">

          {/* Left Panel */}
          <div className="w-[340px] flex-shrink-0 border-r border-white/5 overflow-y-auto p-5 space-y-6">

            {/* Building Type Pills */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Building Type</p>
              <div className="flex flex-wrap gap-2">
                {BUILDING_TYPES.map(b => (
                  <button key={b.id} onClick={() => setBuildingType(b.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      buildingType === b.id
                        ? "bg-gradient-to-r from-[#e040fb] to-[#ff4081] border-transparent text-white shadow shadow-purple-500/30"
                        : "border-white/10 text-white/50 hover:border-white/30 hover:text-white bg-white/5"
                    }`}
                  >{b.label}</button>
                ))}
              </div>
            </div>

            {/* Style Cards */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Style</p>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      style === s.id
                        ? "border-[#e040fb]/60 bg-[#e040fb]/10"
                        : "border-white/8 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${style === s.id ? "text-[#e040fb]" : "text-white"}`}>{s.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Image Upload */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Base Image <span className="normal-case text-white/20">(optional)</span></p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {baseImage ? (
                <div className="relative group rounded-xl overflow-hidden aspect-video">
                  <img src={baseImage} alt="base" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors">Change</button>
                    <button onClick={() => setBaseImage(null)} className="px-3 py-1.5 bg-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/50 transition-colors">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-[#e040fb]/40 transition-all flex flex-col items-center justify-center gap-2 group bg-white/2">
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#e040fb]/10 transition-colors flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white/30 group-hover:text-[#e040fb] transition-colors" />
                  </div>
                  <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Drop sketch or photo here</p>
                </button>
              )}
            </div>

            {/* Prompt */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Prompt</p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, 600))}
                placeholder={`Describe your ${BUILDING_TYPES.find(b=>b.id===buildingType)?.label || "building"}...\n\ne.g. glass facade, infinity pool, mountain view, evening light, photorealistic`}
                rows={5}
                className="w-full bg-white/5 border border-white/8 rounded-xl p-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#e040fb]/50 transition-colors leading-relaxed"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">Be specific for best results</span>
                <span className={`text-[10px] ${prompt.length > 500 ? "text-[#e040fb]" : "text-white/20"}`}>{prompt.length}/600</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                bg-gradient-to-r from-[#e040fb] to-[#ff4081] text-white hover:opacity-90 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating... {progress}%</>
                : <><Sparkles className="w-4 h-4" /> Generate Design</>
              }
            </button>

            {/* Progress bar */}
            {generating && (
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden -mt-3">
                <motion.div className="h-full bg-gradient-to-r from-[#e040fb] to-[#ff4081] rounded-full"
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[#080808]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-2xl">
                  {/* Real floor plan preview */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
                    {previewSvg ? (
                      // Real SVG floor plan from backend
                      <img
                        src={previewSvg}
                        alt="Generated floor plan"
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      // Styled placeholder while no SVG yet
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                        <div className="grid grid-cols-3 gap-1.5 opacity-60">
                          {["Living","Kitchen","Dining","Bed 1","Bed 2","Bath"].map((room, i) => (
                            <div key={i} className={`rounded border border-white/20 bg-white/5 flex items-center justify-center text-[9px] text-white/50 font-medium ${
                              i === 0 ? "col-span-2 h-16" : "h-12"
                            }`}>{room}</div>
                          ))}
                        </div>
                        <p className="text-white/40 text-xs font-medium">{resultLabel || "Floor Plan Generated"}</p>
                      </div>
                    )}
                    {/* Overlay badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-[#e040fb]/80 backdrop-blur-sm rounded-full text-xs font-semibold">
                        AI Generated
                      </span>
                    </div>
                  </div>
                  {/* Action bar */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-white/50 truncate max-w-xs">{prompt || `${BUILDING_TYPES.find(b=>b.id===buildingType)?.label} design`}</p>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Heart className="w-4 h-4 text-white/50" /></button>
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Share2 className="w-4 h-4 text-white/50" /></button>
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e040fb] to-[#ff4081] text-xs font-semibold flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center max-w-sm">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#e040fb]/10 to-[#ff4081]/10 border border-[#e040fb]/20 flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-12 h-12 text-[#e040fb]/50" />
                  </div>
                  <h3 className="text-lg font-bold text-white/70 mb-2">Your design will appear here</h3>
                  <p className="text-sm text-white/30 leading-relaxed">Choose a building type, style, and add a prompt — then click <span className="text-[#e040fb]">Generate Design</span></p>
                  <div className="mt-6 flex flex-col gap-2">
                    {["Try: 'glass villa with infinity pool, mountain view'", "Try: 'futuristic museum with curved steel facade'"].map((ex, i) => (
                      <button key={i} onClick={() => setPrompt(ex.replace("Try: '","").replace("'",""))}
                        className="text-xs text-white/30 hover:text-[#e040fb] transition-colors px-4 py-2 rounded-lg bg-white/3 hover:bg-[#e040fb]/5 border border-white/5 hover:border-[#e040fb]/20 text-left">
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── GALLERY TAB ── */}
      {tab === "gallery" && (
        <div className="p-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {["All", "Architectural Design", "Interior Design", "Urban Planning", "Landscape"].map(cat => (
              <button key={cat}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  cat === "All"
                    ? "bg-gradient-to-r from-[#e040fb] to-[#ff4081] border-transparent text-white"
                    : "border-white/10 text-white/50 hover:text-white hover:border-white/30 bg-white/5"
                }`}
              >{cat}</button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div className="columns-3 gap-4 space-y-4">
            {GALLERY_ITEMS.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br"
                style={{ aspectRatio: i % 3 === 0 ? "3/4" : "4/3" }}
                onClick={() => setZoomItem(item)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.bg}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-white/10" />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-white/60">{item.style}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); toggleLike(item.id); }}
                          className={`p-1.5 rounded-lg backdrop-blur-sm transition-all ${likedItems.has(item.id) ? "bg-[#ff4081]/80 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                          <Heart className={`w-3.5 h-3.5 ${likedItems.has(item.id) ? "fill-white" : ""}`} />
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                          <ZoomIn className="w-3.5 h-3.5 text-white/70" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setPrompt(item.prompt); setTab("generate"); }}
                      className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#e040fb] to-[#ff4081] text-xs font-semibold flex items-center justify-center gap-1">
                      <Wand2 className="w-3 h-3" /> Generate Similar
                    </button>
                  </div>
                </div>
                {/* Style badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-medium text-white/70">{item.style}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zoom Modal ── */}
      <AnimatePresence>
        {zoomItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50" onClick={() => setZoomItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-5xl flex gap-6">
                {/* Image */}
                <div className={`flex-1 rounded-2xl overflow-hidden bg-gradient-to-br ${zoomItem.bg} aspect-video flex items-center justify-center`}>
                  <Building2 className="w-20 h-20 text-white/10" />
                </div>
                {/* Details */}
                <div className="w-72 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{zoomItem.label}</h3>
                    <button onClick={() => setZoomItem(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/8">
                    <p className="text-xs text-white/40 mb-1 font-semibold uppercase tracking-wider">Prompt</p>
                    <p className="text-sm text-white/80 leading-relaxed">{zoomItem.prompt}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-2">
                    <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Parameters</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Style</span><span className="text-white/80">{zoomItem.style}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Resolution</span><span className="text-white/80">1536×1536</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Model</span><span className="text-white/80">Arch-Gen v2</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPrompt(zoomItem.prompt); setZoomItem(null); setTab("generate"); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e040fb] to-[#ff4081] text-sm font-bold flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" /> Generate the Same
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => toggleLike(zoomItem.id)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 border transition-all ${likedItems.has(zoomItem.id) ? "bg-[#ff4081]/20 border-[#ff4081]/50 text-[#ff4081]" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                      <Heart className={`w-3.5 h-3.5 ${likedItems.has(zoomItem.id) ? "fill-current" : ""}`} />
                      {likedItems.has(zoomItem.id) ? "Liked" : "Like"}
                    </button>
                    <button className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 border border-white/10 text-white/50 hover:border-white/30 transition-all">
                      <Download className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

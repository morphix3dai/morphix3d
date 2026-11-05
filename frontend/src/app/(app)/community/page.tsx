"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Users, Heart, Search, Sparkles, Eye, Download, Loader2, Cog, Building2, Palette, X, Share2 } from "lucide-react";
import { assets, Asset } from "@/lib/api";
import toast from "react-hot-toast";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#EDEFF2] rounded-xl animate-pulse flex items-center justify-center border border-[#141413]/20">
      <Loader2 className="w-8 h-8 text-[#FF6A1A] animate-spin" />
    </div>
  ),
});

const CURATED_SHOWCASE: (Asset & { category?: string; author?: string; prompt?: string })[] = [
  {
    id: "showcase-helical-gear-28t",
    name: "28-Tooth Helical Transmission Gear (M2.5 · 20° PA)",
    fileFormat: "STEP / GLB",
    fileUrl: "/samples/gear.glb",
    fileSize: 2450000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 142,
    downloads: 89,
    createdAt: "2026-10-24T10:00:00.000Z",
    category: "MECHANICAL CAD",
    author: "Morphix CAD Lab",
    prompt: "28-tooth helical gear, bore 16mm, keyway 5mm, thickness 22mm, hardened 4140 steel",
  },
  {
    id: "showcase-courtyard-villa",
    name: "3-Bedroom Modern Courtyard Villa (1,800 sq ft · 2 Floors)",
    fileFormat: "DXF / GLB",
    fileUrl: "/samples/castle.glb",
    fileSize: 4120000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 198,
    downloads: 134,
    createdAt: "2026-10-25T14:30:00.000Z",
    category: "ARCHITECTURE",
    author: "Studio ArchiTech",
    prompt: "3-bedroom modern courtyard villa, 1800 sq ft, 2 floors, north-facing living room & MEP stack",
  },
  {
    id: "showcase-cyber-valkyrie",
    name: "Armored Cyber-Valkyrie Guardian (4K PBR Quad Mesh)",
    fileFormat: "GLB / OBJ",
    fileUrl: "/samples/dragon.glb",
    fileSize: 6840000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 276,
    downloads: 165,
    createdAt: "2026-10-26T09:15:00.000Z",
    category: "CREATIVE 3D",
    author: "Atelier Morphix",
    prompt: "Armored cyber-valkyrie guardian with glowing wings, clean quad topology, 4K PBR metallic armor",
  },
  {
    id: "showcase-planetary-carrier",
    name: "CNC Billet Planetary Gearbox Housing (6061-T6 Aluminum)",
    fileFormat: "STEP / STL",
    fileUrl: "/samples/gear.glb",
    fileSize: 3180000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 118,
    downloads: 74,
    createdAt: "2026-10-27T11:20:00.000Z",
    category: "MECHANICAL CAD",
    author: "K. Precision Works",
    prompt: "6-bolt planetary gearbox flange housing, 110mm OD, M8 bolt circle, 6061-T6 aluminum",
  },
  {
    id: "showcase-relic-longsword",
    name: "Runed Obsidian Relic Greatsword (Game-Ready Low Poly)",
    fileFormat: "GLB / FBX",
    fileUrl: "/samples/sword.glb",
    fileSize: 1950000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 164,
    downloads: 112,
    createdAt: "2026-10-28T16:45:00.000Z",
    category: "CREATIVE 3D",
    author: "Forge & Rune",
    prompt: "Runed obsidian greatsword with weathered bronze crossguard and emissive runes",
  },
  {
    id: "showcase-brutalist-pavilion",
    name: "Cantilevered Brutalist Glass & Concrete Studio Pavilion",
    fileFormat: "DXF / GLB",
    fileUrl: "/samples/castle.glb",
    fileSize: 3890000,
    thumbnailUrl: null,
    isPublic: true,
    likes: 151,
    downloads: 93,
    createdAt: "2026-10-29T12:10:00.000Z",
    category: "ARCHITECTURE",
    author: "Nordic BIM Collective",
    prompt: "2-story cantilevered brutalist studio pavilion, 2400 sq ft, double-height glazing, open courtyard",
  },
];

const tabs = [
  { id: "latest", label: "Latest" },
  { id: "likes", label: "Most Liked" },
  { id: "downloads", label: "Most Downloaded" },
];

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("latest");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [galleryItems, setGalleryItems] = useState<(Asset & { category?: string; author?: string; prompt?: string })[]>(CURATED_SHOWCASE);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectItem, setInspectItem] = useState<(Asset & { category?: string; author?: string; prompt?: string }) | null>(null);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await assets.gallery(1, 30, activeTab);
      const apiAssets = (result.assets || []).map((a) => ({
        ...a,
        category: a.fileFormat?.includes("STEP")
          ? "MECHANICAL CAD"
          : a.fileFormat?.includes("DXF")
          ? "ARCHITECTURE"
          : "CREATIVE 3D",
        author: "Community Creator",
      }));
      const existingIds = new Set(apiAssets.map((a) => a.id));
      const merged = [
        ...apiAssets,
        ...CURATED_SHOWCASE.filter((c) => !existingIds.has(c.id)),
      ];
      if (activeTab === "likes") {
        merged.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (activeTab === "downloads") {
        merged.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      }
      setGalleryItems(merged);
    } catch {
      setGalleryItems(CURATED_SHOWCASE);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const toggleLike = async (id: string) => {
    const isAlreadyLiked = likedItems.has(id);
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (isAlreadyLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setGalleryItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, likes: Math.max(0, (item.likes || 0) + (isAlreadyLiked ? -1 : 1)) }
          : item
      )
    );
    if (!id.startsWith("showcase-")) {
      try {
        const result = await assets.like(id);
        setGalleryItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, likes: result.likes } : item))
        );
      } catch {
        // Optimistic like preserved
      }
    }
  };

  const handleDownload = (item: Asset & { prompt?: string }) => {
    const url = item.fileUrl || item.outputUrls?.glb;
    if (url && (url.startsWith("http") || url.startsWith("data:"))) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name.replace(/[^a-zA-Z0-9]/g, "_")}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading: ${item.name}`);
      return;
    }
    // Generate clean procedural Wavefront OBJ download for showcase models
    const objContent = `# MORPHIX 3D COMMUNITY ASSET EXPORT\n# Model: ${item.name}\n# Prompt: ${item.prompt || item.name}\no MorphixCommunityAsset\nv -1.0 0.0 -1.0\nv 1.0 0.0 -1.0\nv 1.0 0.0 1.0\nv -1.0 0.0 1.0\nv -0.8 1.6 -0.8\nv 0.8 1.6 -0.8\nv 0.8 1.6 0.8\nv -0.8 1.6 0.8\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n`;
    const blob = new Blob([objContent], { type: "text/plain" });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = `${item.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.obj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
    toast.success(`Downloaded ${item.name} (.OBJ)`);
  };

  const filtered = galleryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.prompt || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || (item.category || "CREATIVE 3D") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-[#141413]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-normal flex items-center gap-2 text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            <Users className="w-6 h-6 text-[#FF6A1A]" /> Community Gallery
          </h1>
          <p className="text-sm text-[#4A4945] mt-1">
            Explore 3D models, parametric CAD assemblies, and architectural blueprints created with Morphix 3D
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "MECHANICAL CAD", "ARCHITECTURE", "CREATIVE 3D"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#141413] text-[#FAF8F2] border-[#141413]"
                  : "bg-[#FAF8F2] text-[#4A4945] border-[#141413]/25 hover:border-[#141413]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CAD gears, villas, characters..."
            className="input-field pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex border-[1.5px] border-[#141413] rounded-lg overflow-hidden ml-auto bg-[#FAF8F2]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === tab.id ? "bg-[#141413] text-[#FAF8F2]" : "text-[#4A4945] hover:text-[#141413]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6A1A] animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413]">
          <Sparkles className="w-12 h-12 text-[#FF6A1A] mx-auto mb-3" />
          <p className="font-bold text-[#141413]">No models match your search</p>
          <p className="text-xs text-[#6E6C65] mt-1">Try clearing your search filter or switch category.</p>
        </div>
      )}

      {/* Gallery Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, i) => {
            const cat = item.category || "CREATIVE 3D";
            const CategoryIcon =
              cat === "MECHANICAL CAD" ? Cog : cat === "ARCHITECTURE" ? Building2 : Palette;
            const badgeColor =
              cat === "MECHANICAL CAD"
                ? "bg-[#2563EB] text-white"
                : cat === "ARCHITECTURE"
                ? "bg-[#0D9488] text-white"
                : "bg-[#FF6A1A] text-[#141413]";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] overflow-hidden hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Preview Viewport */}
                  <div
                    onClick={() => setInspectItem(item)}
                    className="h-48 bg-[#EDEFF2] border-b border-[#141413]/20 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.16) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CategoryIcon className="w-8 h-8 text-[#141413]" />
                    </div>
                    <span className="mt-2.5 text-[11px] font-mono text-[#6E6C65]">
                      Click to inspect in 3D
                    </span>

                    <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-[#141413] ${badgeColor}`}>
                      {cat}
                    </span>
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141413] text-[#FAF8F2]">
                      {item.fileFormat || "GLB"}
                    </span>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#141413]/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem(item);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#FAF8F2] hover:bg-[#FF6A1A] text-[#141413] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Inspect 3D
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className="p-2 rounded-lg bg-[#FAF8F2] hover:bg-[#16A34A] text-[#141413] hover:text-white cursor-pointer"
                        title="Download model"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/community/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-[#FAF8F2] hover:bg-[#2563EB] text-[#141413] hover:text-white"
                        title="Open permanent page"
                      >
                        <Share2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="font-bold text-sm text-[#141413] line-clamp-1">{item.name}</div>
                    {item.prompt && (
                      <p className="text-xs text-[#6E6C65] mt-1 line-clamp-2 font-mono">
                        &ldquo;{item.prompt}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3.5 pt-2 border-t border-[#141413]/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#6E6C65]">
                    {item.author || "Morphix Creator"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(item.id)}
                      className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                        likedItems.has(item.id) ? "text-[#DC2626]" : "text-[#6E6C65] hover:text-[#DC2626]"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedItems.has(item.id) ? "fill-current" : ""}`} />
                      {item.likes}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive 3D Inspection Modal */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectItem(null)}
        >
          <div
            className="w-full max-w-4xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[10px_10px_0px_#141413] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#F4F1E6] border-b border-[#141413]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#141413] text-[#FAF8F2]">
                  {inspectItem.category || inspectItem.fileFormat || "3D ASSET"}
                </span>
                <h3 className="text-lg font-bold text-[#141413] mt-1">{inspectItem.name}</h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-2 rounded-lg border border-[#141413]/20 hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[420px] w-full bg-[#EDEFF2]">
              <ModelViewer
                modelUrl={
                  inspectItem.fileUrl &&
                  (inspectItem.fileUrl.startsWith("http") || inspectItem.fileUrl.startsWith("data:"))
                    ? inspectItem.fileUrl
                    : null
                }
                className="w-full h-full"
              />
            </div>

            <div className="px-6 py-4 bg-[#FAF8F2] border-t border-[#141413]/20 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#4A4945] max-w-xl">
                <strong className="text-[#141413]">Prompt:</strong>{" "}
                {inspectItem.prompt || inspectItem.name}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/community/${inspectItem.id}`);
                    toast.success("Direct model link copied!");
                  }}
                  className="px-4 py-2 rounded-lg border-[1.5px] border-[#141413] bg-[#FAF8F2] hover:bg-[#F4F1E6] text-xs font-bold text-[#141413] flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy Link
                </button>
                <button
                  onClick={() => handleDownload(inspectItem)}
                  className="px-4 py-2 rounded-lg border-[1.5px] border-[#141413] bg-[#FF6A1A] hover:bg-[#E85A0C] text-xs font-bold text-[#141413] shadow-[3px_3px_0px_#141413] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download 3D File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

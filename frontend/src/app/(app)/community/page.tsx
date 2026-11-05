"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Heart, Search, Sparkles, Eye, Download, Loader2 } from "lucide-react";
import { assets, Asset } from "@/lib/api";
import toast from "react-hot-toast";

const tabs = [
  { id: "latest", label: "Latest" },
  { id: "likes", label: "Most Liked" },
  { id: "downloads", label: "Most Downloaded" },
];

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("latest");
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [galleryItems, setGalleryItems] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await assets.gallery(1, 30, activeTab);
      setGalleryItems(result.assets);
    } catch {
      setGalleryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const toggleLike = async (id: string) => {
    try {
      const result = await assets.like(id);
      setLikedItems((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      setGalleryItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, likes: result.likes } : item))
      );
    } catch {
      toast.error("Please sign in to like models");
    }
  };

  const filtered = galleryItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-[#141413]">
      <div>
        <h1
          className="text-3xl font-normal flex items-center gap-2 text-[#141413]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          <Users className="w-6 h-6 text-[#FF6A1A]" /> Community Gallery
        </h1>
        <p className="text-sm text-[#4A4945] mt-1">Explore 3D models, CAD assemblies, and architectural plans created by the community</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gallery..." className="input-field pl-10 py-2.5 text-sm" />
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
        <div className="text-center py-20 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413]">
          <Sparkles className="w-12 h-12 text-[#FF6A1A] mx-auto mb-3" />
          <p className="font-bold text-[#141413]">No community models yet</p>
          <p className="text-xs text-[#6E6C65] mt-1">Be the first to share a creation from your Assets vault!</p>
        </div>
      )}

      {/* Gallery Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] overflow-hidden hover:-translate-y-1 transition-all"
            >
              {/* Preview */}
              <div className="h-44 bg-[#EDEFF2] border-b border-[#141413]/20 relative flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#6E6C65]" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141413] text-[#FAF8F2]">
                  {item.fileFormat || "GLB"}
                </span>
                {/* Hover */}
                <div className="absolute inset-0 bg-[#141413]/75 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { const url = item.fileUrl || item.outputUrls?.glb; if (url) window.open(url, "_blank"); }}
                    className="p-2.5 rounded-lg bg-[#FAF8F2] hover:bg-[#FF6A1A] text-[#141413]"
                    title="View model"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const url = item.fileUrl || item.outputUrls?.glb;
                      if (url) {
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${item.name || "model"}.${item.fileFormat?.toLowerCase() || "glb"}`;
                        a.click();
                      }
                    }}
                    className="p-2.5 rounded-lg bg-[#FAF8F2] hover:bg-[#16A34A] text-[#141413] hover:text-white"
                    title="Download model"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-bold text-sm text-[#141413]">{item.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono text-[#6E6C65]">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => toggleLike(item.id)}
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                      likedItems.has(item.id) ? "text-[#DC2626]" : "text-[#6E6C65] hover:text-[#DC2626]"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedItems.has(item.id) ? "fill-current" : ""}`} />
                    {item.likes}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

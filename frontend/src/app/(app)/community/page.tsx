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
      // Backend may be offline — show empty state
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
      // Update the item's like count in local state
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-[#818cf8]" /> Community Gallery
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Explore 3D models created by the community</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gallery..." className="input-field pl-10 py-2.5 text-sm" />
        </div>
        <div className="flex border border-[rgba(148,163,184,0.1)] rounded-lg overflow-hidden ml-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-[rgba(99,102,241,0.15)] text-[#818cf8]" : "text-[#64748b] hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-[#1a1a2e] mx-auto mb-3" />
          <p className="text-[#64748b]">No community models yet</p>
          <p className="text-xs text-[#475569] mt-1">Be the first to share a creation!</p>
        </div>
      )}

      {/* Gallery Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] overflow-hidden card-hover">
              {/* Preview */}
              <div className="h-44 bg-[#0a0a12] relative flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#1a1a2e]" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[rgba(99,102,241,0.15)] text-[#818cf8]">{item.fileFormat || "GLB"}</span>
                {/* Hover */}
                <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"><Eye className="w-5 h-5" /></button>
                  <button className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"><Download className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#64748b]">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => toggleLike(item.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${likedItems.has(item.id) ? "text-[#ef4444]" : "text-[#64748b] hover:text-[#ef4444]"}`}>
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

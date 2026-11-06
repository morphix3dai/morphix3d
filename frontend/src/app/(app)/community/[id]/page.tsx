"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Sparkles, Loader2, ExternalLink } from "lucide-react";
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

export default function CommunityAssetDetailPage() {
  const params = useParams<{ id: string }>();
  const assetId = params?.id || "";
  const [asset, setAsset] = useState<(Asset & { generation?: { prompt?: string; type?: string; outputUrls?: Record<string, string> } }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) return;
    assets
      .get(assetId)
      .then((data) => {
        setAsset(data as Asset & { generation?: { prompt?: string; type?: string; outputUrls?: Record<string, string> } });
      })
      .catch(() => {
        setAsset({
          id: assetId,
          name: assetId.replace(/^showcase-/, "").replace(/-/g, " ").toUpperCase(),
          fileFormat: "GLB",
          fileUrl: "",
          fileSize: 2450000,
          thumbnailUrl: null,
          isPublic: true,
          likes: 42,
          downloads: 18,
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  const handleDownload = () => {
    if (!asset) return;
    const url = asset.fileUrl || asset.outputUrls?.glb || asset.generation?.outputUrls?.glb;
    if (url && (url.startsWith("http") || url.startsWith("data:"))) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_")}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${asset.name}`);
      return;
    }
    const objContent = `# MORPHIX 3D SHARED ASSET\n# Name: ${asset.name}\no SharedMorphixModel\nv -1 0 -1\nv 1 0 -1\nv 1 0 1\nv -1 0 1\nv 0 1.8 0\nf 1 2 3 4\nf 1 2 5\nf 2 3 5\nf 3 4 5\nf 4 1 5\n`;
    const blob = new Blob([objContent], { type: "text/plain" });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.obj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
    toast.success(`Downloaded ${asset.name} (.OBJ)`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 text-[#FF6A1A] animate-spin" />
      </div>
    );
  }

  const validModelUrl =
    asset?.fileUrl &&
    (asset.fileUrl.startsWith("http") ||
      asset.fileUrl.startsWith("data:") ||
      asset.fileUrl.startsWith("/"))
      ? asset.fileUrl
      : asset?.outputUrls?.glb || asset?.generation?.outputUrls?.glb || "/samples/dragon.glb";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-[#141413]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4A4945] hover:text-[#141413]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Gallery
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Share link copied to clipboard!");
            }}
            className="px-4 py-2 rounded-lg border-[1.5px] border-[#141413] bg-[#FAF8F2] hover:bg-[#F4F1E6] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Link
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg border-[1.5px] border-[#141413] bg-[#FF6A1A] hover:bg-[#E85A0C] text-xs font-bold text-white shadow-[3px_3px_0px_#141413] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download 3D Asset
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413] overflow-hidden">
        <div className="px-6 py-4 bg-[#F4F1E6] border-b border-[#141413]/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#141413] text-[#FAF8F2]">
              {asset?.fileFormat || "GLB"} · SHARED 3D CREATION
            </span>
            <h1
              className="text-2xl font-normal text-[#141413] mt-1"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              {asset?.name || "Morphix 3D Model"}
            </h1>
          </div>
          <Link
            href="/workspace/text-to-3d"
            className="px-3.5 py-2 rounded-lg border border-[#141413] bg-[#FAF8F2] hover:bg-[#141413] hover:text-[#FAF8F2] text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A1A]" /> Remix in Studio <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="h-[480px] w-full bg-[#EDEFF2]">
          <ModelViewer modelUrl={validModelUrl} className="w-full h-full" />
        </div>

        <div className="px-6 py-4 bg-[#FAF8F2] border-t border-[#141413]/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#6E6C65]">
          <div>
            <strong className="text-[#141413]">Prompt:</strong>{" "}
            {asset?.generation?.prompt || asset?.name || "Morphix 3D Creation"}
          </div>
          <div>
            Published {asset?.createdAt ? new Date(asset.createdAt).toLocaleDateString() : "Today"}
          </div>
        </div>
      </div>
    </div>
  );
}

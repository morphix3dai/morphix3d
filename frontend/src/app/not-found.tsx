import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";
import { ArrowRight, Cog, Building2, Palette, Home, Users } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#F4F1E6] text-[#141413] px-4 py-12 relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(20, 20, 19, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 20, 19, 0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="max-w-xl w-full bg-[#FAF8F2] border-2 border-[#141413] shadow-[10px_10px_0px_#141413] p-8 sm:p-10 text-center space-y-6">
        <div className="flex justify-center">
          <Link href="/">
            <MorphixLogo size="md" showTagline />
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EFECE0] border border-[#141413] font-mono text-xs font-bold uppercase tracking-widest text-[#FF6A1A]">
          ERR // 404 · COORDINATES OUT OF BOUNDS
        </div>

        <div>
          <h1
            className="text-5xl sm:text-6xl font-normal text-[#141413] mb-3"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Blueprint Not Found
          </h1>
          <p className="text-sm text-[#575652] max-w-md mx-auto leading-relaxed">
            The 3D studio coordinate or asset URL you requested does not exist on the drafting table. Choose a destination below to continue building.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
          <Link
            href="/workspace/mechanical"
            className="p-3.5 bg-[#F4F1E6] border-[1.5px] border-[#141413] hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors group"
          >
            <Cog className="w-4 h-4 text-[#FF6A1A] mb-1.5" />
            <div className="font-mono text-xs font-bold">Mechanical CAD</div>
            <div className="text-[11px] opacity-75">B-Rep Gears &amp; Parts</div>
          </Link>
          <Link
            href="/workspace/architecture"
            className="p-3.5 bg-[#F4F1E6] border-[1.5px] border-[#141413] hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors group"
          >
            <Building2 className="w-4 h-4 text-[#2F5BFF] mb-1.5" />
            <div className="font-mono text-xs font-bold">Architecture</div>
            <div className="text-[11px] opacity-75">2D Plans to 3D BIM</div>
          </Link>
          <Link
            href="/workspace/text-to-3d"
            className="p-3.5 bg-[#F4F1E6] border-[1.5px] border-[#141413] hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors group"
          >
            <Palette className="w-4 h-4 text-[#6D4AFF] mb-1.5" />
            <div className="font-mono text-xs font-bold">Creative 3D</div>
            <div className="text-[11px] opacity-75">4K PBR &amp; Rigging</div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="btn-primary text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Return to Homepage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/community"
            className="btn-secondary text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Community Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}

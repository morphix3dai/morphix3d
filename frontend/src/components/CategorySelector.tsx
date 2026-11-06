"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cog, Building2, Palette, ArrowRight } from "lucide-react";

const categories = [
  {
    id: "mechanical",
    title: "Mechanical CAD",
    subtitle: "Engineering & Manufacturing",
    description: "Design precision-engineered parts, gears, housings, brackets, and assemblies with parametric B-Rep AI.",
    icon: Cog,
    href: "/workspace/mechanical",
    accentBg: "bg-[#FF6A1A] text-white",
    features: ["STEP Export", "Parametric B-Rep", "CNC Ready"],
    badge: "01 · CAD",
  },
  {
    id: "architecture",
    title: "Architecture",
    subtitle: "Buildings & Interiors",
    description: "Generate collision-free floor plans, 3D cutaway houses, room layouts, and BOQ specs from one sentence.",
    icon: Building2,
    href: "/workspace/architecture",
    accentBg: "bg-[#2F5BFF] text-white",
    features: ["Floor Plans", "3D Cutaway", "PDF/DXF Export"],
    badge: "02 · ARCH",
  },
  {
    id: "creative",
    title: "Creative 3D",
    subtitle: "Assets & Characters",
    description: "Synthesize game assets, characters, props, and 4K PBR quad meshes from text prompts or images.",
    icon: Palette,
    href: "/workspace/text-to-3d",
    accentBg: "bg-[#6D4AFF] text-white",
    features: ["Text to 3D", "Image to 3D", "4K PBR Texture"],
    badge: "03 · 3D",
  },
];

interface CategorySelectorProps {
  size?: "lg" | "md";
  className?: string;
}

export default function CategorySelector({ size = "lg", className = "" }: CategorySelectorProps) {
  const isLarge = size === "lg";

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${className}`}>
      {categories.map((cat, i) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Link href={cat.href} className="block group h-full">
            <div
              className={`h-full flex flex-col justify-between rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[5px_5px_0px_#141413] hover:-translate-y-1 transition-all duration-200 ${
                isLarge ? "p-6" : "p-5"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`${isLarge ? "w-12 h-12" : "w-10 h-10"} rounded-xl ${cat.accentBg} border border-[#141413] flex items-center justify-center shadow-[2px_2px_0px_#141413]`}
                  >
                    <cat.icon className={`${isLarge ? "w-6 h-6" : "w-5 h-5"}`} />
                  </div>
                  <span className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded bg-[#141413] text-[#FAF8F2]">
                    {cat.badge}
                  </span>
                </div>

                <h3
                  className={`${isLarge ? "text-2xl" : "text-xl"} font-normal text-[#141413] mb-0.5`}
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {cat.title}
                </h3>
                <p className="text-[11px] font-mono font-bold text-[#6E6C65] mb-3 tracking-wider uppercase">
                  {cat.subtitle}
                </p>
                <p className={`text-sm text-[#4A4945] leading-relaxed ${isLarge ? "mb-5" : "mb-3"}`}>
                  {cat.description}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cat.features.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#EDEFF2] text-[#141413] border border-[#141413]/20"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#141413] group-hover:text-[#FF6A1A] transition-colors">
                  <span>Launch Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

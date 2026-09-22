"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cog, Building2, Palette, ArrowRight } from "lucide-react";

const categories = [
  {
    id: "mechanical",
    title: "Mechanical CAD",
    subtitle: "Engineering & Manufacturing",
    description: "Design precision-engineered parts, gears, housings, brackets, and assemblies with parametric AI.",
    icon: Cog,
    href: "/workspace/mechanical",
    gradient: "from-[#00F0FF] to-[#0EA5E9]",
    glowColor: "rgba(0, 240, 255, 0.15)",
    borderColor: "rgba(0, 240, 255, 0.25)",
    features: ["STEP Export", "Parametric", "CNC Ready"],
    badge: "CAD",
  },
  {
    id: "architecture",
    title: "Architecture",
    subtitle: "Buildings & Interiors",
    description: "Generate floor plans, 3D houses, room layouts, and interior designs from text descriptions.",
    icon: Building2,
    href: "/workspace/architecture",
    gradient: "from-[#7B2FFF] to-[#A855F7]",
    glowColor: "rgba(123, 47, 255, 0.15)",
    borderColor: "rgba(123, 47, 255, 0.25)",
    features: ["Floor Plans", "3D Models", "PDF Export"],
    badge: "ARCH",
  },
  {
    id: "creative",
    title: "Creative 3D",
    subtitle: "Assets & Characters",
    description: "Create game assets, characters, props, and organic 3D models from text prompts or images.",
    icon: Palette,
    href: "/workspace/text-to-3d",
    gradient: "from-[#FF2FD4] to-[#F43F5E]",
    glowColor: "rgba(255, 47, 212, 0.15)",
    borderColor: "rgba(255, 47, 212, 0.25)",
    features: ["Text to 3D", "Image to 3D", "AI Texture"],
    badge: "3D",
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
        >
          <Link href={cat.href} className="block group">
            <div
              className={`relative overflow-hidden rounded-2xl border transition-all duration-500 
                group-hover:scale-[1.02] group-hover:shadow-2xl
                ${isLarge ? "p-7" : "p-5"}`}
              style={{
                backgroundColor: "rgba(15, 15, 24, 0.8)",
                borderColor: cat.borderColor,
                boxShadow: `0 0 0 1px ${cat.borderColor}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${cat.glowColor}, 0 0 0 1px ${cat.borderColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 1px ${cat.borderColor}`;
              }}
            >
              {/* Background gradient glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${cat.glowColor}, transparent 70%)`,
                }}
              />

              {/* Icon + Badge */}
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div
                  className={`${isLarge ? "w-14 h-14" : "w-10 h-10"} rounded-xl bg-gradient-to-br ${cat.gradient} 
                    flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <cat.icon className={`${isLarge ? "w-7 h-7" : "w-5 h-5"} text-white`} />
                </div>
                <span
                  className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-md bg-gradient-to-r ${cat.gradient} text-white`}
                >
                  {cat.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="relative z-10">
                <h3 className={`${isLarge ? "text-xl" : "text-lg"} font-bold text-white mb-0.5 group-hover:text-white transition-colors`}>
                  {cat.title}
                </h3>
                <p className="text-xs font-medium text-[#64748b] mb-3 tracking-wide uppercase">
                  {cat.subtitle}
                </p>
                <p className={`text-sm text-[#94a3b8] leading-relaxed ${isLarge ? "mb-5" : "mb-3"}`}>
                  {cat.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {cat.features.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[#94a3b8] border border-[rgba(255,255,255,0.06)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold text-[#64748b] group-hover:text-white transition-colors">
                  <span>Start Creating</span>
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

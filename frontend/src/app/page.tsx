"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Globe,
  Cog,
  Building2,
  Palette,
  FileDown,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Orbital3DHero from "@/components/Orbital3DHero";
import PhyloFooter from "@/components/PhyloFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const capabilities = [
  {
    code: "01 // MECHANICAL CAD",
    icon: Cog,
    title: "Precision B-Rep Parts",
    description:
      "Clinical blueprint on frosted paper. Real-time parametric sliders for tooth count, bore diameter, and wall thickness.",
    href: "/mechanical_cad_section.html",
    items: [
      "Parametric involute gears & CNC brackets",
      "Shaded, Wireframe & Exploded orthographic views",
      "ISO 2768-fH tolerance callouts (±0.02 mm)",
      "Direct STEP, STL, DXF & GLB export",
    ],
    accent: "#FF6A1A",
    accentBg: "rgba(255, 106, 26, 0.12)",
  },
  {
    code: "02 // ARCHITECTURE BIM",
    icon: Building2,
    title: "Floor Plans to Full 3D",
    description:
      "Warm architect's studio desk. Watch 2D drafting lines extrude into structural walls, furnished cutaways, and exteriors.",
    href: "/architecture_studio_section.html",
    items: [
      "4-stage interactive 2D-to-3D morphing",
      "Click any room to inspect live dimensions",
      "Toggle Roof & Furniture layers on/off",
      "Export scaled PDF, AutoCAD DXF, USDZ & GLB",
    ],
    accent: "#2F5BFF",
    accentBg: "rgba(47, 91, 255, 0.10)",
  },
  {
    code: "03 // CREATIVE 3D ATELIER",
    icon: Palette,
    title: "Characters & Props",
    description:
      "Daylight sculpture atelier. Step through Prompt → Image → Quad Mesh → 4K PBR Texture with 65-bone auto-rigging.",
    href: "/creative_3d_darkroom.html",
    items: [
      "4-stage transparent mesh synthesis pipeline",
      "Live 65-bone skeleton & T-Pose / Action toggle",
      "Watertight quad topology for Unity & Unreal",
      "Export GLB, FBX, OBJ & Apple USDZ",
    ],
    accent: "#6D4AFF",
    accentBg: "rgba(109, 74, 255, 0.10)",
  },
];

const exportFormats = ["STEP", "STL", "DXF", "PDF", "GLB", "FBX", "OBJ", "USDZ", "3MF", "BLEND"];

const useCases = [
  {
    code: "SPEC // IND-01",
    title: "CNC & Additive Manufacturing",
    description: "Watertight manifold B-Rep solids exported directly to STEP, IGES, STL, and 3MF for 5-axis milling.",
    icon: Layers,
  },
  {
    code: "SPEC // IND-02",
    title: "Robotics & Mechatronics",
    description: "Planetary gearboxes, NEMA motor mounts, and sensor brackets with ISO tolerance clearances.",
    icon: Cog,
  },
  {
    code: "SPEC // IND-03",
    title: "Architectural Residential",
    description: "Scaled 2D floor plans and 3D daylight cutaways for client approvals and rapid site massing.",
    icon: Building2,
  },
  {
    code: "SPEC // IND-04",
    title: "Game Development",
    description: "Clean quad-remeshed assets with 4K PBR textures and 65-bone rigs for Unity, Unreal, and Godot.",
    icon: Sparkles,
  },
  {
    code: "SPEC // IND-05",
    title: "AR / E-Commerce",
    description: "Apple Vision Pro USDZ and web-ready GLB product configurators from a single photo or prompt.",
    icon: Globe,
  },
  {
    code: "SPEC // IND-06",
    title: "STEM & Education",
    description: "Interactive exploded assemblies and cross-sections for engineering labs and classrooms.",
    icon: Star,
  },
];

const pricingPlans = [
  {
    tier: "TIER 01 // STARTER",
    name: "Free",
    price: "₹0",
    period: "/ forever",
    features: [
      "200 one-time signup credits",
      "All 3 AI 3D Studio engines",
      "GLB, OBJ, STL & SVG export",
      "Public community gallery",
      "Standard generation queue",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    tier: "TIER 02 // PROFESSIONAL",
    name: "Pro Studio",
    price: "₹999",
    period: "/ month",
    features: [
      "2,000 high-speed credits / month",
      "All native CAD exports (STEP, DXF, USDZ)",
      "Priority GPU generation queue",
      "No watermark",
      "Full commercial ownership & private models",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    tier: "TIER 03 // ORGANIZATION",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited team credits & seats",
      "Dedicated CAD / BIM REST API",
      "Custom tolerance & library training",
      "Team workspace & role management",
      "99.9% SLA & dedicated engineer",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F1E6] text-[#141413]">
      <Navbar />

      {/* Main Hero Section: 3D Orbital Carousel in Warm Architectural Paper Theme */}
      <Orbital3DHero />

      {/* Export Formats Bar */}
      <section className="border-b-[1.5px] border-[#141413] bg-[#EFECE0]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-2.5">
          <FileDown className="w-4 h-4 text-[#575652] mr-1" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#575652] mr-2">
            NATIVE CAD &amp; 3D PIPELINE EXPORTS:
          </span>
          {exportFormats.map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 bg-[#FAF8F2] text-xs font-mono font-bold text-[#141413] border border-[#141413]"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* Capabilities Section (Three Engines, One Drafting Table) */}
      <section className="py-20 px-4 border-b-[1.5px] border-[#141413] bg-[#F4F1E6]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-end justify-between gap-6 pb-6 mb-12 border-b-[1.5px] border-[#141413]"
          >
            <div>
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-xs font-mono font-bold text-[#FF6A1A] mb-2 tracking-widest uppercase"
              >
                // 01 · THREE ENGINES, ONE DRAFTING TABLE
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl font-normal text-[#141413]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Every 3D Workflow, Unified.
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} custom={2} className="text-sm text-[#575652] max-w-md">
              Crafted with the tactile clarity of architectural vellum and industrial catalog blueprints. Click any
              engine to launch its dedicated studio.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-7">
            {capabilities.map((cap, i) => (
              <motion.a
                href={cap.href}
                key={cap.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col justify-between p-7 bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_rgba(20,20,19,0.08)] hover:shadow-[8px_8px_0px_#141413] hover:-translate-y-1 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-1 border border-[#141413]"
                      style={{ backgroundColor: cap.accentBg, color: cap.accent }}
                    >
                      {cap.code}
                    </span>
                    <cap.icon className="w-5 h-5 text-[#141413]" />
                  </div>
                  <h3
                    className="text-3xl font-normal mb-2 text-[#141413]"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    {cap.title}
                  </h3>
                  <p className="text-sm text-[#575652] mb-5 leading-relaxed">{cap.description}</p>
                  <ul className="space-y-2.5 mb-7 border-t border-dashed border-[#141413]/25 pt-4">
                    {cap.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-xs font-mono text-[#141413]">
                        <span className="font-bold" style={{ color: cap.accent }}>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="flex items-center justify-between px-4 py-3 bg-[#141413] text-[#F4F1E6] font-mono text-xs font-bold uppercase tracking-wider group-hover:bg-[#FF6A1A] group-hover:text-white transition-colors"
                  style={{ boxShadow: `3px 3px 0px ${cap.accent}` }}
                >
                  <span>Launch Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases (Ruled Industrial Catalog Grid) */}
      <section className="py-20 px-4 border-b-[1.5px] border-[#141413] bg-[#EDEFF2]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-end justify-between gap-6 pb-6 mb-12 border-b-[1.5px] border-[#141413]"
          >
            <div>
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-xs font-mono font-bold text-[#2F5BFF] mb-2 tracking-widest uppercase"
              >
                // 02 · INDUSTRY SPECIFICATION MATRIX
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl font-normal text-[#141413]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Built for Every Engineering &amp; Creative Discipline.
              </motion.h2>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-[1.5px] border-[#141413] bg-[#FAF8F2]">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-7 border-b border-r border-[#141413]/20 hover:bg-[#F4F1E6] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10.5px] font-mono font-bold text-[#2F5BFF]">{uc.code}</span>
                  <uc.icon className="w-5 h-5 text-[#141413]" />
                </div>
                <h3
                  className="text-2xl font-normal mb-2 text-[#141413]"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {uc.title}
                </h3>
                <p className="text-sm text-[#575652] leading-relaxed">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing (Unified Paper Catalog) */}
      <section className="py-20 px-4 border-b-[1.5px] border-[#141413] bg-[#F4F1E6]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-xs font-mono font-bold text-[#FF6A1A] mb-2 tracking-widest uppercase"
            >
              // 03 · TRANSPARENT LICENSING
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl font-normal mb-3 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Start Free, Scale as You Build.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#575652] max-w-lg mx-auto text-sm">
              200 free credits on signup. Full access to Mechanical CAD, Architecture, and Creative 3D.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative p-7 border-2 border-[#141413] flex flex-col justify-between transition-all ${
                  plan.popular
                    ? "bg-[#FFFDF7] shadow-[10px_10px_0px_#141413]"
                    : "bg-[#FAF8F2] shadow-[5px_5px_0px_rgba(20,20,19,0.08)]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-5 text-[10px] font-mono font-bold tracking-wider uppercase px-3 py-1 bg-[#FF6A1A] text-white border-[1.5px] border-[#141413]">
                    Most Popular
                  </span>
                )}
                <div>
                  <div className="text-[11px] font-mono font-bold text-[#575652] mb-1">{plan.tier}</div>
                  <h3
                    className="text-3xl font-normal text-[#141413]"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-3 mb-5 pb-4 border-b border-dashed border-[#141413]/25">
                    <span
                      className="text-5xl font-normal text-[#141413]"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-xs font-mono text-[#575652] ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-xs font-mono text-[#141413]">
                        <Check className="w-3.5 h-3.5 text-[#FF6A1A] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className={`flex items-center justify-center gap-2 py-3 px-4 border-[1.5px] border-[#141413] font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    plan.popular
                      ? "bg-[#141413] text-[#F4F1E6] shadow-[3px_3px_0px_#FF6A1A] hover:bg-[#FF6A1A] hover:text-white"
                      : "bg-[#FAF8F2] text-[#141413] hover:bg-[#141413] hover:text-[#F4F1E6]"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Editorial + Technical Sketch + 3D Iridescent Sculpture Footer */}
      <PhyloFooter />
    </div>
  );
}

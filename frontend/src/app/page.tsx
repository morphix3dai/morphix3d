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
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const capabilities = [
  {
    icon: Cog,
    title: "Mechanical CAD",
    href: "/mechanical_cad_section.html",
    items: ["Parametric parts", "STEP/STL export", "CNC-ready precision", "Feature tree editing"],
    gradient: "from-[#00F0FF] to-[#0EA5E9]",
  },
  {
    icon: Building2,
    title: "Architecture",
    href: "/architecture_studio_section.html",
    items: ["AI floor plans", "3D house models", "PDF/DXF export", "Interior layouts"],
    gradient: "from-[#7B2FFF] to-[#A855F7]",
  },
  {
    icon: Palette,
    title: "Creative 3D",
    href: "/creative_3d_darkroom.html",
    items: ["Text to 3D", "Image to 3D", "AI texturing", "Auto-rigging"],
    gradient: "from-[#FF2FD4] to-[#F43F5E]",
  },
];

const exportFormats = ["STEP", "GLB", "FBX", "OBJ", "STL", "DXF", "PDF", "USDZ", "3MF", "BLEND"];

const useCases = [
  { title: "3D Printing", description: "Print-ready, watertight models exported in STL & 3MF", icon: Layers },
  { title: "Game Development", description: "Low-poly assets with PBR textures for Unity & Unreal", icon: Sparkles },
  { title: "Product Design", description: "Precision CAD models for manufacturing & prototyping", icon: Cog },
  { title: "Architecture", description: "Floor plans and 3D visualizations for clients", icon: Building2 },
  { title: "E-Commerce", description: "3D product mockups for online stores", icon: Globe },
  { title: "Education", description: "Visual 3D models for learning and presentations", icon: Star },
];

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["200 one-time credits", "All 7 AI engines", "GLB & OBJ export", "Community gallery", "Basic support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    features: [
      "2,000 credits/month",
      "All export formats",
      "Priority queue",
      "No watermark",
      "Commercial license",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited credits",
      "Dedicated GPU",
      "API access",
      "Team management",
      "SLA guarantee",
      "Custom model training",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06060b] text-white">
      <Navbar />

      {/* Main Hero Section: 3D Orbital Depth-of-Field Carousel + "Type it / See it — Just Morphix it" */}
      <Orbital3DHero />

      {/* Export Formats Bar */}
      <section className="border-y border-[rgba(148,163,184,0.05)] bg-[rgba(18,18,26,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-3">
          <FileDown className="w-4 h-4 text-[#64748b] mr-1" />
          <span className="text-sm text-[#64748b] mr-2">Export to:</span>
          {exportFormats.map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1 rounded-lg bg-[#1a1a2e] text-xs font-mono font-semibold text-[#94a3b8] border border-[rgba(148,163,184,0.05)]"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* Capabilities Section (Clicking any card opens its dedicated 3D Studio Section) */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold text-[#00F0FF] mb-3 tracking-wider uppercase"
            >
              Three Engines, One Platform
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
              Every 3D Workflow, Covered
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#94a3b8] max-w-2xl mx-auto">
              Click any engine below to launch its dedicated interactive 3D Studio.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {capabilities.map((cap, i) => (
              <motion.a
                href={cap.href}
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="block p-6 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)] hover:border-[rgba(0,240,255,0.35)] transition-all hover:-translate-y-1 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-5`}
                >
                  <cap.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{cap.title}</h3>
                  <ArrowRight className="w-4 h-4 text-[#64748b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <ul className="space-y-2.5">
                  {cap.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#94a3b8]">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-4 bg-[rgba(18,18,26,0.3)]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold text-[#7B2FFF] mb-3 tracking-wider uppercase"
            >
              Use Cases
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
              Built for Every Industry
            </motion.h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)] hover:border-[rgba(148,163,184,0.15)] transition-colors group"
              >
                <uc.icon className="w-8 h-8 text-[#64748b] group-hover:text-[#818cf8] transition-colors mb-3" />
                <h3 className="font-semibold mb-1">{uc.title}</h3>
                <p className="text-sm text-[#64748b]">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold text-[#FF2FD4] mb-3 tracking-wider uppercase"
            >
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
              Start Free, Scale as You Grow
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#94a3b8] max-w-lg mx-auto">
              200 free credits to start. Upgrade when you need more power.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border transition-all ${
                  plan.popular
                    ? "bg-gradient-to-b from-[rgba(123,47,255,0.08)] to-[#0f0f18] border-[rgba(123,47,255,0.3)] shadow-lg shadow-[rgba(123,47,255,0.1)]"
                    : "bg-[#0f0f18] border-[rgba(148,163,184,0.07)]"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-gradient-to-r from-[#7B2FFF] to-[#FF2FD4] text-white mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm text-[#64748b]">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#7B2FFF] to-[#FF2FD4] text-white hover:opacity-90"
                      : "bg-[#1a1a2e] text-[#94a3b8] hover:text-white hover:bg-[#252540]"
                  }`}
                >
                  {plan.cta} <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Phylo-Style Editorial + Technical Sketch + 3D Iridescent Sculpture Footer */}
      <PhyloFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Globe,
  Download,
  Eye,
  ChevronRight,
  Cog,
  Building2,
  Palette,
  FileDown,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CategorySelector from "@/components/CategorySelector";
import MorphixLogo from "@/components/MorphixLogo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stats = [
  { value: "3", label: "AI Engines" },
  { value: "<60s", label: "Generation Time" },
  { value: "10+", label: "Export Formats" },
  { value: "Free", label: "To Start" },
];

const capabilities = [
  {
    icon: Cog,
    title: "Mechanical CAD",
    items: ["Parametric parts", "STEP/STL export", "CNC-ready precision", "Feature tree editing"],
    gradient: "from-[#00F0FF] to-[#0EA5E9]",
  },
  {
    icon: Building2,
    title: "Architecture",
    items: ["AI floor plans", "3D house models", "PDF/DXF export", "Interior layouts"],
    gradient: "from-[#7B2FFF] to-[#A855F7]",
  },
  {
    icon: Palette,
    title: "Creative 3D",
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
    features: ["5 free credits", "Basic 3D generation", "GLB & OBJ export", "Community gallery"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    features: [
      "200 credits/month",
      "All 3 AI engines",
      "All export formats",
      "Priority queue",
      "Download history",
    ],
    cta: "Start Creating",
    popular: true,
  },
  {
    name: "Pro",
    price: "₹1,999",
    period: "/month",
    features: [
      "1000 credits/month",
      "HD generation quality",
      "Batch generation",
      "API access",
      "Priority support",
      "Commercial license",
    ],
    cta: "Go Pro",
    popular: false,
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
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(0,240,255,0.06),transparent_60%)]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(123,47,255,0.06),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,47,212,0.04),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] mb-6"
          >
            <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-xs font-medium text-[#00F0FF]">3 AI Engines · One Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6"
          >
            Design{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00F0FF, #7B2FFF, #FF2FD4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Anything
            </span>{" "}
            in 3D
            <br />
            with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#94a3b8] max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            From mechanical parts to floor plans to game characters — choose your category
            and let AI generate production-ready 3D models in under 60 seconds.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center gap-8 sm:gap-12 mb-14"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl font-bold"
                  style={{
                    background: "linear-gradient(90deg, #00F0FF, #7B2FFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-[#64748b] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Category Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-6">What do you want to create?</h2>
            <CategorySelector size="lg" className="max-w-5xl mx-auto" />
          </motion.div>
        </div>
      </section>

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

      {/* Capabilities Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-[#00F0FF] mb-3 tracking-wider uppercase">
              Three Engines, One Platform
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
              Every 3D Workflow, Covered
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#94a3b8] max-w-2xl mx-auto">
              Whether you need precision-engineered CAD parts, architectural floor plans, or creative game assets — Morphix handles it all.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.07)] hover:border-[rgba(148,163,184,0.15)] transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-5`}>
                  <cap.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{cap.title}</h3>
                <ul className="space-y-2.5">
                  {cap.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#94a3b8]">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-4 bg-[rgba(18,18,26,0.3)]">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-[#7B2FFF] mb-3 tracking-wider uppercase">
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
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-[#FF2FD4] mb-3 tracking-wider uppercase">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-bold mb-4">
              Start Free, Scale as You Grow
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#94a3b8] max-w-lg mx-auto">
              5 free credits to start. Upgrade when you need more power.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
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

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-b from-[rgba(0,240,255,0.05)] to-[rgba(123,47,255,0.05)] border border-[rgba(0,240,255,0.15)]"
          >
            <MorphixLogo size="lg" showTagline className="justify-center mb-6" />
            <h2 className="text-3xl font-bold mb-3">Ready to Create?</h2>
            <p className="text-[#94a3b8] mb-6">
              Start with 5 free credits. No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[#00F0FF] via-[#7B2FFF] to-[#FF2FD4] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[rgba(123,47,255,0.3)]"
            >
              Start Creating Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(148,163,184,0.07)] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <MorphixLogo size="sm" />
          <p className="text-xs text-[#64748b]">© 2026 Morphix. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="text-xs text-[#64748b] hover:text-white transition-colors">Pricing</Link>
            <Link href="/community" className="text-xs text-[#64748b] hover:text-white transition-colors">Gallery</Link>
            <Link href="/login" className="text-xs text-[#64748b] hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

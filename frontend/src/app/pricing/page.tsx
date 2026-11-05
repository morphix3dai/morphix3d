"use client";

import Navbar from "@/components/Navbar";
import PhyloFooter from "@/components/PhyloFooter";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Zap, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/api";
import RazorpayCheckout, { CREDIT_PLANS } from "@/components/RazorpayCheckout";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    credits: "200 credits (one-time)",
    planId: null,
    features: [
      "200 one-time credits",
      "All 7 AI engines",
      "GLB & OBJ export",
      "Community gallery",
      "Basic support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    credits: "2,000 credits/month",
    planId: "pro_monthly",
    features: [
      "2,000 credits per month",
      "All 7 export formats",
      "Priority queue",
      "No watermark",
      "Private models",
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
    credits: "Unlimited",
    planId: null,
    features: [
      "Custom credits",
      "Dedicated GPU",
      "API access",
      "Team management",
      "SLA guarantee",
      "Custom model training",
      "24/7 support",
    ],
    cta: "Contact Sales",
    popular: false,
    isEnterprise: true,
  },
];

const creditCosts = [
  { feature: "Text to 3D", credits: 10, icon: "✨" },
  { feature: "Image to 3D", credits: 10, icon: "🖼️" },
  { feature: "AI Texturing", credits: 5, icon: "🎨" },
  { feature: "Smart Remesh", credits: 3, icon: "⬡" },
  { feature: "Auto Rigging", credits: 8, icon: "🦴" },
  { feature: "Mechanical CAD", credits: 5, icon: "⚙️" },
  { feature: "Architecture", credits: 8, icon: "🏛️" },
  { feature: "3D Viewer", credits: 0, icon: "👁️" },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);
  const [, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setIsLoggedIn(!!token);
  }, []);

  function handlePlanCta(plan: typeof plans[0]) {
    if (plan.isEnterprise) {
      window.location.href = "mailto:enterprise@morphix.ai?subject=Enterprise%20Plan";
      return;
    }
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }
    if (plan.planId) {
      setSelectedPlanId(plan.planId);
      setCheckoutOpen(true);
    } else {
      router.push("/dashboard");
    }
  }

  function openCreditPurchase(planId?: string) {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }
    setSelectedPlanId(planId);
    setCheckoutOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#F4F1E6] text-[#141413]">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F2] border-[1.5px] border-[#141413] text-[#141413] text-[10px] font-mono uppercase tracking-[0.2em] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A1A]" />
              SECTION 03 // STUDIO CATALOG &amp; PRICING
            </div>
            <h1
              className="text-4xl lg:text-6xl font-normal mb-4 text-[#141413]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Simple, <span className="italic text-[#FF6A1A]">Transparent</span> Pricing
            </h1>
            <p className="text-[#4A4945] max-w-xl mx-auto text-lg">
              Start free with 200 studio credits. Pay only for what you engineer.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-7 rounded-2xl border-2 transition-all hover:-translate-y-1 ${
                  plan.popular
                    ? "bg-[#FAF8F2] border-[#141413] shadow-[8px_8px_0px_#FF6A1A]"
                    : "bg-[#FAF8F2] border-[#141413] shadow-[6px_6px_0px_#141413]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF6A1A] border-[1.5px] border-[#141413] text-[10px] font-mono uppercase tracking-widest font-bold text-[#141413]">
                    Most Popular
                  </div>
                )}
                <h3
                  className="text-2xl font-normal text-[#141413] mb-1"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {plan.name}
                </h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-[#141413]">{plan.price}</span>
                  <span className="text-[#6E6C65] text-sm">{plan.period}</span>
                </div>
                <p className="text-xs font-mono font-bold text-[#FF6A1A] uppercase tracking-wider mb-6">
                  {plan.credits}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#4A4945]">
                      <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanCta(plan)}
                  className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    plan.popular ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Buy Credits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2
                className="text-3xl font-normal mb-2 flex items-center justify-center gap-2 text-[#141413]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                <CreditCard className="w-6 h-6 text-[#FF6A1A]" />
                Buy Credits à la carte
              </h2>
              <p className="text-[#4A4945] text-sm">
                Need more credits? Top up anytime — no subscription required.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {CREDIT_PLANS.filter((p) => p.id !== "pro_monthly").map((pack, i) => (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => openCreditPurchase(pack.id)}
                  className={`relative p-5 rounded-xl border-[1.5px] border-[#141413] transition-all text-center hover:-translate-y-1 cursor-pointer ${
                    pack.popular
                      ? "bg-[#FAF8F2] shadow-[5px_5px_0px_#16A34A]"
                      : "bg-[#FAF8F2] shadow-[4px_4px_0px_#141413]"
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#16A34A] border border-[#141413] text-[9px] font-mono font-bold text-white whitespace-nowrap">
                      {pack.badge}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-[#141413] mb-0.5">
                    {pack.credits.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono uppercase text-[#6E6C65] mb-2">credits</div>
                  <div className="text-base font-bold text-[#FF6A1A]">₹{pack.amount}</div>
                  <div className="text-[10px] font-mono text-[#6E6C65] mt-1">
                    ₹{(pack.amount / pack.credits).toFixed(2)}/cr
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Credit Costs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto p-6 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413]"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#141413]">
              <Zap className="w-5 h-5 text-[#FF6A1A]" /> Credit Costs per Feature
            </h3>
            <div className="space-y-1">
              {creditCosts.map((item) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between py-2.5 border-b border-[#141413]/15 last:border-0"
                >
                  <span className="text-sm font-medium text-[#141413] flex items-center gap-2">
                    <span>{item.icon}</span> {item.feature}
                  </span>
                  <span className="text-sm font-mono font-bold">
                    {item.credits === 0 ? (
                      <span className="text-[#16A34A]">Free</span>
                    ) : (
                      <span className="text-[#FF6A1A]">{item.credits} credits</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <PhyloFooter />

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(creditsAdded, newBalance) => {
          setCreditBalance(newBalance);
          console.log(`Payment successful: +${creditsAdded} credits, balance: ${newBalance}`);
        }}
        defaultPlan={selectedPlanId}
      />
    </div>
  );
}

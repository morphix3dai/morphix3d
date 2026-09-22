"use client";

import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, CreditCard } from "lucide-react";
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
  { feature: "Text to 3D",   credits: 10,  icon: "✨" },
  { feature: "Image to 3D",  credits: 10,  icon: "🖼️" },
  { feature: "AI Texturing",  credits: 5,   icon: "🎨" },
  { feature: "Smart Remesh",  credits: 3,   icon: "⬡" },
  { feature: "Auto Rigging",  credits: 8,   icon: "🦴" },
  { feature: "Mechanical CAD",credits: 5,   icon: "⚙️" },
  { feature: "Architecture",  credits: 8,   icon: "🏛️" },
  { feature: "3D Viewer",     credits: 0,   icon: "👁️" },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

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
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className="section-label mb-3">Pricing</p>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h1>
            <p className="text-[#94a3b8] max-w-xl mx-auto text-lg">
              Start free. Pay only for what you create.
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
                className={`relative p-6 rounded-2xl border transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? "bg-gradient-to-b from-[rgba(99,102,241,0.08)] to-[#12121a] border-[rgba(99,102,241,0.3)] shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                    : "bg-[#12121a] border-[rgba(148,163,184,0.06)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-[#64748b] text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-[#818cf8] font-medium mb-6">{plan.credits}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#94a3b8]">
                      <Check className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanCta(plan)}
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <CreditCard className="w-6 h-6 text-[#6366f1]" />
                Buy Credits à la carte
              </h2>
              <p className="text-[#94a3b8] text-sm">Need more credits? Top up anytime — no subscription required.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {CREDIT_PLANS.filter((p) => p.id !== "pro_monthly").map((pack, i) => (
                <motion.button
                  key={pack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => openCreditPurchase(pack.id)}
                  className={`relative p-4 rounded-xl border transition-all text-center hover:scale-[1.03] hover:border-[rgba(99,102,241,0.4)] ${
                    pack.popular
                      ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.04)]"
                      : "border-[rgba(148,163,184,0.08)] bg-[#12121a]"
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#10b981] text-[9px] font-bold text-white whitespace-nowrap">
                      {pack.badge}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-white mb-0.5">{pack.credits.toLocaleString()}</div>
                  <div className="text-xs text-[#64748b] mb-2">credits</div>
                  <div className="text-base font-semibold text-[#818cf8]">₹{pack.amount}</div>
                  <div className="text-[10px] text-[#475569] mt-1">₹{(pack.amount / pack.credits).toFixed(2)}/cr</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Credit Costs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto p-6 rounded-2xl bg-[#12121a] border border-[rgba(148,163,184,0.06)]"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#f59e0b]" /> Credit Costs per Feature
            </h3>
            <div className="space-y-1">
              {creditCosts.map((item) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between py-2.5 border-b border-[rgba(148,163,184,0.05)] last:border-0"
                >
                  <span className="text-sm text-[#94a3b8] flex items-center gap-2">
                    <span>{item.icon}</span> {item.feature}
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {item.credits === 0 ? (
                      <span className="text-[#10b981]">Free</span>
                    ) : (
                      <span className="text-[#818cf8]">{item.credits} credits</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

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

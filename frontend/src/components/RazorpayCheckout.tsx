"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Shield, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { credits as creditsApi } from "@/lib/api";

// Declare Razorpay on window for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

export interface PurchasePlan {
  id: string;
  label: string;
  credits: number;
  amount: number; // in INR
  popular?: boolean;
  badge?: string;
}

export const CREDIT_PLANS: PurchasePlan[] = [
  { id: "credits_100",  label: "Starter Pack",  credits: 100,  amount: 99  },
  { id: "credits_500",  label: "Creator Pack",  credits: 500,  amount: 299, popular: true, badge: "Best Value" },
  { id: "credits_1000", label: "Pro Pack",      credits: 1000, amount: 499 },
  { id: "credits_2000", label: "Studio Pack",   credits: 2000, amount: 799 },
  { id: "pro_monthly",  label: "Pro Monthly",   credits: 2000, amount: 999, badge: "Subscription" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (creditsAdded: number, newBalance: number) => void;
  userEmail?: string;
  userName?: string;
  defaultPlan?: string;
}

type CheckoutStep = "select" | "processing" | "success" | "error";

export default function RazorpayCheckout({ isOpen, onClose, onSuccess, userEmail, userName, defaultPlan }: Props) {
  const [step, setStep] = useState<CheckoutStep>("select");
  const [selectedPlan, setSelectedPlan] = useState<PurchasePlan | null>(
    CREDIT_PLANS.find((p) => p.id === defaultPlan) || null
  );
  const [successData, setSuccessData] = useState<{ creditsAdded: number; newBalance: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePurchase() {
    if (!selectedPlan) return;
    setLoading(true);
    setStep("processing");

    try {
      // 1. Create Razorpay order on backend
      const order = await creditsApi.purchase(selectedPlan.id);

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your connection.");

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: order.keyId || "rzp_test_mock",
        amount: order.amount,
        currency: order.currency,
        name: "Morphix 3D",
        description: `${selectedPlan.credits} Credits — ${selectedPlan.label}`,
        order_id: order.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#6366f1" },
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await fetch("/api/credits/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("forge3d_access_token")}` },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                credits: selectedPlan.credits,
              }),
            });
            const data = await verifyRes.json();
            if (data.success) {
              setSuccessData({ creditsAdded: data.creditsAdded, newBalance: data.newBalance });
              setStep("success");
              onSuccess(data.creditsAdded, data.newBalance);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch {
            setErrorMsg("Payment was received but verification failed. Contact support.");
            setStep("error");
          }
        },
        modal: {
          ondismiss: () => {
            setStep("select");
            setLoading(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (step === "processing" || loading) return;
    setStep("select");
    setSelectedPlan(null);
    setErrorMsg("");
    setSuccessData(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-[#0f0f17] border border-[rgba(99,102,241,0.2)] rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.15)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(148,163,184,0.07)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Buy Credits</h2>
                    <p className="text-xs text-[#64748b]">Secure payment via Razorpay</p>
                  </div>
                </div>
                {step !== "processing" && (
                  <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[#64748b] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">

                {/* STEP: SELECT */}
                {step === "select" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-[#94a3b8] mb-4">Choose a credit pack to top up your account:</p>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {CREDIT_PLANS.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`relative flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                            selectedPlan?.id === plan.id
                              ? "border-[#6366f1] bg-[rgba(99,102,241,0.08)] shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                              : "border-[rgba(148,163,184,0.08)] bg-[#12121a] hover:border-[rgba(99,102,241,0.3)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                              selectedPlan?.id === plan.id
                                ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"
                                : "bg-[#1e1e2e] text-[#94a3b8]"
                            }`}>
                              {plan.credits >= 1000 ? `${plan.credits / 1000}K` : plan.credits}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{plan.label}</span>
                                {plan.badge && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    plan.popular ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]" : "bg-[rgba(99,102,241,0.1)] text-[#818cf8]"
                                  }`}>
                                    {plan.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#64748b]">{plan.credits.toLocaleString()} credits</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">₹{plan.amount}</div>
                            <div className="text-[10px] text-[#64748b]">
                              ₹{(plan.amount / plan.credits).toFixed(2)}/credit
                            </div>
                          </div>
                          {selectedPlan?.id === plan.id && (
                            <motion.div
                              layoutId="selected-indicator"
                              className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                              <div className="w-5 h-5 rounded-full bg-[#6366f1] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mb-6 py-3 border-t border-b border-[rgba(148,163,184,0.05)]">
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <Shield className="w-3.5 h-3.5 text-[#10b981]" />
                        Secure SSL
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <CreditCard className="w-3.5 h-3.5 text-[#6366f1]" />
                        UPI / Cards / Netbanking
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
                        Instant credits
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={!selectedPlan || loading}
                      className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                      ) : selectedPlan ? (
                        <>Pay ₹{selectedPlan.amount} · Get {selectedPlan.credits.toLocaleString()} Credits</>
                      ) : (
                        <>Select a plan to continue</>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* STEP: PROCESSING */}
                {step === "processing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center animate-pulse">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-1">Opening Payment</h3>
                      <p className="text-sm text-[#64748b]">Complete your payment in the Razorpay window…</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP: SUCCESS */}
                {step === "success" && successData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center border border-[rgba(16,185,129,0.3)]"
                    >
                      <CheckCircle className="w-10 h-10 text-[#10b981]" />
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-1">Payment Successful! 🎉</h3>
                      <p className="text-sm text-[#94a3b8] mb-4">
                        <span className="text-[#10b981] font-semibold">+{successData.creditsAdded.toLocaleString()} credits</span> added to your account
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)]">
                        <Zap className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-sm font-medium text-[#818cf8]">
                          New balance: {successData.newBalance.toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                    <button onClick={handleClose} className="btn-primary w-full max-w-xs py-2.5 text-sm font-semibold">
                      Start Creating →
                    </button>
                  </motion.div>
                )}

                {/* STEP: ERROR */}
                {step === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center border border-[rgba(239,68,68,0.2)]">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">Payment Failed</h3>
                      <p className="text-sm text-[#94a3b8] max-w-xs">{errorMsg}</p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button onClick={() => setStep("select")} className="btn-primary flex-1 py-2.5 text-sm">
                        Try Again
                      </button>
                      <button onClick={handleClose} className="btn-secondary flex-1 py-2.5 text-sm">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

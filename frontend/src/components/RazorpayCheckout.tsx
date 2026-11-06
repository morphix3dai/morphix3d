"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Shield, Zap, CheckCircle, AlertCircle, Loader2, Sparkles, Receipt } from "lucide-react";
import { credits as creditsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
  order_id?: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string; reason?: string } }) => void) => void;
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
  onSuccess: (creditsAdded: number, newBalance: number, newPlan?: string) => void;
  userEmail?: string;
  userName?: string;
  defaultPlan?: string;
}

type CheckoutStep = "select" | "processing" | "success" | "error";

export default function RazorpayCheckout({ isOpen, onClose, onSuccess, userEmail, userName, defaultPlan }: Props) {
  const { user, updateCredits, refreshUser } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("select");
  const [selectedPlan, setSelectedPlan] = useState<PurchasePlan | null>(
    CREDIT_PLANS.find((p) => p.id === defaultPlan) || CREDIT_PLANS[1]
  );
  const [successData, setSuccessData] = useState<{
    creditsAdded: number;
    newBalance: number;
    plan?: string;
    paymentId?: string;
    orderId?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync selectedPlan whenever modal opens or defaultPlan prop changes
  useEffect(() => {
    if (isOpen) {
      const matched = CREDIT_PLANS.find((p) => p.id === defaultPlan);
      setSelectedPlan(matched || CREDIT_PLANS[1]);
      setStep("select");
      setErrorMsg("");
    }
  }, [isOpen, defaultPlan]);

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function finalizeVerification(payload: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    plan: PurchasePlan;
  }) {
    const data = await creditsApi.verify({
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpayOrderId: payload.razorpayOrderId,
      razorpaySignature: payload.razorpaySignature,
      credits: payload.plan.credits,
      plan: payload.plan.id,
    });

    if (data.success) {
      updateCredits(data.newBalance);
      refreshUser().catch(() => {});
      setSuccessData({
        creditsAdded: data.creditsAdded,
        newBalance: data.newBalance,
        plan: data.plan,
        paymentId: payload.razorpayPaymentId,
        orderId: payload.razorpayOrderId,
      });
      setStep("success");
      onSuccess(data.creditsAdded, data.newBalance, data.plan);
    } else {
      throw new Error("Payment verification failed");
    }
  }

  async function handlePurchase() {
    if (!selectedPlan) return;
    setLoading(true);
    setStep("processing");
    setErrorMsg("");

    try {
      // 1. Create Razorpay order on backend (apiFetch auto-provisions guest session if needed)
      const order = await creditsApi.purchase(selectedPlan.id);

      // 2. If backend is in mock mode (no live Razorpay keys), complete instant sandbox verification
      if (order.orderId.startsWith("order_mock_") || order.keyId === "rzp_test_mock") {
        await finalizeVerification({
          razorpayPaymentId: `pay_sandbox_${Date.now()}`,
          razorpayOrderId: order.orderId,
          razorpaySignature: "razorpay_test_verified_signature",
          plan: selectedPlan,
        });
        setLoading(false);
        return;
      }

      // 3. Load official Razorpay checkout.js SDK
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay Checkout SDK. Please check your internet connection.");
      }

      // 4. Open Razorpay Checkout Modal
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Morphix 3D Studio",
        description: `${selectedPlan.credits.toLocaleString()} Credits — ${selectedPlan.label}`,
        order_id: order.orderId,
        prefill: {
          name: userName || user?.name || "Morphix Creator",
          email: userEmail || user?.email || "creator@3dmorphix.com",
        },
        notes: {
          plan: selectedPlan.id,
          credits: String(selectedPlan.credits),
        },
        theme: { color: "#FF6A1A" },
        handler: async (response) => {
          try {
            await finalizeVerification({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || order.orderId,
              razorpaySignature: response.razorpay_signature || "",
              plan: selectedPlan,
            });
          } catch (err) {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : "Payment was received, but verification failed. Please contact support@3dmorphix.com."
            );
            setStep("error");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setStep("select");
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        const desc = response?.error?.description || "Your payment could not be completed by the bank.";
        setErrorMsg(desc);
        setStep("error");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong starting Razorpay checkout.");
      setStep("error");
      setLoading(false);
    }
  }

  // Instant Test Mode Checkout (for 1-click verification when testing in Razorpay Test Mode)
  async function handleInstantTestCheckout() {
    if (!selectedPlan) return;
    setLoading(true);
    setStep("processing");
    setErrorMsg("");

    try {
      const order = await creditsApi.purchase(selectedPlan.id);
      await finalizeVerification({
        razorpayPaymentId: `pay_test_${Date.now()}`,
        razorpayOrderId: order.orderId,
        razorpaySignature: "razorpay_test_verified_signature",
        plan: selectedPlan,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sandbox test payment failed.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (step === "processing" && loading) return;
    setStep("select");
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
            className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-[#FAF8F2] text-[#141413] border-2 border-[#141413] rounded-2xl shadow-[8px_8px_0px_#141413] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#F4F1E6] border-b-[1.5px] border-[#141413]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF6A1A] border-[1.5px] border-[#141413] shadow-[2px_2px_0px_#141413] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#141413]" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-normal text-[#141413] leading-tight"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      Studio Credit Top-Up &amp; Plans
                    </h2>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#6E6C65]">
                      RAZORPAY SECURE GATEWAY // UPI · CARDS · NETBANKING
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close payment modal"
                  className="p-1.5 rounded-lg border border-transparent hover:border-[#141413] hover:bg-[#FAF8F2] text-[#4A4945] hover:text-[#141413] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[82vh] overflow-y-auto">

                {/* STEP: SELECT */}
                {step === "select" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#4A4945] mb-3.5">
                      SELECT A CREDIT PACK OR SUBSCRIPTION:
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 mb-5">
                      {CREDIT_PLANS.map((plan) => {
                        const isSelected = selectedPlan?.id === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            className={`relative flex items-center justify-between p-3.5 rounded-xl border-[1.5px] transition-all text-left cursor-pointer ${
                              isSelected
                                ? "border-[#141413] bg-[#F4F1E6] shadow-[4px_4px_0px_#FF6A1A]"
                                : "border-[#141413]/30 bg-[#FAF8F2] hover:border-[#141413] hover:bg-[#F4F1E6]/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg border-[1.5px] border-[#141413] flex items-center justify-center text-xs font-mono font-bold ${
                                  isSelected
                                    ? "bg-[#FF6A1A] text-[#141413]"
                                    : "bg-[#EDEFF2] text-[#141413]"
                                }`}
                              >
                                {plan.credits >= 1000 ? `${plan.credits / 1000}K` : plan.credits}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#141413]">{plan.label}</span>
                                  {plan.badge && (
                                    <span
                                      className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border border-[#141413] ${
                                        plan.popular
                                          ? "bg-[#16A34A] text-white"
                                          : "bg-[#FF6A1A] text-[#141413]"
                                      }`}
                                    >
                                      {plan.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-mono text-[#6E6C65]">
                                  +{plan.credits.toLocaleString()} studio credits
                                </p>
                              </div>
                            </div>
                            <div className="text-right pr-2">
                              <div className="text-base font-bold text-[#141413]">₹{plan.amount}</div>
                              <div className="text-[10px] font-mono text-[#6E6C65]">
                                ₹{(plan.amount / plan.credits).toFixed(2)}/cr
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-5 py-2.5 px-3 rounded-xl bg-[#F4F1E6] border border-[#141413]/20">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#141413]">
                        <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
                        256-BIT SSL
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#141413]">
                        <CreditCard className="w-3.5 h-3.5 text-[#FF6A1A]" />
                        UPI / CARDS / NETBANKING
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#141413]">
                        <Zap className="w-3.5 h-3.5 text-[#FF6A1A]" />
                        INSTANT CREDITS
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={handlePurchase}
                        disabled={!selectedPlan || loading}
                        className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Initializing Razorpay…
                          </>
                        ) : selectedPlan ? (
                          <>
                            <CreditCard className="w-4 h-4" /> Pay ₹{selectedPlan.amount} via Razorpay · Get{" "}
                            {selectedPlan.credits.toLocaleString()} Credits
                          </>
                        ) : (
                          <>Select a plan to continue</>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleInstantTestCheckout}
                        disabled={!selectedPlan || loading}
                        className="w-full py-2 text-[11px] font-mono uppercase tracking-wider text-[#4A4945] hover:text-[#141413] bg-[#F4F1E6] hover:bg-[#EDEFF2] border border-[#141413]/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6A1A]" />
                        Simulate Instant Sandbox Payment (Test Mode)
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: PROCESSING */}
                {step === "processing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#FF6A1A] border-2 border-[#141413] shadow-[4px_4px_0px_#141413] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#141413] animate-spin" />
                    </div>
                    <div className="text-center">
                      <h3
                        className="text-2xl font-normal text-[#141413] mb-1"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Connecting to Razorpay Gateway…
                      </h3>
                      <p className="text-xs font-mono text-[#6E6C65]">
                        Complete your payment in the secure Razorpay checkout window.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("select");
                        setLoading(false);
                      }}
                      className="mt-2 text-xs font-mono uppercase tracking-wider text-[#6E6C65] hover:text-[#141413] underline cursor-pointer"
                    >
                      Cancel &amp; Return to Plans
                    </button>
                  </motion.div>
                )}

                {/* STEP: SUCCESS */}
                {step === "success" && successData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-6 gap-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                      className="w-16 h-16 rounded-full bg-[#16A34A]/15 flex items-center justify-center border-2 border-[#16A34A]"
                    >
                      <CheckCircle className="w-9 h-9 text-[#16A34A]" />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <h3
                        className="text-3xl font-normal text-[#141413]"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Payment Verified!
                      </h3>
                      <p className="text-sm text-[#4A4945]">
                        <span className="text-[#16A34A] font-bold">
                          +{successData.creditsAdded.toLocaleString()} credits
                        </span>{" "}
                        have been credited to your Morphix 3D studio account.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4F1E6] border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413]">
                        <Zap className="w-4 h-4 text-[#FF6A1A]" />
                        <span className="text-xs font-mono font-bold text-[#141413]">
                          NEW BALANCE: {successData.newBalance.toLocaleString()} CREDITS
                          {successData.plan ? ` · ${successData.plan} PLAN` : ""}
                        </span>
                      </div>
                      {successData.orderId && (
                        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#6E6C65]">
                          <Receipt className="w-3.5 h-3.5" />
                          Order: {successData.orderId}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-primary w-full max-w-xs py-3 text-sm font-bold cursor-pointer"
                    >
                      Continue to Studio →
                    </button>
                  </motion.div>
                )}

                {/* STEP: ERROR */}
                {step === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 gap-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#DC2626]/15 flex items-center justify-center border-2 border-[#DC2626]">
                      <AlertCircle className="w-8 h-8 text-[#DC2626]" />
                    </div>
                    <div className="text-center">
                      <h3
                        className="text-2xl font-normal text-[#141413] mb-1"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Payment Incomplete
                      </h3>
                      <p className="text-xs font-mono text-[#4A4945] max-w-xs">{errorMsg}</p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setStep("select")}
                        className="btn-primary flex-1 py-2.5 text-sm cursor-pointer"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="btn-secondary flex-1 py-2.5 text-sm cursor-pointer"
                      >
                        Close
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

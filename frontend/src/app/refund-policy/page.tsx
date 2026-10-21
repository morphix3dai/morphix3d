import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Refund & Cancellation Policy | Morphix 3D",
  description: "Refund and Cancellation Policy for Morphix 3D (3dmorphix.com).",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#07070d] text-[#f1f5f9]">
      <header className="border-b border-[rgba(148,163,184,0.08)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <MorphixLogo size="sm" />
          </Link>
          <Link href="/" className="text-sm text-[#94a3b8] hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6 text-sm leading-relaxed text-[#cbd5e1]">
        <h1 className="text-3xl font-bold text-white">Refund &amp; Cancellation Policy</h1>
        <p className="text-xs text-[#64748b]">Last updated: October 21, 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Digital Delivery Policy</h2>
          <p>
            Morphix 3D (<a href="https://3dmorphix.com" className="text-[#818cf8] underline">https://3dmorphix.com</a>) provides instant digital credits
            and software-as-a-service (SaaS) subscriptions. Credits are credited immediately to your account upon successful payment verification via Razorpay.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. Eligibility for Refunds</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Unused Credit Packs:</strong> If you have purchased a credit pack or plan and have <strong>not used any credits</strong> from that purchase, you may request a full refund within <strong>7 days</strong> of the transaction date.</li>
            <li><strong>Duplicate or Failed Charges:</strong> If your bank account or UPI was debited more than once for the same order, or if credits were not added after payment deduction, a 100% refund (or instant credit restoration) will be issued.</li>
            <li><strong>Failed AI Generations:</strong> If an AI 3D generation job fails due to a server error, credits for that failed job are automatically refunded to your Morphix 3D credit balance.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Subscription Cancellation</h2>
          <p>
            You may cancel your Pro Monthly subscription at any time from your account settings or by emailing support. Cancellation stops future billing cycles,
            and you will retain access to your remaining credits until used.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Refund Processing Timeline</h2>
          <p>
            To request a refund, please email{" "}
            <a href="mailto:morphix3dai@gmail.com" className="text-[#818cf8] underline">morphix3dai@gmail.com</a> with your registered email address
            and Razorpay Payment/Order ID. Approved refunds are processed within <strong>5–7 business days</strong> back to your original payment method.
          </p>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Contact Us | Morphix 3D",
  description: "Contact support and billing team at Morphix 3D (3dmorphix.com).",
};

export default function ContactPage() {
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

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed text-[#cbd5e1]">
        <div>
          <h1 className="text-3xl font-bold text-white">Contact Us</h1>
          <p className="text-[#94a3b8] mt-2">
            Have questions about Morphix 3D, billing, credit packs, or enterprise API access? Reach out to us below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.1)] space-y-2">
            <h2 className="text-base font-semibold text-white">Customer &amp; Billing Support</h2>
            <p className="text-xs text-[#94a3b8]">For account help, Razorpay payment inquiries, or refund requests:</p>
            <p className="pt-2">
              <a href="mailto:morphix3dai@gmail.com" className="text-base font-medium text-[#818cf8] hover:underline">
                morphix3dai@gmail.com
              </a>
            </p>
            <p className="text-xs text-[#64748b]">Response time: Within 24 business hours (Mon–Sat, 10:00 AM – 7:00 PM IST)</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.1)] space-y-2">
            <h2 className="text-base font-semibold text-white">Platform &amp; Operations</h2>
            <p className="text-xs text-[#94a3b8]">Official Website &amp; Registered Operations:</p>
            <p className="pt-1 text-white font-medium">Morphix 3D (3dmorphix.com)</p>
            <p className="text-xs text-[#94a3b8]">Gujarat, India</p>
            <p className="text-xs text-[#64748b] pt-1">
              Website: <a href="https://3dmorphix.com" className="text-[#818cf8] underline">https://3dmorphix.com</a>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[rgba(148,163,184,0.1)] space-y-3">
          <h2 className="text-base font-semibold text-white">Legal &amp; Policy Links</h2>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/terms" className="text-[#818cf8] hover:underline">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="text-[#818cf8] hover:underline">Privacy Policy</Link>
            <Link href="/refund-policy" className="text-[#818cf8] hover:underline">Refund &amp; Cancellation Policy</Link>
            <Link href="/pricing" className="text-[#818cf8] hover:underline">Pricing Plans</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

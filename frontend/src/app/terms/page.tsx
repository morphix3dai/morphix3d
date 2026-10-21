import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Terms & Conditions | Morphix 3D",
  description: "Terms and Conditions for using Morphix 3D (3dmorphix.com) AI 3D generation services.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-white">Terms &amp; Conditions</h1>
        <p className="text-xs text-[#64748b]">Last updated: October 21, 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            Welcome to Morphix 3D (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{" "}
            <a href="https://3dmorphix.com" className="text-[#818cf8] underline">https://3dmorphix.com</a>. By registering an account,
            purchasing credits, or using our AI 3D generation, CAD, or architectural design tools, you agree to be bound by these Terms &amp; Conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
          <p>
            Morphix 3D provides cloud-based AI software for generating 3D models (Text-to-3D, Image-to-3D, AI Texturing, Smart Remeshing, Auto-Rigging),
            parametric Mechanical CAD components, and Architectural floor plans and 3D building concepts. All outputs are digital files delivered electronically
            through your user workspace.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. User Accounts &amp; Credits</h2>
          <p>
            New accounts receive complimentary starter credits. Additional generation credits or Pro subscriptions may be purchased in Indian Rupees (INR)
            via Razorpay. Credits are consumed when a generation task is initiated. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Intellectual Property &amp; Engineering Disclaimer</h2>
          <p>
            Subject to your compliance with these Terms, you may use 3D models, CAD files, and architectural layouts generated under your account for personal
            or commercial projects. Architectural floor plans, plumbing, and electrical layouts generated on Morphix 3D are preliminary conceptual designs and must
            be verified and stamped by a licensed local architect or structural engineer prior to physical construction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. Acceptable Use</h2>
          <p>
            You agree not to use the Platform to generate illegal, infringing, harmful, or prohibited content, or to attempt to reverse-engineer or overload our API infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">6. Governing Law &amp; Contact</h2>
          <p>
            These Terms are governed by the laws of India. For any questions regarding these Terms, please contact us at{" "}
            <a href="mailto:morphix3dai@gmail.com" className="text-[#818cf8] underline">morphix3dai@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}

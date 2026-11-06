import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for using Morphix 3D (3dmorphix.com) AI 3D generation services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F1E6] text-[#141413]">
      <header className="border-b-[1.5px] border-[#141413] bg-[#FAF8F2] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <MorphixLogo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-xs font-mono font-bold uppercase tracking-wider text-[#4A4945] hover:text-[#141413] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6 text-sm leading-relaxed text-[#4A4945]">
        <div>
          <span className="inline-block px-2.5 py-1 rounded bg-[#141413] text-[#FAF8F2] font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
            LEGAL SPECIFICATION
          </span>
          <h1
            className="text-4xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Terms &amp; Conditions
          </h1>
          <p className="text-xs font-mono text-[#6E6C65] mt-1">Last updated: October 21, 2026</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">1. Acceptance of Terms</h2>
            <p>
              Welcome to Morphix 3D (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{" "}
              <a href="https://3dmorphix.com" className="text-[#FF6A1A] font-semibold underline">
                https://3dmorphix.com
              </a>
              . By registering an account, purchasing credits, or using our AI 3D generation, CAD, or architectural design tools, you agree to be bound by these Terms &amp; Conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">2. Description of Service</h2>
            <p>
              Morphix 3D provides cloud-based AI software for generating 3D models (Text-to-3D, Image-to-3D, AI Texturing, Smart Remeshing, Auto-Rigging),
              parametric Mechanical CAD components, and Architectural floor plans and 3D building concepts. All outputs are digital files delivered electronically
              through your user workspace.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">3. User Accounts &amp; Credits</h2>
            <p>
              New accounts receive complimentary starter credits. Additional generation credits or Pro subscriptions may be purchased in Indian Rupees (INR)
              via Razorpay. Credits are consumed when a generation task is initiated. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">4. Intellectual Property &amp; Engineering Disclaimer</h2>
            <p>
              Subject to your compliance with these Terms, you may use 3D models, CAD files, and architectural layouts generated under your account for personal
              or commercial projects. Architectural floor plans, plumbing, and electrical layouts generated on Morphix 3D are preliminary conceptual designs and must
              be verified and stamped by a licensed local architect or structural engineer prior to physical construction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">5. Acceptable Use</h2>
            <p>
              You agree not to use the Platform to generate illegal, infringing, harmful, or prohibited content, or to attempt to reverse-engineer or overload our API infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">6. Governing Law &amp; Contact</h2>
            <p>
              These Terms are governed by the laws of India. For any questions regarding these Terms, please contact us at{" "}
              <a href="mailto:morphix3dai@gmail.com" className="text-[#FF6A1A] font-semibold underline">
                morphix3dai@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

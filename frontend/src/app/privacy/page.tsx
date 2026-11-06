import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Morphix 3D (3dmorphix.com).",
};

export default function PrivacyPage() {
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
            DATA PRIVACY
          </span>
          <h1
            className="text-4xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#6E6C65] mt-1">Last updated: October 21, 2026</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">1. Information We Collect</h2>
            <p>
              When you use Morphix 3D (
              <a href="https://3dmorphix.com" className="text-[#FF6A1A] font-semibold underline">
                https://3dmorphix.com
              </a>
              ), we collect:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong className="text-[#141413]">Account Information:</strong> Your name, email address, and encrypted password when you register.
              </li>
              <li>
                <strong className="text-[#141413]">Generation Data:</strong> Text prompts, uploaded reference images, and generated 3D assets saved to your workspace.
              </li>
              <li>
                <strong className="text-[#141413]">Payment Information:</strong> Payments are processed securely by Razorpay. We do not store your credit/debit card numbers or UPI PINs on our servers; we only store Razorpay order IDs and transaction status.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">2. How We Use Your Information</h2>
            <p>
              We use collected information solely to provide and improve our AI 3D generation services, manage your credit balance, send transactional account emails
              (such as password resets), and provide customer support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">3. Data Security &amp; Third-Party Processors</h2>
            <p>
              We use industry-standard encryption (HTTPS/TLS, hashed passwords, and JWT authentication) and trusted infrastructure providers (PostgreSQL,
              Vercel, Railway, and Razorpay) to protect your data. We never sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#141413]">4. Your Rights &amp; Account Deletion</h2>
            <p>
              You may view, update, or request deletion of your account and generated assets at any time by contacting us at{" "}
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

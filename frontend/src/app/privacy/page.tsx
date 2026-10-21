import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Privacy Policy | Morphix 3D",
  description: "Privacy Policy for Morphix 3D (3dmorphix.com).",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-[#64748b]">Last updated: October 21, 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
          <p>
            When you use Morphix 3D (<a href="https://3dmorphix.com" className="text-[#818cf8] underline">https://3dmorphix.com</a>), we collect:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Account Information:</strong> Your name, email address, and encrypted password when you register.</li>
            <li><strong>Generation Data:</strong> Text prompts, uploaded reference images, and generated 3D assets saved to your workspace.</li>
            <li><strong>Payment Information:</strong> Payments are processed securely by Razorpay. We do not store your credit/debit card numbers or UPI PINs on our servers; we only store Razorpay order IDs and transaction status.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
          <p>
            We use collected information solely to provide and improve our AI 3D generation services, manage your credit balance, send transactional account emails
            (such as password resets), and provide customer support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Data Security &amp; Third-Party Processors</h2>
          <p>
            We use industry-standard encryption (HTTPS/TLS, hashed passwords, and JWT authentication) and trusted infrastructure providers (Supabase PostgreSQL,
            Vercel, Railway, and Razorpay) to protect your data. We never sell your personal data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Your Rights &amp; Account Deletion</h2>
          <p>
            You may view, update, or request deletion of your account and generated assets at any time by contacting us at{" "}
            <a href="mailto:morphix3dai@gmail.com" className="text-[#818cf8] underline">morphix3dai@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}

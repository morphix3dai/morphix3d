import Link from "next/link";
import MorphixLogo from "@/components/MorphixLogo";

export const metadata = {
  title: "Contact & FAQ",
  description: "Contact support, billing, and frequently asked questions at Morphix 3D (3dmorphix.com).",
};

const faqs = [
  {
    q: "Do I need an account to try the 3D studios?",
    a: "No! You can immediately test Mechanical CAD, Architecture, Creative Text-to-3D, Image-to-3D, AI Texture, Smart Remesh, and Auto-Rigging with a complimentary 200-credit guest studio session.",
  },
  {
    q: "What file formats can I export from Morphix 3D?",
    a: "Mechanical CAD exports ISO 10303-21 .STEP, .STL, AutoCAD .DXF, and .GLB. Architecture Studio exports .DXF, 2D .SVG/.PDF blueprints, and 3D .GLB/.OBJ massing. Creative 3D exports .GLB and quad-dominant .OBJ meshes.",
  },
  {
    q: "How many credits does each generation use?",
    a: "Mechanical CAD uses 5 credits, Architecture Floor Plan & 3D Massing uses 8 credits, Text-to-3D and Image-to-3D use 10 credits, AI Texturing uses 5 credits, Smart Remesh uses 3 credits, and Auto-Rigging uses 8 credits.",
  },
  {
    q: "Can I use generated 3D models and CAD files commercially?",
    a: "Yes. All 3D models, parametric CAD solids, and architectural floor plans generated under your account are yours to use in commercial manufacturing, games, or client presentations.",
  },
];

export default function ContactPage() {
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

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-sm leading-relaxed text-[#4A4945]">
        <div>
          <span className="inline-block px-2.5 py-1 rounded bg-[#141413] text-[#FAF8F2] font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
            SUPPORT &amp; DOCUMENTATION
          </span>
          <h1
            className="text-4xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Contact Us &amp; FAQ
          </h1>
          <p className="text-[#4A4945] mt-2">
            Have questions about Morphix 3D, studio pipelines, credit packs, or enterprise API access? Reach out below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] space-y-2">
            <h2 className="text-base font-bold text-[#141413]">Customer &amp; Billing Support</h2>
            <p className="text-xs text-[#6E6C65]">For account help, billing inquiries, or enterprise partnerships:</p>
            <p className="pt-2">
              <a
                href="mailto:morphix3dai@gmail.com"
                className="text-base font-mono font-bold text-[#FF6A1A] hover:underline"
              >
                morphix3dai@gmail.com
              </a>
            </p>
            <p className="text-xs text-[#6E6C65]">
              Response time: Within 24 business hours (Mon–Sat, 10:00 AM – 7:00 PM IST)
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] space-y-2">
            <h2 className="text-base font-bold text-[#141413]">Platform &amp; Operations</h2>
            <p className="text-xs text-[#6E6C65]">Official Website &amp; Registered Operations:</p>
            <p className="pt-1 text-[#141413] font-bold">Morphix 3D (3dmorphix.com)</p>
            <p className="text-xs text-[#6E6C65]">Gujarat, India</p>
            <p className="text-xs text-[#6E6C65] pt-1">
              Website:{" "}
              <a href="https://3dmorphix.com" className="text-[#FF6A1A] font-mono font-bold underline">
                https://3dmorphix.com
              </a>
            </p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <section id="faq" className="space-y-4">
          <h2
            className="text-2xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="p-5 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413] space-y-1.5"
              >
                <h3 className="font-bold text-[#141413] text-sm">{item.q}</h3>
                <p className="text-xs text-[#4A4945] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] space-y-3">
          <h2 className="text-base font-bold text-[#141413]">Legal &amp; Policy Links</h2>
          <div className="flex flex-wrap gap-5 text-xs font-mono font-bold">
            <Link href="/terms" className="text-[#141413] hover:text-[#FF6A1A] underline">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="text-[#141413] hover:text-[#FF6A1A] underline">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="text-[#141413] hover:text-[#FF6A1A] underline">
              Refund &amp; Cancellation Policy
            </Link>
            <Link href="/pricing" className="text-[#141413] hover:text-[#FF6A1A] underline">
              Pricing Plans
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Gift, Loader2 } from "lucide-react";
import MorphixLogo from "@/components/MorphixLogo";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import { auth, setAccessToken, setRefreshToken } from "@/lib/api";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await auth.register({ email, password, name });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      toast.success(`Welcome to Morphix! You have ${data.user.credits} free credits!`);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setGoogleModalOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1E6] text-[#141413] px-4 pt-20 pb-10 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(20,20,19,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,20,19,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Top Header with Direct Home Logo */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F4F1E6]/95 backdrop-blur-md border-b-[1.5px] border-[#141413]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" title="Go to Morphix 3D Home Page" className="flex items-center">
            <MorphixLogo size="sm" showTagline />
          </Link>
          <Link
            href="/"
            className="text-xs font-mono font-bold uppercase tracking-wider text-[#575652] hover:text-[#141413] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center mb-4">
            <MorphixLogo size="md" showTagline />
          </Link>
          <h1
            className="text-3xl font-normal tracking-tight text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Create your account
          </h1>
          <p className="text-sm text-[#4A4945] mt-1">Start generating Mechanical CAD and Architecture 3D with AI</p>
        </div>

        {/* Free Credits Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-5 p-3.5 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#FF6A1A]/15 border border-[#FF6A1A]/40 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-[#FF6A1A]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#141413]">200 Free Studio Credits</div>
            <div className="text-xs text-[#6E6C65]">Create up to 40 CAD parts or 25 architectural floor plans on signup</div>
          </div>
        </motion.div>

        <div className="p-6 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[8px_8px_0px_#141413]">
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-[1.5px] border-[#141413] text-sm font-semibold text-[#141413] hover:bg-[#EDEFF2] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#141413]/15" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#6E6C65]">or</span>
            <div className="flex-1 h-px bg-[#141413]/15" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="section-label block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="section-label block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="input-field pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6C65] hover:text-[#141413]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-[#4A4945] cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 accent-[#FF6A1A] rounded mt-0.5" required />
              I agree to the Terms of Service and Privacy Policy
            </label>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4A4945] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#FF6A1A] hover:underline font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
      {/* GOOGLE ACCOUNT & PROFILE MODAL */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        mode="register"
      />
    </div>
  );
}

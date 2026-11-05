"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, X, CheckCircle2 } from "lucide-react";
import MorphixLogo from "@/components/MorphixLogo";
import { auth, setAccessToken, setRefreshToken } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const data = await auth.google({});
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      toast.success(`Signed in with Google as ${data.user.name || data.user.email}!`);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google login failed";
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await auth.login({ email, password });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await auth.forgotPassword({ email: forgotEmail });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1E6] text-[#141413] px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <MorphixLogo size="md" showTagline />
          </Link>
          <h1
            className="text-4xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Welcome back
          </h1>
          <p className="text-sm text-[#575652] mt-1 font-mono">Sign in to your Morphix 3D Studio account</p>
        </div>

        {/* Form Card */}
        <div className="p-7 bg-[#FAF8F2] border-2 border-[#141413] shadow-[8px_8px_0px_#141413]">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#FFFDF7] border-[1.5px] border-[#141413] text-sm font-mono font-bold text-[#141413] hover:bg-[#EFECE0] transition-all disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6A1A]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#141413]/20" />
            <span className="text-xs font-mono uppercase text-[#575652]">or</span>
            <div className="flex-1 h-px bg-[#141413]/20" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5 font-mono">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575652]" />
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
              <label className="section-label block mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575652]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575652] hover:text-[#141413]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="flex items-center gap-2 text-[#575652] cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 accent-[#FF6A1A]" /> Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotSent(false);
                  setForgotEmail("");
                }}
                className="text-[#FF6A1A] hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#575652] mt-5 font-mono">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#FF6A1A] hover:underline font-bold">
            Sign up free
          </Link>
        </p>
      </motion.div>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showForgot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgot(false)}
              className="fixed inset-0 bg-[#141413]/50 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-sm bg-[#FAF8F2] border-2 border-[#141413] p-6 shadow-[8px_8px_0px_#141413]">
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-2xl font-normal text-[#141413]"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    Reset Password
                  </h2>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-8 h-8 bg-[#EFECE0] border border-[#141413] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#F4F1E6] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!forgotSent ? (
                  <>
                    <p className="text-sm text-[#575652] mb-5">
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="section-label block mb-1.5 font-mono">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575652]" />
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="input-field pl-10"
                            required
                            autoFocus
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn-primary w-full py-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            Send Reset Link <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-[#EFECE0] border border-[#141413] flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-[#15803D]" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#141413]">Check your inbox!</h3>
                    <p className="text-sm text-[#575652] mb-5">
                      If <span className="text-[#141413] font-semibold">{forgotEmail}</span> is registered, you&apos;ll
                      receive a password reset link shortly.
                    </p>
                    <button
                      onClick={() => setShowForgot(false)}
                      className="btn-secondary w-full py-2.5 font-mono text-xs uppercase"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

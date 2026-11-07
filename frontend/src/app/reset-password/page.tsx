"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import MorphixLogo from "@/components/MorphixLogo";
import { auth } from "@/lib/api";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isValidLink = Boolean(token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await auth.resetPassword({ token, email, newPassword: password, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0
      ? 0
      : password.length < 8
      ? 1
      : password.match(/[A-Z]/) && password.match(/[0-9]/)
      ? 3
      : 2;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-[#DC2626]", "bg-[#FF6A1A]", "bg-[#16A34A]"];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F4F1E6] text-[#141413] px-4 pt-20 pb-10 relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(20, 20, 19, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 20, 19, 0.04) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
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
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center mb-4">
            <MorphixLogo size="md" />
          </Link>
          <h1
            className="text-3xl font-normal text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Set New Password
          </h1>
          <p className="text-sm text-[#4A4945] mt-1">Enter a strong new password for your Morphix 3D account</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FAF8F2] border-2 border-[#141413] shadow-[6px_6px_0px_#141413]">
          {!isValidLink ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-[#DC2626]" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#DC2626]">Invalid Reset Link</h3>
              <p className="text-sm text-[#4A4945] mb-5">
                This reset link is invalid or missing a security token. Please request a new password reset link from the login page.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141413] text-[#FAF8F2] hover:bg-[#FF6A1A] hover:text-[#141413] font-bold text-sm transition-colors"
              >
                Back to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#16A34A]/15 border border-[#16A34A]/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#141413]">Password Updated!</h3>
              <p className="text-sm text-[#4A4945] mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="btn-primary w-full py-3 rounded-xl text-sm"
              >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {email && (
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#EDEFF2] border border-[#141413]/20">
                  <span className="text-xs text-[#6E6C65]">Resetting password for</span>
                  <span className="text-xs font-mono font-bold text-[#141413]">{email}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#4A4945] block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input-field pl-10 pr-10"
                    required
                    autoFocus
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
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength ? strengthColor[strength] : "bg-[#141413]/15"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-mono font-bold ${
                        strength === 1 ? "text-[#DC2626]" : strength === 2 ? "text-[#FF6A1A]" : "text-[#16A34A]"
                      }`}
                    >
                      {strengthLabel[strength]} password
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#4A4945] block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6C65]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="input-field pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6C65] hover:text-[#141413]"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <p className="text-xs font-bold text-[#DC2626]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#4A4945] mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-[#FF6A1A] hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F1E6]">
          <Loader2 className="w-6 h-6 text-[#FF6A1A] animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

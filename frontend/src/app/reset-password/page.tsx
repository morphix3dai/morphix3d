"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import MorphixLogo from "@/components/MorphixLogo";
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

  // Invalid link check
  const isValidLink = token && email;

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email, newPassword: password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 3
    : 2;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(99,102,241,0.08),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <MorphixLogo size="md" />
          </Link>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-sm text-[#64748b] mt-1">Enter a strong new password below</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] shadow-xl">

          {!isValidLink ? (
            /* Invalid / missing token */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-red-400">Invalid Reset Link</h3>
              <p className="text-sm text-[#94a3b8] mb-5">
                This reset link is invalid or missing. Please request a new one from the login page.
              </p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
                Back to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : success ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Password Updated!</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                  bg-gradient-to-r from-[#7B2FFF] to-[#6366f1] text-white hover:opacity-90 transition-opacity"
              >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {email && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)]">
                  <span className="text-xs text-[#94a3b8]">Resetting password for</span>
                  <span className="text-xs font-medium text-[#818cf8]">{email}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="section-label block mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input-field pl-10 pr-10"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-[rgba(148,163,184,0.1)]"}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-400" : "text-green-400"}`}>
                      {strengthLabel[strength]} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="section-label block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`input-field pl-10 pr-10 ${confirmPassword && confirmPassword !== password ? "border-red-500/50" : ""}`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
                  bg-gradient-to-r from-[#7B2FFF] to-[#6366f1] text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                  : <>Reset Password <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              <p className="text-center text-sm text-[#64748b]">
                Remember your password?{" "}
                <Link href="/login" className="text-[#818cf8] hover:text-white transition-colors">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, ArrowRight, Loader2, Check, PlusCircle } from "lucide-react";
import { auth, setAccessToken, setRefreshToken } from "@/lib/api";
import toast from "react-hot-toast";

interface SavedGoogleProfile {
  email: string;
  name: string;
  colorIdx: number;
}

const BADGE_COLORS = ["#FF6A1A", "#2F5BFF", "#141413", "#16A34A", "#0D9488", "#9333EA"];

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "login" | "register";
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  mode = "login",
}: GoogleAuthModalProps) {
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleProfile[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem("morphix_google_accounts");
      if (raw) {
        const parsed = JSON.parse(raw) as SavedGoogleProfile[];
        const valid = parsed.filter(
          (acc) =>
            acc.email &&
            !acc.email.startsWith("google_user_") &&
            !acc.email.startsWith("studio_")
        );
        setSavedAccounts(valid);
        setShowNewForm(valid.length === 0);
      } else {
        setShowNewForm(true);
      }
    } catch {
      setShowNewForm(true);
    }
  }, [isOpen]);

  const completeGoogleSignIn = async (profileEmail: string, profileName: string, chosenColor: number) => {
    setLoading(true);
    try {
      const cleanEmail = profileEmail.trim().toLowerCase();
      const cleanName = profileName.trim() || cleanEmail.split("@")[0];

      const data = await auth.google({
        email: cleanEmail,
        name: cleanName,
      });

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      try {
        localStorage.setItem("morphix_avatar_color", String(chosenColor));
        const updated = [
          { email: cleanEmail, name: cleanName, colorIdx: chosenColor },
          ...savedAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
        ].slice(0, 4);
        localStorage.setItem("morphix_google_accounts", JSON.stringify(updated));
      } catch {}

      toast.success(
        mode === "register"
          ? `Welcome to Morphix, ${data.user.name || cleanName}! Your profile is ready with ${data.user.credits} credits.`
          : `Signed in as ${data.user.name || cleanName} (${data.user.email})`
      );
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid Google email address");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your profile name");
      return;
    }
    await completeGoogleSignIn(email, name, colorIdx);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-[#FAF8F2] border-2 border-[#141413] shadow-[10px_10px_0px_#141413] p-6 pointer-events-auto text-[#141413]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#141413]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white border-[1.5px] border-[#141413] flex items-center justify-center">
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
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6A1A]">
                      GOOGLE ACCOUNT PROFILE
                    </div>
                    <h2
                      className="text-2xl font-normal leading-tight"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      {showNewForm ? "Connect your Google Profile" : "Choose an account"}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 bg-[#EFECE0] border border-[#141413] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Saved Google Accounts List */}
              {!showNewForm && savedAccounts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-[#575652]">
                    Select your Google account to continue to <strong>Morphix 3D Studio</strong>:
                  </p>
                  <div className="space-y-2">
                    {savedAccounts.map((acc) => {
                      const bg = BADGE_COLORS[acc.colorIdx % BADGE_COLORS.length];
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={loading}
                          onClick={() => completeGoogleSignIn(acc.email, acc.name, acc.colorIdx || 0)}
                          className="w-full p-3 bg-[#F4F1E6] border-[1.5px] border-[#141413] hover:bg-[#141413] hover:text-[#FAF8F2] transition-colors flex items-center justify-between group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 border border-[#141413] flex items-center justify-center text-white font-mono text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: bg }}
                            >
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate">{acc.name}</div>
                              <div className="text-xs font-mono opacity-75 truncate">{acc.email}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 flex-shrink-0 text-[#FF6A1A]" />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewForm(true)}
                    className="w-full py-2.5 px-3 bg-[#FAF8F2] border border-[#141413]/40 hover:border-[#141413] text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#FF6A1A]" /> Use another Google account
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <p className="text-xs text-[#575652] leading-relaxed">
                    Enter your Google email and full name to create or sign in to your personal Morphix 3D Studio profile.
                  </p>

                  <div>
                    <label className="section-label block mb-1.5 font-mono">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575652]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="input-field pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="section-label block mb-1.5 font-mono">Google Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575652]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Profile Badge Color Picker */}
                  <div>
                    <label className="section-label block mb-1.5 font-mono">Studio Profile Badge</label>
                    <div className="flex items-center justify-between p-2.5 bg-[#F4F1E6] border border-[#141413]">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 border border-[#141413] flex items-center justify-center text-white font-mono text-xs font-bold"
                          style={{ backgroundColor: BADGE_COLORS[colorIdx] }}
                        >
                          {(name.trim() || email.trim() || "M").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs font-mono">
                          <div className="font-bold text-[#141413]">{name.trim() || "Your Studio Name"}</div>
                          <div className="text-[10px] text-[#575652]">{email.trim() || "yourname@gmail.com"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {BADGE_COLORS.map((c, idx) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColorIdx(idx)}
                            className="w-5 h-5 border border-[#141413] flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: c }}
                            title="Choose badge color"
                          >
                            {colorIdx === idx && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {savedAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewForm(false)}
                        className="btn-secondary py-3 px-4 font-mono text-xs uppercase cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 py-3 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Setting up Profile...
                        </>
                      ) : (
                        <>
                          Continue as {name.trim().split(" ")[0] || "Creator"} <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

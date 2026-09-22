"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import MorphixLogo from "@/components/MorphixLogo";
import {
  Sparkles,
  Menu,
  X,
  Coins,
  User,
  LogOut,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth as authApi, credits as creditsApi, getAccessToken } from "@/lib/api";
import type { User as UserType } from "@/lib/api";
import RazorpayCheckout from "@/components/RazorpayCheckout";

const navLinks = [
  { href: "/workspace/text-to-3d", label: "Text to 3D" },
  { href: "/workspace/image-to-3d", label: "Image to 3D" },
  { href: "/workspace/texture", label: "AI Texture" },
  { href: "/community", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authApi.me().then((data) => {
        setUser(data.user);
        setCreditBalance(data.user.credits);
      }).catch(() => {
        setUser(null);
      });
    }
  }, []);

  const isLoggedIn = !!user;
  const displayName = user?.name || user?.email?.split("@")[0] || "U";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authApi.logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <MorphixLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === link.href
                    ? "text-white"
                    : "text-[#94a3b8] hover:text-white"
                  }`}
              >
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-[#1e1e38] rounded-lg border border-[rgba(99,102,241,0.3)]"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Credits */}
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[rgba(148,163,184,0.1)] hover:border-[rgba(99,102,241,0.3)] transition-colors">
                  <Coins className="w-4 h-4 text-[#f59e0b]" />
                  <span className="text-sm font-semibold text-[#f1f5f9]">{creditBalance ?? "..."}</span>
                  <span className="text-xs text-[#64748b]">credits</span>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="ml-1 w-5 h-5 rounded-md bg-[rgba(99,102,241,0.15)] hover:bg-[rgba(99,102,241,0.3)] flex items-center justify-center transition-colors"
                    title="Buy credits"
                  >
                    <Plus className="w-3 h-3 text-[#818cf8]" />
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-sm font-bold text-white">
                      {initial}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                  </button>

                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1e1e38] border border-[rgba(148,163,184,0.1)] shadow-xl py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[rgba(148,163,184,0.1)]">
                        <div className="text-sm font-medium truncate">{displayName}</div>
                        <div className="text-xs text-[#64748b] truncate">{user?.email}</div>
                      </div>
                      <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1a1a2e] transition-colors">
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/assets" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1a1a2e] transition-colors">
                        <Sparkles className="w-4 h-4" /> My Assets
                      </Link>
                      <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1a1a2e] transition-colors">
                        <User className="w-4 h-4" /> Settings
                      </Link>
                      <hr className="border-[rgba(148,163,184,0.1)] my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#1a1a2e] w-full transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#94a3b8] hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-[rgba(148,163,184,0.1)] bg-[#12121a]"
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${pathname === link.href
                    ? "text-white bg-[#1e1e38]"
                    : "text-[#94a3b8] hover:text-white hover:bg-[#1a1a2e]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[rgba(148,163,184,0.1)] my-2" />
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => { setMobileOpen(false); setCheckoutOpen(true); }}
                  className="block w-full px-4 py-3 rounded-lg text-sm text-[#818cf8] hover:bg-[#1a1a2e] text-left"
                >
                  + Buy Credits
                </button>
                <button onClick={handleLogout} className="block px-4 py-3 rounded-lg text-sm text-[#ef4444] hover:bg-[#1a1a2e] w-full text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:text-white">Sign In</Link>
                <Link href="/register" className="block btn-primary text-sm text-center mt-2">Get Started Free</Link>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(creditsAdded, newBalance) => {
          setCreditBalance(newBalance);
        }}
        userEmail={user?.email}
        userName={user?.name || undefined}
      />
    </nav>
  );
}

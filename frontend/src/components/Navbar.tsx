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
import { useState } from "react";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/mechanical_cad_section.html", label: "Mechanical CAD" },
  { href: "/architecture_studio_section.html", label: "Architecture" },
  { href: "/creative_3d_darkroom.html", label: "Creative 3D" },
  { href: "/community", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { user, credits: creditBalance, isLoggedIn, updateCredits, logout: handleLogout } = useAuth();

  const displayName = user?.name || user?.email?.split("@")[0] || "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F4F1E6]/95 backdrop-blur-md border-b-[1.5px] border-[#141413]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <MorphixLogo size="sm" showTagline />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-[#141413] font-semibold"
                    : "text-[#575652] hover:text-[#141413]"
                }`}
              >
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-[#EFECE0] border border-[#141413]"
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
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] transition-colors">
                  <Coins className="w-4 h-4 text-[#FF6A1A]" />
                  <span className="text-sm font-mono font-bold text-[#141413]">{creditBalance ?? "..."}</span>
                  <span className="text-xs font-mono text-[#575652]">credits</span>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="ml-1 w-5 h-5 bg-[#FF6A1A] text-white hover:bg-[#141413] flex items-center justify-center transition-colors"
                    title="Buy credits"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F2] border-[1.5px] border-[#141413] hover:bg-[#EFECE0] transition-colors"
                  >
                    <div className="w-7 h-7 bg-[#141413] text-[#F4F1E6] flex items-center justify-center text-xs font-mono font-bold">
                      {initial}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#141413]" />
                  </button>

                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] py-1 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-[#141413]/20 bg-[#EFECE0]">
                        <div className="text-sm font-semibold text-[#141413] truncate">{displayName}</div>
                        <div className="text-xs font-mono text-[#575652] truncate">{user?.email}</div>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#141413] hover:bg-[#EFECE0] transition-colors"
                      >
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        href="/assets"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#141413] hover:bg-[#EFECE0] transition-colors"
                      >
                        <Sparkles className="w-4 h-4" /> My Assets
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#141413] hover:bg-[#EFECE0] transition-colors"
                      >
                        <User className="w-4 h-4" /> Settings
                      </Link>
                      <hr className="border-[#141413]/20 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF6A1A] font-semibold hover:bg-[#EFECE0] w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 border-[1.5px] border-[#141413] bg-[#FAF8F2] text-[#141413] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#141413] hover:text-[#F4F1E6] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 border-[1.5px] border-[#141413] bg-[#141413] text-[#F4F1E6] font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#FF6A1A] hover:bg-[#FF6A1A] hover:text-white hover:shadow-[3px_3px_0px_#141413] transition-all"
                >
                  Start Creating Free →
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#141413] hover:bg-[#EFECE0]"
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
          className="md:hidden border-t-[1.5px] border-[#141413] bg-[#FAF8F2]"
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-[#141413] bg-[#EFECE0] font-semibold border border-[#141413]"
                    : "text-[#575652] hover:text-[#141413] hover:bg-[#EFECE0]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[#141413]/20 my-2" />
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="block w-full px-4 py-3 text-sm font-mono font-bold text-[#FF6A1A] hover:bg-[#EFECE0] text-left"
                >
                  + Buy Credits
                </button>
                <button
                  onClick={handleLogout}
                  className="block px-4 py-3 text-sm font-mono font-bold text-[#141413] hover:bg-[#EFECE0] w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid gap-2 pt-2">
                <Link
                  href="/login"
                  className="block px-4 py-2.5 border-[1.5px] border-[#141413] bg-[#FAF8F2] text-center font-mono text-xs font-bold uppercase text-[#141413]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2.5 border-[1.5px] border-[#141413] bg-[#141413] text-[#F4F1E6] font-mono text-xs font-bold uppercase text-center shadow-[3px_3px_0px_#FF6A1A]"
                >
                  Start Creating Free →
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(_creditsAdded, newBalance) => {
          updateCredits(newBalance);
        }}
        userEmail={user?.email}
        userName={user?.name || undefined}
      />
    </nav>
  );
}

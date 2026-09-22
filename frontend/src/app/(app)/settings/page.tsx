"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, CreditCard, Key, Bell, Shield, Save, Loader2, Plus, TrendingUp, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import { auth, credits, getAccessToken, type User as UserType, type CreditTransaction } from "@/lib/api";
import RazorpayCheckout from "@/components/RazorpayCheckout";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserType | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();
      if (!token) { setIsLoading(false); return; }
      try {
        const [userData, creditData, txData] = await Promise.all([
          auth.me(),
          credits.balance(),
          credits.history(1, 10),
        ]);
        setName(userData.user.name || "");
        setEmail(userData.user.email);
        setPlan(creditData.plan);
        setCreditBalance(creditData.credits);
        setTransactions(txData.transactions);
        setUserInfo(userData.user);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ name }),
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Fill in all password fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Password changed!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  const planLabel = plan === "ENTERPRISE" ? "Enterprise" : plan === "PRO" ? "Pro Plan" : "Free Plan";
  const planCredits = plan === "ENTERPRISE" ? "10,000" : plan === "PRO" ? "2,000" : "200";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-[#818cf8]" /> Settings
      </h1>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${activeTab === tab.id ? "bg-[rgba(99,102,241,0.1)] text-white border-l-2 border-[#6366f1]" : "text-[#64748b] hover:text-[#94a3b8]"}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-4">
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-2xl font-bold text-white">
                    {(name || "U").charAt(0).toUpperCase()}
                  </div>
                  <button className="btn-secondary text-sm">Change Avatar</button>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Email</label>
                  <input value={email} disabled className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <button onClick={handleSaveProfile} className="btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Current Plan */}
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-4">
                <h2 className="text-lg font-semibold">Current Plan</h2>
                <div className="p-4 rounded-lg bg-gradient-to-r from-[rgba(99,102,241,0.08)] to-[rgba(139,92,246,0.08)] border border-[rgba(99,102,241,0.15)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">{planLabel}</div>
                      <div className="text-sm text-[#94a3b8]">{creditBalance.toLocaleString()} credits remaining • {planCredits} total</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCheckoutOpen(true)}
                        className="btn-secondary text-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Buy Credits
                      </button>
                      {plan === "FREE" && (
                        <button
                          onClick={() => setCheckoutOpen(true)}
                          className="btn-primary text-sm"
                        >
                          Upgrade to Pro
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-3">
                <h2 className="text-lg font-semibold">Transaction History</h2>
                {transactions.length === 0 ? (
                  <div className="text-sm text-[#64748b]">No transactions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-[rgba(148,163,184,0.05)] last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            tx.amount > 0 ? "bg-[rgba(16,185,129,0.1)]" : "bg-[rgba(239,68,68,0.1)]"
                          }`}>
                            {tx.amount > 0
                              ? <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />
                              : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                          <div>
                            <div className="text-sm text-white">{tx.description || tx.type}</div>
                            <div className="text-xs text-[#64748b]">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold font-mono ${
                          tx.amount > 0 ? "text-[#10b981]" : "text-red-400"
                        }`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-4">
                <h2 className="text-lg font-semibold">Change Password</h2>
                <div><label className="section-label block mb-1.5">Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" /></div>
                <div><label className="section-label block mb-1.5">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" /></div>
                <div><label className="section-label block mb-1.5">Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" /></div>
                <button onClick={handleChangePassword} className="btn-primary text-sm">Update Password</button>
              </div>
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-3">
                <h2 className="text-lg font-semibold">API Keys</h2>
                <p className="text-sm text-[#64748b]">Available on Pro and Enterprise plans.</p>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-5 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] space-y-4">
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                {["Generation complete", "Credit low warning", "New features & updates", "Community likes"].map((pref) => (
                  <label key={pref} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{pref}</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#6366f1] rounded" />
                  </label>
                ))}
                <button onClick={() => toast.success("Preferences saved!")} className="btn-primary text-sm mt-2">Save Preferences</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Razorpay Checkout */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(creditsAdded, newBalance) => {
          setCreditBalance(newBalance);
          toast.success(`+${creditsAdded} credits added to your account!`);
          // Refresh transactions
          credits.history(1, 10).then((d) => setTransactions(d.transactions)).catch(() => {});
        }}
        userEmail={email}
        userName={name}
      />
    </div>
  );
}

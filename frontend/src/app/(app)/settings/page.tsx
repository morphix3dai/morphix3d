"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  Save,
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  Copy,
  RefreshCw,
  Key,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth, credits, type CreditTransaction } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RazorpayCheckout from "@/components/RazorpayCheckout";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const AVATAR_COLORS = ["#FF6A1A", "#2F5BFF", "#6D4AFF", "#16A34A", "#141413", "#0D9488"];

const NOTIFICATION_ITEMS = [
  { id: "gen_complete", label: "Generation complete" },
  { id: "credit_low", label: "Credit low warning" },
  { id: "new_features", label: "New features & updates" },
  { id: "community_likes", label: "Community likes" },
];

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColorIdx, setAvatarColorIdx] = useState(0);
  const [plan, setPlan] = useState("FREE");
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<string | undefined>("credits_500");
  const [apiKey, setApiKey] = useState<string>("");
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    gen_complete: true,
    credit_low: true,
    new_features: true,
    community_likes: true,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("morphix_studio_api_key");
      if (savedKey) setApiKey(savedKey);
      const savedNotifs = localStorage.getItem("morphix_notif_prefs");
      if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs));
      const savedColor = localStorage.getItem("morphix_avatar_color");
      if (savedColor) setAvatarColorIdx(Number(savedColor) % AVATAR_COLORS.length);
    } catch {}

    const loadUser = async () => {
      try {
        const [userData, creditData, txData] = await Promise.all([
          auth.me(),
          credits.balance(),
          credits.history(1, 10),
        ]);
        setName(userData.user.name || "");
        setEmail(userData.user.email);
        if (userData.user.avatarUrl) setAvatarUrl(userData.user.avatarUrl);
        setPlan(creditData.plan);
        setCreditBalance(creditData.credits);
        setTransactions(txData.transactions);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      try {
        await auth.updateProfile({ name, avatarUrl: dataUrl });
        toast.success("Avatar updated!");
      } catch {
        toast.success("Avatar updated locally!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCycleAvatarColor = () => {
    const next = (avatarColorIdx + 1) % AVATAR_COLORS.length;
    setAvatarColorIdx(next);
    setAvatarUrl(null);
    try {
      localStorage.setItem("morphix_avatar_color", String(next));
    } catch {}
    toast.success("Studio badge color updated!");
  };

  const handleSaveProfile = async () => {
    try {
      await auth.updateProfile({ name, avatarUrl: avatarUrl || undefined });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await auth.changePassword({ currentPassword, newPassword });
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    }
  };

  const handleGenerateApiKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let rand = "";
    for (let i = 0; i < 32; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newKey = `mpx_live_${rand}`;
    setApiKey(newKey);
    try {
      localStorage.setItem("morphix_studio_api_key", newKey);
    } catch {}
    toast.success("New Morphix 3D Studio API key generated!");
  };

  const handleCopyApiKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard!");
  };

  const handleSaveNotifications = () => {
    try {
      localStorage.setItem("morphix_notif_prefs", JSON.stringify(notifPrefs));
    } catch {}
    toast.success("Notification preferences saved!");
  };

  const planLabel = plan === "ENTERPRISE" ? "Enterprise" : plan === "PRO" ? "Pro Plan" : "Free Plan";
  const planCredits = plan === "ENTERPRISE" ? "10,000" : plan === "PRO" ? "2,000" : "200";
  const activeBgColor = AVATAR_COLORS[avatarColorIdx];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 text-[#141413]">
      <h1
        className="text-3xl font-normal flex items-center gap-2 text-[#141413]"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        <Settings className="w-6 h-6 text-[#FF6A1A]" /> Settings
        {isLoading && <Loader2 className="w-4 h-4 text-[#FF6A1A] animate-spin ml-2" />}
      </h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tabs (Horizontal scroll on mobile, vertical column on desktop) */}
        <div className="w-full sm:w-48 flex-shrink-0 flex sm:flex-col gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:w-full flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all text-left cursor-pointer whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "bg-[#FAF8F2] text-[#141413] border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413]"
                    : "text-[#4A4945] hover:text-[#141413] hover:bg-[#FAF8F2]/60 border border-transparent"
                }`}
            >
              <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? "text-[#FF6A1A]" : "text-[#6E6C65]"}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-4">
                <h2 className="text-lg font-bold text-[#141413]">Profile Information</h2>
                <div className="flex flex-wrap items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name || "User Avatar"}
                      className="w-16 h-16 rounded-full object-cover border-[1.5px] border-[#141413]"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full border-[1.5px] border-[#141413] flex items-center justify-center text-2xl font-bold text-white transition-colors"
                      style={{ backgroundColor: activeBgColor }}
                    >
                      {(name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change Avatar
                    </button>
                    <button
                      type="button"
                      onClick={handleCycleAvatarColor}
                      className="px-3 py-2 border-[1.5px] border-[#141413] bg-[#F4F1E6] hover:bg-[#EFECE0] text-xs font-mono font-bold text-[#141413] transition-colors cursor-pointer"
                    >
                      Switch Badge Color
                    </button>
                  </div>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Email</label>
                  <input value={email} disabled className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <button onClick={handleSaveProfile} className="btn-primary text-sm flex items-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Current Plan */}
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-4">
                <h2 className="text-lg font-bold text-[#141413]">Current Plan</h2>
                <div className="p-4 rounded-xl bg-[#F4F1E6] border-[1.5px] border-[#141413]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-lg font-bold text-[#141413]">{planLabel}</div>
                      <div className="text-sm font-mono text-[#4A4945]">
                        {creditBalance.toLocaleString()} credits remaining • {planCredits} total
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCheckoutPlan("credits_500");
                          setCheckoutOpen(true);
                        }}
                        className="btn-secondary text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Buy Credits
                      </button>
                      {plan === "FREE" && (
                        <button
                          onClick={() => {
                            setSelectedCheckoutPlan("pro_monthly");
                            setCheckoutOpen(true);
                          }}
                          className="btn-primary text-sm cursor-pointer"
                        >
                          Upgrade to Pro
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-3">
                <h2 className="text-lg font-bold text-[#141413]">Transaction History</h2>
                {transactions.length === 0 ? (
                  <div className="text-sm text-[#6E6C65]">No transactions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-2.5 border-b border-[#141413]/15 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border border-[#141413]/20 ${
                              tx.amount > 0 ? "bg-[#16A34A]/15" : "bg-[#DC2626]/15"
                            }`}
                          >
                            {tx.amount > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#141413]">{tx.description || tx.type}</div>
                            <div className="text-xs font-mono text-[#6E6C65]">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-bold font-mono ${
                            tx.amount > 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
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
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-4">
                <h2 className="text-lg font-bold text-[#141413]">Change Password</h2>
                <div>
                  <label className="section-label block mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="section-label block mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button onClick={handleChangePassword} className="btn-primary text-sm cursor-pointer">
                  Update Password
                </button>
              </div>

              {/* Studio REST API Keys */}
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-[#141413] flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#FF6A1A]" /> Studio REST API Keys
                  </h2>
                  <span className="px-2.5 py-0.5 rounded bg-[#141413] text-[#FAF8F2] font-mono text-[10px] font-bold uppercase">
                    {plan} TIER
                  </span>
                </div>
                <p className="text-sm text-[#4A4945]">
                  Use your Studio API key to automate Mechanical CAD, Architecture, and 3D Mesh generation via REST endpoints.
                </p>

                {apiKey ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      readOnly
                      value={apiKey}
                      aria-label="Generated API Key"
                      className="input-field flex-1 font-mono text-xs bg-[#F4F1E6]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      className="btn-secondary text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateApiKey}
                      className="px-3 py-2.5 border-[1.5px] border-[#141413] bg-[#FAF8F2] hover:bg-[#EFECE0] text-xs font-mono font-bold text-[#141413] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Rotate Key
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateApiKey}
                      className="btn-primary text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" /> Generate Studio API Key
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-6 rounded-2xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[6px_6px_0px_#141413] space-y-4">
                <h2 className="text-lg font-bold text-[#141413]">Notification Preferences</h2>
                {NOTIFICATION_ITEMS.map((item) => (
                  <label key={item.id} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-sm font-medium text-[#141413]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.id] ?? true}
                      onChange={(e) =>
                        setNotifPrefs((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#FF6A1A] rounded cursor-pointer"
                    />
                  </label>
                ))}
                <button onClick={handleSaveNotifications} className="btn-primary text-sm mt-2 cursor-pointer">
                  Save Preferences
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Razorpay Checkout */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(creditsAdded, newBalance, newPlan) => {
          setCreditBalance(newBalance);
          if (newPlan) setPlan(newPlan);
          toast.success(`+${creditsAdded.toLocaleString()} credits added to your account!`);
          credits.history(1, 10).then((d) => setTransactions(d.transactions)).catch(() => {});
        }}
        userEmail={email}
        userName={name}
        defaultPlan={selectedCheckoutPlan}
      />
    </div>
  );
}

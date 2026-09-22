"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Cog, Building2, Palette, ImageIcon, Paintbrush, Hexagon, Bone,
  Zap, FolderOpen, Clock, TrendingUp, ArrowRight, Loader2,
} from "lucide-react";
import { auth as authApi, generate, credits as creditsApi, getAccessToken } from "@/lib/api";
import type { User, GenerationJob } from "@/lib/api";
import CategorySelector from "@/components/CategorySelector";

const quickActions = [
  { icon: Cog, label: "Mechanical CAD", href: "/workspace/mechanical", color: "from-[#00F0FF] to-[#0EA5E9]", credits: 5, badge: "CAD" },
  { icon: Building2, label: "Architecture", href: "/workspace/architecture", color: "from-[#7B2FFF] to-[#A855F7]", credits: 8, badge: "ARCH" },
  { icon: Palette, label: "Creative 3D", href: "/workspace/text-to-3d", color: "from-[#FF2FD4] to-[#F43F5E]", credits: 10, badge: "3D" },
  { icon: ImageIcon, label: "Image to 3D", href: "/workspace/image-to-3d", color: "from-[#06b6d4] to-[#6366f1]", credits: 10 },
  { icon: Paintbrush, label: "AI Texture", href: "/workspace/texture", color: "from-[#8b5cf6] to-[#ec4899]", credits: 5 },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusColor: Record<string, string> = {
  COMPLETED: "text-[#10b981] bg-[rgba(16,185,129,0.1)]",
  PROCESSING: "text-[#6366f1] bg-[rgba(99,102,241,0.1)]",
  QUEUED: "text-[#f59e0b] bg-[rgba(245,158,11,0.1)]",
  FAILED: "text-[#ef4444] bg-[rgba(239,68,68,0.1)]",
  PENDING: "text-[#94a3b8] bg-[rgba(148,163,184,0.1)]",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    Promise.all([
      authApi.me(),
      generate.history(1, 10),
    ]).then(([userData, historyData]) => {
      setUser(userData.user);
      setJobs(historyData.generations);
    }).catch(() => {
      window.location.href = "/login";
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, <span className="gradient-text">{user?.name || user?.email?.split("@")[0] || "Creator"}</span>
        </h1>
        <p className="text-sm text-[#64748b] mt-1">What would you like to create today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: "Credits Left", value: user?.credits ?? 0, color: "text-[#f59e0b]" },
          { icon: Sparkles, label: "Generations", value: jobs.length, color: "text-[#6366f1]" },
          { icon: FolderOpen, label: "Models Saved", value: jobs.filter(j => j.status === "COMPLETED").length, color: "text-[#10b981]" },
          { icon: TrendingUp, label: "Plan", value: user?.plan || "FREE", color: "text-[#06b6d4]" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)]">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[#64748b]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={action.href} className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] hover:border-[rgba(99,102,241,0.3)] transition-all card-hover text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-[#64748b]">{action.credits} credits</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#818cf8]" /> Recent Generations
          </h2>
          {jobs.length > 0 && (
            <Link href="/assets" className="text-sm text-[#818cf8] hover:text-white flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] text-center">
            <Sparkles className="w-10 h-10 text-[#1e1e38] mx-auto mb-3" />
            <p className="text-[#64748b] text-sm mb-4">No generations yet. Choose a category to start!</p>
            <CategorySelector size="md" className="max-w-3xl mx-auto" />
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job, i) => (
              <Link key={job.id} href="/assets">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[#12121a] border border-[rgba(148,163,184,0.06)] hover:border-[rgba(99,102,241,0.3)] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[#0a0a12] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(99,102,241,0.1)] transition-colors">
                    <Sparkles className="w-4 h-4 text-[#6366f1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-white transition-colors">{job.prompt || job.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-[#64748b]">{job.type.replace(/_/g, " ")} • {timeAgo(job.createdAt)}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[job.status] || "text-[#94a3b8]"}`}>
                    {job.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#334155] group-hover:text-[#818cf8] transition-colors" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

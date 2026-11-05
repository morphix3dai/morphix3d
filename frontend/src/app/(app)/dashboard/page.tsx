"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Cog, Building2, Palette, ImageIcon, Paintbrush,
  Zap, FolderOpen, Clock, TrendingUp, ArrowRight, Loader2,
} from "lucide-react";
import { generate, getAccessToken } from "@/lib/api";
import type { GenerationJob } from "@/lib/api";
import CategorySelector from "@/components/CategorySelector";
import { useAuth } from "@/context/AuthContext";

const quickActions = [
  { icon: Cog, label: "Mechanical CAD", href: "/workspace/mechanical", accent: "bg-[#2F5BFF] text-white", credits: 5, badge: "CAD" },
  { icon: Building2, label: "Architecture", href: "/workspace/architecture", accent: "bg-[#FF6A1A] text-[#141413]", credits: 8, badge: "ARCH" },
  { icon: Palette, label: "Creative 3D", href: "/workspace/text-to-3d", accent: "bg-[#6D4AFF] text-white", credits: 10, badge: "3D" },
  { icon: ImageIcon, label: "Image to 3D", href: "/workspace/image-to-3d", accent: "bg-[#141413] text-[#FAF8F2]", credits: 10 },
  { icon: Paintbrush, label: "AI Texture", href: "/workspace/texture", accent: "bg-[#FF6A1A] text-[#141413]", credits: 5 },
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
  COMPLETED: "text-[#16A34A] bg-[#16A34A]/15 border border-[#16A34A]/30",
  PROCESSING: "text-[#2F5BFF] bg-[#2F5BFF]/15 border border-[#2F5BFF]/30",
  QUEUED: "text-[#FF6A1A] bg-[#FF6A1A]/15 border border-[#FF6A1A]/30",
  FAILED: "text-[#DC2626] bg-[#DC2626]/15 border border-[#DC2626]/30",
  PENDING: "text-[#6E6C65] bg-[#EDEFF2] border border-[#141413]/20",
};

export default function DashboardPage() {
  const { user, credits, plan } = useAuth();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generate.history(1, 10)
      .then((historyData) => {
        setJobs(historyData.generations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 text-[#FF6A1A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-[#141413]">
      {/* Welcome */}
      <div>
        <h1
          className="text-3xl font-normal text-[#141413]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          Welcome back, <span className="italic text-[#FF6A1A]">{user?.name || user?.email?.split("@")[0] || "Creator"}</span>
        </h1>
        <p className="text-sm text-[#4A4945] mt-1">What would you like to engineer today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: "Credits Left", value: credits ?? user?.credits ?? 0, color: "text-[#FF6A1A]" },
          { icon: Sparkles, label: "Generations", value: jobs.length, color: "text-[#6D4AFF]" },
          { icon: FolderOpen, label: "Models Saved", value: jobs.filter(j => j.status === "COMPLETED").length, color: "text-[#16A34A]" },
          { icon: TrendingUp, label: "Plan", value: plan || user?.plan || "FREE", color: "text-[#2F5BFF]" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413]">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold text-[#141413]">{stat.value}</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#6E6C65]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          className="text-xl font-normal mb-3 text-[#141413]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                href={action.href}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[4px_4px_0px_#141413] hover:-translate-y-1 transition-all text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${action.accent} border border-[#141413] flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-[#141413]">{action.label}</span>
                <span className="text-xs font-mono text-[#6E6C65]">{action.credits} credits</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xl font-normal flex items-center gap-2 text-[#141413]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            <Clock className="w-5 h-5 text-[#FF6A1A]" /> Recent Generations
          </h2>
          {jobs.length > 0 && (
            <Link href="/assets" className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6A1A] hover:underline flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] shadow-[5px_5px_0px_#141413] text-center">
            <Sparkles className="w-10 h-10 text-[#FF6A1A] mx-auto mb-3" />
            <p className="text-[#4A4945] text-sm mb-4">No generations yet. Choose an engine below to start!</p>
            <CategorySelector size="md" className="max-w-3xl mx-auto" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {jobs.map((job, i) => (
              <Link key={job.id} href="/assets">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-[#FAF8F2] border-[1.5px] border-[#141413] hover:bg-[#EDEFF2] transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EDEFF2] border border-[#141413]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF6A1A]/15 transition-colors">
                    <Sparkles className="w-4 h-4 text-[#FF6A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#141413] truncate">{job.prompt || job.type.replace(/_/g, " ")}</div>
                    <div className="text-xs font-mono text-[#6E6C65]">{job.type.replace(/_/g, " ")} • {timeAgo(job.createdAt)}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${statusColor[job.status] || "text-[#6E6C65]"}`}>
                    {job.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#6E6C65] group-hover:text-[#141413] transition-colors" />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

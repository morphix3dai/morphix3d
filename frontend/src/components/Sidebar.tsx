"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Cog,
  Building2,
  Palette,
  FolderOpen,
  Users,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Coins,
  ImageIcon,
  Paintbrush,
  Hexagon,
  Bone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { credits as creditsApi, getAccessToken } from "@/lib/api";

const menuItems = [
  {
    section: "Dashboard",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    section: "⚙️ Mechanical CAD",
    items: [
      { href: "/workspace/mechanical", icon: Cog, label: "Text to CAD", badge: "CAD" },
    ],
  },
  {
    section: "🏠 Architecture",
    items: [
      { href: "/workspace/architecture", icon: Building2, label: "Floor Plan AI", badge: "ARCH" },
    ],
  },
  {
    section: "🎨 Creative 3D",
    items: [
      { href: "/workspace/text-to-3d", icon: Palette, label: "Text to 3D", badge: "AI" },
      { href: "/workspace/image-to-3d", icon: ImageIcon, label: "Image to 3D", badge: "AI" },
      { href: "/workspace/texture", icon: Paintbrush, label: "AI Texture", badge: "AI" },
      { href: "/workspace/remesh", icon: Hexagon, label: "Smart Remesh" },
      { href: "/workspace/rig", icon: Bone, label: "Auto Rigging" },
    ],
  },
  {
    section: "Library",
    items: [
      { href: "/assets", icon: FolderOpen, label: "My Assets" },
      { href: "/community", icon: Users, label: "Community" },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      creditsApi.balance().then((data) => {
        setCreditBalance(data.credits);
      }).catch(() => {});
    }
  }, []);

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ease-in-out 
        ${collapsed ? "w-[68px]" : "w-[240px]"}
        bg-[#0f0f18] border-r border-[rgba(148,163,184,0.07)]`}
    >
      <div className="flex flex-col h-full">
        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {menuItems.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider uppercase text-[#4a4a6a]">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive
                          ? "text-white"
                          : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-gradient-to-r from-[rgba(0,240,255,0.1)] to-transparent rounded-lg border-l-2 border-[#00F0FF]"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                      <item.icon
                        className={`w-5 h-5 relative z-10 flex-shrink-0 transition-colors
                          ${isActive ? "text-[#00F0FF]" : "text-[#64748b] group-hover:text-[#94a3b8]"}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="relative z-10 truncate">{item.label}</span>
                          {"badge" in item && item.badge && (
                            <span className="relative z-10 ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-[#7B2FFF] to-[#FF2FD4] text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Credits Footer */}
        {!collapsed && (
          <div className="p-3 mx-2 mb-3 rounded-xl bg-gradient-to-br from-[rgba(0,240,255,0.06)] to-[rgba(123,47,255,0.06)] border border-[rgba(0,240,255,0.12)]">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-sm font-semibold text-[#f1f5f9]">{creditBalance ?? "..."} Credits</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7B2FFF]"
                style={{ width: `${Math.min(((creditBalance ?? 0) / 200) * 100, 100)}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="block text-center text-xs font-medium text-[#00F0FF] hover:text-white transition-colors"
            >
              Upgrade Plan →
            </Link>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-[rgba(148,163,184,0.07)] text-[#64748b] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Cog,
  Building2,
  FolderOpen,
  Users,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Coins,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
  const { credits: creditBalance } = useAuth();

  return (
    <aside
      className={`hidden md:block fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ease-in-out 
        ${collapsed ? "w-[68px]" : "w-[240px]"}
        bg-[#FAF8F2] border-r-[1.5px] border-[#141413] text-[#141413]`}
    >
      <div className="flex flex-col h-full">
        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4">
          {menuItems.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-mono font-bold tracking-widest uppercase text-[#6E6C65]">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                        ${isActive
                          ? "text-[#141413]"
                          : "text-[#4A4945] hover:text-[#141413] hover:bg-[#EDEFF2]/60"
                        }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-[#FF6A1A]/15 rounded-lg border-[1.5px] border-[#141413] shadow-[2px_2px_0px_#141413]"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                      <item.icon
                        className={`w-5 h-5 relative z-10 flex-shrink-0 transition-colors
                          ${isActive ? "text-[#FF6A1A]" : "text-[#6E6C65] group-hover:text-[#141413]"}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="relative z-10 truncate">{item.label}</span>
                          {"badge" in item && item.badge && (
                            <span className="relative z-10 ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#141413] text-[#FAF8F2]">
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
          <div className="p-3.5 mx-2.5 mb-3 rounded-xl bg-[#F4F1E6] border-[1.5px] border-[#141413] shadow-[3px_3px_0px_#141413]">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-[#FF6A1A]" />
              <span className="text-sm font-bold text-[#141413]">{creditBalance ?? "..."} Credits</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EDEFF2] border border-[#141413]/30 mb-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF6A1A]"
                style={{ width: `${Math.min(((creditBalance ?? 0) / 200) * 100, 100)}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="block text-center text-xs font-mono font-bold uppercase tracking-wider text-[#141413] hover:text-[#FF6A1A] transition-colors"
            >
              Upgrade Plan →
            </Link>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center h-10 border-t-[1.5px] border-[#141413] text-[#4A4945] hover:text-[#141413] hover:bg-[#EDEFF2] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

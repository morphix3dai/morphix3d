"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Dedicated standalone Create Design Studios for each of the 3 engines
  const isDedicatedStudio =
    pathname === "/workspace/mechanical" ||
    pathname === "/workspace/architecture" ||
    pathname === "/workspace/text-to-3d";

  if (isDedicatedStudio) {
    return <div className="min-h-screen w-full bg-[#F4F1E6] text-[#141413]">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F4F1E6] text-[#141413]">
      <Navbar />
      <Sidebar />
      <main className="ml-0 md:ml-[240px] pt-16 min-h-screen max-w-full overflow-x-hidden transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

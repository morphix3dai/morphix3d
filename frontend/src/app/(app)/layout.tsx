import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <Sidebar />
      <main className="ml-[240px] pt-16 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

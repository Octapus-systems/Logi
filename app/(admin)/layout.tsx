"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content — always full width on mobile, offset on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-[#1a1725]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-primary">Admin Panel</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

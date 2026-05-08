"use client";

import { Sidebar } from "@/components/staff/Sidebar";
import { TopNav } from "@/components/staff/TopNav";
import { useState } from "react";

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-72" : "lg:ml-20"
        }`}
      >
        <TopNav onMenuToggle={toggleSidebar} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

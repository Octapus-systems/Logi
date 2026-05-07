"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "/admin/dashboard", icon: "dashboard" },
  { name: "Staff", href: "/admin/staff", icon: "group" },
  { name: "Tasks", href: "/admin/tasks", icon: "assignment" },
  { name: "Settings", href: "/admin/settings", icon: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-screen w-72 fixed left-0 top-0 bg-surface-container/20 backdrop-blur-3xl border-r border-white/10 z-50">
      {/* Header */}
      <div className="mb-16 px-6 pt-6">
        <h1 className="text-h2 font-bold text-primary">Admin Panel</h1>
        <p className="text-on-surface-variant text-label-sm">System Control</p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 px-4 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-white/5 text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Profile */}
      <div className="mt-auto px-6 py-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <img
            alt="Admin User"
            className="w-10 h-10 rounded-full object-cover border border-primary/20"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          />
          <div>
            <p className="text-label-sm font-bold text-on-surface">Alex Thorne</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Master Admin</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

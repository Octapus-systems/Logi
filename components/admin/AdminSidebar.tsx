"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Overview", href: "/admin/dashboard", icon: "dashboard" },
  { name: "Staff", href: "/admin/staff", icon: "group" },
  { name: "Tasks", href: "/admin/tasks", icon: "assignment" },
  { name: "Settings", href: "/admin/settings", icon: "settings" },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Admin";
  const avatar = (session?.user as { image?: string } | undefined)?.image ?? undefined;

  return (
    <>
      {/* Mobile Sidebar */}
      <nav className={`fixed left-0 top-0 h-screen w-72 bg-surface-container/20 backdrop-blur-3xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 glass-card rounded-lg"
        >
          <X className="w-4 h-4 text-on-surface" />
        </button>

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
                onClick={onClose}
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
            <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-white/5 flex items-center justify-center text-on-surface-variant">
              {avatar ? (
                <img alt={name} className="w-full h-full object-cover" src={avatar} />
              ) : (
                <span className="text-label-sm font-bold">
                  {name.trim().slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-label-sm font-bold text-on-surface">{name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col h-screen w-72 fixed left-0 top-0 bg-surface-container/20 backdrop-blur-3xl border-r border-white/10 z-50">
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
            <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-white/5 flex items-center justify-center text-on-surface-variant">
              {avatar ? (
                <img alt={name} className="w-full h-full object-cover" src={avatar} />
              ) : (
                <span className="text-label-sm font-bold">
                  {name.trim().slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-label-sm font-bold text-on-surface">{name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

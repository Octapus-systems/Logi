"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { X, LogOut, LayoutDashboard, Users, ClipboardList, Settings } from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Attendance", href: "/admin/attendance", icon: Users },
  { name: "Tasks", href: "/admin/tasks", icon: ClipboardList },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function SidebarContent({ onClose, pathname, name, avatar, isAdmin = true }: {
  onClose?: () => void;
  pathname: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-primary leading-tight">Admin Panel</h1>
        <p className="text-on-surface-variant text-xs mt-1 tracking-wide">System Control</p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 mb-4" />

      {/* Navigation Label */}
      <p className="px-6 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Navigation</p>

      {/* Navigation */}
      <div className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 mt-4 mb-4" />

      {/* Admin Profile + Logout */}
      <div className="px-4 pb-6 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-white/5 flex items-center justify-center text-on-surface-variant flex-shrink-0">
            {avatar ? (
              <img alt={name} className="w-full h-full object-cover" src={avatar} />
            ) : (
              <span className="text-sm font-bold">
                {name.trim().slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{name}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Admin</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Admin";
  const avatar = (session?.user as { image?: string } | undefined)?.image ?? undefined;

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen w-72 bg-[#1a1725]/95 backdrop-blur-3xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-on-surface" />
        </button>
        <SidebarContent onClose={onClose} pathname={pathname} name={name} avatar={avatar} />
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col h-screen w-72 fixed left-0 top-0 bg-[#1a1725]/95 backdrop-blur-3xl border-r border-white/10 z-50">
        <SidebarContent pathname={pathname} name={name} avatar={avatar} />
      </nav>
    </>
  );
}

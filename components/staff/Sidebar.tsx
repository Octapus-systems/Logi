"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { href: "/staff/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/staff/staff", label: "Staff", icon: Users, comingSoon: true },
  { href: "/staff/tasks", label: "Tasks", icon: ClipboardList, comingSoon: true },
  { href: "/staff/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "User";
  const avatar = (session?.user as { image?: string } | undefined)?.image ?? undefined;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-[#1a1725]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${
          isMobile
            ? isOpen
              ? "w-72 translate-x-0"
              : "w-72 -translate-x-full"
            : isOpen
            ? "w-72 translate-x-0"
            : "w-20 translate-x-0"
        }`}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-6 w-6 h-6 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container hover:scale-110 transition-transform z-50 shadow-lg"
          >
            {isOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && isOpen && (
          <button
            onClick={onToggle}
            className="absolute right-4 top-4 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors z-50"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className={`p-6 pb-4 ${!isOpen && !isMobile ? "px-4 text-center" : ""}`}>
          {isOpen || isMobile ? (
            <span className="text-xl font-bold text-primary tracking-tight">Logi Task</span>
          ) : (
            <span className="text-xl font-bold text-primary">L</span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/10 mb-4" />

        {/* Menu Label */}
        {(isOpen || isMobile) && (
          <p className="px-6 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">
            Main Menu
          </p>
        )}

        {/* Main Menu */}
        <nav className={`space-y-1 flex-1 ${isOpen || isMobile ? "px-3" : "px-2"}`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onToggle()}
                className={`flex items-center rounded-xl font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent"
                } ${isOpen || isMobile ? "gap-3 px-4 py-3" : "justify-center p-3"}`}
                title={!isOpen && !isMobile ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(isOpen || isMobile) && (
                  <span className="text-sm flex items-center gap-2">
                    {item.label}
                    {item.comingSoon && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-outline-variant">
                        Soon
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto">
          {/* Divider */}
          <div className="mx-4 border-t border-white/10 mb-3" />

          {/* User Profile */}
          {(isOpen || isMobile) && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-white/5 flex items-center justify-center text-on-surface-variant flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">
                      {name.trim().slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Staff</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className={`pb-6 ${isOpen || isMobile ? "px-4" : "px-2"}`}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`w-full flex items-center rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 ${
                isOpen || isMobile ? "gap-3 px-4 py-3" : "justify-center p-3"
              }`}
              title={!isOpen && !isMobile ? "Log Out" : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {(isOpen || isMobile) && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

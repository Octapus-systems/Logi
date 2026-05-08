"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ClipboardList, Settings, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { href: "/staff/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/staff/staff", label: "Staff", icon: Users, comingSoon: true },
  { href: "/staff/tasks", label: "Tasks", icon: ClipboardList, comingSoon: true },
  { href: "/staff/settings", label: "Settings", icon: Settings, comingSoon: true },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-surface-container/30 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${
          isOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
        } ${isMobile && !isOpen ? "-translate-x-full" : ""}`}
      >
        {/* Toggle Button - Desktop (inside sidebar) */}
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
            className="absolute right-4 top-4 w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors z-50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      {/* Logo */}
      <div className={`p-6 mb-6 ${!isOpen && !isMobile ? "px-4" : ""}`}>
        {isOpen || isMobile ? (
          <span className="text-h3 text-primary tracking-tight">Logi Task</span>
        ) : (
          <span className="text-h3 text-primary tracking-tight">L</span>
        )}
      </div>

      {/* Main Menu */}
      <div className={`mb-4 ${isOpen || isMobile ? "px-4" : "px-2"}`}>
        {(isOpen || isMobile) && (
          <h4 className="text-caps-xs text-outline uppercase tracking-widest px-4 mb-4">
            Main Menu
          </h4>
        )}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onToggle()}
                className={`flex items-center rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-primary purple-glow border border-white/10"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                } ${isOpen || isMobile ? "gap-4 px-4 py-3" : "justify-center p-3"}`}
                title={!isOpen && !isMobile ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(isOpen || isMobile) && (
                  <span className="text-label-sm flex items-center gap-2">
                    {item.label}
                    {item.comingSoon && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-outline-variant">
                        Coming soon
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Daily Goal Progress */}
      {(isOpen || isMobile) && (
        <div className="mt-auto p-6">
          <div className="p-4 glass-card rounded-xl border border-white/10">
            <p className="text-label-sm text-on-surface-variant">No data now</p>
          </div>
        </div>
      )}
      {!isOpen && !isMobile && (
        <div className="mt-auto p-4">
          <div className="p-2 glass-card rounded-xl border border-white/10 flex justify-center">
            <span className="text-caps-xs text-outline-variant font-bold">N/A</span>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}

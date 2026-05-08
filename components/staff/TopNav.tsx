"use client";

import { Menu, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface TopNavProps {
  onMenuToggle: () => void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "User";
  const avatar =
    (session?.user as { image?: string } | undefined)?.image ?? undefined;

  return (
    <nav className="flex items-center justify-between px-6 py-3 w-full sticky top-0 z-40 bg-background/50 backdrop-blur-xl border-b border-white/5">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-10 h-10 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-4 ml-auto">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-sm font-bold text-on-surface">{name}</p>
            <p className="text-caps-xs text-outline">Staff</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden bg-white/5 flex items-center justify-center text-on-surface-variant">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-label-sm font-bold">
                {name.trim().slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}

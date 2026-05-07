"use client";

import { Menu } from "lucide-react";

interface User {
  name: string;
  role: string;
  avatar: string;
  lives: number;
}

interface TopNavProps {
  onMenuToggle: () => void;
}

const currentUser: User = {
  name: "Alex Rivera",
  role: "Product Designer",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  lives: 3,
};

export function TopNav({ onMenuToggle }: TopNavProps) {
  return (
    <nav className="flex items-center justify-between px-6 py-3 w-full sticky top-0 z-40 bg-background/50 backdrop-blur-xl border-b border-white/5">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-10 h-10 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-6 ml-auto">
        {/* Lives Counter */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
          <span className="text-label-sm text-on-surface-variant">Lives</span>
          <div className="flex gap-0.5">
            {Array.from({ length: currentUser.lives }).map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-primary-container"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-label-sm font-bold text-on-surface">{currentUser.name}</p>
            <p className="text-caps-xs text-outline">{currentUser.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

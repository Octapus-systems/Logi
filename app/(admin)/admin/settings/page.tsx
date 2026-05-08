"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, User, Shield, Bell, Palette } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">Settings</h1>
        <p className="text-sm text-on-surface-variant">Manage your admin account and preferences</p>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="glass-card border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide">Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {name.trim().slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-base font-semibold text-on-surface">{name}</p>
              <p className="text-sm text-on-surface-variant">{email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="glass-card border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide">System</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-on-surface-variant">Role</span>
              <span className="text-sm font-medium text-on-surface">Administrator</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-on-surface-variant">Platform</span>
              <span className="text-sm font-medium text-on-surface">Logi Task v1.0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-on-surface-variant">Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-green-400">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications — Coming Soon */}
        <div className="glass-card border border-white/10 rounded-2xl p-5 sm:p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-on-surface-variant" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide">Notifications</h2>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-outline-variant">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Appearance — Coming Soon */}
        <div className="glass-card border border-white/10 rounded-2xl p-5 sm:p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-on-surface-variant" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide">Appearance</h2>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-outline-variant">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Logout */}
        <div className="glass-card border border-red-500/20 rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide mb-1">Danger Zone</h2>
          <p className="text-xs text-on-surface-variant mb-4">
            Signing out will end your current admin session.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export default function AdminStaffPage() {
  return (
    <div className="min-h-[80vh] flex flex-col">
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

      {/* Coming Soon Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3">Coming Soon</h1>
        <p className="text-on-surface-variant text-sm sm:text-base max-w-md mb-8">
          The <strong className="text-on-surface">Staff Management</strong> section is currently under development. 
          Check back soon for full staff management capabilities.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-outline-variant">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
          In progress
        </div>
      </div>
    </div>
  );
}

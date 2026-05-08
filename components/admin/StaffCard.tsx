"use client";

import { User } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  tasksAssigned: number;
  lifeCount: number;
  maxLives: number;
  avatar: string;
  isOnline: boolean;
  status?: "checked-in" | "checked-out" | "absent";
  isOnBreak?: boolean;
}

function HeartIcon({ fillType, className }: { fillType: 'full' | 'half' | 'empty'; className?: string }) {
  return (
    <div className={`relative w-3 h-3 sm:w-3.5 sm:h-3.5 ${className}`}>
      {/* Background (Outline) */}
      <svg
        className="absolute inset-0 w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      
      {/* Fill */}
      {(fillType === 'full' || fillType === 'half') && (
        <svg
          className="absolute inset-0 w-full h-full"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={fillType === 'half' ? { clipPath: 'inset(0 50% 0 0)' } : {}}
        >
          <path
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </div>
  );
}

interface StaffCardProps {
  staff: StaffMember;
  onLifeCountChange: (delta: number) => void;
}

/**
 * Get staff status badge
 */
function getStaffStatusBadge(status?: string, isOnBreak?: boolean): { text: string; color: string; icon: string } {
  if (isOnBreak) {
    return { text: "On Break", color: "bg-amber-500/20 text-amber-400 border-amber-500/50", icon: "🟡" };
  }
  if (status === "checked-in") {
    return { text: "Active", color: "bg-green-500/20 text-green-400 border-green-500/50", icon: "🟢" };
  }
  if (status === "checked-out") {
    return { text: "Checked Out", color: "bg-red-500/20 text-red-400 border-red-500/50", icon: "🔴" };
  }
  return { text: "Absent", color: "bg-gray-500/20 text-gray-400 border-gray-500/50", icon: "⚪" };
}

export function StaffCard({ staff, onLifeCountChange }: StaffCardProps) {
  const statusBadge = getStaffStatusBadge(staff.status, staff.isOnBreak);

  return (
    <div className="glass-card p-3 sm:p-4 rounded-2xl flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            {staff.avatar ? (
              <img
                alt={staff.name || 'Staff'}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover"
                src={staff.avatar}
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface-container-high flex items-center justify-center border border-white/10">
                <User className="text-on-surface-variant w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            )}
            {staff.isOnline && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full border-2 border-surface" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-bold text-on-surface truncate">
              {staff.name || 'Unknown Staff'}
            </p>
            <p className="text-[11px] sm:text-[12px] text-on-surface-variant">
              {staff.tasksAssigned || 0} Tasks Assigned
            </p>
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] border mt-1 ${statusBadge.color}`}>
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.text}</span>
            </span>
          </div>
        </div>
        {/* Life Icons - Responsive */}
        <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 sm:px-2 py-1 rounded-full flex-shrink-0">
          {Array.from({ length: Math.min(staff.maxLives || 5, 5) }).map((_, index) => {
            const i = index + 1;
            const isFull = i <= (staff.lifeCount || 0);
            const isHalf = !isFull && i - 0.5 <= (staff.lifeCount || 0);
            const fillType = isFull ? 'full' : isHalf ? 'half' : 'empty';
            
            return (
              <HeartIcon
                key={index}
                fillType={fillType}
                className={fillType !== 'empty' ? "text-primary" : "text-primary/20"}
              />
            );
          })}
          {(staff.maxLives || 0) > 5 && (
            <span className="text-[10px] text-primary ml-1">+{(staff.maxLives || 0) - 5}</span>
          )}
        </div>
      </div>

      {/* Life Count Control */}
      <div className="bg-white/5 rounded-lg p-2 sm:p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-caps-xs uppercase text-on-surface-variant text-[10px] sm:text-[12px]">Life Count</span>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => onLifeCountChange(-1)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-on-surface disabled:opacity-50"
            disabled={(staff.lifeCount || 0) <= 0}
          >
            <span className="text-sm sm:text-base">-</span>
          </button>
          <span className="font-bold text-primary w-8 sm:w-12 text-center text-sm sm:text-base">
            {(staff.lifeCount || 0).toFixed(1)}
          </span>
          <button
            onClick={() => onLifeCountChange(1)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-on-surface disabled:opacity-50"
            disabled={(staff.lifeCount || 0) >= (staff.maxLives || 10)}
          >
            <span className="text-sm sm:text-base">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

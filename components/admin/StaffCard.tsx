"use client";

interface StaffMember {
  id: string;
  name: string;
  tasksAssigned: number;
  lifeCount: number;
  maxLives: number;
  avatar: string;
  isOnline: boolean;
}

interface StaffCardProps {
  staff: StaffMember;
  onLifeCountChange: (delta: number) => void;
}

export function StaffCard({ staff, onLifeCountChange }: StaffCardProps) {
  return (
    <div className="glass-card p-4 rounded-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            alt={staff.name}
            className="w-14 h-14 rounded-xl object-cover"
            src={staff.avatar}
          />
          {staff.isOnline && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full border-2 border-surface" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-body-md font-bold text-on-surface">{staff.name}</p>
          <p className="text-[12px] text-on-surface-variant">{staff.tasksAssigned} Tasks Assigned</p>
        </div>
        {/* Life Icons */}
        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
          {Array.from({ length: staff.maxLives }).map((_, index) => (
            <span
              key={index}
              className="material-symbols-outlined text-primary text-[14px]"
              style={{
                fontVariationSettings: index < staff.lifeCount ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
          ))}
        </div>
      </div>

      {/* Life Count Control */}
      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
        <span className="text-caps-xs uppercase text-on-surface-variant">Life Count</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLifeCountChange(-1)}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-on-surface"
            disabled={staff.lifeCount <= 0}
          >
            -
          </button>
          <span className="font-bold text-primary w-4 text-center">{staff.lifeCount}</span>
          <button
            onClick={() => onLifeCountChange(1)}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-on-surface"
            disabled={staff.lifeCount >= staff.maxLives}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

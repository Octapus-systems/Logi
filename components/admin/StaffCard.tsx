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
    <div className="glass-card p-3 sm:p-4 rounded-2xl flex flex-col gap-3 sm:gap-4">
      {/* Header */}
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
              <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-2xl">
                person
              </span>
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
        </div>
        {/* Life Icons - Responsive */}
        <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 sm:px-2 py-1 rounded-full flex-shrink-0">
          {Array.from({ length: Math.min(staff.maxLives || 5, 5) }).map((_, index) => (
            <span
              key={index}
              className="material-symbols-outlined text-primary text-[12px] sm:text-[14px]"
              style={{
                fontVariationSettings: index < (staff.lifeCount || 0) ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
          ))}
          {(staff.maxLives || 0) > 5 && (
            <span className="text-[10px] text-primary ml-1">+{(staff.maxLives || 0) - 5}</span>
          )}
        </div>
      </div>

      {/* Life Count Control */}
      <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 sm:p-3">
        <span className="text-caps-xs uppercase text-on-surface-variant text-[10px] sm:text-[12px]">Life Count</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onLifeCountChange(-1)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-on-surface disabled:opacity-50"
            disabled={(staff.lifeCount || 0) <= 0}
          >
            <span className="text-sm sm:text-base">-</span>
          </button>
          <span className="font-bold text-primary w-3 sm:w-4 text-center text-sm sm:text-base">
            {staff.lifeCount || 0}
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

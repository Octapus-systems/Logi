"use client";

interface StreakCardProps {
  days: number;
}

export function StreakCard({ days }: StreakCardProps) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
      <svg
        className="w-8 h-8 text-primary relative z-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <p className="text-caps-xs text-primary relative z-10">STREAK</p>
      <p className="text-h2 text-on-surface relative z-10">{days} Days</p>
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}

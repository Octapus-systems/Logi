"use client";

import { useEffect, useState } from "react";
import { useLives } from "@/hooks/useLives";

/**
 * Heart icon component for displaying lives
 */
function HeartIcon({ fillType, className }: { fillType: 'full' | 'half' | 'empty'; className?: string }) {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      {/* Background (Outline) */}
      <svg
        className="absolute inset-0 w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
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

/**
 * LivesCounter component - Displays staff member's current lives
 */
export function LivesCounter() {
  const {
    livesStatus,
    loading,
    error,
    fetchLivesStatus,
    getWarningLevel,
    formatCountdown,
    isHalfDay,
    minutesUntilDeduction,
  } = useLives();

  const [countdown, setCountdown] = useState(minutesUntilDeduction);
  const isOnBreak = livesStatus?.isOnBreak || false;

  // Sync countdown with livesStatus
  useEffect(() => {
    setCountdown(minutesUntilDeduction);
  }, [minutesUntilDeduction]);

  // Fetch lives status on mount
  useEffect(() => {
    fetchLivesStatus();
  }, [fetchLivesStatus]);

  // Decrement countdown locally every second for smoother UI
  // Pause when on break
  useEffect(() => {
    if (!livesStatus?.isCheckedIn || countdown === null || countdown <= 0 || isOnBreak) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) return prev;
        const next = prev - 1 / 60; // Decrement by 1 second
        
        // Trigger immediate refresh when hitting 0 to avoid "DEDUCTING..." hang
        if (next <= 0) {
          fetchLivesStatus();
        }
        
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [livesStatus?.isCheckedIn, countdown, isOnBreak, fetchLivesStatus]);

  // Not checked in state
  if (!livesStatus?.isCheckedIn) {
    return (
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 opacity-30">
            {[1, 2, 3, 4].map((i) => (
              <HeartIcon key={i} fillType="empty" className="text-outline" />
            ))}
          </div>
          <div className="flex-1">
            <p className="text-caps-xs text-outline">Not checked in</p>
            <p className="text-body-sm text-on-surface-variant">
              Check in to start tracking
            </p>
          </div>
        </div>
      </div>
    );
  }

  const warningLevel = getWarningLevel(livesStatus.lives);
  const warningColor =
    warningLevel === "danger"
      ? "text-red-400"
      : warningLevel === "warning"
      ? "text-yellow-400"
      : "text-primary";

  const countdownWarning =
    countdown !== null && countdown <= 5 && countdown > 0
      ? "animate-pulse text-red-400"
      : "";

  return (
    <div className="glass-card p-4 rounded-2xl">
      {/* Lives Display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => {
            const isFull = i <= livesStatus.lives;
            const isHalf = !isFull && i - 0.5 <= livesStatus.lives;
            const fillType = isFull ? 'full' : isHalf ? 'half' : 'empty';
            
            return (
              <HeartIcon
                key={i}
                fillType={fillType}
                className={fillType !== 'empty' ? warningColor : "text-outline/30"}
              />
            );
          })}
        </div>
        <div className="flex-1">
          <p className={`text-h3 font-bold ${warningColor}`}>
            {livesStatus.lives.toFixed(1)} / {livesStatus.maxLives.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {isHalfDay && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3">
          <p className="text-caps-xs text-red-400 text-center">
            HALF DAY - Only 2 hours counted
          </p>
        </div>
      )}

      {livesStatus.lives <= 1 && livesStatus.lives > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3">
          <p className="text-caps-xs text-red-400 text-center">
            WARNING: Reply to a task soon to avoid losing your last life!
          </p>
        </div>
      )}

      {/* Countdown - Hidden when on break */}
      {countdown !== null && countdown >= 0 && livesStatus.lives > 0 && !isOnBreak && (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${countdown <= 5 ? 'text-red-400' : 'text-outline'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-caps-xs text-outline font-medium">Activity Timer</span>
          </div>
          <span className={`font-mono text-body-md font-bold tracking-wider ${countdownWarning}`}>
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      {/* Break Status */}
      {isOnBreak && (
        <div className="flex items-center justify-between bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-caps-xs text-amber-400 font-medium">On Break</span>
          </div>
          <span className="font-mono text-body-md font-bold text-amber-400">
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      {livesStatus.lives === 0 && (
        <p className="text-caps-xs text-red-400 text-center">
          No lives remaining - Check out to end session
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <p className="text-caps-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}

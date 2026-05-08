"use client";

import { useEffect, useState } from "react";
import { useLives } from "@/hooks/useLives";

/**
 * Heart icon component for displaying lives
 */
function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`w-6 h-6 ${className}`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
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

  // Decrement countdown locally every second for smoother UI
  // Pause when on break
  useEffect(() => {
    if (!livesStatus?.isCheckedIn || countdown === null || countdown <= 0 || isOnBreak) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1 / 60; // Decrement by 1 second
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [livesStatus?.isCheckedIn, countdown, isOnBreak]);

  // Fetch lives status on mount
  useEffect(() => {
    fetchLivesStatus();
  }, [fetchLivesStatus]);

  // Not checked in state
  if (!livesStatus?.isCheckedIn) {
    return (
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 opacity-30">
            {[1, 2, 3, 4].map((i) => (
              <HeartIcon key={i} filled={false} className="text-outline" />
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
          {[1, 2, 3, 4].map((i) => (
            <HeartIcon
              key={i}
              filled={i <= livesStatus.lives}
              className={i <= livesStatus.lives ? warningColor : "text-outline/30"}
            />
          ))}
        </div>
        <div className="flex-1">
          <p className={`text-h3 font-bold ${warningColor}`}>
            {livesStatus.lives} / {livesStatus.maxLives}
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

      {livesStatus.lives === 1 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3">
          <p className="text-caps-xs text-red-400 text-center">
            WARNING: Reply to a task soon to avoid losing your last life!
          </p>
        </div>
      )}

      {/* Countdown - Hidden when on break */}
      {countdown !== null && countdown > 0 && livesStatus.lives > 0 && !isOnBreak && (
        <div className="flex items-center justify-between text-caps-xs text-outline">
          <span>Next deduction in:</span>
          <span className={`font-mono ${countdownWarning}`}>
            {countdown <= 0
              ? "DEDUCTING..."
              : `${Math.ceil(countdown).toString().padStart(2, "0")}m`}
          </span>
        </div>
      )}

      {/* Break Status */}
      {isOnBreak && (
        <div className="flex items-center justify-between text-caps-xs text-amber-400">
          <span>Countdown paused</span>
          <span className="font-mono">{countdown !== null ? `${Math.ceil(countdown).toString().padStart(2, "0")}m` : "--"}</span>
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

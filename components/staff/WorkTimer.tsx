"use client";

import { useEffect, useState, useCallback } from "react";

interface WorkTimerProps {
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * WorkTimer component displays a countdown timer for the 4-hour work day
 */
export function WorkTimer({ remainingSeconds, isRunning, className = "" }: WorkTimerProps) {
  const [displayTime, setDisplayTime] = useState(remainingSeconds);

  // Update display time when props change
  useEffect(() => {
    setDisplayTime(remainingSeconds);
  }, [remainingSeconds]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning || displayTime <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, displayTime]);

  /**
   * Format seconds to HH:MM:SS
   */
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Calculate progress percentage (inverse - starts at 0%, ends at 100%)
   */
  const fourHoursInSeconds = 4 * 60 * 60;
  const progress = Math.min(100, ((fourHoursInSeconds - displayTime) / fourHoursInSeconds) * 100);

  /**
   * Get color based on remaining time
   */
  const getTimerColor = (): string => {
    if (displayTime > 2 * 60 * 60) return "text-primary-container"; // > 2 hours
    if (displayTime > 30 * 60) return "text-yellow-400"; // 30 min - 2 hours
    return "text-red-400"; // < 30 minutes
  };

  /**
   * Get progress bar color
   */
  const getProgressColor = (): string => {
    if (displayTime > 2 * 60 * 60) return "bg-primary-container";
    if (displayTime > 30 * 60) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center gap-3">
        <svg
          className={`w-5 h-5 ${getTimerColor()}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
        <span className={`font-mono text-h3 font-bold ${getTimerColor()}`}>
          {formatTime(displayTime)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[200px]">
        <div className="flex items-center justify-between text-caps-xs text-outline mb-1">
          <span>Work Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Text */}
      <p className="text-caps-xs text-outline">
        {displayTime === 0
          ? "Work day complete!"
          : `${formatTime(displayTime)} remaining`}
      </p>
    </div>
  );
}

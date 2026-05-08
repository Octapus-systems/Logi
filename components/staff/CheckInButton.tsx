"use client";

import { useState } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { useLives } from "@/hooks/useLives";

interface CheckInButtonProps {
  onStatusChange?: (isCheckedIn: boolean) => void;
}

/**
 * CheckInButton component - Check-in/out with break functionality
 */
export function CheckInButton({ onStatusChange }: CheckInButtonProps) {
  const { attendance, loading, error, isCheckedIn, isOnBreak, checkIn, checkOut, startBreak, endBreak } = useAttendance();
  const { minutesUntilDeduction } = useLives();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  /**
   * Handle check-in/check-out button click
   */
  const handleClick = async () => {
    try {
      setCheckoutError(null);
      if (isCheckedIn) {
        await checkOut();
        onStatusChange?.(false);
      } else {
        await checkIn();
        onStatusChange?.(true);
      }
    } catch (err) {
      // Check for specific checkout error
      if (err instanceof Error && err.message.includes("cannot check out without completing")) {
        setCheckoutError("You cannot check out without completing at least one task. Please mark a task as Done before checking out.");
      }
      // Error is handled in the hook
    }
  };

  /**
   * Handle break toggle
   */
  const handleBreakToggle = async () => {
    try {
      if (isOnBreak) {
        await endBreak();
      } else {
        // Pass remaining countdown seconds to resume from same point
        const remainingSeconds = minutesUntilDeduction ? Math.ceil(minutesUntilDeduction * 60) : 1800;
        await startBreak(remainingSeconds);
      }
    } catch {
      // Error is handled in the hook
    }
  };

  /**
   * Get check-in/out button text based on state
   */
  const getButtonText = (): string => {
    if (loading) return "Loading...";
    return isCheckedIn ? "Check Out" : "Check In";
  };

  /**
   * Get check-in/out button color based on state
   */
  const getButtonClass = (): string => {
    const baseClass = "font-h3 text-h3 px-16 py-4 rounded-full transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    if (isCheckedIn) {
      return `${baseClass} bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30`;
    }

    return `${baseClass} bg-gradient-to-br from-primary-container to-primary text-on-primary-container`;
  };

  /**
   * Get break button text
   */
  const getBreakButtonText = (): string => {
    if (loading) return "Processing...";
    return isOnBreak ? "End Break" : "Take a Break";
  };

  /**
   * Get break button color
   */
  const getBreakButtonClass = (): string => {
    const baseClass = "font-h3 text-h3 px-8 py-3 rounded-full transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    if (isOnBreak) {
      return `${baseClass} bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30`;
    }

    return `${baseClass} bg-gradient-to-br from-surface-container-high to-surface-container text-on-surface border border-white/10`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* On Break Banner */}
      {isOnBreak && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl px-6 py-3 flex items-center gap-3">
          <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-amber-400 font-medium">On Break - Lives countdown paused</span>
        </div>
      )}

      {/* Main Check In/Out Button */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={getButtonClass()}
        style={!isCheckedIn ? { boxShadow: "0 0 20px rgba(156, 122, 255, 0.3)" } : undefined}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          getButtonText()
        )}
      </button>

      {/* Break Button - Only visible after check-in */}
      {isCheckedIn && (
        <button
          onClick={handleBreakToggle}
          disabled={loading}
          className={getBreakButtonClass()}
        >
          {getBreakButtonText()}
        </button>
      )}

      {/* Checkout Error Message */}
      {checkoutError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 max-w-md text-center">
          <p className="text-red-400 text-sm">{checkoutError}</p>
        </div>
      )}

      {/* General Error Message */}
      {error && !checkoutError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 max-w-md text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

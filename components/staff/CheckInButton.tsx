"use client";

import { useAttendance } from "@/hooks/useAttendance";
import { WorkTimer } from "./WorkTimer";

interface CheckInButtonProps {
  onStatusChange?: (isCheckedIn: boolean) => void;
}

/**
 * CheckInButton component with API integration and countdown timer
 */
export function CheckInButton({ onStatusChange }: CheckInButtonProps) {
  const { attendance, loading, error, isCheckedIn, checkIn, checkOut, getRemainingSeconds } = useAttendance();

  /**
   * Handle check-in/check-out button click
   */
  const handleClick = async () => {
    try {
      if (isCheckedIn) {
        await checkOut();
        onStatusChange?.(false);
      } else {
        await checkIn();
        onStatusChange?.(true);
      }
    } catch {
      // Error is handled in the hook
    }
  };

  /**
   * Get button text based on state
   */
  const getButtonText = (): string => {
    if (loading) return "Loading...";
    if (attendance?.status === "on-break") return "End Break";
    return isCheckedIn ? "Check Out" : "Check In";
  };

  /**
   * Get button color based on state
   */
  const getButtonClass = (): string => {
    const baseClass = "font-h3 text-h3 px-16 py-4 rounded-full transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (isCheckedIn) {
      return `${baseClass} bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30`;
    }
    
    return `${baseClass} bg-gradient-to-br from-primary-container to-primary text-on-primary-container`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
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

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-body-sm text-center max-w-xs">
          {error}
        </p>
      )}

      {/* Work Timer - Only show when checked in */}
      {isCheckedIn && attendance && (
        <WorkTimer
          remainingSeconds={getRemainingSeconds()}
          isRunning={attendance.status === "checked-in"}
        />
      )}

      {/* Check In Time Display */}
      {attendance?.checkInTime && (
        <p className="text-caps-xs text-outline">
          Checked in at{" "}
          {new Date(attendance.checkInTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

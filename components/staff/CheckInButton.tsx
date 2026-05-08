import { useState, useEffect } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { useLives } from "@/hooks/useLives";
import { Coffee, LogOut, LogIn, AlertCircle, Play, Square, Lock } from "lucide-react";

interface CheckInButtonProps {
  onStatusChange?: (isCheckedIn: boolean) => void;
  doneTaskCount?: number;
}

/**
 * CheckInButton component - Check-in/out with break functionality
 */
export function CheckInButton({ onStatusChange, doneTaskCount = 0 }: CheckInButtonProps) {
  const { attendance, loading, error: attendanceError, isCheckedIn, isOnBreak, checkIn, checkOut, startBreak, endBreak } = useAttendance();
  const { minutesUntilDeduction } = useLives();
  const [breakError, setBreakError] = useState<string | null>(null);
  const [showBlockedTooltip, setShowBlockedTooltip] = useState(false);

  // Clear break error after some time or when status changes
  useEffect(() => {
    if (breakError) {
      const timer = setTimeout(() => setBreakError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [breakError]);

  /**
   * Handle check-in/check-out button click
   */
  const handleClick = async () => {
    try {
      setBreakError(null);
      if (isCheckedIn) {
        await checkOut();
        onStatusChange?.(false);
      } else {
        await checkIn();
        onStatusChange?.(true);
      }
    } catch (err) {
      // Error is handled in the hook
    }
  };

  /**
   * Handle break toggle
   */
  const handleBreakToggle = async () => {
    try {
      setBreakError(null);
      if (isOnBreak) {
        await endBreak();
      } else {
        // Backend now validates this, but we also check on frontend for better UX
        if (doneTaskCount === 0) {
          setBreakError("You must complete at least 1 task before taking a break.");
          return;
        }
        
        // Pass remaining countdown seconds to resume from same point
        const remainingSeconds = minutesUntilDeduction ? Math.ceil(minutesUntilDeduction * 60) : 1800;
        await startBreak(remainingSeconds);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("complete at least 1 task")) {
        setBreakError("You must complete at least 1 task before taking a break.");
      }
    }
  };

  /**
   * Get check-in/out button text based on state
   */
  const getButtonContent = () => {
    if (loading) return <span>Processing...</span>;
    
    if (isCheckedIn) {
      return (
        <span className="flex items-center gap-2">
          <LogOut size={20} />
          Check Out
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2">
        <LogIn size={20} />
        Check In
      </span>
    );
  };

  /**
   * Get check-in/out button color based on state
   */
  const getButtonClass = (): string => {
    const baseClass = "font-bold text-base sm:text-xl px-10 sm:px-16 py-3.5 sm:py-5 rounded-full transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center min-w-[200px]";

    if (isCheckedIn) {
      return `${baseClass} bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/20`;
    }

    return `${baseClass} bg-gradient-to-br from-[#cebdff] to-[#9c7aff] text-[#310083]`;
  };

  /**
   * Get break button content
   */
  const getBreakButtonContent = () => {
    if (loading) return <span>Loading...</span>;
    
    if (isOnBreak) {
      return (
        <span className="flex items-center gap-2">
          <Square size={18} fill="currentColor" />
          End Break
        </span>
      );
    }

    if (doneTaskCount === 0) {
      return (
        <span className="flex items-center gap-2 opacity-70">
          <Lock size={18} />
          Break Locked
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2">
        <Coffee size={18} />
        Take a Break
      </span>
    );
  };

  /**
   * Get break button color
   */
  const getBreakButtonClass = (): string => {
    const baseClass = "font-semibold text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-3.5 rounded-2xl transform transition-all duration-300 flex items-center justify-center min-w-[180px]";

    if (isOnBreak) {
      return `${baseClass} bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10 active:scale-95`;
    }

    if (doneTaskCount === 0) {
      return `${baseClass} bg-surface-container text-outline border border-outline/20 cursor-not-allowed grayscale`;
    }

    return `${baseClass} bg-surface-container-high text-on-surface border border-white/10 hover:border-primary/50 hover:bg-surface-container-highest shadow-lg active:scale-95`;
  };

  const isBreakBlocked = isCheckedIn && !isOnBreak && doneTaskCount === 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* On Break Banner */}
      {isOnBreak && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 flex items-center gap-4 w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-75" />
            <span className="relative w-3 h-3 bg-amber-500 rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-amber-500 font-bold text-sm uppercase tracking-wider">On Break</span>
            <span className="text-amber-500/70 text-xs">Lives countdown is currently paused</span>
          </div>
        </div>
      )}

      {/* Main Check In/Out Button */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={getButtonClass()}
      >
        {getButtonContent()}
      </button>

      {/* Break Button Section */}
      {isCheckedIn && (
        <div className="relative w-full flex flex-col items-center gap-3">
          <button
            onClick={handleBreakToggle}
            onMouseEnter={() => isBreakBlocked && setShowBlockedTooltip(true)}
            onMouseLeave={() => setShowBlockedTooltip(false)}
            className={getBreakButtonClass()}
          >
            {getBreakButtonContent()}
          </button>
          
          {/* Tooltip/Helper Text for Blocked State */}
          {isBreakBlocked && (
            <p className="text-[10px] sm:text-xs text-outline text-center flex items-center gap-1.5 animate-in fade-in duration-300">
              <AlertCircle size={12} />
              Complete at least 1 task to unlock breaks
            </p>
          )}
        </div>
      )}

      {/* Error Messages */}
      {(breakError || attendanceError) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 w-full flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-red-400 text-sm font-medium">{breakError || attendanceError}</p>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useLives, type StaffLivesData } from "@/hooks/useLives";

/**
 * Heart icon for lives display
 */
function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
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
 * LivesManager component - Admin interface for managing staff lives
 */
export function LivesManager() {
  const {
    allStaffLives,
    loading,
    error,
    fetchAllStaffLives,
    adjustLives,
  } = useLives();

  const [selectedStaff, setSelectedStaff] = useState<StaffLivesData | null>(null);
  const [actionType, setActionType] = useState<"give" | "remove">("give");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);

  // Fetch staff lives on mount
  useEffect(() => {
    fetchAllStaffLives();
  }, [fetchAllStaffLives]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllStaffLives();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllStaffLives]);

  /**
   * Open adjustment modal for a staff member
   */
  const openAdjustModal = (staff: StaffLivesData, action: "give" | "remove") => {
    setSelectedStaff(staff);
    setActionType(action);
    setAmount(1);
    setReason("");
    setAdjustmentError(null);
    setAdjustmentSuccess(null);
    setIsModalOpen(true);
  };

  /**
   * Handle lives adjustment
   */
  const handleAdjustLives = async () => {
    if (!selectedStaff || !reason.trim()) return;

    setAdjustmentError(null);
    setAdjustmentSuccess(null);

    const result = await adjustLives(selectedStaff.userId, actionType, amount, reason.trim());

    if (result) {
      setAdjustmentSuccess(
        `Successfully ${actionType === "give" ? "gave" : "removed"} ${amount} life${amount > 1 ? "s" : ""}`
      );
      setTimeout(() => {
        setIsModalOpen(false);
        setAdjustmentSuccess(null);
      }, 1500);
    } else {
      setAdjustmentError("Failed to adjust lives. Staff may have reached max/min lives.");
    }
  };

  /**
   * Get status color based on lives
   */
  const getStatusColor = (lives: number, isHalfDay: boolean): string => {
    if (lives <= 1) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (isHalfDay) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

  /**
   * Format time since last activity
   */
  const formatTimeSince = (dateString: string | null): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading && allStaffLives.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-center h-40">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h3 text-on-surface">Staff Lives Status</h2>
        <button
          onClick={() => fetchAllStaffLives()}
          disabled={loading}
          className="px-4 py-2 bg-surface-container-high rounded-xl text-caps-xs text-on-surface hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-caps-xs text-red-400">{error}</p>
        </div>
      )}

      {allStaffLives.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body-lg text-on-surface-variant">No staff currently checked in</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allStaffLives.map((staff) => (
            <div
              key={staff.userId}
              className="flex items-center gap-4 p-4 bg-surface-container-high/50 rounded-xl"
            >
              {/* Staff Info */}
              <div className="flex-1 min-w-0">
                <p className="text-body-md text-on-surface font-medium truncate">{staff.name}</p>
                <p className="text-caps-xs text-outline truncate">{staff.email}</p>
              </div>

              {/* Lives Display */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <HeartIcon
                      key={i}
                      filled={i <= staff.lives}
                      className={
                        i <= staff.lives
                          ? staff.lives <= 1
                            ? "text-red-400"
                            : staff.lives <= 2
                            ? "text-yellow-400"
                            : "text-primary"
                          : "text-outline/30"
                      }
                    />
                  ))}
                </div>
                <span className={`text-h3 font-bold w-8 text-center ${staff.lives <= 1 ? "text-red-400" : staff.lives <= 2 ? "text-yellow-400" : "text-primary"}`}>
                  {staff.lives}
                </span>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full border text-caps-xs ${getStatusColor(staff.lives, staff.isHalfDay)}`}>
                {staff.isHalfDay ? "HALF DAY" : "FULL DAY"}
              </div>

              {/* Last Activity */}
              <div className="hidden md:block text-right min-w-[100px]">
                <p className="text-caps-xs text-outline">Last reply:</p>
                <p className={`text-caps-xs ${staff.minutesUntilDeduction !== null && staff.minutesUntilDeduction <= 5 ? "text-red-400" : "text-on-surface"}`}>
                  {formatTimeSince(staff.lastReplyAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openAdjustModal(staff, "give")}
                  disabled={staff.lives >= 4}
                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-caps-xs hover:bg-green-500/30 transition-colors disabled:opacity-30"
                  title="Give Life"
                >
                  +1
                </button>
                <button
                  onClick={() => openAdjustModal(staff, "remove")}
                  disabled={staff.lives <= 0}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-xl text-caps-xs hover:bg-red-500/30 transition-colors disabled:opacity-30"
                  title="Remove Life"
                >
                  -1
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adjustment Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-h3 text-on-surface mb-4">
              {actionType === "give" ? "Give Lives" : "Remove Lives"}
            </h3>

            <p className="text-body-md text-on-surface-variant mb-4">
              Staff: <span className="text-on-surface font-medium">{selectedStaff.name}</span>
            </p>

            <p className="text-body-md text-on-surface-variant mb-4">
              Current Lives: <span className="text-h3 font-bold text-primary">{selectedStaff.lives}</span>
            </p>

            {/* Amount Selection */}
            <div className="mb-4">
              <label className="text-caps-xs text-outline block mb-2">Amount:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setAmount(num)}
                    disabled={
                      actionType === "give"
                        ? selectedStaff.lives + num > 4
                        : selectedStaff.lives - num < 0
                    }
                    className={`w-12 h-12 rounded-xl text-h3 font-bold transition-colors ${
                      amount === num
                        ? actionType === "give"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-surface-container-high text-on-surface hover:bg-white/10"
                    } disabled:opacity-30`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-6">
              <label className="text-caps-xs text-outline block mb-2">Reason (required):</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for adjustment..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body-md text-on-surface focus:border-primary-container focus:ring-0 placeholder:text-outline transition-colors outline-none"
              />
            </div>

            {/* Messages */}
            {adjustmentError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <p className="text-caps-xs text-red-400">{adjustmentError}</p>
              </div>
            )}
            {adjustmentSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                <p className="text-caps-xs text-green-400">{adjustmentSuccess}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-surface-container-high rounded-xl text-caps-xs text-on-surface hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustLives}
                disabled={!reason.trim()}
                className={`flex-1 px-4 py-3 rounded-xl text-caps-xs font-medium transition-colors disabled:opacity-50 ${
                  actionType === "give"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {actionType === "give" ? "Give Lives" : "Remove Lives"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

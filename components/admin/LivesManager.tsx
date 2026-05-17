"use client";

import { useState, useEffect } from "react";
import { useLives, type StaffLivesData } from "@/hooks/useLives";
import { X, RefreshCw } from "lucide-react";

function HeartIcon({ fillType, className }: { fillType: 'full' | 'half' | 'empty'; className?: string }) {
  return (
    <div className={`relative w-4 h-4 ${className}`}>
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

export function LivesManager() {
  const { allStaffLives, loading, error, fetchAllStaffLives, adjustLives } = useLives();

  const [selectedStaff, setSelectedStaff] = useState<StaffLivesData | null>(null);
  const [actionType, setActionType] = useState<"give" | "remove">("give");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAllStaffLives(); }, [fetchAllStaffLives]);
  useEffect(() => {
    const interval = setInterval(() => fetchAllStaffLives(), 30000);
    return () => clearInterval(interval);
  }, [fetchAllStaffLives]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  const openAdjustModal = (staff: StaffLivesData, action: "give" | "remove") => {
    setSelectedStaff(staff);
    setActionType(action);
    setAmount(1);
    setReason("");
    setAdjustmentError(null);
    setAdjustmentSuccess(null);
    setIsModalOpen(true);
  };

  const handleAdjustLives = async () => {
    if (!selectedStaff || !reason.trim()) return;
    setSubmitting(true);
    setAdjustmentError(null);
    setAdjustmentSuccess(null);
    const result = await adjustLives(selectedStaff.userId, actionType, amount, reason.trim());
    setSubmitting(false);
    if (result) {
      setAdjustmentSuccess(
        `Successfully ${actionType === "give" ? "gave" : "removed"} ${amount} life${amount > 1 ? "s" : ""}`
      );
      setTimeout(() => {
        setIsModalOpen(false);
        setAdjustmentSuccess(null);
      }, 1200);
    } else {
      setAdjustmentError("Failed to adjust lives. Staff may have reached max/min lives.");
    }
  };

  const getStatusColor = (lives: number, isHalfDay: boolean): string => {
    if (lives <= 1) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (isHalfDay) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

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
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4 sm:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-semibold text-on-surface">Staff Lives Status</h2>
          <button
            onClick={() => fetchAllStaffLives()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-surface-container-high rounded-xl text-xs text-on-surface hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {allStaffLives.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base text-on-surface-variant">No staff currently checked in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allStaffLives.map((staff) => (
              <div
                key={staff.userId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-surface-container-high/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
              >
                {/* Top Section / Main Info: Staff Name/Email + Break status */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 min-w-0 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-on-surface truncate">{staff.name}</p>
                      {staff.isOnBreak && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-outline truncate">{staff.email}</p>
                  </div>
                  
                  {/* Status Badge shown on the right side of staff info on mobile */}
                  <div className="flex-shrink-0 sm:hidden">
                    {staff.isOnBreak ? (
                      <div className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse">
                        ON BREAK
                      </div>
                    ) : (
                      <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${getStatusColor(staff.lives, staff.isHalfDay)}`}>
                        {staff.isHalfDay ? "HALF DAY" : "FULL DAY"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section (on mobile) / Right Section (on desktop): Stats + Badges + Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t border-white/5 pt-2.5 sm:border-t-0 sm:pt-0">
                  {/* Lives Display */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => {
                        const isFull = i <= staff.lives;
                        const isHalf = !isFull && i - 0.5 <= staff.lives;
                        const fillType = isFull ? 'full' : isHalf ? 'half' : 'empty';
                        
                        return (
                          <HeartIcon
                            key={i}
                            fillType={fillType}
                            className={
                              fillType !== 'empty'
                                ? staff.lives <= 1
                                  ? "text-red-400"
                                  : staff.lives <= 2
                                  ? "text-yellow-400"
                                  : "text-primary"
                                : "text-outline/30"
                            }
                          />
                        );
                      })}
                    </div>
                    <span className={`text-xl font-bold w-7 text-center ${staff.lives <= 1 ? "text-red-400" : staff.lives <= 2 ? "text-yellow-400" : "text-primary"}`}>
                      {staff.lives.toFixed(1)}
                    </span>
                  </div>

                  {/* Status Badge (hidden on mobile, shown on desktop) */}
                  <div className="hidden sm:block">
                    {staff.isOnBreak ? (
                      <div className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse">
                        ON BREAK
                      </div>
                    ) : (
                      <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${getStatusColor(staff.lives, staff.isHalfDay)}`}>
                        {staff.isHalfDay ? "HALF DAY" : "FULL DAY"}
                      </div>
                    )}
                  </div>

                  {/* Last Activity — hidden on very small screens */}
                  <div className="hidden sm:block text-right min-w-[90px]">
                    <p className="text-[10px] text-outline">Last reply:</p>
                    <p className={`text-xs ${staff.minutesUntilDeduction !== null && staff.minutesUntilDeduction <= 5 ? "text-red-400" : "text-on-surface"}`}>
                      {formatTimeSince(staff.lastReplyAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdjustModal(staff, "give")}
                      disabled={staff.lives >= 4}
                      className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 text-sm font-bold hover:bg-green-500/30 transition-colors disabled:opacity-30 flex items-center justify-center"
                      title="Give Life"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => openAdjustModal(staff, "remove")}
                      disabled={staff.lives <= 0}
                      className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors disabled:opacity-30 flex items-center justify-center"
                      title="Remove Life"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjustment Modal — Bottom sheet on mobile */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-[#1e1b2e] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-on-surface">
                {actionType === "give" ? "Give Lives" : "Remove Lives"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Staff Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-outline mb-0.5">Staff Member</p>
                <p className="text-sm font-semibold text-on-surface">{selectedStaff.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((i) => {
                      const isFull = i <= selectedStaff.lives;
                      const isHalf = !isFull && i - 0.5 <= selectedStaff.lives;
                      const fillType = isFull ? 'full' : isHalf ? 'half' : 'empty';
                      
                      return (
                        <HeartIcon
                          key={i}
                          fillType={fillType}
                          className={fillType !== 'empty' ? "text-primary" : "text-outline/30"}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-outline">Current: <span className="text-primary font-bold">{selectedStaff.lives.toFixed(1)}</span></span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wide block mb-2">Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setAmount(num)}
                      disabled={
                        actionType === "give"
                          ? selectedStaff.lives + num > 4
                          : selectedStaff.lives - num < 0
                      }
                      className={`h-12 rounded-xl text-lg font-bold transition-colors disabled:opacity-30 ${
                        amount === num
                          ? actionType === "give"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-surface-container-high text-on-surface hover:bg-white/10"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wide block mb-2">
                  Reason <span className="text-red-400">(required)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for adjustment..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary/40 outline-none placeholder:text-outline transition-colors"
                />
              </div>

              {/* Messages */}
              {adjustmentError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-400">{adjustmentError}</p>
                </div>
              )}
              {adjustmentSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-green-400">{adjustmentSuccess}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-on-surface-variant hover:bg-white/10 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustLives}
                  disabled={!reason.trim() || submitting}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                    actionType === "give"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting ? "Saving..." : actionType === "give" ? "Give Lives" : "Remove Lives"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

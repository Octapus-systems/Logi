"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Lives status data interface
 */
export interface LivesStatus {
  lives: number;
  maxLives: number;
  isHalfDay: boolean;
  isCheckedIn: boolean;
  isOnBreak: boolean;
  lastReplyAt: string | null;
  lastDeductionAt: string | null;
  nextDeductionAt: string | null;
  minutesUntilDeduction: number | null;
  remainingCountdownSeconds: number;
}

/**
 * Staff lives data for admin view
 */
export interface StaffLivesData {
  userId: string;
  name: string;
  email: string;
  lives: number;
  maxLives: number;
  isHalfDay: boolean;
  isOnBreak: boolean;
  lastReplyAt: string | null;
  lastDeductionAt: string | null;
  checkInTime: string | null;
  minutesUntilDeduction: number | null;
}

/**
 * Admin adjustment result
 */
export interface AdjustLivesResult {
  userId: string;
  previousLives: number;
  newLives: number;
  isHalfDay: boolean;
  historyId: string;
}

/**
 * Hook for managing lives system
 */
export function useLives() {
  const [livesStatus, setLivesStatus] = useState<LivesStatus | null>(null);
  const [allStaffLives, setAllStaffLives] = useState<StaffLivesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current lives status (for staff)
   */
  const fetchLivesStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/lives");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch lives status");
      }

      setLivesStatus(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all staff lives status (for admin)
   */
  const fetchAllStaffLives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/lives");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch staff lives");
      }

      setAllStaffLives(data.data || []);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adjust lives for a staff member (admin only)
   */
  const adjustLives = useCallback(async (
    userId: string,
    action: "give" | "remove",
    amount: number,
    reason: string
  ): Promise<AdjustLivesResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/lives/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, amount, reason }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to adjust lives");
      }

      // Refresh staff list after adjustment
      await fetchAllStaffLives();

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchAllStaffLives]);

  /**
   * Calculate warning level based on remaining lives
   */
  const getWarningLevel = useCallback((lives: number): "normal" | "warning" | "danger" => {
    if (lives <= 1) return "danger";
    if (lives <= 2) return "warning";
    return "normal";
  }, []);

  /**
   * Format countdown time for display
   */
  const formatCountdown = useCallback((minutes: number | null): string => {
    if (minutes === null) return "--:--";
    if (minutes <= 0) return "DEDUCTING...";
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes % 1) * 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Auto-refresh lives status when checked in
   */
  useEffect(() => {
    if (livesStatus?.isCheckedIn) {
      // Refresh every minute when checked in to keep countdown accurate
      const interval = setInterval(() => {
        fetchLivesStatus();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [livesStatus?.isCheckedIn, fetchLivesStatus]);

  return {
    // Data
    livesStatus,
    allStaffLives,
    loading,
    error,

    // Actions
    fetchLivesStatus,
    fetchAllStaffLives,
    adjustLives,

    // Helpers
    getWarningLevel,
    formatCountdown,

    // Derived state
    isHalfDay: livesStatus?.isHalfDay || false,
    minutesUntilDeduction: livesStatus?.minutesUntilDeduction || null,
    canLoseLife: livesStatus?.isCheckedIn && (livesStatus?.lives || 0) > 0,
  };
}

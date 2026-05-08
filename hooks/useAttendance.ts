"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Attendance data interface
 */
export interface AttendanceData {
  id?: string;
  status: "checked-in" | "checked-out" | "absent" | "on-break";
  checkInTime: Date | null;
  checkOutTime: Date | null;
  totalWorkingHours: number;
  formattedWorkingHours: string;
  remainingTime: number;
  formattedRemainingTime: string;
  isOnBreak: boolean;
  breaks: Array<{
    startTime: Date;
    endTime?: Date;
    duration: number;
    reason?: string;
  }>;
  notes: string;
}

/**
 * Hook for managing attendance state and API calls
 */
export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch today's attendance status
   */
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch attendance");
      }

      setAttendance(data.data);
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
   * Check in for the day
   */
  const checkIn = useCallback(async (notes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to check in");
      }

      setAttendance(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check out for the day
   */
  const checkOut = useCallback(async (notes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to check out");
      }

      setAttendance(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle break (start or end)
   */
  const toggleBreak = useCallback(async (reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to manage break");
      }

      // Refresh attendance data to get full updated state
      await fetchAttendance();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAttendance]);

  /**
   * Check if user is currently checked in
   */
  const isCheckedIn = attendance?.status === "checked-in" || attendance?.status === "on-break";

  /**
   * Get remaining time in seconds
   */
  const getRemainingSeconds = useCallback(() => {
    if (!attendance || attendance.status !== "checked-in") {
      return 4 * 60 * 60; // 4 hours default
    }

    const fourHours = 4 * 60 * 60;
    const worked = attendance.totalWorkingHours;
    return Math.max(0, fourHours - worked);
  }, [attendance]);

  // Load attendance on mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    isCheckedIn,
    checkIn,
    checkOut,
    toggleBreak,
    fetchAttendance,
    getRemainingSeconds,
  };
}

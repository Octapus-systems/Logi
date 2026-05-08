"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Simplified attendance data interface - tracks check-in time and break status
 */
export interface AttendanceData {
  id?: string;
  status: "checked-in" | "checked-out" | "absent";
  checkInTime: Date | null;
  isOnBreak: boolean;
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
   * Check if user is currently checked in
   */
  const isCheckedIn = attendance?.status === "checked-in";

  /**
   * Check if user is currently on break
   */
  const isOnBreak = attendance?.isOnBreak || false;

  /**
   * Start a break
   */
  const startBreak = useCallback(async (remainingSeconds?: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", remainingSeconds }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to start break");
      }

      setAttendance((prev) => prev ? { ...prev, isOnBreak: true } : null);
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
   * End a break
   */
  const endBreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to end break");
      }

      setAttendance((prev) => prev ? { ...prev, isOnBreak: false } : null);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load attendance on mount and poll every 30 seconds
  useEffect(() => {
    fetchAttendance();

    const interval = setInterval(() => {
      fetchAttendance();
    }, 30000); // 30 seconds poll

    return () => clearInterval(interval);
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    isCheckedIn,
    isOnBreak,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    fetchAttendance,
  };
}

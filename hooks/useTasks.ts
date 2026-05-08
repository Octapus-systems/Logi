"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Task interface matching API response
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "stuck" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  lockedAt?: string;
  totalTimeSpent: number;
  isTimerRunning: boolean;
  timeElapsed: number;
  replies: Array<{
    content: string;
    createdAt: string;
    updatedAt?: string;
  }>;
}

/**
 * Hook for managing tasks
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  /**
   * Fetch tasks from API
   */
  const fetchTasks = useCallback(async (page = 1, limit = 10, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.append("status", status);

      const response = await fetch(`/api/v1/tasks?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch tasks");
      }

      setTasks(data.data);
      setPagination(data.pagination);
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
   * Start task timer
   */
  const startTimer = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "start" }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to start timer");
      }

      // Update local task state - status is now manually controlled
      // Also ensure all other tasks have their timers stopped
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              isTimerRunning: true,
              timeElapsed: data.data.currentElapsed,
            };
          } else if (task.isTimerRunning) {
            return {
              ...task,
              isTimerRunning: false,
              // We don't have the exact totalTimeSpent for the auto-stopped task here,
              // but it will be refreshed on next fetch or we can estimate it.
              // For now, just stopping the visual timer is most important.
            };
          }
          return task;
        })
      );

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
   * Stop task timer
   */
  const stopTimer = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "stop" }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to stop timer");
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                isTimerRunning: false,
                totalTimeSpent: data.data.totalTimeSpent,
                timeElapsed: data.data.currentElapsed,
              }
            : task
        )
      );

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
   * Update task status
   */
  const updateTaskStatus = useCallback(async (taskId: string, status: Task["status"]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update task");
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: data.data.status,
                startedAt: data.data.startedAt,
                completedAt: data.data.completedAt,
              }
            : task
        )
      );

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
   * Add reply to task
   */
  const addReply = useCallback(async (taskId: string, content: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to add reply");
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, replies: data.data.replies } : task
        )
      );

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
   * Format time elapsed to HH:MM:SS
   */
  const formatTimeElapsed = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Get active task count
   */
  const activeTaskCount = tasks.filter(
    (t) => t.status === "in-progress" || t.status === "todo"
  ).length;

  /**
   * Get done task count for TODAY
   */
  const doneTaskCount = tasks.filter((t) => {
    if (t.status !== "done" || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return (
      completedDate.getDate() === today.getDate() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
    );
  }).length;

  return {
    tasks,
    loading,
    error,
    pagination,
    activeTaskCount,
    doneTaskCount,
    fetchTasks,
    startTimer,
    stopTimer,
    updateTaskStatus,
    addReply,
    formatTimeElapsed,
  };
}

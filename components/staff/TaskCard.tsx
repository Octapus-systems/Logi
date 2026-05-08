"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onToggleTimer: (taskId: string) => void;
  onAddReply?: (taskId: string, content: string) => void;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  loading?: boolean;
}

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get priority color
 */
function getPriorityColor(priority: Task["priority"]): string {
  switch (priority) {
    case "urgent":
      return "text-red-400";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-yellow-400";
    default:
      return "text-green-400";
  }
}

/**
 * Get status badge style
 */
function getStatusBadge(status: Task["status"]): { text: string; className: string } {
  switch (status) {
    case "in-progress":
      return {
        text: "In Progress",
        className: "bg-primary/10 text-primary border-l-4 border-l-primary",
      };
    case "stuck":
      return {
        text: "Stuck",
        className: "bg-red-500/10 text-red-400 border-l-4 border-l-red-500",
      };
    case "done":
      return {
        text: "Done",
        className: "bg-green-500/10 text-green-400 border-l-4 border-l-green-500",
      };
    default:
      return {
        text: "To do",
        className: "bg-surface-container-highest text-outline",
      };
  }
}

/**
 * Status options for dropdown
 */
const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "stuck", label: "Stuck" },
  { value: "done", label: "Done" },
];

export function TaskCard({ task, onToggleTimer, onAddReply, onStatusChange, loading = false }: TaskCardProps) {
  const [statusUpdate, setStatusUpdate] = useState("");
  const [displayTime, setDisplayTime] = useState(task.timeElapsed);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const isActive = task.status === "in-progress";
  const statusBadge = getStatusBadge(task.status);
  const priorityColor = getPriorityColor(task.priority);

  /**
   * Handle status change
   */
  const handleStatusChange = async (newStatus: Task["status"]) => {
    // Stop timer if status changes to 'done' and timer is running
    if (newStatus === "done" && task.isTimerRunning) {
      await onToggleTimer(task.id);
    }
    
    if (onStatusChange && newStatus !== task.status) {
      onStatusChange(task.id, newStatus);
    }
    setIsStatusDropdownOpen(false);
  };

  // Update display time when task timeElapsed changes
  useEffect(() => {
    setDisplayTime(task.timeElapsed);
  }, [task.timeElapsed]);

  // Countdown/up effect when timer is running
  useEffect(() => {
    if (!task.isTimerRunning) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.isTimerRunning]);

  /**
   * Handle reply submission
   */
  const handleReply = useCallback(() => {
    if (!statusUpdate.trim() || !onAddReply) return;
    onAddReply(task.id, statusUpdate.trim());
    setStatusUpdate("");
  }, [statusUpdate, task.id, onAddReply]);

  return (
    <div
      className={`glass-card p-4 sm:p-6 rounded-2xl space-y-4 transition-all hover:bg-white/10 ${
        isActive ? "bg-white/5" : "opacity-80 hover:opacity-100"
      } ${statusBadge.className}`}
    >
      <div className="flex flex-col gap-4">
        {/* Task Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown - Disabled for Done tasks */}
            <div className="relative">
              <button
                onClick={() => task.status !== "done" && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                disabled={loading || !onStatusChange || task.status === "done"}
                className={`text-caps-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:opacity-80 disabled:opacity-50 ${statusBadge.className} ${task.status === "done" ? "cursor-not-allowed" : ""}`}
              >
                {statusBadge.text}
                {task.status === "done" ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                )}
              </button>

              {isStatusDropdownOpen && task.status !== "done" && (
                <div className="absolute top-full left-0 mt-1 bg-surface-container-high border border-white/10 rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-caps-xs hover:bg-white/5 transition-colors ${
                        task.status === option.value ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className={`text-caps-xs ${priorityColor}`}>
              • {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-semibold text-on-surface">{task.title}</h3>
          <p className="text-sm sm:text-base text-on-surface-variant">
            {task.description}
          </p>

          {/* Assigned By */}
          <p className="text-caps-xs text-outline">
            Assigned by: {task.assignedBy?.name || "Admin"}
          </p>
        </div>

        {/* Timer Section — full width on mobile */}
        <div className="flex items-center justify-between gap-3">
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border flex-1 ${
              isActive ? "bg-black/40 border-white/5" : "bg-black/20 border-white/5"
            }`}
          >
            <span
              className={`font-mono text-lg sm:text-2xl font-bold tabular-nums ${
                isActive ? "text-primary-container" : "text-outline"
              }`}
            >
              {formatTime(displayTime)}
            </span>
            <button
              onClick={() => onToggleTimer(task.id)}
              disabled={loading || task.status === "done"}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ml-auto ${
                task.isTimerRunning
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "border border-white/20 text-on-surface hover:bg-primary/20 hover:border-primary"
              }`}
            >
              {task.isTimerRunning ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Total Time Spent */}
        <p className="text-xs text-outline text-right">
          Total: {formatTime(task.totalTimeSpent + (task.isTimerRunning ? displayTime - task.timeElapsed : 0))}
        </p>
      </div>

      {/* Replies Section */}
      {task.replies && task.replies.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-caps-xs text-outline">Updates:</p>
          {task.replies.map((reply, index) => (
            <div key={index} className="bg-surface-container-high/50 rounded-xl px-4 py-2">
              <p className="text-body-sm text-on-surface">{reply.content}</p>
              <p className="text-caps-xs text-outline mt-1">
                {new Date(reply.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Input - Only for non-done tasks */}
      {task.status !== "done" && (
        <div className="flex gap-3 mt-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              placeholder="Add a status update..."
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-body-md text-on-surface focus:border-primary-container focus:ring-0 placeholder:text-outline transition-colors outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
            />
          </div>
          <button
            onClick={handleReply}
            disabled={loading || !statusUpdate.trim() || !onAddReply}
            className="px-6 rounded-xl bg-surface-container-high border border-white/10 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

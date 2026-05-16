"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Trash2,
} from "lucide-react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: {
      _id: string;
      name: string;
      email: string;
    } | null;
    scheduledFor?: string;
    isScheduled: boolean;
    createdAt: string;
    completedAt?: string;
    totalTimeSpent: number;
    timeElapsed: number;
    replies: Array<{
      content: string;
      createdAt: string;
    }>;
  };
  onDelete?: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  todo: {
    label: "To Do",
    color: "text-on-surface-variant",
    bg: "bg-white/5",
    dot: "bg-on-surface-variant",
  },
  "in-progress": {
    label: "In Progress",
    color: "text-tertiary",
    bg: "bg-tertiary/10",
    dot: "bg-tertiary",
  },
  stuck: {
    label: "Stuck",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
  },
  done: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
};

const priorityConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    color: "text-on-surface-variant",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  medium: {
    label: "Medium",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  high: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  urgent: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const lastReply =
    task.replies && task.replies.length > 0
      ? task.replies[task.replies.length - 1]
      : null;

  return (
    <div
      className={`group glass-card rounded-2xl border transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${
        task.isScheduled
          ? "border-primary/15 bg-primary/[0.02]"
          : "border-white/5"
      }`}
    >
      {/* Main Content — always visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        tabIndex={0}
        role="button"
        className="w-full text-left p-4 sm:p-5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Title & meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Priority Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priority.bg} ${priority.color} ${priority.border}`}
              >
                {task.priority === "urgent" && (
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                )}
                {priority.label}
              </span>

              {/* Scheduled Badge */}
              {task.isScheduled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                  <Calendar className="w-2.5 h-2.5" />
                  Scheduled
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm sm:text-base font-bold text-on-surface truncate group-hover:text-white transition-colors">
              {task.title}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Assigned Staff */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-on-surface-variant" />
                </div>
                <span className="text-xs text-on-surface-variant">
                  {task.assignedTo?.name || "Unassigned"}
                </span>
              </div>

              {/* Schedule / Created Date */}
              <div className="flex items-center gap-1.5 text-xs text-outline">
                <Calendar className="w-3 h-3" />
                <span>
                  {task.isScheduled && task.scheduledFor
                    ? formatDateTime(task.scheduledFor)
                    : formatDate(task.createdAt)}
                </span>
              </div>

              {/* Time Spent */}
              {task.timeElapsed > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-outline">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">
                    {formatTime(task.timeElapsed)}
                  </span>
                </div>
              )}

              {/* Reply count */}
              {task.replies && task.replies.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-outline">
                  <MessageSquare className="w-3 h-3" />
                  <span>
                    {task.replies.length}{" "}
                    {task.replies.length === 1 ? "reply" : "replies"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status + Expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dot} ${task.status === "in-progress" ? "animate-pulse" : ""}`}
              />
              {status.label}
            </span>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all group/delete"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4 transition-transform group-hover/delete:scale-110" />
              </button>
            )}

            {/* Expand Arrow */}
            <div className="text-on-surface-variant">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/5 px-4 sm:px-5 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Description */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
              Description
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                Assigned To
              </p>
              <p className="text-sm text-on-surface font-medium">
                {task.assignedTo?.name || "Unassigned"}
              </p>
              <p className="text-[10px] text-outline truncate">
                {task.assignedTo?.email || "—"}
              </p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                Time Spent
              </p>
              <p className="text-sm text-on-surface font-mono font-medium">
                {formatTime(task.timeElapsed)}
              </p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                Created
              </p>
              <p className="text-sm text-on-surface font-medium">
                {formatDate(task.createdAt)}
              </p>
            </div>
            {task.scheduledFor && (
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                  Scheduled For
                </p>
                <p className="text-sm text-on-surface font-medium">
                  {formatDateTime(task.scheduledFor)}
                </p>
              </div>
            )}
            {task.completedAt && (
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                  Completed
                </p>
                <p className="text-sm text-on-surface font-medium">
                  {formatDateTime(task.completedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Latest Reply */}
          {lastReply && (
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
                Latest Reply
              </p>
              <p className="text-sm text-on-surface-variant italic leading-relaxed">
                &ldquo;{lastReply.content}&rdquo;
              </p>
              <p className="text-[10px] text-outline mt-1">
                {formatDateTime(lastReply.createdAt)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

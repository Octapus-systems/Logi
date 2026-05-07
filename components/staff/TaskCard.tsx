"use client";

import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "pending" | "completed";
  priority: number;
  timeElapsed: string;
  isTimerRunning: boolean;
}

interface TaskCardProps {
  task: Task;
  onToggleTimer: () => void;
}

export function TaskCard({ task, onToggleTimer }: TaskCardProps) {
  const [statusUpdate, setStatusUpdate] = useState("");

  const isActive = task.status === "in-progress";

  return (
    <div
      className={`glass-card p-6 rounded-2xl space-y-4 transition-all hover:bg-white/10 ${
        isActive ? "border-l-4 border-l-primary bg-white/5" : "opacity-80 hover:opacity-100"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Task Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-caps-xs px-2 py-1 rounded-full ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-highest text-outline"
              }`}
            >
              {isActive ? "In Progress" : "Pending"}
            </span>
            <span className="text-outline-variant text-caps-xs">
              • Priority {task.priority}
            </span>
          </div>
          <h3 className="text-h3 text-on-surface">{task.title}</h3>
          <p className="text-body-md text-on-surface-variant max-w-xl">
            {task.description}
          </p>
        </div>

        {/* Timer Section */}
        <div className="flex flex-col items-end gap-2">
          <div
            className={`flex items-center gap-4 px-6 py-2 rounded-xl border ${
              isActive ? "bg-black/40 border-white/5" : "bg-black/20 border-white/5"
            }`}
          >
            <span
              className={`font-mono text-h3 font-bold ${
                isActive ? "text-primary-container" : "text-outline"
              }`}
            >
              {task.timeElapsed}
            </span>
            <button
              onClick={onToggleTimer}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-90 ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "border border-white/20 text-on-surface hover:bg-primary/20 hover:border-primary"
              }`}
            >
              {task.isTimerRunning ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Update Input - Only for active tasks */}
      {isActive && (
        <div className="flex gap-3 mt-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              placeholder="Add a status update..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-body-md text-on-surface focus:border-primary-container focus:ring-0 placeholder:text-outline transition-colors outline-none"
            />
          </div>
          <button className="px-6 rounded-xl bg-surface-container-high border border-white/10 text-on-surface hover:bg-white/10 transition-colors flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

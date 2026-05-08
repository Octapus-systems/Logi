"use client";

import { useMemo, useState } from "react";
import { CheckInButton } from "@/components/staff/CheckInButton";
import { TaskCard } from "@/components/staff/TaskCard";
import { PerformanceInsight } from "@/components/staff/PerformanceInsight";
import { StreakCard } from "@/components/staff/StreakCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "pending" | "completed";
  priority: number;
  timeElapsed: string;
  isTimerRunning: boolean;
}

export default function StaffDashboard() {
  // TODO: replace with real API data
  const [tasks, setTasks] = useState<Task[]>([]);

  const activeTaskCount = useMemo(
    () => tasks.filter((t) => t.status === "in-progress" || t.status === "pending").length,
    [tasks]
  );

  const toggleTimer = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, isTimerRunning: !task.isTimerRunning } : task
      )
    );
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Hero Action Section */}
      <section className="flex flex-col items-center text-center space-y-6">
        <CheckInButton />
        <div className="glass-card px-8 py-4 rounded-2xl inline-flex items-center gap-4 border border-white/10">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
          </svg>
          <p className="text-body-lg text-on-surface">
            You have <span className="font-bold text-primary">{activeTaskCount} tasks</span> today
          </p>
        </div>
      </section>

      {/* Task List Canvas */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-on-surface">Daily Queue</h2>
          <span className="text-caps-xs text-outline px-4 py-1 border border-white/10 rounded-full">
            {currentDate}
          </span>
        </div>

        {tasks.length === 0 ? (
          <EmptyState title="No data now" description="No tasks assigned yet." />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleTimer={() => toggleTimer(task.id)}
              />
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="md:col-span-2">
            <PerformanceInsight />
          </div>
          <StreakCard days={0} />
        </div>
      </section>
    </div>
  );
}

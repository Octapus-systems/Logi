"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckInButton } from "@/components/staff/CheckInButton";
import { TaskCard } from "@/components/staff/TaskCard";
import { PerformanceInsight } from "@/components/staff/PerformanceInsight";
import { StreakCard } from "@/components/staff/StreakCard";
import { LivesCounter } from "@/components/staff/LivesCounter";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAttendance } from "@/hooks/useAttendance";
import { useTasks } from "@/hooks/useTasks";

export default function StaffDashboard() {
  const { isCheckedIn, attendance } = useAttendance();
  const {
    tasks,
    loading,
    error,
    activeTaskCount,
    doneTaskCount,
    fetchTasks,
    startTimer,
    stopTimer,
    updateTaskStatus,
    addReply,
    formatTimeElapsed,
  } = useTasks();
  const [isCheckInComplete, setIsCheckInComplete] = useState(false);

  /**
   * Handle check-in status change
   */
  const handleCheckInStatusChange = useCallback((checkedIn: boolean) => {
    setIsCheckInComplete(checkedIn);
    if (checkedIn) {
      // Refresh tasks after check-in
      fetchTasks();
    }
  }, [fetchTasks]);

  /**
   * Handle task timer toggle
   */
  const handleToggleTimer = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.isTimerRunning) {
      await stopTimer(taskId);
    } else {
      await startTimer(taskId);
    }
  }, [tasks, startTimer, stopTimer]);

  /**
   * Handle adding reply to task
   */
  const handleAddReply = useCallback(async (taskId: string, content: string) => {
    await addReply(taskId, content);
  }, [addReply]);

  /**
   * Handle task status change
   */
  const handleStatusChange = useCallback(async (taskId: string, status: "todo" | "in-progress" | "stuck" | "done") => {
    await updateTaskStatus(taskId, status);
  }, [updateTaskStatus]);

  // Initial task load on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Synchronize check-in status and refresh tasks
  useEffect(() => {
    if (isCheckedIn) {
      setIsCheckInComplete(true);
      fetchTasks();
    }
  }, [isCheckedIn, fetchTasks]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Hero Action Section */}
      {attendance?.status !== "checked-out" && (
        <section className="flex flex-col items-center text-center space-y-6">
          <CheckInButton 
            onStatusChange={handleCheckInStatusChange} 
            doneTaskCount={doneTaskCount}
          />
          
          {/* Lives Counter - Shows when checked in */}
          {isCheckedIn && (
            <div className="w-full max-w-xs">
              <LivesCounter />
            </div>
          )}
          
          {/* Task Count - Always visible */}
          <div className="glass-card px-8 py-4 rounded-2xl inline-flex items-center gap-4 border border-white/10">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
            </svg>
            <p className="text-body-lg text-on-surface">
              You have <span className="font-bold text-primary">{activeTaskCount} tasks</span> today
            </p>
          </div>

          {/* Check-in required message */}
          {!isCheckInComplete && (
            <p className="text-body-md text-outline max-w-md">
              Check in to see your assigned tasks and start working.
            </p>
          )}

        </section>
      )}

      {/* Task List Canvas - Only visible after check-in */}
      {isCheckInComplete && attendance?.status !== "checked-out" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-on-surface">Daily Queue</h2>
            <span className="text-caps-xs text-outline px-4 py-1 border border-white/10 rounded-full">
              {currentDate}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-outline">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading tasks...</span>
              </div>
            </div>
          ) : error ? (
            <EmptyState 
              title="Error loading tasks" 
              description={error} 
            />
          ) : tasks.length === 0 ? (
            <EmptyState title="No tasks today" description="No tasks assigned yet. Enjoy your free time!" />
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleTimer={handleToggleTimer}
                  onAddReply={handleAddReply}
                  onStatusChange={handleStatusChange}
                  loading={loading}
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
      )}

      {/* Checked Out Message */}
      {attendance?.status === "checked-out" && (
        <section className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-h2 text-on-surface">You have checked out for today.</h2>
          <p className="text-body-lg text-outline text-center max-w-md">
            Your work is complete. You have officially finished your work for the day.
          </p>
          <div className="glass-card px-8 py-4 rounded-2xl border border-white/10 mt-8">
            <p className="text-body-md text-on-surface/70">
              Only an admin can allow you to check back in if this was an accident.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Calendar, CheckCircle, Heart } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { EmptyState } from "@/components/ui/EmptyState";
import { getISTTodayRange } from "@/lib/dateUtils";

interface AttendanceRecord {
  date: string;
  lives: number;
  maxLives: number;
  status: string;
}

export default function StaffTasksPage() {
  const {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    formatTimeElapsed,
    moveToToday,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Fetch tasks
  const loadTasks = useCallback(async (tab: "pending" | "completed", page: number) => {
    setIsRefreshing(true);
    if (tab === "pending") {
      // past=true, pending=true
      await fetchTasks(page, 10, undefined, false, true, true);
    } else {
      // past=true, status="done"
      await fetchTasks(page, 10, "done", false, true, false);
    }
    setIsRefreshing(false);
  }, [fetchTasks]);

  const loadAttendanceHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/attendance/history");
      const data = await response.json();
      if (data.success) {
        setAttendanceHistory(data.data);
      }
    } catch (err) {
      console.error("Failed to load attendance history", err);
    }
  }, []);

  useEffect(() => {
    loadTasks(activeTab, activeTab === "pending" ? pendingPage : completedPage);
  }, [activeTab, pendingPage, completedPage, loadTasks]);

  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  const handleMoveToToday = async (taskId: string) => {
    try {
      await moveToToday(taskId);
      showToast("Task moved to today's queue successfully!");
    } catch (err: any) {
      showToast("Failed to move task: " + err.message);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Group tasks
  const pastTasks = useMemo(() => {
    const { start } = getISTTodayRange();
    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt);
      return taskDate.getTime() < start.getTime();
    });
  }, [tasks]);

  const pastPendingTasks = useMemo(() => {
    return pastTasks.filter(t => t.status !== "done");
  }, [pastTasks]);

  const pastCompletedTasks = useMemo(() => {
    return pastTasks.filter(t => t.status === "done");
  }, [pastTasks]);

  // Group completed tasks by date
  const groupedCompletedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    pastCompletedTasks.forEach(task => {
      const dateStr = new Date(task.completedAt || task.createdAt).toLocaleDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });
    // Sort keys descending
    return Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => {
      // Find matching attendance record to get lives
      const historyRecord = attendanceHistory.find(
        (record) => new Date(record.date).toLocaleDateString() === date
      );
      
      return {
        date,
        tasks: groups[date],
        totalTime: groups[date].reduce((acc, t) => acc + t.totalTimeSpent, 0),
        lives: historyRecord?.lives,
        maxLives: historyRecord?.maxLives || 4
      };
    });
  }, [pastCompletedTasks, attendanceHistory]);

  const renderPagination = () => {
    // Show pagination even if there's only 1 page, so the user can see it exists
    if (!pagination || pagination.totalPages === 0) return null;

    const currentPage = activeTab === "pending" ? pendingPage : completedPage;
    const setPage = activeTab === "pending" ? setPendingPage : setCompletedPage;

    return (
      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          className="px-4 py-2 rounded-lg border border-white/10 text-on-surface hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-outline">
          Page {currentPage} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
          disabled={currentPage === pagination.totalPages || loading}
          className="px-4 py-2 rounded-lg border border-white/10 text-on-surface hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-400";
      case "high": return "text-orange-400";
      case "medium": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-surface-container-highest border border-white/10 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary" />
            <p className="text-on-surface font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-4">
            <Link
              href="/staff/dashboard"
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-h2 text-on-surface">Task History & Reports</h1>
          <p className="text-body-lg text-outline">View your past work and pending items.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-outline hover:text-on-surface"
          }`}
        >
          Pending Tasks {activeTab === "pending" && `(${pagination.total})`}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "completed"
              ? "border-primary text-primary"
              : "border-transparent text-outline hover:text-on-surface"
          }`}
        >
          Completed Reports
        </button>
      </div>

      {(loading && !isRefreshing) ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <EmptyState title="Error loading tasks" description={error} />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === "pending" && (
            <div className="space-y-4">
              {pastPendingTasks.length === 0 ? (
                <EmptyState title="No pending tasks" description="You have no pending tasks from past days." />
              ) : (
                pastPendingTasks.map(task => (
                  <div key={task.id} className="glass-card p-6 rounded-2xl border border-white/10 relative hover:bg-white/5 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 text-caps-xs">
                          <span className="flex items-center gap-1.5 text-outline bg-surface-container-highest px-3 py-1 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.createdAt).toLocaleDateString(undefined, {
                              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          <span className="text-outline">Assigned by: {task.assignedBy?.name || "Admin"}</span>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-on-surface mt-2">{task.title}</h3>
                        <p className="text-on-surface-variant text-sm mt-1">{task.description}</p>
                        
                        <p className="text-xs text-outline mt-4 font-mono">
                          Current logged time: {formatTimeElapsed(task.totalTimeSpent)}
                        </p>
                      </div>

                      <div className="sm:ml-auto pt-2 sm:pt-0 shrink-0">
                        <button
                          onClick={() => handleMoveToToday(task.id)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/5"
                        >
                          <Calendar className="w-4 h-4" />
                          Add to Today
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="space-y-8">
              {groupedCompletedTasks.length === 0 ? (
                <EmptyState title="No reports available" description="No completed tasks found in the history." />
              ) : (
                groupedCompletedTasks.map(group => (
                  <div key={group.date} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                    <div className="bg-white/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10">
                      <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {group.date}
                      </h3>
                      
                      <div className="flex items-center gap-3">
                        {/* Lives counter for that day */}
                        {group.lives !== undefined && (
                          <div className="flex items-center gap-1.5 text-sm font-medium bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20">
                            <Heart className="w-4 h-4 fill-current" />
                            <span>{group.lives}/{group.maxLives}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-outline font-medium bg-surface px-3 py-1.5 rounded-full border border-white/10">
                          <Clock3 className="w-4 h-4 text-primary" />
                          Total: {formatTimeElapsed(group.totalTime)}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {group.tasks.map(task => (
                        <div key={task.id} className="bg-surface/50 rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <h4 className="text-on-surface font-medium">{task.title}</h4>
                            <p className="text-outline text-sm mt-1">{task.description.substring(0, 100)}{task.description.length > 100 ? "..." : ""}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20 flex items-center gap-1.5`}>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Done
                            </span>
                            <span className="text-outline text-sm font-mono font-medium">
                              {formatTimeElapsed(task.totalTimeSpent)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {renderPagination()}
        </div>
      )}
    </div>
  );
}

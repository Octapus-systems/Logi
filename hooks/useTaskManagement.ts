"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
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
  scheduledFor?: string;
  isScheduled: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  totalTimeSpent: number;
  isTimerRunning: boolean;
  timeElapsed: number;
  replies: Array<{
    content: string;
    createdAt: string;
    updatedAt?: string;
  }>;
}

export type TaskFilter =
  | "all"
  | "pending"
  | "in-progress"
  | "stuck"
  | "done"
  | "scheduled";

interface UseTaskManagementOptions {
  initialFilter?: TaskFilter;
}

export function useTaskManagement(options?: UseTaskManagementOptions) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(
    options?.initialFilter || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD
  const [allStaff, setAllStaff] = useState<Array<{ id: string; name: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    scheduled: 0,
    active: 0,
    stuck: 0,
    done: 0,
  });
  const itemsPerPage = 12;

  // Fetch all staff members for filter dropdown
  const fetchStaff = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/users");
      const result = await response.json();
      if (result.success) {
        setAllStaff(
          result.data.map((u: any) => ({ id: u._id, name: u.name }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch staff for filters:", err);
    }
  }, []);

  // Dispatch scheduled tasks on mount
  const dispatchScheduledTasks = useCallback(async () => {
    try {
      await fetch("/api/v1/tasks/dispatch", { method: "POST" });
    } catch (err) {
      console.error("Failed to dispatch scheduled tasks:", err);
    }
  }, []);

  // Fetch tasks based on current filters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      // Determine API filter params based on active filter
      if (filter === "scheduled") {
        params.set("scheduled", "true");
      } else if (filter === "pending") {
        params.set("pending", "true");
      } else if (filter === "all") {
        params.set("all", "true");
      } else {
        // Specific status filter (in-progress, stuck, done)
        params.set("all", "true");
        params.set("status", filter);
      }

      // Add search/priority/staff/date filters to API call
      if (searchQuery) params.set("search", searchQuery);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (staffFilter !== "all") params.set("assignedTo", staffFilter);
      if (dateFilter) params.set("date", dateFilter);

      const response = await fetch(`/api/v1/tasks?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.total || 0);
        if (result.statusCounts) {
          setStatusCounts(result.statusCounts);
        }
      } else {
        throw new Error(result.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filter, currentPage, itemsPerPage, searchQuery, priorityFilter, staffFilter, dateFilter]);

  // Filtered tasks are now primarily handled server-side, 
  // but we keep the variable for compatibility with existing components
  const filteredTasks = tasks;

  // Use the fetched staff list for the dropdown
  const uniqueStaff = allStaff;

  // statusCounts is now state updated by API response

  // Dispatch on mount, then fetch
  useEffect(() => {
    fetchStaff();
    dispatchScheduledTasks().then(() => fetchTasks());
  }, []);

  // Re-fetch when filter or page changes
  useEffect(() => {
    fetchTasks();
  }, [filter, currentPage, searchQuery, priorityFilter, staffFilter, dateFilter]);

  const deleteTask = async (taskId: string) => {
    const result = await Swal.fire({
      title: "Delete Task?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      background: "#121212",
      color: "#ffffff",
      width: "300px",
      padding: "1.5rem",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-[24px] border border-white/5 shadow-2xl",
        title: "text-base font-bold m-0 p-0",
        htmlContainer: "text-xs text-white/50 mt-2 mb-6 p-0",
        actions: "flex gap-2 w-full m-0 p-0",
        confirmButton: "flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 py-2.5 rounded-xl text-sm font-bold transition-colors",
        cancelButton: "flex-1 bg-white/5 text-white/70 hover:bg-white/10 py-2.5 rounded-xl text-sm font-bold transition-colors",
      }
    });

    if (!result.isConfirmed) return;
    
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        // Optimistically update the UI
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setTotalCount(prev => prev - 1);
        // Refresh full data to keep counts in sync
        fetchTasks();
        
        Swal.fire({
          title: "Deleted",
          icon: "success",
          background: "#121212",
          color: "#ffffff",
          timer: 1500,
          width: "280px",
          showConfirmButton: false,
          customClass: {
            popup: "rounded-[24px] border border-white/5 shadow-2xl",
            title: "text-sm font-bold mt-2",
          }
        });
      } else {
        Swal.fire({
          title: "Error",
          text: result.message || "Failed to delete task",
          icon: "error",
          background: "#121212",
          color: "#ffffff",
          width: "300px",
          buttonsStyling: false,
          customClass: {
            popup: "rounded-[24px] border border-white/5 shadow-2xl",
            title: "text-base font-bold",
            htmlContainer: "text-xs text-white/50 mb-4",
            confirmButton: "w-full bg-white/5 text-white hover:bg-white/10 py-2.5 rounded-xl text-sm font-bold transition-colors",
          }
        });
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      Swal.fire({
        title: "Error",
        text: "An error occurred while deleting the task",
        icon: "error",
        background: "#121212",
        color: "#ffffff",
        width: "300px",
        buttonsStyling: false,
        customClass: {
          popup: "rounded-[24px] border border-white/5 shadow-2xl",
          title: "text-base font-bold",
          htmlContainer: "text-xs text-white/50 mb-4",
          confirmButton: "w-full bg-white/5 text-white hover:bg-white/10 py-2.5 rounded-xl text-sm font-bold transition-colors",
        }
      });
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, priorityFilter, staffFilter, dateFilter]);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    staffFilter,
    setStaffFilter,
    dateFilter,
    setDateFilter,
    uniqueStaff,
    statusCounts,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    deleteTask,
    refreshData: fetchTasks,
  };
}

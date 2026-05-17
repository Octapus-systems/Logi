"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ListChecks,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { TaskCard } from "@/components/admin/TaskCard";
import { TaskHeaderFilters } from "@/components/admin/TaskHeaderFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTaskManagement } from "@/hooks/useTaskManagement";

export default function AdminTasksPage() {
  const {
    tasks,
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
    refreshData,
  } = useTaskManagement({ initialFilter: "all" });

  // Compute summary stats from the statusCounts provided by the hook
  // (Note: In a real app, these should come from the server for all tasks, 
  // not just the current page. But we'll use what we have for now.)
  const summaryStats = [
    {
      label: "Pending Tasks",
      value: statusCounts.pending,
      icon: ListChecks,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/15",
      glow: "shadow-orange-500/5",
    },
    {
      label: "Scheduled",
      value: statusCounts.scheduled,
      icon: CalendarClock,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/15",
      glow: "shadow-primary/5",
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-400 mb-4 font-bold">Error loading tasks</div>
          <p className="text-on-surface-variant mb-4 text-sm">{error}</p>
          <button
            onClick={refreshData}
            className="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/90 text-sm font-bold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-h1 text-on-background mb-1">Task Management</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            {totalCount > 0
              ? `Showing ${totalCount} result${totalCount !== 1 ? "s" : ""}`
              : "No tasks found"}
          </p>
        </div>
        <Link
          href="/admin/tasks/assign"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:shadow-[#8c62ff]/20 active:scale-95 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Assign New Task
        </Link>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`glass-card rounded-2xl border ${stat.border} p-5 shadow-lg ${stat.glow} transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {stat.value}
                </p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Filters at the top */}
      <section>
        <TaskHeaderFilters
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          staffFilter={staffFilter}
          onStaffChange={setStaffFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          uniqueStaff={uniqueStaff}
        />
      </section>

      {/* Main Task List */}
      <div className="min-h-[400px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20 backdrop-blur-[1px] rounded-3xl z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
              Loading Tasks...
            </p>
          </div>
        ) : null}

        {tasks.length === 0 && !loading ? (
          <div className="py-12">
            <EmptyState
              title={
                filter === "all"
                  ? "No Tasks Found"
                  : `No ${filter === "in-progress" ? "In Progress" : filter === "done" ? "Completed" : filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks`
              }
              description={
                filter === "all"
                  ? "No tasks match your current filters. Try adjusting your search or filters."
                  : `There are no tasks matching the "${filter}" status.`
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Task Cards */}
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={() => deleteTask(task.id)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-white/5 px-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  Showing page{" "}
                  <span className="text-on-surface font-bold">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="text-on-surface font-bold">
                    {totalPages}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-white/10 disabled:opacity-30 transition-all border border-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                              currentPage === page
                                ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary"
                                : "bg-surface-container-high text-on-surface hover:bg-white/10 border-white/5"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev: number) =>
                        Math.min(totalPages, prev + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-white/10 disabled:opacity-30 transition-all border border-white/5"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

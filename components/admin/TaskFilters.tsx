"use client";

import {
  Search,
  Filter,
  SlidersHorizontal,
  User,
  ListChecks,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  LayoutList,
} from "lucide-react";
import type { TaskFilter } from "@/hooks/useTaskManagement";

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  staffFilter: string;
  onStaffChange: (staffId: string) => void;
  uniqueStaff: Array<{ id: string; name: string }>;
  statusCounts: Record<string, number>;
}

const filterItems: Array<{
  key: TaskFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "all", label: "All Tasks", icon: LayoutList },
  { key: "pending", label: "Pending", icon: ListChecks },
  { key: "in-progress", label: "Active", icon: Clock },
  { key: "stuck", label: "Stuck", icon: AlertCircle },
  { key: "done", label: "Completed", icon: CheckCircle2 },
  { key: "scheduled", label: "Scheduled", icon: CalendarClock },
];

export function TaskFilters({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  staffFilter,
  onStaffChange,
  uniqueStaff,
  statusCounts,
}: TaskFiltersProps) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-5">
      {/* Search */}
      <div className="bg-surface-container-high/50 rounded-2xl border border-white/5 p-1.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 focus-within:border-primary/30 transition-colors">
          <Search className="w-4 h-4 text-outline flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline w-full"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Status
          </p>
        </div>
        <div className="p-1.5 space-y-0.5">
          {filterItems.map((item) => {
            const isActive = filter === item.key;
            const count = statusCounts[item.key] ?? 0;

            return (
              <button
                key={item.key}
                onClick={() => onFilterChange(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={`text-[10px] font-bold min-w-[20px] text-center rounded-full px-1.5 py-0.5 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-white/5 text-outline"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Priority
          </p>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl border border-white/5 px-3 py-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-outline flex-shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-on-surface font-medium cursor-pointer w-full"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Filter */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Staff Member
          </p>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl border border-white/5 px-3 py-2.5">
            <User className="w-3.5 h-3.5 text-outline flex-shrink-0" />
            <select
              value={staffFilter}
              onChange={(e) => onStaffChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-on-surface font-medium cursor-pointer w-full"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

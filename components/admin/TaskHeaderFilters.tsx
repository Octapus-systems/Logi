"use client";

import {
  Search,
  Filter,
  SlidersHorizontal,
  User,
  Calendar,
  X,
} from "lucide-react";
import type { TaskFilter } from "@/hooks/useTaskManagement";

interface TaskHeaderFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  staffFilter: string;
  onStaffChange: (staffId: string) => void;
  dateFilter: string;
  onDateChange: (date: string) => void;
  uniqueStaff: Array<{ id: string; name: string }>;
}

export function TaskHeaderFilters({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  staffFilter,
  onStaffChange,
  dateFilter,
  onDateChange,
  uniqueStaff,
}: TaskHeaderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-surface-container-high/30 p-3 rounded-2xl border border-white/5">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 focus-within:border-primary/30 transition-all group">
          <Search className="w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline w-full"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="text-outline hover:text-on-surface">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-outline" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as TaskFilter)}
            className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="stuck">Stuck</option>
            <option value="done">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-outline" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Staff Filter */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
          <User className="w-3.5 h-3.5 text-outline" />
          <select
            value={staffFilter}
            onChange={(e) => onStaffChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer max-w-[120px]"
          >
            <option value="all">All Staff</option>
            {uniqueStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
          <Calendar className="w-3.5 h-3.5 text-outline" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer [color-scheme:dark]"
          />
          {dateFilter && (
            <button onClick={() => onDateChange("")} className="text-outline hover:text-on-surface">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

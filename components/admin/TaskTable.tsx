import { useState, useMemo } from "react";
import { 
  Search, 
  User, 
  UserPlus, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";

interface Task {
  id: string;
  name: string;
  priority: string;
  assignedTo: {
    name: string;
    avatar?: string;
    isUnassigned?: boolean;
  };
  status: "in-progress" | "reviewing" | "pending" | "done" | "stuck" | "todo";
  timeSpent: string;
  staffReply: string;
}

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task | 'assignedTo.name'; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique staff members from tasks
  const uniqueStaff = useMemo(() => {
    const staffNames = new Set<string>();
    tasks.forEach(t => {
      if (!t.assignedTo.isUnassigned && t.assignedTo.name) {
        staffNames.add(t.assignedTo.name);
      }
    });
    return Array.from(staffNames).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        task.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.staffReply.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesStaff = staffFilter === "all" || task.assignedTo.name === staffFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesStaff;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, staffFilter]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!sortConfig) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      if (sortConfig.key === 'assignedTo.name') {
        aValue = a.assignedTo.name;
        bValue = b.assignedTo.name;
      } else {
        const key = sortConfig.key as keyof Task;
        aValue = a[key];
        bValue = b[key];
      }

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      const aValStr = typeof aValue === 'string' ? aValue : '';
      const bValStr = typeof bValue === 'string' ? bValue : '';

      if (aValStr < bValStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValStr > bValStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const paginatedTasks = sortedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: keyof Task | 'assignedTo.name') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Task | 'assignedTo.name') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const getStatusBadge = (status: Task["status"]) => {
    const styles = {
      "in-progress": "bg-tertiary/10 text-tertiary",
      reviewing: "bg-primary/10 text-primary",
      pending: "bg-error/10 text-error",
      done: "bg-success/10 text-success",
      stuck: "bg-warning/10 text-warning",
      todo: "bg-surface/10 text-on-surface",
    };

    const labels = {
      "in-progress": "In Progress",
      reviewing: "Reviewing",
      pending: "Pending",
      done: "Completed",
      stuck: "Stuck",
      todo: "To Do",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        <div className="bg-surface-container-high px-4 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 w-full sm:max-w-xs focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant"
            placeholder="Search tasks or staff..."
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Staff Filter */}
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl border border-white/5">
            <User className="w-3.5 h-3.5 text-outline" />
            <select 
              value={staffFilter}
              onChange={(e) => { setStaffFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map(staffName => (
                <option key={staffName} value={staffName}>{staffName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl border border-white/5">
            <Filter className="w-3.5 h-3.5 text-outline" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Completed</option>
              <option value="stuck">Stuck</option>
              <option value="todo">To Do</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-xl border border-white/5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-outline" />
            <select 
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-on-surface font-medium cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block glass-card rounded-3xl overflow-hidden border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th 
                className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-2">
                  Task Name {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => requestSort('assignedTo.name')}
              >
                <div className="flex items-center gap-2">
                  Assigned To {getSortIcon('assignedTo.name')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => requestSort('timeSpent')}
              >
                <div className="flex items-center gap-2">
                  Time Spent {getSortIcon('timeSpent')}
                </div>
              </th>
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Staff Reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="text-label-sm font-bold text-on-surface truncate max-w-[200px]">{task.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{task.priority}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {task.assignedTo.isUnassigned ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                          <UserPlus className="w-3.5 h-3.5 text-on-surface-variant" />
                        </div>
                        <span className="text-label-sm text-outline">Unassigned</span>
                      </>
                    ) : (
                      <>
                        {task.assignedTo.avatar ? (
                          <img
                            alt={task.assignedTo.name}
                            className="w-6 h-6 rounded-full object-cover"
                            src={task.assignedTo.avatar}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                            <User className="w-3.5 h-3.5 text-on-surface-variant" />
                          </div>
                        )}
                        <span className="text-label-sm text-on-surface truncate max-w-[100px]">{task.assignedTo.name}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                <td className="px-6 py-4 font-mono text-label-sm text-on-surface-variant">
                  {task.timeSpent}
                </td>
                <td className="px-6 py-4 text-label-sm italic text-on-surface-variant">
                  <p className="line-clamp-2 max-w-[200px]">&ldquo;{task.staffReply}&rdquo;</p>
                </td>
              </tr>
            ))}
            {paginatedTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                  No tasks found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedTasks.map((task) => (
          <div key={task.id} className="glass-card p-4 rounded-2xl border border-white/5">
            {/* Task Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-3">
                <p className="text-label-sm font-bold text-on-surface mb-1">{task.name}</p>
                <p className="text-[10px] text-on-surface-variant">{task.priority}</p>
              </div>
              {getStatusBadge(task.status)}
            </div>

            {/* Assigned To */}
            <div className="flex items-center gap-2 mb-3">
              {task.assignedTo.isUnassigned ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                    <UserPlus className="w-3.5 h-3.5 text-on-surface-variant" />
                  </div>
                  <span className="text-label-sm text-outline">Unassigned</span>
                </>
              ) : (
                <>
                  {task.assignedTo.avatar ? (
                    <img
                      alt={task.assignedTo.name}
                      className="w-6 h-6 rounded-full object-cover"
                      src={task.assignedTo.avatar}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <User className="w-3.5 h-3.5 text-on-surface-variant" />
                    </div>
                  )}
                  <span className="text-label-sm text-on-surface">{task.assignedTo.name}</span>
                </>
              )}
            </div>

            {/* Time and Reply */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-label-sm text-on-surface-variant">{task.timeSpent}</span>
              </div>
              {task.staffReply && (
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[11px] italic text-on-surface-variant line-clamp-3">
                    &ldquo;{task.staffReply}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {paginatedTasks.length === 0 && (
          <div className="glass-card p-12 text-center text-on-surface-variant text-sm rounded-2xl">
            No tasks found matching your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <p className="text-[10px] sm:text-xs text-on-surface-variant">
            Showing <span className="text-on-surface font-bold">{filteredTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-on-surface font-bold">{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of <span className="text-on-surface font-bold">{filteredTasks.length}</span> tasks
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-on-surface-variant">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-container-high text-xs text-on-surface border border-white/5 rounded-lg px-2 py-1 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-white/10 disabled:opacity-30 transition-colors border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border border-white/5 ${
                    currentPage === page 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary" 
                      : "bg-surface-container-high text-on-surface hover:bg-white/10"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-white/10 disabled:opacity-30 transition-colors border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

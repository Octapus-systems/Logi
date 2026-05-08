"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Heart,
  Filter,
  ArrowUpDown,
  History,
  LayoutGrid,
  List
} from "lucide-react";
import { format, subDays, addDays } from "date-fns";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  department?: string;
  status?: string;
}

interface TaskLog {
  id: string;
  title: string;
  completedAt: string;
  totalTimeSpent: number;
}

interface AttendanceLog {
  staffName: string;
  date: string;
  lives: number;
  totalTasksCleared: number;
  tasks: TaskLog[];
  attendanceStatus: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function AttendancePage() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // List View State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Detail View State
  const [logData, setLogData] = useState<AttendanceLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskSortOrder, setTaskSortOrder] = useState<"asc" | "desc">("desc");
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 5;

  // Fetch Staff List
  useEffect(() => {
    if (view === "list") {
      fetchStaffList();
    }
  }, [view, search, sortBy, sortOrder, page]);

  // Fetch Attendance Log
  useEffect(() => {
    if (view === "detail" && selectedStaff) {
      fetchAttendanceLog();
    }
  }, [view, selectedStaff, selectedDate]);

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "12",
      });
      const res = await fetch(`/api/v1/admin/attendance/staff?${query}`);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch staff list", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceLog = async () => {
    if (!selectedStaff) return;
    setLogLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const query = new URLSearchParams({
        staffId: selectedStaff._id,
        date: dateStr,
      });
      const res = await fetch(`/api/v1/admin/attendance/log?${query}`);
      const data = await res.json();
      if (data.success) {
        setLogData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance log", error);
    } finally {
      setLogLoading(false);
    }
  };

  const handleStaffClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setLogData(null);
  };

  const navigateDate = (days: number) => {
    setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)));
  };

  const livesToHours = (lives: number) => {
    return lives; // 1 life = 1 hour rule
  };

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Client-side task filtering and pagination
  const filteredTasks = logData?.tasks.filter(t => 
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  ).sort((a, b) => {
    const timeA = new Date(a.completedAt).getTime();
    const timeB = new Date(b.completedAt).getTime();
    return taskSortOrder === "asc" ? timeA - timeB : timeB - timeA;
  }) || [];

  const paginatedTasks = filteredTasks.slice(
    (taskPage - 1) * tasksPerPage,
    taskPage * tasksPerPage
  );

  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);

  if (view === "detail" && selectedStaff) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button 
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Staff List
            </button>
            <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Attendance Log
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-sm">
            <button 
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-1.5 flex flex-col items-center min-w-[140px]">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {format(selectedDate, "EEEE")}
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {format(selectedDate, "MMM dd, yyyy")}
              </span>
            </div>
            <button 
              onClick={() => navigateDate(1)}
              disabled={format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#1e1b2e] to-[#161421] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserIcon className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm text-on-surface-variant mb-1">Staff Member</p>
            <h3 className="text-xl font-bold text-on-surface">{selectedStaff.name}</h3>
            <p className="text-xs text-outline-variant mt-1">{selectedStaff.email}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1e1b2e] to-[#161421] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Heart className="w-16 h-16 text-red-500" />
            </div>
            <p className="text-sm text-on-surface-variant mb-1">Daily Summary</p>
            <div className="flex items-end gap-3">
              <div>
                <span className="text-2xl font-bold text-on-surface">{logData?.lives ?? '-'}</span>
                <span className="text-xs text-on-surface-variant ml-1">Lives</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10 mb-1" />
              <div>
                <span className="text-2xl font-bold text-primary">{logData ? livesToHours(logData.lives) : '-'}</span>
                <span className="text-xs text-on-surface-variant ml-1">Hours</span>
              </div>
            </div>
            <p className="text-[10px] text-outline-variant mt-2 uppercase tracking-wider">1 Life = 1 Hour Rule Applied</p>
          </div>

          <div className="bg-gradient-to-br from-[#1e1b2e] to-[#161421] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-sm text-on-surface-variant mb-1">Productivity</p>
            <h3 className="text-2xl font-bold text-on-surface">{logData?.totalTasksCleared ?? '-'}</h3>
            <p className="text-xs text-outline-variant mt-1">Tasks completed today</p>
          </div>
        </div>

        {/* Task List Section */}
        <div className="bg-[#161421] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              Cleared Tasks
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={taskSearch}
                  onChange={(e) => {setTaskSearch(e.target.value); setTaskPage(1);}}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all w-full sm:w-64"
                />
              </div>
              <button 
                onClick={() => setTaskSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                title="Sort by Time"
              >
                <ArrowUpDown className={`w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors ${taskSortOrder === "asc" ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <div className="min-h-[300px]">
            {logLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant animate-pulse">Loading daily log...</p>
              </div>
            ) : paginatedTasks.length > 0 ? (
              <div className="divide-y divide-white/5">
                {paginatedTasks.map((task) => (
                  <div key={task.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Marked as done at {format(new Date(task.completedAt), "hh:mm a")}
                          </p>
                          <p className="text-xs text-primary/80 font-medium flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Time taken: {formatSeconds(task.totalTimeSpent)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-outline-variant bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Completed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-on-surface-variant">
                  <Clock className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1">No tasks found</h3>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  {taskSearch ? "Try adjusting your filter to find what you're looking for." : "No tasks were marked as completed on this day."}
                </p>
              </div>
            )}
          </div>

          {/* Task Pagination */}
          {totalTaskPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Showing {paginatedTasks.length} of {filteredTasks.length} tasks
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={taskPage === 1}
                  onClick={() => setTaskPage(prev => prev - 1)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-on-surface px-2">
                  Page {taskPage} of {totalTaskPages}
                </span>
                <button
                  disabled={taskPage === totalTaskPages}
                  onClick={() => setTaskPage(prev => prev + 1)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Staff Attendance</h1>
          <p className="text-on-surface-variant text-sm">Monitor daily logs, lives, and task history.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#161421] border border-white/10 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => {setSearch(e.target.value); setPage(1);}}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-outline-variant"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
            <button 
              onClick={() => { setSortBy("name"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${sortBy === "name" ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/10"}`}
            >
              Name
              {sortBy === "name" && <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />}
            </button>
            <button 
              onClick={() => { setSortBy("email"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${sortBy === "email" ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/10"}`}
            >
              Email
              {sortBy === "email" && <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />}
            </button>
          </div>
        </div>
      </div>

      {/* Staff Grid/List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-[#161421] border border-white/10 rounded-3xl animate-pulse" />
          ))
        ) : staffList.length > 0 ? (
          staffList.map((staff) => (
            <button
              key={staff._id}
              onClick={() => handleStaffClick(staff)}
              className="group bg-gradient-to-br from-[#1e1b2e] to-[#161421] border border-white/10 rounded-3xl p-6 text-left hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <UserIcon className="w-12 h-12" />
              </div>
              
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                <UserIcon className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors truncate">{staff.name}</h3>
              <p className="text-xs text-on-surface-variant truncate mb-4">{staff.email}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                  Staff Member
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-on-surface-variant opacity-20" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">No staff found</h2>
            <p className="text-on-surface-variant max-w-sm">
              We couldn't find any staff members matching your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-on-surface-variant">
            Page <span className="font-bold text-on-surface">{page}</span> of <span className="font-bold text-on-surface">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 bg-[#161421] border border-white/10 rounded-2xl text-on-surface hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 bg-[#161421] border border-white/10 rounded-2xl text-on-surface hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

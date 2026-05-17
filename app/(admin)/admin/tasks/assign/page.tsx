"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Loader2,
} from "lucide-react";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

export default function AssignTaskPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    assignedTo: [] as string[],
    priority: "medium",
    scheduleMode: "now" as "now" | "later",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    setStaffLoading(true);
    try {
      const response = await fetch("/api/v1/users");
      const result = await response.json();
      if (result.success) {
        setStaffMembers(result.data);
      }
    } catch {
      setError("Failed to load staff members");
    } finally {
      setStaffLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const toggleStaff = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter((s) => s !== id)
        : [...prev.assignedTo, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.taskName.trim()) {
      setError("Task name is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Task description is required");
      return;
    }
    if (formData.assignedTo.length === 0) {
      setError("Please select at least one staff member");
      return;
    }

    // Validate scheduling
    let scheduledFor: string | null = null;
    if (formData.scheduleMode === "later") {
      if (!formData.scheduledDate) {
        setError("Please select a scheduled date");
        return;
      }
      if (!formData.scheduledTime) {
        setError("Please select a scheduled time");
        return;
      }
      // Construct ISO datetime from date + time (IST)
      const dateTimeStr = `${formData.scheduledDate}T${formData.scheduledTime}:00+05:30`;
      const scheduledDate = new Date(dateTimeStr);
      if (scheduledDate.getTime() <= Date.now()) {
        setError("Scheduled time must be in the future");
        return;
      }
      scheduledFor = scheduledDate.toISOString();
    }

    setLoading(true);

    const payload = {
      title: formData.taskName.trim(),
      description: formData.description.trim(),
      priority: formData.priority === "critical" ? "urgent" : formData.priority,
      scheduledFor,
    };

    try {
      const promises = formData.assignedTo.map(async (assignedId) => {
        const res = await fetch("/api/v1/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, assignedTo: assignedId }),
        });
        return res.json();
      });

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        setError(
          `Failed to assign task to ${failed.length} staff member(s). ${failed[0]?.message || ""}`
        );
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/tasks");
        }, 1500);
      }
    } catch {
      setError(
        "Failed to assign task. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date restriction
  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">
          {formData.scheduleMode === "later"
            ? "Task Scheduled!"
            : "Task Assigned!"}
        </h2>
        <p className="text-on-surface-variant text-sm">
          {formData.scheduleMode === "later"
            ? "The task will be sent to staff at the scheduled time."
            : "The task has been sent to the selected staff members."}
        </p>
        <p className="text-outline text-xs mt-3">Redirecting to Tasks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Tasks
        </Link>
        <h1 className="text-h1 text-on-background mb-2">Assign New Task</h1>
        <p className="text-on-surface-variant text-body-md">
          Create and assign a task to your team members
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left Column: Form Fields (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Task Details Card */}
            <div className="glass-card rounded-3xl border border-white/5 p-5 sm:p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                  Task Details
                </p>
              </div>

              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Task Name
                </label>
                <input
                  type="text"
                  value={formData.taskName}
                  onChange={(e) =>
                    setFormData({ ...formData, taskName: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all placeholder:text-outline"
                  placeholder="Enter task name..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all h-32 resize-none placeholder:text-outline"
                  placeholder="Enter task description..."
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "medium", "high", "critical"] as const).map(
                    (priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority })}
                        className={`py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200 ${
                          formData.priority === priority
                            ? priority === "critical"
                              ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10"
                              : priority === "high"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-lg shadow-orange-500/10"
                                : priority === "medium"
                                  ? "bg-primary/20 text-primary border border-primary/40 shadow-lg shadow-primary/10"
                                  : "bg-white/10 text-on-surface border border-white/20"
                            : "bg-white/5 text-on-surface-variant border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {priority}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Scheduling Card */}
            <div className="glass-card rounded-3xl border border-white/5 p-5 sm:p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                  Schedule
                </p>
              </div>

              {/* Schedule Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, scheduleMode: "now" })
                  }
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    formData.scheduleMode === "now"
                      ? "bg-primary/15 text-primary border-primary/30 shadow-lg shadow-primary/10"
                      : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, scheduleMode: "later" })
                  }
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    formData.scheduleMode === "later"
                      ? "bg-primary/15 text-primary border-primary/30 shadow-lg shadow-primary/10"
                      : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10"
                  }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  Schedule
                </button>
              </div>

              {/* Date & Time Pickers — only shown in schedule mode */}
              {formData.scheduleMode === "later" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduledDate: e.target.value,
                        })
                      }
                      min={today}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-2 bg-primary/5 rounded-xl border border-primary/10 px-4 py-3">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-on-surface-variant">
                        The task will be automatically sent to the selected staff
                        at the scheduled date and time (IST). Email notifications
                        will also be sent at that time.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Staff Selection + Actions (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Staff Selection Card */}
            <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-5 sm:p-6 pb-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                  Assign To
                </p>

                {/* Staff Search */}
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 mb-4 focus-within:border-primary/30 transition-colors">
                  <Search className="w-4 h-4 text-outline flex-shrink-0" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline w-full"
                  />
                </div>

                {/* Selected count */}
                {formData.assignedTo.length > 0 && (
                  <p className="text-xs text-primary font-medium mb-3">
                    {formData.assignedTo.length} staff member
                    {formData.assignedTo.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              {/* Staff List */}
              <div className="max-h-[360px] overflow-y-auto px-5 sm:px-6 pb-5 sm:pb-6 space-y-1.5">
                {staffLoading ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading staff...
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    No staff members found
                  </div>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelected = formData.assignedTo.includes(staff._id);
                    return (
                      <button
                        key={staff._id}
                        type="button"
                        onClick={() => toggleStaff(staff._id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-left border ${
                          isSelected
                            ? "bg-primary/10 border-primary/20"
                            : "bg-transparent border-transparent hover:bg-white/5"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="relative flex items-center justify-center flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-white/20 bg-white/5"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                viewBox="0 0 14 10"
                                fill="none"
                              >
                                <path
                                  d="M1 5L4.5 8.5L13 1"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-on-surface-variant">
                            {staff.name.trim().slice(0, 1).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isSelected ? "text-on-surface" : "text-on-surface-variant"}`}
                          >
                            {staff.name}
                          </p>
                          <p className="text-[10px] text-outline truncate">
                            {staff.email}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white hover:shadow-lg hover:shadow-[#8c62ff]/20 transition-all text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {formData.scheduleMode === "later"
                      ? "Scheduling..."
                      : "Assigning..."}
                  </>
                ) : formData.scheduleMode === "later" ? (
                  <>
                    <CalendarClock className="w-4 h-4" />
                    Schedule Task
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Assign Task
                  </>
                )}
              </button>
              <Link
                href="/admin/tasks"
                className="w-full py-3 rounded-2xl border border-white/10 text-sm text-on-surface-variant hover:bg-white/5 transition-all font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

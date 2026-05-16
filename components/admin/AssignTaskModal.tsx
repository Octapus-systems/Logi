"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignTaskModal({ isOpen, onClose }: AssignTaskModalProps) {
  const [formData, setFormData] = useState<{
    taskName: string;
    description: string;
    assignedTo: string[];
    priority: string;
  }>({
    taskName: "",
    description: "",
    assignedTo: [],
    priority: "medium",
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStaffMembers();
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const fetchStaffMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users");
      const result = await response.json();
      if (result.success) {
        setStaffMembers(result.data);
      } else {
        setError(result.message || "Failed to load staff members");
      }
    } catch {
      setError("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.taskName.trim()) { setError("Task name is required"); return; }
    if (!formData.description.trim()) { setError("Task description is required"); return; }
    if (formData.assignedTo.length === 0) { setError("Please select at least one staff member"); return; }

    setLoading(true);
    setError(null);

    const payload = {
      title: formData.taskName.trim(),
      description: formData.description.trim(),
      priority: formData.priority === "critical" ? "urgent" : formData.priority,
    };

    try {
      const promises = formData.assignedTo.map(assignedId => 
        fetch("/api/v1/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, assignedTo: assignedId }),
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        setError(`Failed to assign task to ${failed.length} staff member(s).`);
      } else {
        setFormData({ taskName: "", description: "", assignedTo: [], priority: "medium" });
        onClose();
        window.location.reload();
      }
    } catch {
      setError("Failed to assign task. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on sm+ */}
      <div className="relative bg-[#1e1b2e] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-on-surface">Assign New Task</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        {/* Modal Body — scrollable */}
        <div className="overflow-y-auto max-h-[80vh] px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                Task Name
              </label>
              <input
                type="text"
                value={formData.taskName}
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder:text-outline"
                placeholder="Enter task name..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors h-24 resize-none placeholder:text-outline"
                placeholder="Enter task description..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                Assign To
              </label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-h-48 overflow-y-auto space-y-3">
                {loading && staffMembers.length === 0 ? (
                  <div className="text-sm text-on-surface-variant">Loading staff...</div>
                ) : (
                  staffMembers.map((staff) => (
                    <label key={staff._id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formData.assignedTo.includes(staff._id)}
                          onChange={(e) => {
                            const newAssignedTo = e.target.checked
                              ? [...formData.assignedTo, staff._id]
                              : formData.assignedTo.filter(id => id !== staff._id);
                            setFormData({ ...formData, assignedTo: newAssignedTo });
                          }}
                          className="peer w-5 h-5 appearance-none rounded border border-white/20 bg-white/5 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                        />
                        <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-on-surface group-hover:text-white transition-colors">
                        {staff.name} <span className="text-on-surface-variant text-xs">— {staff.email}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["low", "medium", "high", "critical"].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      formData.priority === priority
                        ? priority === "critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : priority === "high"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                          : priority === "medium"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-white/10 text-on-surface border border-white/20"
                        : "bg-white/5 text-on-surface-variant border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2 pb-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-on-surface-variant hover:bg-white/5 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white hover:shadow-lg hover:shadow-[#8c62ff]/20 transition-all text-sm font-bold disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

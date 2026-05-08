"use client";

import { useState, useEffect } from "react";

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
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    assignedTo: "",
    priority: "medium",
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStaffMembers();
    }
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
    } catch (err) {
      setError("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Assigning task:", formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-container-high/80 backdrop-blur-[60px] border border-primary/30 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <h2 className="text-h3 text-on-surface mb-6">Assign New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Task Name</label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors"
              placeholder="Enter task name..."
              required
            />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors h-24 resize-none"
              placeholder="Enter task description..."
            />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Assign To</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value="">{loading ? "Loading staff..." : "Select staff member..."}</option>
              {staffMembers.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}@{staff.email.split("@")[1]}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-error text-label-xs mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high", "critical"].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`flex-1 py-2 rounded-lg text-caps-xs uppercase transition-all ${
                    formData.priority === priority
                      ? priority === "critical"
                        ? "bg-error/20 text-error border border-error/30"
                        : priority === "high"
                        ? "bg-tertiary/20 text-tertiary border border-tertiary/30"
                        : priority === "medium"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/10 text-on-surface border border-white/20"
                      : "bg-white/5 text-on-surface-variant border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all text-label-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white hover:shadow-lg hover:shadow-[#8c62ff]/20 transition-all text-label-sm font-bold"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

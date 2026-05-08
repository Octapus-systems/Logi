"use client";

import { useMemo, useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { StaffCard } from "@/components/admin/StaffCard";
import { ReplyCard } from "@/components/admin/ReplyCard";
import { TaskTable } from "@/components/admin/TaskTable";
import { AssignTaskModal } from "@/components/admin/AssignTaskModal";
import { EmptyState } from "@/components/ui/EmptyState";

interface StaffMember {
  id: string;
  name: string;
  tasksAssigned: number;
  lifeCount: number;
  maxLives: number;
  avatar: string;
  isOnline: boolean;
}

interface Reply {
  id: string;
  staffName: string;
  taskTitle: string;
  message: string;
  timeAgo: string;
}

interface Task {
  id: string;
  name: string;
  priority: string;
  assignedTo: {
    name: string;
    avatar?: string;
    isUnassigned?: boolean;
  };
  status: "in-progress" | "reviewing" | "pending";
  timeSpent: string;
  staffReply: string;
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: replace with real API data
  const staffMembers: StaffMember[] = [];
  const replies: Reply[] = [];
  const tasks: Task[] = [];

  const stats = useMemo(
    () => ({
      totalStaff: staffMembers.length,
      totalTasks: tasks.length,
      completed: 0,
      activeSessions: 0,
    }),
    [staffMembers.length, tasks.length]
  );

  const handleLifeCountChange = (staffId: string, delta: number) => {
    console.log(`Change life count for staff ${staffId} by ${delta}`);
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-on-background mb-2">Dashboard</h1>
          <p className="text-on-surface-variant text-body-md">No data now</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white px-6 py-3 rounded-full font-label-sm font-bold shadow-lg hover:shadow-xl hover:shadow-[#8c62ff]/20 active:scale-95 transition-all"
        >
          Assign Task
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Staff"
          value={stats.totalStaff}
          icon="diversity_3"
          variant="primary"
          glow
        />
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon="task"
          variant="default"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon="check_circle"
          variant="tertiary"
        />
        <StatsCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon="sensors"
          variant="primary"
        />
      </section>

      {/* Staff & Replies Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Personnel */}
        <section className="lg:col-span-2">
          <h3 className="text-h3 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">badge</span>
            Active Personnel
          </h3>
          {staffMembers.length === 0 ? (
            <EmptyState title="No data now" description="No staff data available." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffMembers.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onLifeCountChange={(delta) => handleLifeCountChange(staff.id, delta)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Replies */}
        <section className="lg:col-span-1">
          <h3 className="text-h3 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">forum</span>
            Recent Replies
          </h3>
          {replies.length === 0 ? (
            <EmptyState title="No data now" description="No replies available." />
          ) : (
            <div className="flex flex-col gap-4">
              {replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Task Queue */}
      <section>
        {tasks.length === 0 ? (
          <EmptyState title="No data now" description="No tasks available." />
        ) : (
          <TaskTable tasks={tasks} />
        )}
      </section>

      {/* Assign Task Modal */}
      <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

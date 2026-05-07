"use client";

import { useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { StaffCard } from "@/components/admin/StaffCard";
import { ReplyCard } from "@/components/admin/ReplyCard";
import { TaskTable } from "@/components/admin/TaskTable";
import { AssignTaskModal } from "@/components/admin/AssignTaskModal";

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

  const stats = {
    totalStaff: 12,
    totalTasks: 48,
    completed: 32,
    activeSessions: 8,
  };

  const staffMembers: StaffMember[] = [
    {
      id: "1",
      name: "Julian Vane",
      tasksAssigned: 4,
      lifeCount: 3,
      maxLives: 3,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
    },
    {
      id: "2",
      name: "Elena Ross",
      tasksAssigned: 7,
      lifeCount: 5,
      maxLives: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
    },
  ];

  const replies: Reply[] = [
    {
      id: "1",
      staffName: "Julian Vane",
      taskTitle: "Database Migration",
      message: "Initial schema is ready. Moving to production clusters now. Will update on sync.",
      timeAgo: "2m ago",
    },
    {
      id: "2",
      staffName: "Elena Ross",
      taskTitle: "UI Audit",
      message: "Completed the glassmorphism pass on the sidebar. Spacing issues resolved.",
      timeAgo: "15m ago",
    },
  ];

  const tasks: Task[] = [
    {
      id: "1",
      name: "Cloud Infrastructure Sync",
      priority: "High Priority",
      assignedTo: {
        name: "Julian Vane",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      },
      status: "in-progress",
      timeSpent: "02:45:12",
      staffReply: "Waiting on server response...",
    },
    {
      id: "2",
      name: "Asset Compression Engine",
      priority: "Medium Priority",
      assignedTo: {
        name: "Elena Ross",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      },
      status: "reviewing",
      timeSpent: "05:12:00",
      staffReply: "Ready for final sign-off.",
    },
    {
      id: "3",
      name: "Security Patch 2.4.1",
      priority: "Critical",
      assignedTo: {
        name: "Unassigned",
        isUnassigned: true,
      },
      status: "pending",
      timeSpent: "00:00:00",
      staffReply: "N/A",
    },
  ];

  const handleLifeCountChange = (staffId: string, delta: number) => {
    console.log(`Change life count for staff ${staffId} by ${delta}`);
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-on-background mb-2">Operations Hub</h1>
          <p className="text-on-surface-variant text-body-md">
            Monitoring real-time performance and system health.
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffMembers.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onLifeCountChange={(delta) => handleLifeCountChange(staff.id, delta)}
              />
            ))}
          </div>
        </section>

        {/* Recent Replies */}
        <section className="lg:col-span-1">
          <h3 className="text-h3 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">forum</span>
            Recent Replies
          </h3>
          <div className="flex flex-col gap-4">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        </section>
      </div>

      {/* Task Queue */}
      <section>
        <TaskTable tasks={tasks} />
      </section>

      {/* Assign Task Modal */}
      <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { ReplyCard } from "@/components/admin/ReplyCard";
import { TaskTable } from "@/components/admin/TaskTable";
import { AssignTaskModal } from "@/components/admin/AssignTaskModal";
import { LivesManager } from "@/components/admin/LivesManager";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminData } from "@/hooks/useAdminData";
import { Users, ClipboardList, CheckCircle, Radio, MessageSquare, List } from "lucide-react";

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

interface TaskDisplay {
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

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { staffMembers: staffData, tasks: taskData, replies: replyData, loading, error, refreshData } = useAdminData();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Transform staff data to match StaffMember interface
  const staffMembers: StaffMember[] = useMemo(() => {
    return staffData.map((staff: any) => {
      const tasksAssigned = taskData.filter(task => task.assignedTo._id === staff.id).length;
      const lifeCount = staff.lives || 0;
      const maxLives = lifeCount > 0 ? lifeCount * 2 : 10;
      
      return {
        id: staff.id,
        name: staff.name || 'Unknown Staff',
        tasksAssigned,
        lifeCount,
        maxLives,
        avatar: '', // API doesn't provide avatar yet
        isOnline: false, // API doesn't provide online status yet
      };
    });
  }, [staffData, taskData]);

  // Transform task data to match TaskDisplay interface  
  const tasks: TaskDisplay[] = useMemo(() =>
    taskData.map(task => ({
      id: task.id,
      name: task.title,
      priority: task.priority,
      assignedTo: {
        name: task.assignedTo?.name || 'Unassigned',
        avatar: "",
        isUnassigned: !task.assignedTo,
      },
      status: task.status as "in-progress" | "reviewing" | "pending" | "done" | "stuck" | "todo",
      timeSpent: formatTime(task.timeElapsed || 0),
      staffReply: task.replies && task.replies.length > 0 ? task.replies[task.replies.length - 1].content : "",
    }))
  , [taskData]);

  const stats = useMemo(
    () => ({
      totalStaff: staffMembers.length,
      totalTasks: tasks.length,
      completed: tasks.filter(task => task.status === 'done').length,
      activeSessions: tasks.filter(task => task.status === 'in-progress').length,
    }),
    [staffMembers.length, tasks.length]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-error mb-4">Error loading data</div>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-h1 text-on-background mb-2">Dashboard</h1>
          <p className="text-on-surface-variant text-body-md">
            {staffMembers.length > 0 || tasks.length > 0 
              ? `Managing ${staffMembers.length} staff members and ${tasks.length} tasks`
              : "No data now"
            }
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#8c62ff] to-[#693bdb] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-label-sm font-bold shadow-lg hover:shadow-xl hover:shadow-[#8c62ff]/20 active:scale-95 transition-all w-full sm:w-auto"
        >
          Assign Task
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total Staff"
          value={stats.totalStaff}
          icon={Users}
          variant="primary"
          glow
        />
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={ClipboardList}
          variant="default"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          variant="tertiary"
        />
        <StatsCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Radio}
          variant="primary"
        />
      </section>

      {/* Lives Management Section */}
      <section>
        <LivesManager />
      </section>

      {/* Recent Replies Section */}
      <section>
        <h3 className="text-h3 mb-4 sm:mb-6 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          Recent Activity & Replies
        </h3>
        {replyData.length === 0 ? (
          <EmptyState 
            title="No Recent Activity" 
            description="No recent replies found. Staff activity will appear here once they start working on tasks." 
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {replyData.map((reply: Reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </section>

      {/* Task Queue */}
      <section>
        <h3 className="text-h3 mb-4 sm:mb-6 flex items-center gap-3">
          <List className="w-6 h-6 text-primary" />
          Active Task Queue
        </h3>
        {tasks.length === 0 ? (
          <EmptyState 
            title="No Tasks Found" 
            description="No tasks have been assigned yet. Create your first task to get started." 
          />
        ) : (
          <TaskTable tasks={tasks} />
        )}
      </section>

      {/* Assign Task Modal */}
      <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

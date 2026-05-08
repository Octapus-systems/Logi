import { Search, User, UserPlus, Clock } from "lucide-react";

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
      <div className="flex justify-end mb-4 sm:mb-6">
        <div className="bg-surface-container-high px-3 sm:px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-on-surface-variant" />
          <input
            className="bg-transparent border-none outline-none text-label-sm w-full text-on-surface placeholder:text-on-surface-variant"
            placeholder="Filter tasks..."
            type="text"
          />
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block glass-card rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Task Name</th>
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Assigned To</th>
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Time Spent</th>
              <th className="px-6 py-4 text-caps-xs uppercase text-on-surface-variant">Staff Reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map((task) => (
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
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="glass-card p-4 rounded-2xl">
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
      </div>
    </div>
  );
}

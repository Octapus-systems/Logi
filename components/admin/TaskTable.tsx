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

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  const getStatusBadge = (status: Task["status"]) => {
    const styles = {
      "in-progress": "bg-tertiary/10 text-tertiary",
      reviewing: "bg-primary/10 text-primary",
      pending: "bg-error/10 text-error",
    };

    const labels = {
      "in-progress": "In Progress",
      reviewing: "Reviewing",
      pending: "Pending",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-h3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">list_alt</span>
          Active Task Queue
        </h3>
        <div className="flex gap-2">
          <div className="bg-surface-container-high px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              className="bg-transparent border-none outline-none text-label-sm w-32 text-on-surface placeholder:text-on-surface-variant"
              placeholder="Filter tasks..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
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
                  <p className="text-label-sm font-bold text-on-surface">{task.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{task.priority}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {task.assignedTo.isUnassigned ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                            person_search
                          </span>
                        </div>
                        <span className="text-label-sm text-outline">Unassigned</span>
                      </>
                    ) : (
                      <>
                        <img
                          alt={task.assignedTo.name}
                          className="w-6 h-6 rounded-full object-cover"
                          src={task.assignedTo.avatar}
                        />
                        <span className="text-label-sm text-on-surface">{task.assignedTo.name}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                <td className="px-6 py-4 font-mono text-label-sm text-on-surface-variant">
                  {task.timeSpent}
                </td>
                <td className="px-6 py-4 text-label-sm italic text-on-surface-variant">
                  &ldquo;{task.staffReply}&rdquo;
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

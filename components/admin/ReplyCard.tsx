interface Reply {
  id: string;
  staffName: string;
  taskTitle: string;
  message: string;
  timeAgo: string;
}

interface ReplyCardProps {
  reply: Reply;
}

export function ReplyCard({ reply }: ReplyCardProps) {
  return (
    <div className="glass-card p-4 rounded-2xl">
      <div className="flex justify-between items-start mb-2">
        <p className="text-label-sm font-bold text-primary">{reply.staffName}</p>
        <span className="text-[10px] text-on-surface-variant">{reply.timeAgo}</span>
      </div>
      <p className="text-on-surface-variant text-[11px] mb-1">Re: {reply.taskTitle}</p>
      <p className="text-on-surface text-body-md line-clamp-2">&ldquo;{reply.message}&rdquo;</p>
    </div>
  );
}

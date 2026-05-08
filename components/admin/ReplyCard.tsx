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
    <div className="glass-card p-3 sm:p-4 rounded-2xl">
      <div className="flex justify-between items-start mb-2">
        <p className="text-label-sm font-bold text-primary truncate flex-1 mr-2">{reply.staffName}</p>
        <span className="text-[10px] text-on-surface-variant flex-shrink-0">{reply.timeAgo}</span>
      </div>
      <p className="text-on-surface-variant text-[10px] sm:text-[11px] mb-1 truncate">Re: {reply.taskTitle}</p>
      <p className="text-on-surface text-body-md line-clamp-3 text-sm leading-relaxed">&ldquo;{reply.message}&rdquo;</p>
    </div>
  );
}

"use client";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass-card border border-red-500/20 rounded-2xl p-8">
      <p className="text-h3 text-on-surface">{title}</p>
      {message && (
        <pre className="mt-3 whitespace-pre-wrap break-words text-body-sm text-on-surface-variant">
          {message}
        </pre>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 bg-white/10 hover:bg-white/15 text-on-surface transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}


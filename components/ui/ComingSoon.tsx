"use client";

export function ComingSoon({
  title = "Coming soon",
  description = "This section is under development.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card border border-white/10 rounded-2xl p-10 text-center">
        <p className="text-h1 text-on-surface">{title}</p>
        <p className="text-body-md text-on-surface-variant mt-3">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-outline-variant">
          Status: In progress
        </div>
      </div>
    </div>
  );
}


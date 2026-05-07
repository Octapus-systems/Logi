"use client";

import React from "react";

export function EmptyState({
  title = "No data now",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card border border-white/10 rounded-2xl p-8 text-center">
      <p className="text-h3 text-on-surface">{title}</p>
      {description && (
        <p className="text-body-md text-on-surface-variant mt-2">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}


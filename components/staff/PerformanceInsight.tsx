"use client";

export function PerformanceInsight() {
  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group h-full">
      <div className="relative z-10 space-y-2">
        <h4 className="text-h3 text-on-surface">Performance Insight</h4>
        <p className="text-body-md text-on-surface-variant">
          You are 15% more productive than last Tuesday. Keep up the momentum, Alex!
        </p>
      </div>
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full"></div>
    </div>
  );
}

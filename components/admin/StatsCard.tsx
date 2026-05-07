interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  variant?: "default" | "primary" | "tertiary";
  glow?: boolean;
}

export function StatsCard({ title, value, icon, variant = "default", glow }: StatsCardProps) {
  const valueColorClass = {
    default: "text-on-surface",
    primary: "text-primary",
    tertiary: "text-tertiary",
  }[variant];

  const iconColorClass = {
    default: "text-on-surface-variant",
    primary: "text-primary",
    tertiary: "text-tertiary",
  }[variant];

  return (
    <div
      className={`glass-card p-6 rounded-2xl ${
        glow ? "shadow-[0_0_40px_-10px_rgba(140,98,255,0.15)]" : ""
      }`}
    >
      <p className="text-on-surface-variant text-caps-xs uppercase mb-4">{title}</p>
      <div className="flex items-end justify-between">
        <span className={`text-h1 ${valueColorClass}`}>{value}</span>
        <span className={`material-symbols-outlined mb-1 ${iconColorClass}`}>{icon}</span>
      </div>
    </div>
  );
}

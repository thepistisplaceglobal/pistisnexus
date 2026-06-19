import { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number; // Positive for up, negative for down
  icon?: ReactNode;
}

export function MetricCard({ title, value, trend, icon }: MetricCardProps) {
  return (
    <GlassCard className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-start text-lilac">
        <h3 className="text-sm font-medium tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-royal-purple/80">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center text-sm font-medium ${
              trend >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </GlassCard>
  );
}

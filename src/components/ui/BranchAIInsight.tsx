import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface InsightData {
  type: "positive" | "warning" | "suggestion" | "info";
  content: string;
}

const mockBranchInsights: InsightData[] = [
  {
    type: "positive",
    content: "Ushers and Media departments submitted reports early this week. High engagement across 80% of Home Cells.",
  },
  {
    type: "warning",
    content: "3 Interest Groups are yet to submit weekly attendance reports. Deadline approaching in 4 hours.",
  },
  {
    type: "suggestion",
    content: "Noticeable 15% dip in midweek service attendance compared to last month. Consider deploying branch-wide reminder broadcast.",
  },
];

export function BranchAIInsight() {
  return (
    <GlassCard className="flex flex-col gap-4 bg-gradient-to-br from-[#0B0118]/80 to-royal-purple/10">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-lilac" />
        <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">
          Branch Intelligence
        </h3>
      </div>
      
      <div className="flex flex-col gap-3">
        {mockBranchInsights.map((insight, idx) => {
          let Icon;
          let colorClass;
          let bgClass;

          switch (insight.type) {
            case "positive":
              Icon = TrendingUp;
              colorClass = "text-emerald-400";
              bgClass = "bg-emerald-400/10";
              break;
            case "warning":
              Icon = AlertTriangle;
              colorClass = "text-amber-400";
              bgClass = "bg-amber-400/10";
              break;
            case "suggestion":
            default:
              Icon = Lightbulb;
              colorClass = "text-lavender";
              bgClass = "bg-lavender/10";
              break;
          }

          return (
            <div key={idx} className="flex gap-3 items-start p-3 rounded-lg border border-white/5 bg-white/5">
              <div className={`p-1.5 rounded-full ${bgClass} ${colorClass} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-white/80 leading-snug">
                {insight.content}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

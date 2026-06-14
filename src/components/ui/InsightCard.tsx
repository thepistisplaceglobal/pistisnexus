import { SparklesIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface InsightCardProps {
  content: string;
  type?: "positive" | "warning" | "neutral";
}

export function InsightCard({ content, type = "neutral" }: InsightCardProps) {
  const highlightColor = 
    type === 'positive' ? 'text-emerald-400' :
    type === 'warning' ? 'text-amber-400' :
    'text-lilac';

  return (
    <GlassCard className="flex items-start gap-4">
      <div className="p-2 rounded-full bg-royal-purple/20">
        <SparklesIcon className={`w-5 h-5 ${highlightColor}`} />
      </div>
      <p className="text-sm text-lavender/90 leading-relaxed font-medium">
        {content}
      </p>
    </GlassCard>
  );
}

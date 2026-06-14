import { GlassCard } from "./GlassCard";
import { Sparkles, Users, Wallet, BrainCircuit, Activity } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function GlobalAIInsight() {
  const user = useAppStore(state => state.user);

  if (user?.role !== 'GLOBAL_ADMIN') {
    return null;
  }

  return (
    <GlassCard className="flex flex-col gap-4 bg-gradient-to-br from-[#0B0118]/80 to-indigo-900/40 border-indigo-500/20 relative overflow-hidden">
       {/* AI Glow Effect */}
       <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
       
       <div className="flex items-center gap-2 border-b border-white/5 pb-3 relative z-10">
         <div className="p-1.5 rounded-lg bg-indigo-500/20">
           <BrainCircuit className="w-5 h-5 text-indigo-400" />
         </div>
         <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-200">Global Executive Intelligence</h3>
         <span className="ml-auto text-xs font-medium text-white/50 flex items-center gap-1">
           <Sparkles className="w-3 h-3 text-indigo-400" />
           Aggregated Overview
         </span>
       </div>

       <div className="flex flex-col gap-4 relative z-10">
          {/* Multi-Branch Growth Correlation */}
          <div className="flex gap-3 items-start bg-emerald-400/5 p-3 rounded-xl border border-emerald-400/10">
             <div className="p-2 rounded-full bg-emerald-400/10 shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white mb-1">Evangelism Growth Correlation</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Aggregated reports from <strong>Uyo, Calabar, and PH</strong> branches indicate an <strong>18% rise in first-time attendees</strong> correlating with recent unified outreach programs.
                  <br /><span className="text-emerald-400 mt-1 block font-medium">Recommendation: Distribute successful outreach templates globally to all branch admins.</span>
                </p>
             </div>
          </div>

          {/* Aggregated Branch Financial Optimization */}
          <div className="flex gap-3 items-start bg-indigo-400/5 p-3 rounded-xl border border-indigo-400/10">
             <div className="p-2 rounded-full bg-indigo-400/10 shrink-0">
                <Wallet className="w-4 h-4 text-indigo-400" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white mb-1">Global Financial Efficiency</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Consolidated analysis across <strong>total branches and departments</strong> shows administrative expenditures decreased by 6% globally while total inflows grew by 9.2%. 
                  <br /><span className="text-indigo-300 mt-1 block font-medium">Insight: High yield recorded across specific Interest Groups; consider increased support budget.</span>
                </p>
             </div>
          </div>

          {/* Multi-Branch Compliance Risk */}
          <div className="flex gap-3 items-start bg-amber-400/5 p-3 rounded-xl border border-amber-400/10">
             <div className="p-2 rounded-full bg-amber-400/10 shrink-0">
                <Activity className="w-4 h-4 text-amber-400" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white mb-1">Reporting Compliance Bottlenecks</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Data latency identified: <strong>14% of Home Cells</strong> across all branches consistently submit reports exactly at the deadline. 
                  <br /><span className="text-amber-400 mt-1 block font-medium">Action Taken: Configured earlier automated reminder pulses for Cell Leaders starting next week.</span>
                </p>
             </div>
          </div>
       </div>
    </GlassCard>
  );
}

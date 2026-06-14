import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Trophy, TrendingUp, ShieldCheck, Medal, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardData {
  rank: number;
  branch: string;
  growth: string;
  consistency: string;
  financeImpact: string;
  score: number;
}

export function GlobalLeaderboardWidget() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch branch reports
      const { data: reports, error } = await supabase
        .from('branch_reports')
        .select('*');

      if (!error && reports) {
        // Group by branch
        const branchStats: Record<string, { count: number; totalAttendance: number; totalIncome: number }> = {};
        
        reports.forEach(r => {
          if (!branchStats[r.branch_name]) {
            branchStats[r.branch_name] = { count: 0, totalAttendance: 0, totalIncome: 0 };
          }
          branchStats[r.branch_name].count += 1;
          const attendance = r.metrics?.attendance || 0;
          const income = r.metrics?.compiled_income || 0;
          branchStats[r.branch_name].totalAttendance += attendance;
          branchStats[r.branch_name].totalIncome += income;
        });

        // Convert to leaderboard format and calculate score based on attendance & finance
        const lbData = Object.keys(branchStats).map((branch) => {
          const stats = branchStats[branch];
          
          const consistencyValue = Math.min(stats.count * 20 + 60, 100);
          const growthValue = Math.min((stats.totalAttendance / 500) * 5, 30);
          const financeScore = Math.min((stats.totalIncome / 50000) * 5, 30);
          
          const score = Math.round((consistencyValue * 0.4) + (growthValue * 0.3) + (financeScore * 0.3));
          
          return {
            rank: 0,
            branch: branch,
            growth: `+${growthValue.toFixed(1)}%`,
            consistency: `${consistencyValue}%`,
            financeImpact: `+${financeScore.toFixed(1)}`,
            score,
          };
        });

        lbData.sort((a, b) => b.score - a.score);
        lbData.forEach((item, index) => {
          item.rank = index + 1;
        });

        if (lbData.length > 0) {
           setLeaderboardData(lbData);
        } else {
           // Fallback to initial mock if no dynamic data exists yet
           setLeaderboardData([
              { rank: 1, branch: "Pistis Annex Uyo", growth: "+14.5%", consistency: "98%", financeImpact: "+8", score: 96 },
              { rank: 2, branch: "Pistis Hub Calabar", growth: "+12.2%", consistency: "95%", financeImpact: "+7", score: 91 },
              { rank: 3, branch: "Pistis Center PH", growth: "+8.7%", consistency: "92%", financeImpact: "+6", score: 85 },
              { rank: 4, branch: "Pistis Lagos HQ", growth: "+5.4%", consistency: "100%", financeImpact: "+5", score: 82 },
           ]);
        }
      }
    };

    fetchLeaderboard();
  }, []);
  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-amber-400">
            Performance Leaderboard
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {leaderboardData.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                item.rank === 1 ? "bg-amber-400/20 text-amber-400" :
                item.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                item.rank === 3 ? "bg-amber-700/20 text-amber-700" :
                "bg-white/10 text-white/50"
              }`}>
                {item.rank === 1 ? <Medal className="w-4 h-4" /> : item.rank}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.branch}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {item.growth} Growth
                  </span>
                  <span className="text-xs text-indigo-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {item.consistency} Consistency
                  </span>
                  <span className="text-xs text-amber-300 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {item.financeImpact} Impact
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{item.score}</span>
              <p className="text-[10px] text-lavender uppercase tracking-wider">Score</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

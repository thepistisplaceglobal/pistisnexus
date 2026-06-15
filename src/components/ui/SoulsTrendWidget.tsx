import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, TrendingUp } from "lucide-react";

interface SoulsTrendWidgetProps {
  pulseStats: {
    globalMembership: number;
    globalWeeklySouls: number;
    globalMonthlySouls: number;
    branchMembership: number;
    branchWeeklySouls: number;
    branchMonthlySouls: number;
  };
}

export function SoulsTrendWidget({ pulseStats }: SoulsTrendWidgetProps) {
  const user = useAppStore((state) => state.user);
  const isGlobal = user?.role === "GLOBAL_ADMIN";

  // Generate monthly data merging historical defaults with current live monthly computed figures
  const data = [
    {
      month: "Jan",
      membership: isGlobal ? 11200 : (user?.branchName?.toLowerCase().includes("calabar") ? 3000 : 8200),
      soulsWon: isGlobal ? 850 : (user?.branchName?.toLowerCase().includes("calabar") ? 270 : 580),
    },
    {
      month: "Feb",
      membership: isGlobal ? 11400 : (user?.branchName?.toLowerCase().includes("calabar") ? 3100 : 8300),
      soulsWon: isGlobal ? 920 : (user?.branchName?.toLowerCase().includes("calabar") ? 300 : 620),
    },
    {
      month: "Mar",
      membership: isGlobal ? 11800 : (user?.branchName?.toLowerCase().includes("calabar") ? 3200 : 8600),
      soulsWon: isGlobal ? 1110 : (user?.branchName?.toLowerCase().includes("calabar") ? 340 : 770),
    },
    {
      month: "Apr",
      membership: isGlobal ? 12100 : (user?.branchName?.toLowerCase().includes("calabar") ? 3300 : 8800),
      soulsWon: isGlobal ? 1340 : (user?.branchName?.toLowerCase().includes("calabar") ? 410 : 930),
    },
    {
      month: "May",
      membership: isGlobal ? pulseStats.globalMembership : pulseStats.branchMembership,
      soulsWon: isGlobal ? pulseStats.globalMonthlySouls : pulseStats.branchMonthlySouls,
    },
  ];

  // Calculate insights
  const currentMonthData = data[data.length - 1];
  const prevMonthData = data[data.length - 2];
  const soulsGrowth = ((currentMonthData.soulsWon - prevMonthData.soulsWon) / prevMonthData.soulsWon) * 100;
  const membershipGrowth = ((currentMonthData.membership - prevMonthData.membership) / prevMonthData.membership) * 100;

  return (
    <GlassCard className="flex flex-col h-[380px] p-6 bg-gradient-to-tr from-deep-violet/40 via-purple-950/20 to-[#0A0216]/50 border border-royal-purple/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-lilac uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Growth Convergence: Members vs. Souls Won
          </h3>
          <p className="text-xs text-lavender/60 mt-0.5">
            Comparing monthly active membership capacity against total successfully won souls
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            Souls Map: {soulsGrowth >= 0 ? "+" : ""}{soulsGrowth.toFixed(1)}% MoM
          </div>
          <div className="flex items-center gap-1.5 text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            Strength: {membershipGrowth >= 0 ? "+" : ""}{membershipGrowth.toFixed(1)}% MoM
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: -5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            {/* Left Axis for Membership Strength */}
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A892EE', fontSize: 11 }} 
              tickFormatter={(value) => value.toLocaleString()}
            />
            {/* Right Axis for Souls Won */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#34D399', fontSize: 11 }} 
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 2, 35, 0.9)', 
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(120, 81, 169, 0.4)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ padding: '2px 0' }}
              labelStyle={{ fontWeight: 'bold', color: '#E0B0FF', marginBottom: '4px' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px', color: '#E8A2EE' }} 
              verticalAlign="bottom"
              height={36}
            />
            
            {/* Membership Strength represented as a soft radial gradient bar */}
            <Bar 
              yAxisId="left"
              dataKey="membership" 
              name="Membership Strength (Active)" 
              fill="rgba(120, 81, 169, 0.35)"
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            />
            
            {/* Souls Won represented as a striking, vibrant emerald trend line */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="soulsWon" 
              name="Souls Won (Total Month)" 
              stroke="#34D399" 
              strokeWidth={3}
              dot={{ r: 5, fill: '#0B0118', stroke: '#34D399', strokeWidth: 2.5 }}
              activeDot={{ r: 7, fill: '#E6E6FA', stroke: '#10B981', strokeWidth: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

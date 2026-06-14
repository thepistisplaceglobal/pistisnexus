import { GlassCard } from "./GlassCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Activity, Wallet } from "lucide-react";

const aggregatedData = [
  { month: "Jan", attendanceGrowth: 2.1, financeHealth: 68, engagementScore: 72 },
  { month: "Feb", attendanceGrowth: 3.4, financeHealth: 74, engagementScore: 78 },
  { month: "Mar", attendanceGrowth: 5.8, financeHealth: 72, engagementScore: 81 },
  { month: "Apr", attendanceGrowth: 8.2, financeHealth: 85, engagementScore: 84 },
  { month: "May", attendanceGrowth: 14.5, financeHealth: 92, engagementScore: 89 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0118]/90 border border-royal-purple/30 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-lavender/80">{entry.name}:</span>
            <span className="text-white font-bold">
              {entry.value}{entry.dataKey === "attendanceGrowth" ? "%" : "%"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function GlobalTrendsWidget() {
  return (
    <GlassCard className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Global Branch Trends
          </h3>
          <p className="text-sm text-lavender/70 mt-1">
            Aggregated performance metrics from all church branches.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <div className="w-3 h-3 rounded-full bg-emerald-400" /> Attendance Growth
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <div className="w-3 h-3 rounded-full bg-indigo-400" /> Financial Health
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <div className="w-3 h-3 rounded-full bg-amber-400" /> Dept Engagement
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFinance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomTooltip />} />
            
            <Area 
              type="monotone" 
              dataKey="attendanceGrowth" 
              name="Attendance Growth" 
              stroke="#34d399" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorAttendance)" 
            />
            <Area 
              type="monotone" 
              dataKey="financeHealth" 
              name="Financial Health" 
              stroke="#818cf8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorFinance)" 
            />
            <Area 
              type="monotone" 
              dataKey="engagementScore" 
              name="Dept Engagement" 
              stroke="#fbbf24" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorEngagement)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

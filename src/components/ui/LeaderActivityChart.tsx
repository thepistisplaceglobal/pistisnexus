import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

export function LeaderActivityChart() {
  const leaders = useAppStore(state => state.leaders);

  const data = useMemo(() => {
    const branchMap: Record<string, { branch: string; Active: number; Inactive: number }> = {};
    
    leaders.forEach(leader => {
      // Default branch name if empty
      const branchName = leader.branch || "Unknown";
      if (!branchMap[branchName]) {
        branchMap[branchName] = { branch: branchName, Active: 0, Inactive: 0 };
      }
      if (leader.active) {
        branchMap[branchName].Active += 1;
      } else {
        branchMap[branchName].Inactive += 1;
      }
    });

    return Object.values(branchMap);
  }, [leaders]);

  return (
    <GlassCard className="flex flex-col h-[300px]">
      <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4">Leader Activity by Branch</h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="branch" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(51, 0, 102, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(120, 81, 169, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Bar dataKey="Active" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Inactive" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

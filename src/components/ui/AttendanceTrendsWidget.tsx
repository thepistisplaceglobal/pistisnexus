import React from 'react';
import { GlassCard } from "./GlassCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function AttendanceTrendsWidget() {
  const { user } = useAppStore();

  const attendanceData = [
    { week: 'W1', attendance: 11000 },
    { week: 'W2', attendance: 11200 },
    { week: 'W3', attendance: 11500 },
    { week: 'W4', attendance: 11400 },
    { week: 'W5', attendance: 11800 },
    { week: 'W6', attendance: 12100 },
    { week: 'W7', attendance: 12050 },
    { week: 'W8', attendance: 12200 },
    { week: 'W9', attendance: 12350 },
    { week: 'W10', attendance: 12400 },
    { week: 'W11', attendance: 12600 },
    { week: 'W12', attendance: 12450 },
  ];

  const scale = user?.role === 'GLOBAL_ADMIN' ? 1 : 0.35;
  const data = user?.role === 'GLOBAL_ADMIN' 
    ? attendanceData 
    : attendanceData.map(d => ({ week: d.week, attendance: Math.round(d.attendance * scale) }));

  const titlePrefix = user?.role === 'GLOBAL_ADMIN' ? 'Global' : 'Branch';

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-white">{titlePrefix} Attendance Trends</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+13.2%</span>
        </div>
      </div>
      
      <p className="text-xs text-lilac/70 -mt-2">
        Weekly {titlePrefix.toLowerCase()} attendance metrics over the last 12 weeks.
      </p>

      <div className="h-[250px] w-full mt-2 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="week" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a78bfa', fontSize: 12, opacity: 0.8 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a78bfa', fontSize: 12, opacity: 0.8 }} 
              tickFormatter={(value) => user?.role === 'GLOBAL_ADMIN' ? `${(value / 1000).toFixed(1)}k` : value.toString()}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(11, 1, 24, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
              labelStyle={{ color: '#a78bfa', marginBottom: '4px' }}
              formatter={(value: number) => [value.toLocaleString(), 'Attendance']}
            />
            <Line 
              type="monotone" 
              dataKey="attendance" 
              stroke="#34d399" 
              strokeWidth={3}
              dot={{ fill: '#0B0118', stroke: '#34d399', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#34d399', stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

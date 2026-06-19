import React, { useState, useEffect } from 'react';
import { GlassCard } from "./GlassCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, TrendingUp, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

export function AttendanceTrendsWidget() {
  const { user } = useAppStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<string>("+0.0%");

  useEffect(() => {
    const fetchAttendanceTrends = async () => {
      try {
        let reportsQuery = supabase.from("unit_reports").select("*");
        if (user?.role === 'BRANCH_ADMIN' && user.branchName) {
          reportsQuery = reportsQuery.eq('branch_name', user.branchName);
        }
        
        const { data: reports, error } = await reportsQuery;
        
        if (!error && reports) {
          const now = new Date();
          const msInWeek = 7 * 24 * 60 * 60 * 1000;
          
          const weeksData = Array.from({ length: 12 }).map((_, idx) => {
            const weekNumber = 12 - idx;
            const weekStart = new Date(now.getTime() - (weekNumber * msInWeek));
            const weekEnd = new Date(now.getTime() - ((weekNumber - 1) * msInWeek));
            
            return {
              week: `W${12 - weekNumber + 1}`,
              startDate: weekStart,
              endDate: weekEnd,
              attendance: 0
            };
          });

          reports.forEach((r) => {
            const metrics = r.metrics || {};
            const dateStr = r.created_at || metrics.submitted_at;
            if (!dateStr) return;
            const rDate = new Date(dateStr);
            
            const targetWeek = weeksData.find(w => rDate >= w.startDate && rDate < w.endDate);
            if (targetWeek) {
              const attStr = metrics["Total number of department workers"] || metrics["Total attendance"] || metrics["Total membership"] || "0";
              const attValue = parseInt(String(attStr).replace(/,/g, ''), 10) || 0;
              targetWeek.attendance += attValue;
            }
          });

          // Compute percentage change (W11 to W12)
          let change = 0;
          const w11 = weeksData[10]?.attendance || 0;
          const w12 = weeksData[11]?.attendance || 0;
          if (w11 > 0) {
            change = ((w12 - w11) / w11) * 100;
          } else if (w12 > 0) {
            change = 100;
          }
          
          const prefix = change >= 0 ? "+" : "";
          setPercentageChange(`${prefix}${change.toFixed(1)}%`);

          const chartPoints = weeksData.map(w => ({
            week: w.week,
            attendance: w.attendance
          }));

          setData(chartPoints);
        } else {
          setData(Array.from({ length: 12 }).map((_, index) => ({ week: `W${index + 1}`, attendance: 0 })));
        }
      } catch (err) {
        console.warn("Error fetching attendance trends dynamically:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceTrends();
  }, [user]);

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
          <span>{percentageChange}</span>
        </div>
      </div>
      
      <p className="text-xs text-lilac/70 -mt-2">
        Weekly {titlePrefix.toLowerCase()} attendance metrics over the last 12 weeks.
      </p>

      <div className="h-[250px] w-full mt-2 -ml-4 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-lavender/80">
            <Loader2 className="w-6 h-6 animate-spin text-royal-purple" />
            <span className="text-xs">Processing records...</span>
          </div>
        ) : (
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
                tickFormatter={(value) => user?.role === 'GLOBAL_ADMIN' ? (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()) : value.toString()}
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
        )}
      </div>
    </GlassCard>
  );
}

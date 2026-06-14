import React from 'react';
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Megaphone } from "lucide-react";

export function BroadcastReachWidget() {
  const { user } = useAppStore();

  // Mock engagement data for the widget
  const deliveryData = [
    { name: 'Mon', reach: 85, engagement: 45 },
    { name: 'Tue', reach: 98, engagement: 62 },
    { name: 'Wed', reach: 110, engagement: 74 },
    { name: 'Thu', reach: 95, engagement: 58 },
    { name: 'Fri', reach: 130, engagement: 88 },
    { name: 'Sat', reach: 145, engagement: 95 },
    { name: 'Sun', reach: 170, engagement: 120 },
  ];

  if (!['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '')) {
    return null;
  }

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-white">Broadcast Reach</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      </div>
      
      <p className="text-xs text-lilac/70 -mt-2">
        Tracking delivery and engagement rates of recent global announcements.
      </p>

      <div className="h-40 w-full mt-2 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={deliveryData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="engageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7851A9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7851A9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a78bfa', fontSize: 10, opacity: 0.6 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#a78bfa', fontSize: 10, opacity: 0.6 }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(11, 1, 24, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#a78bfa', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="reach" 
              stroke="#34d399" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#reachGradient)" 
              name="Total Reach"
            />
            <Area 
              type="monotone" 
              dataKey="engagement" 
              stroke="#7851A9" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#engageGradient)" 
              name="Engagement"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-1 text-xs">
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div><span className="text-lilac/70">Reach</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-royal-purple"></div><span className="text-lilac/70">Reads/Clicks</span></div>
      </div>
    </GlassCard>
  );
}

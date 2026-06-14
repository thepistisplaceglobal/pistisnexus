import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { GlassCard } from "./GlassCard";

interface ChartPanelProps {
  title: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  valuePrefix?: string;
}

export function ChartPanel({ title, data, dataKey, xAxisKey, valuePrefix = "" }: ChartPanelProps) {
  return (
    <GlassCard className="flex flex-col h-[300px]">
      <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4">{title}</h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7851A9" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#7851A9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              tickFormatter={(value) => `${valuePrefix}${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(51, 0, 102, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(120, 81, 169, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#E0B0FF' }}
              formatter={(value: number) => [`${valuePrefix}${value.toLocaleString()}`, dataKey]}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#7851A9" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPurple)" 
              activeDot={{ r: 6, fill: '#E6E6FA', stroke: '#7851A9', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

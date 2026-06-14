import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { GlassCard } from "./GlassCard";

interface LineChartPanelProps {
  title: string;
  data: any[];
  lines: { key: string; color: string; name: string; yAxisId?: 'left' | 'right' }[];
  xAxisKey: string;
  valuePrefix?: string;
}

export function LineChartPanel({ title, data, lines, xAxisKey, valuePrefix = "" }: LineChartPanelProps) {
  const hasRightAxis = lines.some(l => l.yAxisId === 'right');

  return (
    <GlassCard className="flex flex-col h-[300px]">
      <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4">{title}</h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: hasRightAxis ? 0 : 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#C8A2C8', fontSize: 12 }} 
              tickFormatter={(value) => `${valuePrefix}${value.toLocaleString()}`}
            />
            {hasRightAxis && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#facc15', fontSize: 12 }} 
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
            )}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(51, 0, 102, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(120, 81, 169, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#E0B0FF' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#E6E6FA' }} />
            {lines.map((line) => (
              <Line 
                key={line.key}
                yAxisId={line.yAxisId || 'left'}
                type="monotone" 
                dataKey={line.key} 
                name={line.name}
                stroke={line.color} 
                strokeWidth={3}
                dot={{ r: 4, fill: '#0B0118', stroke: line.color, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#E6E6FA', stroke: line.color, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

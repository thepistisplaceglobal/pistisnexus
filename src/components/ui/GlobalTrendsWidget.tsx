import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Activity, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function GlobalTrendsWidget() {
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalTrends = async () => {
      try {
        // Fetch unit reports
        const { data: reports, error } = await supabase
          .from("unit_reports")
          .select("*");
          
        // Fetch branch reports to compile real-time financials
        const { data: bReports, error: bError } = await supabase
          .from("branch_reports")
          .select("*");

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthIndex = new Date().getMonth();
        
        // Initialize months Jan to currentMonth
        const initialData = monthNames.slice(0, currentMonthIndex + 1).map(m => ({
          month: m,
          attendanceTotal: 0,
          inflowsTotal: 0,
          expensesTotal: 0,
          reportsSubmitted: 0,
          attendanceGrowth: 0,
          financeHealth: 0,
          engagementScore: 0,
        }));

        // Fallback to ensuring we have at least Jan-May to match aesthetic
        if (initialData.length < 5) {
          const fallbackMonths = ["Jan", "Feb", "Mar", "Apr", "May"];
          fallbackMonths.forEach(m => {
            if (!initialData.some(d => d.month === m)) {
              initialData.push({
                month: m,
                attendanceTotal: 0,
                inflowsTotal: 0,
                expensesTotal: 0,
                reportsSubmitted: 0,
                attendanceGrowth: 0,
                financeHealth: 0,
                engagementScore: 0,
              });
            }
          });
          initialData.sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));
        }

        if (!error && reports) {
          reports.forEach(r => {
            const metrics = r.metrics || {};
            const dateStr = r.created_at || metrics.submitted_at;
            if (!dateStr) return;
            const rDate = new Date(dateStr);
            const rMonth = monthNames[rDate.getMonth()];
            
            const target = initialData.find(d => d.month === rMonth);
            if (target) {
              const attStr = metrics["Total number of department workers"] || metrics["Total attendance"] || metrics["Total membership"] || "0";
              const att = parseInt(String(attStr).replace(/,/g, ''), 10) || 0;
              target.attendanceTotal += att;
              target.reportsSubmitted += 1;
            }
          });
        }

        if (!bError && bReports) {
          bReports.forEach(r => {
            const metrics = r.metrics || {};
            const dateStr = r.created_at;
            if (!dateStr) return;
            const rDate = new Date(dateStr);
            const rMonth = monthNames[rDate.getMonth()];

            const target = initialData.find(d => d.month === rMonth);
            if (target) {
              const income = metrics.compiled_income || metrics.inflow || 0;
              const expenses = metrics.expenses || 0;
              target.inflowsTotal += income;
              target.expensesTotal += expenses;
            }
          });
        }

        // Calculate dynamic trends & metrics
        // Expected total reports per month in a real scenario (e.g. 15 unit reports)
        const expectedTotalReports = 15;

        initialData.forEach((d, idx) => {
          // Attendance Growth month-over-month
          if (idx === 0) {
            d.attendanceGrowth = d.attendanceTotal > 0 ? 5 : 0; // Baseline starting growth
          } else {
            const prev = initialData[idx - 1];
            if (prev.attendanceTotal === 0) {
              d.attendanceGrowth = d.attendanceTotal > 0 ? 5 : 0;
            } else {
              const growth = ((d.attendanceTotal - prev.attendanceTotal) / prev.attendanceTotal) * 100;
              d.attendanceGrowth = parseFloat((Math.min(Math.max(growth, -50), 100)).toFixed(1));
            }
          }

          // Finance Health: (Total Inflow - Expenses) / Total Inflow * 100
          if (d.inflowsTotal === 0) {
            d.financeHealth = 0;
          } else {
            const net = d.inflowsTotal - d.expensesTotal;
            const ratio = (net / d.inflowsTotal) * 100;
            d.financeHealth = Math.round(Math.min(Math.max(ratio, 0), 100));
          }

          // Engagement Score: Reports submitted vs expected
          const score = (d.reportsSubmitted / expectedTotalReports) * 100;
          d.engagementScore = Math.round(Math.min(score, 100));
        });

        setAggregatedData(initialData);
      } catch (err) {
        console.warn("Error fetching global trends dynamically:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalTrends();
  }, []);

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

      <div className="h-[280px] w-full mt-4 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-lavender/80">
            <Loader2 className="w-8 h-8 animate-spin text-royal-purple" />
            <span className="text-xs">Computing trends...</span>
          </div>
        ) : (
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
        )}
      </div>
    </GlassCard>
  );
}

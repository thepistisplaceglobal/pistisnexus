import { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { ChartPanel } from "@/components/ui/ChartPanel";
import { Filter, Wallet } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

export function Finance() {
  const user = useAppStore((state) => state.user);
  const [financeData, setFinanceData] = useState<{ week: string; income: number; expenses: number }[]>([
    { week: "W1", income: 0, expenses: 0 },
    { week: "W2", income: 0, expenses: 0 },
    { week: "W3", income: 0, expenses: 0 },
    { week: "W4", income: 0, expenses: 0 },
  ]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinanceData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("unit_reports")
          .select("*")
          .eq("submitter_name", user.name)
          .order("created_at", { ascending: true })
          .limit(4);

        if (error) {
          console.error("Error fetching finance reports:", error);
          return;
        }

        if (data && data.length > 0) {
          let tInc = 0;
          let tExp = 0;
          
          const mappedData = data.map((report, index) => {
            const metrics = report.metrics || {};
            const incStr = metrics["Opening balance (₦)"] || metrics["Cell offering amount (₦)"] || metrics["Inflow"] || "0";
            const expStr = metrics["Expenses"] || metrics["Total Expenses (₦)"] || "0";
            
            const income = parseInt(String(incStr).replace(/,/g, ''), 10) || 0;
            const expenses = parseInt(String(expStr).replace(/,/g, ''), 10) || 0;
            
            tInc += income;
            tExp += expenses;

            return {
              week: `W${index + 1}`,
              income,
              expenses
            };
          });

          // Pad with empty weeks if less than 4 reports
          while (mappedData.length < 4) {
            mappedData.push({ week: `W${mappedData.length + 1}`, income: 0, expenses: 0 });
          }

          setFinanceData(mappedData);
          setTotalIncome(tInc);
          setTotalExpenses(tExp);
        }
      } catch (err) {
        console.error("Failed to load finance data", err);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceData();
  }, [user]);

  const netFlow = totalIncome - totalExpenses;
  const unitLabel = user?.groupName || user?.deptName || "Your Unit";

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            {unitLabel} Finance Intelligence
          </h1>
          <p className="text-lilac/80 font-medium">Financial Flow & Resource Allocation</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-royal-purple/30 text-white hover:bg-white/10 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter Period</span>
        </button>
      </header>

      {/* Hero: Financial Flow Dial */}
      <section className="relative w-full h-[250px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex flex-col items-center justify-center mb-4">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-royal-purple/10" />
         
         {/* Semi-circle dial */}
         <div className="relative w-64 h-32 overflow-hidden flex items-end justify-center mb-2">
            <div className="w-64 h-64 rounded-full border-[16px] border-royal-purple/20 absolute top-0" />
            <div className="w-64 h-64 rounded-full border-[16px] border-emerald-400 absolute top-0 transition-transform duration-1000" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: 'rotate(45deg)' }} />
            
            <div className="absolute bottom-4 flex flex-col items-center">
               <span className="text-xs text-lilac uppercase tracking-wider font-semibold">Net Flow (MTD)</span>
               <span className="text-3xl font-bold text-white tracking-tighter mt-1">₦{netFlow.toLocaleString()}</span>
            </div>
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Income (MTD)" value={`₦${totalIncome.toLocaleString()}`} trend={0} icon={<Wallet/>} />
        <MetricCard title="Total Expenses (MTD)" value={`₦${totalExpenses.toLocaleString()}`} trend={0} icon={<Wallet/>} />
        <MetricCard title="Reserve Fund" value="₦0" trend={0} icon={<Wallet/>} />
        <MetricCard title="Digital Giving %" value="0%" trend={0} icon={<Wallet/>} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!loading && (
            <ChartPanel 
              title="Income vs Expense Trend (Recent Reports)" 
              data={financeData} 
              dataKey="income" 
              xAxisKey="week" 
              valuePrefix="₦"
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Financial Intelligence</h3>
          <InsightCard 
            type="positive"
            content={`You have a net positive inflow of ₦${netFlow.toLocaleString()} based on your recently submitted reports.`}
          />
          <InsightCard 
            type="neutral"
            content="Regularly submit your weekly and monthly financial reports to ensure dashboard accuracy and clear communication with the administration."
          />
        </div>
      </section>

    </div>
  );
}

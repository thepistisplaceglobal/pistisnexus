import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { ChartPanel } from "@/components/ui/ChartPanel";
import { Filter, Wallet } from "lucide-react";

export function Finance() {
  const mockFinanceData = [
    { week: "W1", income: 32000, expenses: 14000 },
    { week: "W2", income: 34500, expenses: 13500 },
    { week: "W3", income: 31000, expenses: 18000 },
    { week: "W4", income: 42000, expenses: 15200 },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            The Pistis Place Finance Intelligence Hub
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
            <div className="w-64 h-64 rounded-full border-[16px] border-emerald-400 absolute top-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: 'rotate(45deg)' }} />
            
            <div className="absolute bottom-4 flex flex-col items-center">
               <span className="text-xs text-lilac uppercase tracking-wider font-semibold">Net Flow (MTD)</span>
               <span className="text-3xl font-bold text-white tracking-tighter mt-1">₦78.6M</span>
            </div>
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Income (MTD)" value="₦139M" trend={8.2} icon={<Wallet/>} />
        <MetricCard title="Total Expenses (MTD)" value="₦60.7M" trend={-4.1} icon={<Wallet/>} />
        <MetricCard title="Reserve Fund" value="₦420M" trend={2.5} icon={<Wallet/>} />
        <MetricCard title="Digital Giving %" value="82%" trend={5.0} icon={<Wallet/>} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartPanel 
            title="Income vs Expense Trend (4 Weeks)" 
            data={mockFinanceData} 
            dataKey="income" 
            xAxisKey="week" 
            valuePrefix="₦"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Financial Intelligence</h3>
          <InsightCard 
            type="positive"
            content="Digital giving platforms account for 82% of all inflows this month, reducing administrative processing time by 40%."
          />
          <InsightCard 
            type="warning"
            content="Facility maintenance expenses spiked in W3 across the Hub and Annex branches. Review requested."
          />
           <InsightCard 
            type="neutral"
            content="Projected surplus for year-end is tracking safely above the requisite margin for the new building fund."
          />
        </div>
      </section>

    </div>
  );
}

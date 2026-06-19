import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Filter, Network, MapPin } from "lucide-react";
import { BranchMap } from "@/components/ui/BranchMap";
import { ReportingWidget } from "@/components/ui/ReportingWidget";

export function Branches() {
  const branches = [
    { name: "The Pistis Place Uyo", location: "Uyo (HQ)", attendance: 4200, growth: 12, lat: 5.03, lng: 7.92 },
    { name: "The Pistis Place Calabar", location: "Calabar", attendance: 1150, growth: 8, lat: 4.97, lng: 8.35 },
    { name: "The Pistis Place Portharcourt", location: "Portharcourt", attendance: 0, growth: 0, lat: 4.81, lng: 7.01 },
    { name: "The Pistis Place Lagos", location: "Lagos", attendance: 0, growth: 0, lat: 6.52, lng: 3.37 },
    { name: "The Pistis Place Abuja", location: "Abuja", attendance: 0, growth: 0, lat: 9.07, lng: 7.39 },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            The Pistis Place Branch Intelligence Hub
          </h1>
          <p className="text-lilac/80 font-medium">Multi-branch Coordination & Metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-royal-purple/30 text-white hover:bg-white/10 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter Regions</span>
        </button>
      </header>

      {/* Hero: Network Map Simulation */}
      <section className="relative w-full h-[400px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center mb-4">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#7851A91A_1px,transparent_1px),linear-gradient(to_bottom,#7851A91A_1px,transparent_1px)] bg-[size:2rem_2rem]" />
         <div className="relative w-full h-full z-10">
            <BranchMap data={branches} />
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard title="Total City Expressions" value="5" trend={0} />
        <MetricCard title="Avg Branch Growth" value="8.5%" trend={8.5} />
        <MetricCard title="Total Departments" value="24" trend={2.0} />
        <MetricCard title="Total Staff" value="142" trend={2} />
        <MetricCard title="Global Home Cells" value="86" trend={5.2} />
        <MetricCard title="Interest Groups" value="11" trend={8.0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Branch Performance Directory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map(b => (
               <GlassCard key={b.name} className="flex hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex flex-col w-full">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className="text-white font-semibold text-lg">{b.name}</h4>
                           <div className="flex items-center text-xs text-lilac/80 mt-1">
                              <MapPin className="w-3 h-3 mr-1"/> {b.location}
                           </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-black/20 ${b.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {b.growth > 0 ? '+' : ''}{b.growth}%
                        </span>
                     </div>
                     <div className="flex justify-between items-end mt-auto">
                        <div className="text-sm text-lavender font-medium">
                           <span className="text-xl font-bold text-white tracking-tight mr-2">{b.attendance}</span>
                           Avg Attendance
                        </div>
                     </div>
                  </div>
               </GlassCard>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ReportingWidget unitType="Branch" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Regional AI Insights</h3>
          <InsightCard 
            type="positive"
            content="Uyo branch shows the highest acceleration in first-timer retention (65%), outperforming the global average by 15%."
          />
          <InsightCard 
            type="warning"
            content="3 new City Expressions (Portharcourt, Lagos, Abuja) are currently in pending operational status and require staff allocations."
          />
        </div>
      </section>

    </div>
  );
}

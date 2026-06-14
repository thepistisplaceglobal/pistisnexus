import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { Filter, Home, MapPin, Users } from "lucide-react";
import { ReportingWidget } from "@/components/ui/ReportingWidget";
import { GlassCard } from "@/components/ui/GlassCard";

const homeCellsList = [
  { name: "Abak Road Home Cell", leaders: "Ms Emem Ekarika & Mr Chukwuemeka" },
  { name: "Atiku Home Cell", leaders: "Mr Mamaki and Amah victor" },
  { name: "Ibesikpo Home Cell", leaders: "Mr Wisdom Hillary" },
  { name: "Ikotekpene Road Home Cell", leaders: "Ms Kubiat Nkereuwem" },
  { name: "Ekom Iman and Idoro Home Cell", leaders: "Mr Godfrey Anietie" },
  { name: "Aka Road Home Cell", leaders: "Mr Uyoata Joseph and Miss Chinonyelim" },
  { name: "AKSU Home Cell", leaders: "Ms Sophia" },
  { name: "Nwaniba Home Cell", leaders: "Mr Obongekeme Eniang" },
  { name: "Oron Road Home Cell", leaders: "Mr Favour Nkamare" },
];

export function HomeCells() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Home Cell Intelligence Hub
          </h1>
          <p className="text-lilac/80 font-medium">Community Discipleship & Growth Dynamics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-royal-purple/30 text-white hover:bg-white/10 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter Cells</span>
        </button>
      </header>

      {/* Hero: Lifecycle Orb */}
      <section className="relative w-full h-[250px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center mb-4">
         <div className="absolute inset-0 bg-gradient-to-r from-royal-purple/5 to-transparent" />
         <div className="relative w-full h-full flex items-center justify-center">
            
            <div className="relative flex items-center justify-center">
               {/* Center pulsing orb for Home cells */}
               <div className="w-24 h-24 rounded-full bg-lilac/20 border-2 border-royal-purple shadow-[0_0_40px_rgba(120,81,169,0.5)] flex items-center justify-center z-10 anchor">
                   <Home className="w-8 h-8 text-white" />
               </div>

               {/* Orbiting smaller cells */}
               <div className="absolute w-[300px] h-[300px] animate-[spin_15s_linear_infinite]">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 absolute top-0 left-1/2 -ml-2 shadow-[0_0_15px_#34d399]" />
                  <div className="w-4 h-4 rounded-full bg-amber-400 absolute bottom-0 left-1/2 -ml-2 shadow-[0_0_15px_#fbbf24]" />
                  <div className="w-4 h-4 rounded-full bg-rose-400 absolute left-0 top-1/2 -mt-2 shadow-[0_0_15px_#fb7185]" />
               </div>
            </div>

            <div className="absolute top-4 left-6">
              <h2 className="text-sm font-bold text-white/90 tracking-wide uppercase">Cell Propagation</h2>
            </div>
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Active Cells" value="86" trend={5.2} />
        <MetricCard title="Avg Cell Attendance" value="14" trend={1.2} />
        <MetricCard title="Cells Ready to Split" value="12" trend={0} />
        <MetricCard title="Soul Retention" value="78%" trend={-2.1} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <GlassCard className="flex flex-col gap-4 overflow-hidden p-0 max-h-[600px]">
             <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0B0118]/80 backdrop-blur-md z-10">
               <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Active Home Cells</h3>
             </div>
             <div className="overflow-y-auto px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               {homeCellsList.map((cell, index) => (
                 <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3 transition-colors hover:bg-white/10 group">
                   <div className="flex items-start gap-3">
                     <div className="p-2.5 rounded-lg bg-royal-purple/20 border border-royal-purple/30 shrink-0">
                       <MapPin className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div className="flex flex-col">
                       <h4 className="text-white font-bold text-sm md:text-base leading-tight group-hover:text-amber-400 transition-colors">{cell.name}</h4>
                     </div>
                   </div>
                   <div className="pt-3 mt-auto border-t border-white/5 flex items-start gap-2 text-sm text-lilac/80">
                     <Users className="w-4 h-4 mt-0.5 text-lilac/50 shrink-0" />
                     <div>
                        <span className="block text-xs uppercase tracking-wider text-lilac/50 font-semibold mb-0.5">Leaders</span>
                        <span>{cell.leaders}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <ReportingWidget unitType="SubBranch" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Cell Intelligence</h3>
          <InsightCard 
            type="positive"
            content="12 cells have reached the 20-member threshold. Suggest initiating leadership training for planned splits next month."
          />
          <InsightCard 
             type="warning"
             content="Soul retention in Island region cells dropped slightly. Needs pastoral care check-in."
          />
        </div>
      </section>

    </div>
  );
}

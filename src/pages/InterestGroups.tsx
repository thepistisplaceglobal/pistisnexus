import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { Filter, Compass, Briefcase, Landmark, TrendingUp, GraduationCap, Palette, Megaphone, Stethoscope, Scissors, Scale, Monitor, Building } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ReportingWidget } from "@/components/ui/ReportingWidget";

const interestGroupsList = [
  {
    name: "CEO's – Rising Leaders & Professionals",
    who: "Executives, managers, emerging corporate leaders.",
    focus: "Raise boardroom decision-makers who represent God through excellence and influence policy direction.",
    icon: Briefcase,
    color: "text-blue-400"
  },
  {
    name: "Civil Service – Directors Hub",
    who: "Government officials, senior civil servants.",
    focus: "Raise reformers inside government systems who influence transparency and excellence.",
    icon: Landmark,
    color: "text-amber-400"
  },
  {
    name: "Billionaires – Entrepreneurs",
    who: "Founders, investors, high-capacity builders.",
    focus: "Build kingdom financiers and industry captains who shape economic ecosystems.",
    icon: TrendingUp,
    color: "text-emerald-400"
  },
  {
    name: "Scholars – Students & Academicians",
    who: "Students, lecturers, researchers.",
    focus: "Raise idea shapers who influence academia and intellectual discourse.",
    icon: GraduationCap,
    color: "text-purple-400"
  },
  {
    name: "Creatives",
    who: "Designers, writers, photographers, filmmakers, artists.",
    focus: "Shape culture narratives and redefine excellence in creative industries.",
    icon: Palette,
    color: "text-pink-400"
  },
  {
    name: "Influencers",
    who: "Social media personalities, public figures, content creators.",
    focus: "Control narratives online and shift culture conversations toward kingdom values.",
    icon: Megaphone,
    color: "text-orange-400"
  },
  {
    name: "Medical",
    who: "Doctors, nurses, pharmacists, health professionals.",
    focus: "Represent God through healing, compassion, and medical integrity.",
    icon: Stethoscope,
    color: "text-red-400"
  },
  {
    name: "Fashion",
    who: "Designers, stylists, fashion entrepreneurs.",
    focus: "Shape identity, aesthetics, and cultural expression with kingdom excellence.",
    icon: Scissors,
    color: "text-indigo-400"
  },
  {
    name: "Law",
    who: "Lawyers, legal practitioners.",
    focus: "Raise legal reformers who defend justice and influence legislative direction.",
    icon: Scale,
    color: "text-stone-400"
  },
  {
    name: "TECH Mountain: Innovation & Digital Infrastructure",
    who: "Developers, engineers, IT professionals, product designers, etc.",
    focus: "Raise digital architects who shape platforms & ecosystems with kingdom excellence.",
    icon: Monitor,
    color: "text-cyan-400"
  },
  {
    name: "Real Estate",
    who: "Realtors, developers, property consultants.",
    focus: "Influence urban development and property ecosystems with integrity and wisdom.",
    icon: Building,
    color: "text-slate-300"
  }
];

export function InterestGroups() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Interest Group Intelligence Hub
          </h1>
          <p className="text-lilac/80 font-medium">Community Engagement & Initiatives</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-royal-purple/30 text-white hover:bg-white/10 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter Groups</span>
        </button>
      </header>

      {/* Hero: Group Network Orb */}
      <section className="relative w-full h-[250px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center mb-4">
         <div className="absolute inset-0 bg-gradient-to-l from-royal-purple/5 to-transparent" />
         <div className="relative w-full h-full flex items-center justify-center">
            
            <div className="relative flex items-center justify-center">
               <div className="w-24 h-24 rounded-full bg-lilac/20 border-2 border-fuchsia-400/50 shadow-[0_0_40px_rgba(232,121,249,0.5)] flex items-center justify-center z-10 anchor">
                   <Compass className="w-8 h-8 text-fuchsia-400" />
               </div>

               <div className="absolute w-[350px] h-[350px] animate-[spin_20s_linear_infinite]">
                  <div className="w-5 h-5 rounded-md rotate-45 bg-amber-400 absolute top-0 left-1/2 -ml-2.5 shadow-[0_0_15px_#fbbf24]" />
                  <div className="w-5 h-5 rounded-md rotate-12 bg-sky-400 absolute bottom-0 left-1/2 -ml-2.5 shadow-[0_0_15px_#38bdf8]" />
                  <div className="w-5 h-5 rounded-md rotate-90 bg-emerald-400 absolute left-0 top-1/2 -mt-2.5 shadow-[0_0_15px_#34d399]" />
               </div>
            </div>

            <div className="absolute top-4 left-6">
              <h2 className="text-sm font-bold text-white/90 tracking-wide uppercase">Group Network</h2>
            </div>
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Active Groups" value="11" trend={8.0} />
        <MetricCard title="Total Registered" value="450" trend={12.5} />
        <MetricCard title="New Signups (MTD)" value="45" trend={5.2} />
        <MetricCard title="Active Projects" value="12" trend={0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <GlassCard className="flex flex-col gap-4 overflow-hidden p-0 max-h-[600px]">
             <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0B0118]/80 backdrop-blur-md z-10">
               <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Kingdom Spheres of Influence</h3>
             </div>
             <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-4">
               {interestGroupsList.map((group, index) => {
                 const Icon = group.icon;
                 return (
                   <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4 items-start">
                     <div className="p-3 rounded-lg bg-black/20 shrink-0">
                       <Icon className={`w-6 h-6 ${group.color}`} />
                     </div>
                     <div className="flex flex-col gap-1">
                       <h4 className="text-white font-semibold">{group.name}</h4>
                       <p className="text-sm text-lilac/90"><span className="font-semibold text-lilac">Who they are:</span> {group.who}</p>
                       <p className="text-sm text-white/70 italic mt-1"><span className="not-italic text-amber-400/80 mr-1 text-xs uppercase tracking-wide">Dominion Focus:</span>{group.focus}</p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <ReportingWidget unitType="SubBranch" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Group Intelligence</h3>
          <InsightCard 
            type="positive"
            content="TECH Mountain and Billionaires groups are generating significant traction this month with rising leaders."
          />
          <InsightCard 
             type="neutral"
             content="Creatives and Influencers could collaborate for the upcoming media campaign to align culture narratives."
          />
        </div>
      </section>
    </div>
  );
}

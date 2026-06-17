import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { Filter, Users, Radio, Music, Wrench, HandHeart, Users2, Globe, Heart, Baby, Users as UsersIcon, Shield, Briefcase, FileSearch, Drama, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ReportingWidget } from "@/components/ui/ReportingWidget";

const officialDepartments = [
  { 
    name: "Media", 
    icon: Radio, 
    color: "text-blue-400",
    desc: "Coordinates church live broadcasting, audio-visual production, and online media presence."
  },
  { 
    name: "The Living Portals (Choir)", 
    icon: Music, 
    color: "text-pink-400",
    desc: "Enriches the worship experience and leads the congregation in praise and spiritual song."
  },
  { 
    name: "Technical", 
    icon: Wrench, 
    color: "text-amber-400",
    desc: "Manages power, professional acoustics, sound reinforcement, and lighting for all services."
  },
  { 
    name: "Ushering", 
    icon: HandHeart, 
    color: "text-emerald-400",
    desc: "Maintains orderliness, coordinates seating, and administers collections and welcoming flows."
  },
  { 
    name: "Pastoral Team / Greeters", 
    icon: Users2, 
    color: "text-purple-400",
    desc: "Nurtures relational connection with first-time guests and oversees pastoral care integration."
  },
  { 
    name: "Evangelism & Missions", 
    icon: Globe, 
    color: "text-cyan-400",
    desc: "Drives community soul-winning campaigns, outreach, and local/foreign missionary works."
  },
  { 
    name: "Welfare", 
    icon: Heart, 
    color: "text-red-400",
    desc: "Extends material, financial, and emotional support to church members in times of need."
  },
  { 
    name: "Children’s Church", 
    icon: Baby, 
    color: "text-orange-400",
    desc: "Nurtures our children (ages 1-12) to understand the faith in a secure, fun-filled setting."
  },
  { 
    name: "Teens Church", 
    icon: UsersIcon, 
    color: "text-indigo-400",
    desc: "Inspires and mentors teenagers to build an uncompromised spiritual foundation."
  },
  { 
    name: "Intercessory", 
    icon: Shield, 
    color: "text-stone-400",
    desc: "Anchors the daily, global, and corporate prayer watches and spiritual warfare coverage."
  },
  { 
    name: "Protocol", 
    icon: Briefcase, 
    color: "text-slate-300",
    desc: "Manages special invitations, minister logistics, executive security, and hospitality."
  },
  { 
    name: "Follow-up", 
    icon: FileSearch, 
    color: "text-fuchsia-400",
    desc: "Contacts, coordinates, and transitions new converts and guests into active fellowship."
  },
  { 
    name: "Pistis Art", 
    icon: Drama, 
    color: "text-rose-400",
    desc: "Communicates the timeless message of the gospel through creative drama, theater, and performing arts."
  },
  { 
    name: "Sanctuary Keepers", 
    icon: Sparkles, 
    color: "text-[#B193FB]",
    desc: "Maintains a clean, pristine, hygienic, and spiritually welcoming sanctuary environment always."
  }
];

export function Departments() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            The Pistis Place Department Operations Hub
          </h1>
          <p className="text-lilac/80 font-medium">Workforce & Service Group Intelligence</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-royal-purple/30 text-white hover:bg-white/10 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter Departments</span>
        </button>
      </header>

      {/* Hero: Activity Heat Ring */}
      <section className="relative w-full h-[250px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center mb-4">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-royal-purple/20 via-transparent to-transparent opacity-50" />
         
         <div className="relative flex items-center justify-center w-full max-w-sm h-full">
            <div className="w-48 h-48 rounded-full border-4 border-royal-purple/30 flex items-center justify-center">
               <div className="w-32 h-32 rounded-full border-[10px] border-emerald-400/80 shadow-[0_0_30px_#34d39980] flex flex-col items-center justify-center bg-[#0B0118]/80 backdrop-blur-md">
                   <Users className="w-6 h-6 text-emerald-400 mb-1" />
                   <span className="text-xl font-bold text-white tracking-tighter">88%</span>
                   <span className="text-[10px] text-lilac uppercase tracking-wider font-semibold">Activity</span>
               </div>
            </div>
            
            {/* Small nodes denoting departments */}
            <div className="absolute w-56 h-56 rounded-full border border-dashed border-lilac/20 animate-[spin_40s_linear_infinite]" />
         </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Volunteers" value="980" trend={4.8}  />
        <MetricCard title="Active Departments" value="14" trend={16.6}  />
        <MetricCard title="Avg Check-in Rate" value="93.5%" trend={1.5}  />
        <MetricCard title="Training Completed" value="448" trend={8.7}  />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <GlassCard className="flex flex-col gap-4 overflow-hidden p-0 max-h-[800px]">
             <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0B0118]/80 backdrop-blur-md z-10 flex justify-between items-center">
               <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Official Departments Dashboard</h3>
               <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-mono">14 Active Departments</span>
             </div>
             <div className="overflow-y-auto px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               {officialDepartments.map((dept, index) => {
                 const Icon = dept.icon;
                 return (
                   <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4 transition-all hover:bg-white/10 hover:-translate-y-1">
                     <div className="p-3 rounded-lg bg-black/20 shrink-0 h-12 w-12 flex items-center justify-center">
                       <Icon className={`w-6 h-6 ${dept.color}`} />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-white font-semibold text-sm leading-tight mb-1">{dept.name}</h4>
                       <p className="text-xs text-lilac/70 line-clamp-2 leading-normal">{dept.desc}</p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <ReportingWidget unitType="SubBranch" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Operations Insights</h3>
          <InsightCard 
            type="positive"
            content="Media, Protocol, and the newly launched Pistis Art (Theater) teams show consistently high punctuality across major services."
          />
          <InsightCard 
            type="positive"
            content="Sanctuary Keepers have established a comprehensive cleaning rotation schedule ensuring total pristine state before all major weekly services."
          />
          <InsightCard 
            type="warning"
            content="Choir rehearsal attendance dipped last week. Suggest syncing with Choir Admin to review scheduling."
          />
        </div>
      </section>

    </div>
  );
}

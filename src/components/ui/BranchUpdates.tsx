import { GlassCard } from "./GlassCard";
import { MessageSquare, Megaphone, Bell } from "lucide-react";

interface UpdateItem {
  id: string;
  branch: string;
  author: string;
  title: string;
  content: string;
  time: string;
  type: "announcement" | "update" | "alert";
}

const mockUpdates: UpdateItem[] = [
  {
    id: "1",
    branch: "Uyo (HQ)",
    author: "Global Operations",
    title: "Global Leadership Summit",
    content: "All branch administrators are expected to attend the virtual summit next Wednesday to discuss quarterly metrics.",
    time: "2 hours ago",
    type: "announcement"
  },
  {
    id: "2",
    branch: "Calabar",
    author: "Resident Pastor",
    title: "Facility Upgrade Complete",
    content: "The new youth auditorium is fully operational. Special thanksgiving and inauguration holding this Sunday.",
    time: "5 hours ago",
    type: "update"
  },
  {
    id: "3",
    branch: "Portharcourt",
    author: "Setup Team",
    title: "Location Secured",
    content: "Lease agreement signed. Internal renovations and acoustic treatments beginning immediately.",
    time: "1 day ago",
    type: "update"
  },
  {
    id: "4",
    branch: "Uyo (HQ)",
    author: "Welfare Dept",
    title: "Community Outreach",
    content: "Over 500 families reached in our recent weekend drive in the host community.",
    time: "2 days ago",
    type: "update"
  }
];

export function BranchUpdates() {
  return (
    <GlassCard className="flex flex-col overflow-hidden p-0 h-[300px] sm:h-auto sm:max-h-[350px]">
      <div className="p-4 border-b border-white/5 sticky top-0 bg-[#0B0118]/90 backdrop-blur-md z-10 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wide uppercase text-lilac flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" /> Pistis Nexus Updates
        </h3>
        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-sm tracking-wider">Live</span>
      </div>
      <div className="overflow-y-auto px-4 pb-4 pt-3 flex flex-col gap-3 scrollbar-hide">
        {mockUpdates.map((update) => (
          <div key={update.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 transition-colors hover:bg-white/10 group">
             <div className="flex justify-between items-start">
                <span className="text-xs text-emerald-400 font-semibold">{update.branch}</span>
                <span className="text-xs text-white/40">{update.time}</span>
             </div>
             <h4 className="text-sm font-bold text-white group-hover:text-lilac transition-colors">{update.title}</h4>
             <p className="text-sm text-lilac/80 leading-relaxed">{update.content}</p>
             <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-white/50">
               {update.type === 'announcement' ? <Megaphone className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
               <span>{update.author}</span>
             </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

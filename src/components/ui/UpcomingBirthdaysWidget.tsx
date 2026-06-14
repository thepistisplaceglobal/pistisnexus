import React from 'react';
import { GlassCard } from "./GlassCard";
import { Gift, Cake, CalendarDays } from "lucide-react";

export function UpcomingBirthdaysWidget() {
  const birthdays = [
    { id: 1, name: "Ekemini Iyanam", role: "The Living Portals", date: "Today", branch: "Uyo (HQ)", isToday: true },
    { id: 2, name: "Tessy Peter", role: "Cell Leader", date: "Tomorrow", branch: "Calabar", isToday: false },
    { id: 3, name: "Mfoniso Fabian", role: "Media Dept", date: "Friday", branch: "Uyo (HQ)", isToday: false },
    { id: 4, name: "Kingdavid James", role: "Media Dept", date: "Saturday", branch: "Lagos", isToday: false },
  ];

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-white">Upcoming Birthdays</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Cake className="w-3.5 h-3.5" />
          <span>This Week</span>
        </div>
      </div>
      
      <p className="text-xs text-lilac/70 -mt-2">
        Keep track of upcoming member birthdays for pastoral care and well-wishes.
      </p>

      <div className="flex flex-col gap-3 mt-2">
        {birthdays.map((person) => (
          <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-400/30">
                <CalendarDays className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-white">{person.name}</span>
                <span className="text-xs text-lilac/70">{person.role} • {person.branch}</span>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${person.isToday ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/80'}`}>
              {person.date}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

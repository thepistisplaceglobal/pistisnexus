import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Clock, Send, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { NotificationService } from "@/services/notificationService";

interface PendingUnit {
  id: string;
  name: string;
  type: string;
  leaderName: string;
}

export function BranchPendingReportsWidget() {
  const user = useAppStore((state) => state.user);
  const { sendBranchMessage } = useAppStore();
  const [pendingUnits, setPendingUnits] = useState<PendingUnit[]>([]);
  const [nudged, setNudged] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== "BRANCH_ADMIN") return;

    // Expected units list for this branch setup
    const expectedUnits: PendingUnit[] = [
      { id: "1", name: "Media Department", type: "Department", leaderName: "Alex Costa" },
      { id: "2", name: "Choir (Sounds of Pistis)", type: "Department", leaderName: "Sarah Jenkins" },
      { id: "3", name: "Ushering Dept", type: "Department", leaderName: "Michael Obi" },
      { id: "4", name: "Grace Home Cell", type: "Home Cell", leaderName: "David Ojo" },
    ];

    const fetchSubmitted = async () => {
      const { data, error } = await supabase
        .from("unit_reports")
        .select("unit_name")
        .eq("branch_name", user.branchName);

      if (!error && data) {
        const submittedNames = new Set(data.map((d) => d.unit_name));
        setPendingUnits(expectedUnits.filter((u) => !submittedNames.has(u.name)));
      } else {
        setPendingUnits(expectedUnits);
      }
    };

    fetchSubmitted();

    // Subscribe to realtime inserts on unit_reports
    const channel = supabase
      .channel("unit_reports_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "unit_reports",
          filter: `branch_name=eq.${user.branchName}`,
        },
        (payload) => {
          fetchSubmitted();
          if (payload.new) {
            NotificationService.sendLocalNotification("Report Aggregation Update", {
              body: `${(payload.new as any).unit_name} has filed a report.`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNudge = async (id: string, leaderName: string, unitName: string) => {
    if (!user) return;
    setNudged((prev) => new Set(prev).add(id));
    
    // Send a real-time message to nudge the leader
    await sendBranchMessage({
      content: `Hello ${leaderName}, this is a gentle reminder to submit the ${unitName} weekly report. The deadline is approaching!`,
      author_name: user.name,
      author_role: user.role,
      branch_name: user.branchName || "Unknown",
    });
  };

  if (!user || user.role !== "BRANCH_ADMIN") return null;

  return (
    <GlassCard className="flex flex-col gap-4 border-amber-400/20 bg-amber-400/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-medium tracking-wide uppercase text-amber-400">
            Pending Reports Overview
          </h3>
        </div>
        <span className="text-xs text-amber-400 bg-amber-400/10 py-1 px-2 rounded-md font-bold">
          {pendingUnits.length} Pending
        </span>
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {pendingUnits.length === 0 ? (
          <div className="text-center py-6 text-emerald-400/70 text-sm flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 opacity-50" />
            <p>All departments and cells have submitted their reports!</p>
          </div>
        ) : (
          pendingUnits.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{unit.name}</p>
                <p className="text-xs text-white/50">
                  {unit.type} • {unit.leaderName}
                </p>
              </div>
              <button
                onClick={() => handleNudge(unit.id, unit.leaderName, unit.name)}
                disabled={nudged.has(unit.id)}
                className={`py-1.5 px-3 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  nudged.has(unit.id)
                    ? "bg-emerald-500/20 text-emerald-400 cursor-not-allowed border border-emerald-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10"
                }`}
              >
                {nudged.has(unit.id) ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Sent Nudge
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" /> Nudge Leader
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

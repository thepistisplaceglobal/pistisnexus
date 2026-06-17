import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "./GlassCard";
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  UserX,
  Clock,
  ShieldAlert
} from "lucide-react";

interface MissingUnit {
  id: string;
  name: string;
  type: "Department" | "Foundation School";
  leaderName: string;
  contactEmail?: string;
}

export function BranchDeadlineViolationAlert() {
  const user = useAppStore((state) => state.user);
  const { sendBranchMessage } = useAppStore();
  const [missingUnits, setMissingUnits] = useState<MissingUnit[]>([]);
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Default expected mandatory reports for department and foundation
  const defaultMandatoryUnits: MissingUnit[] = [
    { id: "v1", name: "Media Department", type: "Department", leaderName: "Alex Costa" },
    { id: "v2", name: "Choir (Sounds of Pistis)", type: "Department", leaderName: "Sarah Jenkins" },
    { id: "v3", name: "Ushering Dept", type: "Department", leaderName: "Michael Obi" },
    { id: "v4", name: "Foundation School", type: "Foundation School", leaderName: "Sister Rose" }
  ];

  const fetchSubmissions = async () => {
    if (!user?.branchName) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("unit_reports")
        .select("unit_name, unit_type, created_at")
        .eq("branch_name", user.branchName);

      if (error) throw error;

      // Filter reports submitted in the last 7 days (weekly range)
      const now = new Date();
      const submittedInLastWeek = new Set<string>();

      if (data) {
        data.forEach((r) => {
          const reportDate = new Date(r.created_at);
          const diffTime = Math.abs(now.getTime() - reportDate.getTime());
          const isWeekly = diffTime <= 7 * 24 * 60 * 60 * 1000;

          if (isWeekly) {
            // Add normalized match string
            submittedInLastWeek.add(r.unit_name.toLowerCase().trim());
          }
        });
      }

      // Check which mandatory units have not submitted
      const outstanding = defaultMandatoryUnits.filter((u) => {
        const lowerName = u.name.toLowerCase().trim();
        // Support flexible matches (e.g., matching "choir" vs "choir (sounds of pistis)")
        const hasDirectMatch = submittedInLastWeek.has(lowerName);
        
        let hasFlexibleMatch = false;
        if (lowerName.includes("choir")) {
          hasFlexibleMatch = Array.from(submittedInLastWeek).some(s => s.includes("choir"));
        } else if (lowerName.includes("ushering")) {
          hasFlexibleMatch = Array.from(submittedInLastWeek).some(s => s.includes("ushering"));
        } else if (lowerName.includes("foundation")) {
          hasFlexibleMatch = Array.from(submittedInLastWeek).some(s => s.includes("foundation"));
        }

        return !hasDirectMatch && !hasFlexibleMatch;
      });

      setMissingUnits(outstanding);
    } catch (err) {
      console.error("Error evaluating deadline violations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "BRANCH_ADMIN") return;

    fetchSubmissions();

    // Subscribe to realtime submissions to auto-resolve alerts
    const channel = supabase
      .channel("deadline_unit_reports_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "unit_reports",
          filter: `branch_name=eq.${user.branchName}`,
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || user.role !== "BRANCH_ADMIN") return null;

  // Determine if past Sunday 11:59 PM deadline
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isPastDeadline = currentDay !== 0 || (currentDay === 0 && (hours >= 23 && minutes >= 59));

  // If everything is submitted, or if we are not past the deadline yet and everything looks good, skip
  if (missingUnits.length === 0) return null;

  // Render warning message details
  const triggerNudge = async (unit: MissingUnit) => {
    setNudged((prev) => new Set(prev).add(unit.id));
    
    await sendBranchMessage({
      content: `⚠️ [DEADLINE EXPIRED ALERT] Hello ${unit.leaderName}, your weekly report for "${unit.name}" was due on Sunday at 11:59 PM and is currently OVERDUE. Please log in to submit your metrics as soon as possible.`,
      author_name: user.name,
      author_role: user.role,
      branch_name: user.branchName || "Unknown",
    });
  };

  const triggerNudgeAll = async () => {
    const listToNudge = missingUnits.filter(u => !nudged.has(u.id));
    if (listToNudge.length === 0) return;

    const newNudged = new Set(nudged);
    for (const unit of listToNudge) {
      newNudged.add(unit.id);
      await sendBranchMessage({
        content: `🚨 [CRITICAL REMINDER] Hello ${unit.leaderName}, the Sunday 11:59 PM weekly deadline has expired. The report for "${unit.name}" is marked as DELINQUENT. Please submit immediately to complete our branch cross-sector aggregation.`,
        author_name: user.name,
        author_role: user.role,
        branch_name: user.branchName || "Unknown",
      });
    }
    setNudged(newNudged);
  };

  return (
    <GlassCard className="border border-red-500/30 bg-red-950/10 p-5 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest font-mono">
                {isPastDeadline ? "Deadline Expired" : "Deadline Approaching"}
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/40" /> Sunday 11:59 PM
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Outstanding Weekly Reports Highlighted
            </h3>
          </div>
        </div>

        {missingUnits.some(u => !nudged.has(u.id)) && (
          <button
            onClick={triggerNudgeAll}
            className="w-full sm:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 rounded-xl text-red-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-3.5 h-3.5" /> Nudge All Late Leaders
          </button>
        )}
      </div>

      <p className="text-white/70 text-xs md:text-sm leading-relaxed max-w-4xl">
        The branch coordination engine detects the following core sector(s) have not recorded their metrics for the current reporting cycle. The weekly compile threshold has expired, causing a gap in aggregated branch intelligence.
      </p>

      {/* Grid of Highlighted Late Sectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
        {missingUnits.map((unit) => {
          const isUnitNudged = nudged.has(unit.id);
          return (
            <div 
              key={unit.id}
              className="flex items-center justify-between border border-red-500/20 bg-red-950/20 rounded-xl p-3.5 transition-all hover:bg-red-950/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider font-mono">
                    {unit.type}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{unit.name}</h4>
                  <p className="text-xs text-white/50">{unit.leaderName} (Leader)</p>
                </div>
              </div>

              <button
                onClick={() => triggerNudge(unit)}
                disabled={isUnitNudged}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isUnitNudged
                    ? "bg-emerald-500/15 text-emerald-400 cursor-not-allowed border border-emerald-500/20"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-200 cursor-pointer border border-red-500/30"
                }`}
              >
                {isUnitNudged ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Nudged
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Nudge
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

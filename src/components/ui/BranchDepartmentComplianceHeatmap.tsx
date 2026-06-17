import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "./GlassCard";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Minus, 
  Send, 
  HelpCircle, 
  UserSquare2, 
  TrendingUp,
  Inbox,
  Sparkles,
  CalendarDays
} from "lucide-react";

interface HeatmapCell {
  weekLabel: string;
  dateStr: string;
  status: "verified" | "pending" | "late" | "upcoming" | "not-due";
  reportId?: string;
  submittedAt?: string;
  submitter?: string;
  attendance?: number;
  revenue?: number;
}

interface RowData {
  unitName: string;
  leaderName: string;
  leaderRole: string;
  cells: { [key: string]: HeatmapCell };
  complianceScore: number; // percentage of on-time submissions
}

export function BranchDepartmentComplianceHeatmap() {
  const user = useAppStore((state) => state.user);
  const { sendBranchMessage } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RowData[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ unitName: string; leaderName: string; cell: HeatmapCell } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 5 Reference Weeks ending on Sundays
  const weekSundays = [
    { label: "Wk 20 (May 17)", dateStr: "2026-05-17" },
    { label: "Wk 21 (May 24)", dateStr: "2026-05-24" },
    { label: "Wk 22 (May 31)", dateStr: "2026-05-31" },
    { label: "Wk 23 (Jun 07)", dateStr: "2026-06-07" },
    { label: "Wk 24 (Jun 14)", dateStr: "2026-06-14" },
  ];

  // Core units we track
  const trackedUnits = [
    { name: "Media Department", leaderName: "Alex Costa", leaderRole: "Media Director" },
    { name: "Choir (Sounds of Pistis)", leaderName: "Sarah Jenkins", leaderRole: "Music Director" },
    { name: "Ushering Dept", leaderName: "Michael Obi", leaderRole: "Head Usher" },
    { name: "Children's Church", leaderName: "Pastor Liz", leaderRole: "Director" },
    { name: "Technical & Sound", leaderName: "Brother Eric", leaderRole: "AV Lead" },
    { name: "Foundation School", leaderName: "Sister Rose", leaderRole: "Coordinator" },
  ];

  const fetchComplianceData = async () => {
    if (!user?.branchName) return;

    try {
      setLoading(true);
      // Fetch all reports for this branch
      const { data: reports, error } = await supabase
        .from("unit_reports")
        .select("*")
        .eq("branch_name", user.branchName);

      if (error) throw error;

      const builtRows: RowData[] = trackedUnits.map((u) => {
        const rowCells: { [key: string]: HeatmapCell } = {};
        let scoreCount = 0;

        weekSundays.forEach((wk) => {
          // Find matching report for this unit and this week bounds
          const sunDate = new Date(wk.dateStr);
          const start = new Date(sunDate);
          start.setDate(sunDate.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          const end = new Date(sunDate);
          // Allow slightly late submissions up to Wednesday noon
          end.setDate(end.getDate() + 3);
          end.setHours(23, 59, 59, 999);

          const matchedReport = (reports || []).find((r) => {
            const reportTime = new Date(r.created_at).getTime();
            const matchesUnit =
              r.unit_name.toLowerCase().trim() === u.name.toLowerCase().trim() ||
              (u.name === "Foundation School" && r.unit_type === "FOUNDATION");
            const matchesTime = reportTime >= start.getTime() && reportTime <= end.getTime();
            return matchesUnit && matchesTime;
          });

          // Determine current deadline status helper
          const now = new Date();
          const targetDeadline = new Date(sunDate);
          targetDeadline.setHours(23, 59, 0, 0); // Sunday 11:59PM
          const isOverdue = now.getTime() > targetDeadline.getTime();

          let status: "verified" | "pending" | "late" | "not-due" = "not-due";
          if (matchedReport) {
            status = matchedReport.status === "APPROVED" ? "verified" : "pending";
            scoreCount++;
          } else if (isOverdue) {
            status = "late";
          }

          let attendance: number | undefined;
          let revenue: number | undefined;
          if (matchedReport?.metrics) {
            attendance = parseInt(matchedReport.metrics["Attendance"] || matchedReport.metrics["Total Attendance"] || matchedReport.metrics["Active Enrolled Students"]) || undefined;
            revenue = parseInt(matchedReport.metrics["Revenue"] || matchedReport.metrics["Regular Offering"] || matchedReport.metrics["Total Revenue"]) || undefined;
          }

          rowCells[wk.dateStr] = {
            weekLabel: wk.label,
            dateStr: wk.dateStr,
            status,
            reportId: matchedReport?.id,
            submittedAt: matchedReport?.created_at,
            submitter: matchedReport?.submitter_name,
            attendance,
            revenue
          };
        });

        const complianceScore = Math.round((scoreCount / weekSundays.length) * 100);

        return {
          unitName: u.name,
          leaderName: u.leaderName,
          leaderRole: u.leaderRole,
          cells: rowCells,
          complianceScore,
        };
      });

      setRows(builtRows);
    } catch (err) {
      console.error("Error fetching compliance map:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "BRANCH_ADMIN") {
      fetchComplianceData();
    }
  }, [user]);

  if (!user || user.role !== "BRANCH_ADMIN") return null;

  const triggerSingleNudge = async (unitName: string, leaderName: string, weekLabel: string) => {
    try {
      await sendBranchMessage({
        content: `🚨 [COMPLIANCE ALERT] Hello ${leaderName}, the report for "${unitName}" for ${weekLabel} is marked as UNRECOVERED or LATE. Please submit your metrics today to avoid skewing our branch stats.`,
        author_name: user.name,
        author_role: user.role,
        branch_name: user.branchName || "Unknown",
      });
      setSuccessMessage(`Automated notification dispatched to ${leaderName}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Nudge dispatch failure:", err);
    }
  };

  return (
    <GlassCard className="p-6 border border-purple-500/10 bg-purple-950/5 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-lilac">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold">Reporting Registry Dashboard</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Cross-Department Weekly Compliance Map</h3>
          <p className="text-xs text-lavender/40 mt-1">A real-time heatmap identifying reporting velocity and follow-up urgency.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-[#0B0118]/60 px-4 py-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <div className="w-3 h-3 rounded bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">✓</div>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <div className="w-3 h-3 rounded bg-[#7851A9] flex items-center justify-center text-[8px] text-white">●</div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/60 flex items-center justify-center text-[8px] text-red-100">!</div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-400">-</div>
            <span>Not Due</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-lavender/40 animate-pulse">
          Constructing multidimensional compliance matrix...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Heatmap Responsive Grid */}
          <div className="overflow-x-auto select-none">
            <div className="min-w-[650px] space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 items-center text-[10px] font-mono tracking-widest uppercase font-bold text-lavender/40 pb-2 border-b border-white/5 px-2">
                <div className="col-span-4">Sector / Department</div>
                <div className="col-span-1 text-center">Score</div>
                {weekSundays.map((wk, i) => (
                  <div key={i} className="col-span-1.4 text-center truncate px-1">
                    {wk.label}
                  </div>
                ))}
              </div>

              {/* Table Body Rows */}
              {rows.map((row, idx) => (
                <div 
                  key={idx}
                  className="grid grid-cols-12 items-center bg-[#0B0118]/40 hover:bg-[#0B0118]/70 rounded-xl p-2.5 border border-white/5 transition-all"
                >
                  {/* Department Title */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/40 border border-purple-500/10 flex items-center justify-center text-purple-400">
                      <UserSquare2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{row.unitName}</h4>
                      <p className="text-[10px] text-[#B193FB] truncate">{row.leaderName}</p>
                    </div>
                  </div>

                  {/* Compliance Score Badges */}
                  <div className="col-span-1 flex justify-center">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                      row.complianceScore >= 80 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : row.complianceScore >= 50
                        ? "bg-purple-500/10 text-[#B193FB] border-purple-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {row.complianceScore}%
                    </span>
                  </div>

                  {/* Heatmap entries */}
                  {weekSundays.map((wk, wIdx) => {
                    const cell = row.cells[wk.dateStr];
                    const isSelected = selectedCell?.unitName === row.unitName && selectedCell?.cell.dateStr === wk.dateStr;

                    return (
                      <div 
                        key={wIdx} 
                        className="col-span-1.4 flex justify-center py-1"
                      >
                        <button
                          onClick={() => setSelectedCell({ unitName: row.unitName, leaderName: row.leaderName, cell })}
                          className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                            cell.status === "verified"
                              ? "bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              : cell.status === "pending"
                              ? "bg-[#7851A9] hover:bg-[#8e60c4] text-white cursor-pointer"
                              : cell.status === "late"
                              ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/80 text-red-200 cursor-pointer"
                              : "bg-zinc-800/30 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                          } ${isSelected ? "ring-2 ring-white scale-110 z-10" : ""}`}
                        >
                          {cell.status === "verified" && <CheckCircle2 className="w-4 h-4" />}
                          {cell.status === "pending" && <Clock className="w-4 h-4 text-purple-100" />}
                          {cell.status === "late" && <AlertCircle className="w-4 h-4 text-red-400" />}
                          {cell.status === "not-due" && <Minus className="w-3 h-3 text-zinc-600" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Stats and Nudge Panel */}
          {selectedCell ? (
            <div className="bg-[#0B0118]/60 border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${
                  selectedCell.cell.status === "verified"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : selectedCell.cell.status === "pending"
                    ? "bg-purple-500/20 text-[#B193FB] border border-purple-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{selectedCell.unitName}</h4>
                    <span className="text-white/40 text-[10px]">•</span>
                    <span className="text-[11px] font-mono font-bold text-lavender/60">{selectedCell.cell.weekLabel}</span>
                  </div>

                  <p className="text-xs text-lavender/40 mt-1">Leader: {selectedCell.leaderName}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="text-xs text-white/80">
                      Status:{" "}
                      <span className={`font-bold ${
                        selectedCell.cell.status === "verified"
                          ? "text-emerald-400"
                          : selectedCell.cell.status === "pending"
                          ? "text-[#B193FB]"
                          : "text-red-400"
                      }`}>
                        {selectedCell.cell.status === "verified" && "✓ Approved & Verified"}
                        {selectedCell.cell.status === "pending" && "● Pending Review"}
                        {selectedCell.cell.status === "late" && "Overdue (No Submission)"}
                      </span>
                    </div>

                    {selectedCell.cell.attendance !== undefined && (
                      <div className="text-xs text-white/80 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Attendance: <strong className="text-white font-bold">{selectedCell.cell.attendance}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {selectedCell.cell.status === "late" ? (
                  <button
                    onClick={() => triggerSingleNudge(selectedCell.unitName, selectedCell.leaderName, selectedCell.cell.weekLabel)}
                    className="w-full md:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Force Nudge Leader
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl font-medium w-full text-center">
                    {selectedCell.cell.status === "verified" ? "Submission holds verified integrity." : "Awaiting admin audit decision."}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0118]/20 border border-dashed border-white/5 rounded-2xl p-4 flex items-center justify-center text-center py-6">
              <div className="flex items-center gap-2 text-lavender/30 text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Interact with any heatmap tile above to inspect metrics and nudge delinquent leaders.</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

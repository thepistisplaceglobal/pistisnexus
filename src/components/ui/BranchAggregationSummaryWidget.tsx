import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "./GlassCard";
import { ReportService, BranchReportSummary } from "@/services/reportService";
import { useAppStore } from "@/store/useAppStore";
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Users, 
  GraduationCap, 
  Compass, 
  Layers, 
  ArrowRight,
  TrendingUp,
  DollarSign
} from "lucide-react";

export function BranchAggregationSummaryWidget() {
  const user = useAppStore((state) => state.user);
  const [summary, setSummary] = useState<BranchReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    if (!user?.branchName) return;
    try {
      setLoading(true);
      const data = await ReportService.compileBranchSummary(user.branchName);
      setSummary(data);
    } catch (err) {
      console.error("Error fetching compilation summary on dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "BRANCH_ADMIN") {
      fetchSummary();
      // Auto-reload summary every 15 seconds to stream updates
      const interval = setInterval(fetchSummary, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || user.role !== "BRANCH_ADMIN") return null;

  return (
    <GlassCard className="p-6 border border-purple-500/10 bg-purple-950/5 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 text-lilac">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold">Branch Aggregation Engine</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Cross-Sector Compilation</h3>
        </div>
        <Link 
          to="/reports" 
          className="text-xs text-[#B193FB] hover:text-white transition-colors flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 font-bold"
        >
          Manage Reports <ArrowRight className="w-3   h-3" />
        </Link>
      </div>

      {loading && !summary ? (
        <div className="py-6 text-center text-xs text-lavender/40 animate-pulse">
          Computing real-time cross-sector aggregations...
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Sectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sector 1: Departments */}
            <div className="p-3 bg-[#0B0118]/40 border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-lavender/60 font-medium">Departments</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {summary?.departmentStatus.filter(d => d.verified).length} / {summary?.departmentStatus.length}
                </p>
                <p className="text-[10px] text-lavender/40 mt-1">Verified Submissions</p>
              </div>
            </div>

            {/* Sector 2: Home Cells */}
            <div className="p-3 bg-[#0B0118]/40 border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-lavender/60 font-medium">Cell Units</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {summary?.cellsStatus.submitted} / {summary?.cellsStatus.total}
                </p>
                <p className="text-[10px] text-lavender/40 mt-1">Active Cell Turnouts</p>
              </div>
            </div>

            {/* Sector 3: Interest Groups */}
            <div className="p-3 bg-[#0B0118]/40 border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-lavender/60 font-medium">Interest Groups</span>
                <Compass className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {summary?.interestGroupsStatus?.submitted || 0} / {summary?.interestGroupsStatus?.total || 3}
                </p>
                <p className="text-[10px] text-lavender/40 mt-1">Group Analytics In</p>
              </div>
            </div>

            {/* Sector 4: Foundation School */}
            <div className="p-3 bg-[#0B0118]/40 border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-lavender/60 font-medium">Foundation School</span>
                <GraduationCap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#60a5fa]">
                  {summary?.foundationStatus?.submitted ? "100%" : "Pending"}
                </p>
                <p className="text-[10px] text-lavender/40 mt-1">
                  {summary?.foundationStatus?.submitted 
                    ? `${summary.foundationStatus.enrolledCount} active • ${summary.foundationStatus.graduatedCount} grads`
                    : "Awaiting leader upload"}
                </p>
              </div>
            </div>
          </div>

          {/* Aggregated Real-Time Metrics Indicator */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <TrendingUp className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Projected Branch Attendance</h4>
                <p className="text-xs text-lavender/60">Calculated sum of active check-ins & class roll-calls</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 bg-[#12042b]/60 px-4 py-2 rounded-xl border border-purple-500/25">
              <span className="text-2xl font-black text-white">{summary?.totalAttendance || 0}</span>
              <span className="text-[10px] uppercase font-mono font-bold text-[#B193FB] tracking-wider">attendees</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

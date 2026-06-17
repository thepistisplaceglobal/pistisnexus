import { GlassCard } from "@/components/ui/GlassCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { 
  FileText, CheckCircle2, Clock, ArrowRightCircle, CheckSquare, 
  UploadCloud, Users, Network, Shield, Download, MessageSquare, 
  X, Check, AlertTriangle, Send, ChevronRight, CornerDownRight 
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";
import { BranchReportPreviewModal } from "@/components/ui/BranchReportPreviewModal";
import { WeeklyReportFormModal } from "@/components/ui/WeeklyReportFormModal";
import { ReportService, UnitReport, BranchReport, BranchReportSummary } from "@/services/reportService";
import { NotificationService } from "@/services/notificationService";

export function Reports() {
  const user = useAppStore(state => state.user);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dynamic report lists
  const [livePendingUnits, setLivePendingUnits] = useState<UnitReport[]>([]);
  const [liveAllUnitReports, setLiveAllUnitReports] = useState<UnitReport[]>([]);
  const [livePendingBranches, setLivePendingBranches] = useState<BranchReport[]>([]);
  const [liveArchivedBranches, setLiveArchivedBranches] = useState<BranchReport[]>([]);
  const [compiledSummary, setCompiledSummary] = useState<BranchReportSummary | null>(null);
  
  // Coordinator specific states
  const [coordinatorPending, setCoordinatorPending] = useState<UnitReport[]>([]);
  const [isCollationModalOpen, setIsCollationModalOpen] = useState(false);

  // Review/Audit Drawer State
  const [activeReview, setActiveReview] = useState<{
    type: "BRANCH" | "UNIT";
    report: any;
  } | null>(null);
  const [minuteText, setMinuteText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reload handler
  const loadReportsData = async () => {
    if (!user) return;
    
    // Always load branch unit reports if the user is associated with a branch
    if (user.branchName) {
      const allBranchUnits = await ReportService.getBranchUnitReports(user.branchName);
      setLiveAllUnitReports(allBranchUnits);
    }

    if (user.role === "BRANCH_ADMIN" && user.branchName) {
      const pendingUnits = await ReportService.getPendingUnitReports(user.branchName);
      setLivePendingUnits(pendingUnits);

      const summary = await ReportService.compileBranchSummary(user.branchName);
      setCompiledSummary(summary);
    }

    if (user.role === "CELL_COORDINATOR" && user.branchName) {
      const pendingCells = await ReportService.getPendingCoordinatorReports(user.branchName);
      setCoordinatorPending(pendingCells);
    }

    if (user.role === "GLOBAL_ADMIN") {
      const pendingB = await ReportService.getPendingBranchReports();
      setLivePendingBranches(pendingB);

      const archivedB = await ReportService.getArchivedBranchReports();
      setLiveArchivedBranches(archivedB);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [user]);

  const handleBranchSubmit = async (data: { inflow: number; expenses: number; generalNote: string }) => {
    setIsSubmitting(true);
    try {
      if (user && user.branchName && compiledSummary) {
        await ReportService.approveAndSubmitBranchReport(
          user.branchName,
          user.name,
          compiledSummary,
          data
        );
        await loadReportsData();
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
    setIsPreviewOpen(false);
  };

  const handleSaveMinute = async () => {
    if (!activeReview || !minuteText.trim()) return;
    setIsUpdatingStatus(true);
    try {
      const cleanMinutes = activeReview.report.minutes 
        ? `${activeReview.report.minutes}\n\n[HQ Minute - ${new Date().toLocaleDateString()}]: ${minuteText}` 
        : `[HQ Minute - ${new Date().toLocaleDateString()}]: ${minuteText}`;

      if (activeReview.type === "BRANCH") {
        await ReportService.updateBranchReportStatus(
          activeReview.report.id, 
          activeReview.report.status, 
          cleanMinutes
        );
      } else {
        await ReportService.updateUnitReportStatus(
          activeReview.report.id, 
          activeReview.report.status, 
          cleanMinutes
        );
      }
      setMinuteText("");
      await loadReportsData();
      
      // Update local review object so change shows immediately
      setActiveReview(prev => {
        if (!prev) return null;
        return {
          ...prev,
          report: {
            ...prev.report,
            minutes: cleanMinutes
          }
        };
      });
    } catch (err) {
      console.error(err);
    }
    setIsUpdatingStatus(false);
  };

  const handleUpdateStatusAndSaveMinute = async (newStatus: "APPROVED" | "REJECTED" | "APPROVED_BY_BRANCH") => {
    if (!activeReview) return;
    setIsUpdatingStatus(true);
    try {
      // Build updated minutes log
      let cleanMinutes = activeReview.report.minutes || "";
      if (minuteText.trim()) {
        const signature = user?.role === "GLOBAL_ADMIN" ? "HQ Admin" : "Branch Admin";
        cleanMinutes = cleanMinutes
          ? `${cleanMinutes}\n\n[Minute (${signature}) - ${new Date().toLocaleDateString()}]: ${minuteText}`
          : `[Minute (${signature}) - ${new Date().toLocaleDateString()}]: ${minuteText}`;
      }

      const success = activeReview.type === "BRANCH" 
        ? await ReportService.updateBranchReportStatus(activeReview.report.id, newStatus, cleanMinutes || undefined)
        : await ReportService.updateUnitReportStatus(activeReview.report.id, newStatus, cleanMinutes || undefined);

      if (success) {
        setMinuteText("");
        setActiveReview(null);
        await loadReportsData();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
    setIsUpdatingStatus(false);
  };

  const handleCreateCollation = async (focusText: string, generalRemarks: string) => {
    setIsSubmitting(true);
    try {
      if (user && user.branchName) {
        let aggTotalMembership = 0;
        let aggAttendance = 0;
        let aggFirstTimers = 0;
        let aggNewConverts = 0;
        let aggOffering = 0;

        coordinatorPending.forEach(p => {
          const m = p.metrics || {};
          aggTotalMembership += parseInt(m["Total membership"] || "0") || 0;
          aggAttendance += parseInt(m["Number of members present"] || "0") || 0;
          aggFirstTimers += parseInt(m["Number of first timers"] || "0") || 0;
          aggNewConverts += parseInt(m["New converts"] || "0") || 0;
          aggOffering += parseInt(m["Cell offering amount (₦)"] || "0") || 0;
        });

        const aggregatedMetrics = {
          "Total membership": aggTotalMembership,
          "Number of members present": aggAttendance,
          "Number of first-time guests": aggFirstTimers,
          "New converts": aggNewConverts,
          "Cell offering amount (₦)": aggOffering,
          "Focus for the week": focusText || "Cells Unified Weekly Fellowship",
          "General remarks & prayer requests": generalRemarks || `Successfully compiled from ${coordinatorPending.length} reporting cells.`,
          "cells_submitted_count": coordinatorPending.length
        };

        const ids = coordinatorPending.map(p => p.id);

        const success = await ReportService.collateAndSubmitCellCoordinatorReport(
          user.branchName,
          user.name,
          user.id,
          ids,
          aggregatedMetrics
        );

        if (success) {
          setIsCollationModalOpen(false);
          await loadReportsData();
          NotificationService.triggerNotification(
            "📈 Cells Consolidated Report Submitted",
            `A unified cells weekly group summary reporting for ${coordinatorPending.length} cells is successfully forwarded to the branch administration.`,
            "report"
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const renderCoordinatorView = () => {
    let aggTotalMembership = 0;
    let aggAttendance = 0;
    let aggFirstTimers = 0;
    let aggNewConverts = 0;
    let aggOffering = 0;

    coordinatorPending.forEach(p => {
      const m = p.metrics || {};
      aggTotalMembership += parseInt(m["Total membership"] || "0") || 0;
      aggAttendance += parseInt(m["Number of members present"] || "0") || 0;
      aggFirstTimers += parseInt(m["Number of first timers"] || "0") || 0;
      aggNewConverts += parseInt(m["New converts"] || "0") || 0;
      aggOffering += parseInt(m["Cell offering amount (₦)"] || "0") || 0;
    });

    const coordinatorHistory = liveAllUnitReports.filter(u => u.unit_name === 'Cells Group Summary');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Aggregated Analytics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-500">
            <GlassCard className="p-4 flex flex-col justify-between border-purple-500/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-lavender/60">Total Reporting Cells</span>
              <p className="text-2xl font-black text-white mt-2 font-mono">{coordinatorPending.length}</p>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col justify-between border-purple-500/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-lavender/60">Aggregated Attendance</span>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{aggAttendance}</p>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col justify-between border-purple-500/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-lavender/60">Total First Guests</span>
              <p className="text-2xl font-black text-sky-400 mt-2 font-mono">{aggFirstTimers}</p>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col justify-between border-purple-500/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-lavender/60">Total Offering</span>
              <p className="text-xl font-black text-amber-400 mt-2 font-mono">₦{aggOffering.toLocaleString()}</p>
            </GlassCard>
          </div>

          {/* Core Call-to-action Action Box */}
          <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between text-left gap-4 bg-gradient-to-r from-deep-violet/40 to-royal-purple/20 border-royal-purple/30">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Collate Cells & Submit Weekly Report</h3>
              <p className="text-sm text-lavender/80">
                Instantly aggregate and combine operating metrics from {coordinatorPending.length} pending fellowship cells to submit the weekly consolidated Cells Group Summary to the branch admin.
              </p>
            </div>
            <ActionButton 
              onClick={() => setIsCollationModalOpen(true)} 
              disabled={coordinatorPending.length === 0}
              className="whitespace-nowrap gap-2 disabled:opacity-50"
            >
              <ArrowRightCircle className="w-4 h-4" /> Collate & Submit
            </ActionButton>
          </GlassCard>

          {/* Pending Cell Reports List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Pending Fellowship Reports</h3>
              <span className="text-xs bg-amber-400/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">
                {coordinatorPending.length} cell reports received
              </span>
            </div>

            {coordinatorPending.length === 0 ? (
              <div className="text-center py-8 text-emerald-400/70 text-sm flex flex-col items-center gap-2 border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5">
                <CheckCircle2 className="w-6 h-6 opacity-50" />
                <p>All cell reports have been successfully approved and collated!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {coordinatorPending.map((u) => (
                  <GlassCard 
                    key={u.id}
                    onClick={() => setActiveReview({ type: "UNIT", report: u })}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-all group cursor-pointer border hover:border-purple-500/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <FileText className="w-4 h-4 text-lilac" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {u.unit_name} Report
                        </h4>
                        <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                          <span>Submitted {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>By {u.submitter_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Collation
                      </span>
                      <button className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-purple-500/30">
                        Review Details
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Consolidated Reports History */}
          <div>
            <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mt-8 mb-4">Cells Group Compilation History</h3>
            {coordinatorHistory.length === 0 ? (
              <div className="text-center py-5 bg-white/5 rounded-xl border border-white/5 text-xs text-white/30 italic">No historical consolidated summaries loaded.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {coordinatorHistory.map(u => (
                  <GlassCard 
                    key={u.id}
                    onClick={() => setActiveReview({ type: "UNIT", report: u })}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{u.unit_name}</h4>
                        <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                          <span>{new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>By {u.submitter_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center gap-1 ${
                        u.status === "APPROVED_BY_BRANCH" ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        {u.status === "APPROVED_BY_BRANCH" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {u.status === "APPROVED_BY_BRANCH" ? "Approved by Branch Admin" : "Submitted to Branch"}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex flex-col gap-4">
          <InfoSidebar 
            icon={<Users className="w-6 h-6"/>} 
            title="Cells Coordination Pipeline" 
            desc="Home Cell Leaders submit report metrics by Sunday 6:00 PM. Review all entries and click Collate & Submit before Sunday 11:59 PM to push consolidated cells reports up to the branch administrator." 
          />
        </div>
      </div>
    );
  };

  const renderSubBranchView = () => {
    let typeName = "Department";
    if (user?.role === "CELL_LEADER") typeName = "Home Cell";
    if (user?.role === "INTEREST_GROUP_LEADER") typeName = "Interest Group";
    if (user?.role === "FOUNDATION_LEADER") typeName = "Foundation School";

    // Dynamic reports for the active leader (fetched from general state fallback or live list)
    const recentSubmissions = liveAllUnitReports.filter(u => u.submitted_by === user?.id || u.submitter_name === user?.name || (user?.role === "FOUNDATION_LEADER" && u.unit_type === "FOUNDATION"));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassCard className="p-8 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 border-royal-purple/40 bg-royal-purple/5">
            <UploadCloud className="w-12 h-12 text-lilac" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Submit Weekly {typeName} Report</h3>
              <p className="text-sm text-lavender/80">Your metrics will aggregate centrally for your assigned branch admin to overview.</p>
            </div>
            <ActionButton onClick={() => setIsWeeklyReportOpen(true)} className="mt-4 gap-2">
              <FileText className="w-4 h-4" /> Start Report
            </ActionButton>
          </GlassCard>

          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mt-4">Your Recent Submissions</h3>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-white/40 italic text-xs">
              No reports submitted recently. Start by clicking the button above!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentSubmissions.map((report) => (
                <GlassCard 
                  key={report.id} 
                  onClick={() => setActiveReview({ type: "UNIT", report })}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <FileText className="w-4 h-4 text-lilac" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {report.unit_name} Report
                      </h4>
                      <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                        <span>{new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>By {report.submitter_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center gap-1 ${
                      report.status === "APPROVED_BY_BRANCH" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {report.status === "APPROVED_BY_BRANCH" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {report.status === "APPROVED_BY_BRANCH" ? "Approved" : "Pending Branch Review"}
                    </span>
                    {report.minutes && (
                      <span className="text-[10px] bg-sky-500/10 border border-sky-500/30 text-sky-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" /> Has Minutes
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <InfoSidebar 
            icon={<Users className="w-6 h-6"/>} 
            title={`${typeName} Pipeline`} 
            desc={`${typeName} Leaders submit operational metrics directly to the Branch Administration for weekly aggregation.`} 
          />
        </div>
      </div>
    );
  };

  const renderBranchView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Pending Unit Reports</h3>
            <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded-full font-bold">
              {livePendingUnits.length} Requires Review
            </span>
          </div>

          {livePendingUnits.length === 0 ? (
            <div className="text-center py-8 text-emerald-400/70 text-sm flex flex-col items-center gap-2 border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5">
              <CheckCircle2 className="w-6 h-6 opacity-50" />
              <p>No reports pending your review right now!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {livePendingUnits.map((u) => (
                <GlassCard 
                  key={u.id}
                  onClick={() => setActiveReview({ type: "UNIT", report: u })}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-all group cursor-pointer border hover:border-purple-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <FileText className="w-4 h-4 text-lilac" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {u.unit_name} Compilation
                      </h4>
                      <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                        <span>Submitted {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>By {u.submitter_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Needs Audit
                    </span>
                    <button className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-purple-500/30">
                      Audit
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          <GlassCard className="p-8 flex flex-col sm:flex-row items-center justify-between text-left gap-4 mt-8 bg-gradient-to-r from-deep-violet/40 to-royal-purple/20">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Aggregate & Submit Branch Report</h3>
              <p className="text-sm text-lavender/80">
                Review all department, cell, and interest group metrics to compile and post the final {user?.branchName} overview to Global HQ.
              </p>
            </div>
            <ActionButton onClick={() => setIsPreviewOpen(true)} className="whitespace-nowrap gap-2">
              <ArrowRightCircle className="w-4 h-4" /> Preview & Submit
            </ActionButton>
          </GlassCard>

          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mt-8 mb-4">Branch Report History</h3>
          {liveAllUnitReports.filter(u => u.status !== 'PENDING_BRANCH').length === 0 ? (
            <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5 text-xs text-white/30 italic">No archived unit reports.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {liveAllUnitReports.filter(u => u.status !== 'PENDING_BRANCH').map(u => (
                <GlassCard 
                  key={u.id}
                  onClick={() => setActiveReview({ type: "UNIT", report: u })}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{u.unit_name} Report</h4>
                      <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                        <span>{new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>By {u.submitter_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] tracking-wider font-bold text-emerald-400 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                    {u.minutes && (
                      <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                        Has Comments
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <InfoSidebar 
          icon={<Network className="w-6 h-6"/>} 
          title="Branch Pipeline" 
          desc="Branch Admins review and approve all department, cell, and group reports, then aggregate findings into a single Branch Report for HQ." 
        />
      </div>
    </div>
  );

  const renderGlobalView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Pending Branch Reports</h3>
            <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded-full font-bold">
              {livePendingBranches.length} Requires Review
            </span>
          </div>

          {livePendingBranches.length === 0 ? (
            <div className="text-center py-8 text-emerald-400/70 text-sm flex flex-col items-center gap-1.5 border border-dashed border-emerald-500/25 rounded-xl bg-emerald-500/5">
              <CheckCircle2 className="w-6 h-6 opacity-60" />
              <p>All branch reports are currently audited & cleared!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {livePendingBranches.map((br) => (
                <GlassCard 
                  key={br.id}
                  onClick={() => setActiveReview({ type: "BRANCH", report: br })}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-all group cursor-pointer border border-pink-500/10 hover:border-pink-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                      <FileText className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {br.branch_name} Weekly Report Summary
                      </h4>
                      <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                        <span>Submitted {new Date(br.created_at).toLocaleDateString()} at {new Date(br.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>By {br.submitter_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Audit Required
                    </span>
                    <button className="flex items-center gap-1 bg-pink-500/20 hover:bg-pink-500/40 text-pink-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-pink-500/30">
                      HQ Review
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4 mt-6">Recently Archived & Approved</h3>
          {liveArchivedBranches.length === 0 ? (
            <div className="text-center py-6 text-white/30 italic text-xs bg-white/5 border border-white/5 rounded-xl">
              No reports archived recently.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {liveArchivedBranches.map((br) => (
                <GlassCard 
                  key={br.id}
                  onClick={() => setActiveReview({ type: "BRANCH", report: br })}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {br.branch_name} Weekly Report
                      </h4>
                      <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                        <span>{new Date(br.created_at).toLocaleDateString()} at {new Date(br.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>By {br.submitter_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                    {br.minutes && (
                      <span className="text-[10px] bg-purple-500/25 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold font-sans">
                        Has Minutes
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <InfoSidebar 
          icon={<Shield className="w-6 h-6"/>} 
          title="Global Pipeline" 
          desc="Global Admins receive compiled Branch Reports, audit the details, write formal administrative minutes, and close weekly records." 
        />
      </div>
    </div>
  );

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    
    let title = "The Pistis Place Global Report";
    if (user?.role === 'BRANCH_ADMIN') {
       title = `${user?.branchName} Branch Report`;
    } else if (user?.role && user?.role !== 'GLOBAL_ADMIN') {
       title = `${user?.groupName || user?.deptName} Department Report`;
    }
    
    doc.text(title, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(user?.role === 'GLOBAL_ADMIN' || user?.role === 'BRANCH_ADMIN' ? "Financial Overview (MTD)" : "Operational Metrics (MTD)", 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value", "Trend"]],
      body: user?.role === 'GLOBAL_ADMIN' || user?.role === 'BRANCH_ADMIN' ? [
        ["Total Income", "₦139,000,000", "+8.2%"],
        ["Total Expenses", "₦60,700,000", "-4.1%"],
        ["Reserve Fund", "₦420,000,000", "+2.5%"],
        ["Digital Giving %", "82%", "+5.0%"]
      ] : [
        ["Total Budget Used", "₦450,000", "-2.2%"],
        ["Tasks Completed", "18", "+12.1%"],
        ["Active Volunteers", "45", "+2.5%"]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 81, 169] }
    });
    
    const finalY1 = (doc as any).lastAutoTable.finalY || 100;
    
    doc.text("Activity & Engagement (MTD)", 14, finalY1 + 15);
    
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [["Metric", "Value", "Trend"]],
      body: [
        ["Total Attendance", "12,450", "+14.5%"],
        ["First Timers", "412", "+12.1%"],
        ["Active Reporting Units", "12", "0%"],
        ["Assigned Tasks", "86", "+5.2%"]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 81, 169] }
    });
    
    const safeRole = user?.role || "Global";
    doc.save(`The_Pistis_Place_${safeRole}_Report.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            {user?.role === 'GLOBAL_ADMIN' ? 'Global Intelligence Review' : 
             user?.role === 'BRANCH_ADMIN' ? 'Branch Reporting Pipeline' : 
             user?.role === 'FOUNDATION_LEADER' ? 'Foundation School Submission' :
             user?.role === 'CELL_COORDINATOR' ? 'Home Cells Coordinator Hub' :
             'Department Submission'}
          </h1>
          <p className="text-lilac/80 font-medium">Reporting Progression System</p>
        </div>
        
        <ActionButton onClick={generatePDFReport} className="gap-2">
          <Download className="w-4 h-4" /> Print/Export
        </ActionButton>
      </header>

      {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER', 'FOUNDATION_LEADER'].includes(user?.role || '') && renderSubBranchView()}
      {user?.role === 'CELL_COORDINATOR' && renderCoordinatorView()}
      {user?.role === 'BRANCH_ADMIN' && renderBranchView()}
      {user?.role === 'GLOBAL_ADMIN' && renderGlobalView()}

      {/* DETAILED CONTEXT-SENSITIVE AUDIT & REPLY DRAWER (MODAL) */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-full bg-[#0E031E] border-l border-white/10 p-6 flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeReview.type === "BRANCH" ? `Branch: ${activeReview.report.branch_name}` : `Unit: ${activeReview.report.unit_name}`} Report Review
                  </h3>
                  <p className="text-xs text-lavender/60">
                    ID: {activeReview.report.id} • Submitted by {activeReview.report.submitter_name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveReview(null)}
                className="p-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content/Metrics Grid */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-lilac font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Performance Metrics
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeReview.type === "BRANCH" ? (
                  <>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50">Sunday Attendance</p>
                      <p className="text-base font-bold text-white mt-1">{activeReview.report.metrics?.attendance || "N/A"}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50">Financial Inflow</p>
                      <p className="text-base font-bold text-emerald-400 mt-1">₦{(activeReview.report.metrics?.inflow || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50">Financial Outflow</p>
                      <p className="text-base font-bold text-red-400 mt-1">₦{(activeReview.report.metrics?.expenses || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50">New Guests</p>
                      <p className="text-base font-bold text-cyan-300 mt-1">{activeReview.report.metrics?.first_time_guests || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50">Status</p>
                      <p className="text-sm font-bold text-amber-400 mt-1.5 uppercase tracking-wide">{activeReview.report.status}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {Object.entries(activeReview.report.metrics || {}).map(([key, val]) => (
                      <div key={key} className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                        <p className="text-[10px] uppercase font-mono tracking-wider text-lavender/50 leading-tight">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-bold text-white mt-1 whitespace-pre-wrap">{String(val)}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {activeReview.type === "BRANCH" && activeReview.report.metrics?.generalNote && (
                <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-3">
                  <h5 className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold mb-1">Submitter Note</h5>
                  <p className="text-xs text-white/90 leading-relaxed italic">
                    "{activeReview.report.metrics.generalNote}"
                  </p>
                </div>
              )}
            </div>

            {/* Official Minutes/Comments */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <h4 className="text-xs font-mono uppercase tracking-wider text-lilac font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Official Executive Minutes & Comments
              </h4>

              <div className="flex-1 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 custom-scrollbar min-h-[120px]">
                {activeReview.report.minutes ? (
                  activeReview.report.minutes.split("\n\n").map((msg: string, idx: number) => {
                    const isHq = msg.includes("HQ");
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg leading-relaxed text-xs border ${
                          isHq 
                            ? "bg-purple-950/20 border-purple-800/40 text-purple-200" 
                            : "bg-emerald-950/10 border-emerald-900/40 text-emerald-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold uppercase tracking-wider opacity-90">
                          <CornerDownRight className="w-3 h-3 text-lavender/50" />
                          {isHq ? "HQ Executive Command" : "Branch Supervision Comments"}
                        </div>
                        <p className="whitespace-pre-wrap">{msg}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/30 italic text-xs gap-1.5">
                    <AlertTriangle className="w-6 h-6 text-white/20" />
                    No minutes recorded for this report stage yet.
                  </div>
                )}
              </div>
            </div>

            {/* Add Minute Form */}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
              <label className="text-[11px] font-mono uppercase text-lavender/60">
                Write Reply / Official Executive Minute
              </label>
              <textarea
                value={minuteText}
                onChange={(e) => setMinuteText(e.target.value)}
                placeholder="Type official comment, minutes or correctional responses..."
                className="w-full bg-[#0B0118]/60 border border-royal-purple/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-royal-purple resize-none placeholder-lavender/30 font-sans"
                rows={3}
              />

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="flex gap-2">
                  <ActionButton 
                    onClick={handleSaveMinute}
                    disabled={isUpdatingStatus || !minuteText.trim()}
                    className="!bg-purple-600 hover:!bg-purple-700 py-2 inline-flex items-center gap-1.5 text-xs text-white"
                  >
                    <Send className="w-3.5 h-3.5" /> Save Comment Only
                  </ActionButton>
                </div>

                <div className="flex gap-2">
                  {activeReview.report.status !== "APPROVED" && activeReview.report.status !== "APPROVED_BY_BRANCH" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatusAndSaveMinute(activeReview.type === "BRANCH" ? "APPROVED" : "APPROVED_BY_BRANCH")}
                        disabled={isUpdatingStatus}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Report
                      </button>
                      <button
                        onClick={() => handleUpdateStatusAndSaveMinute("REJECTED")}
                        disabled={isUpdatingStatus}
                        className="bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-900/60 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Reject/Return
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Embedded Modals */}
      <BranchReportPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onSubmit={handleBranchSubmit} 
        branchName={user?.branchName || "Unknown"}
        isSubmitting={isSubmitting}
        compiledSummary={compiledSummary}
      />
      <WeeklyReportFormModal
        isOpen={isWeeklyReportOpen}
        onClose={() => {
          setIsWeeklyReportOpen(false);
          loadReportsData();
        }}
      />

      {/* CELL COORDINATOR COLLATION WIZARD MODAL */}
      {isCollationModalOpen && (
        <CollationWizardModal
          isOpen={isCollationModalOpen}
          onClose={() => setIsCollationModalOpen(false)}
          coordinatorPending={coordinatorPending}
          onSubmit={handleCreateCollation}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// DRY sub-components

function InfoSidebar({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <GlassCard className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-[#0B0118]/60">
      <div className="p-3 bg-white/5 rounded-full border border-royal-purple/30 text-lilac">
        {icon}
      </div>
      <h3 className="font-bold text-white tracking-wide">{title}</h3>
      <p className="text-xs text-lavender/70 leading-relaxed">{desc}</p>
    </GlassCard>
  );
}

interface CollationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinatorPending: any[];
  onSubmit: (focusText: string, remarksText: string) => Promise<void>;
  isSubmitting: boolean;
}

function CollationWizardModal({ isOpen, onClose, coordinatorPending, onSubmit, isSubmitting }: CollationWizardModalProps) {
  const [focus, setFocus] = useState("Home Cells Weekly Fellowship");
  const [remarks, setRemarks] = useState("");

  let aggTotalMembership = 0;
  let aggAttendance = 0;
  let aggFirstTimers = 0;
  let aggNewConverts = 0;
  let aggOffering = 0;

  coordinatorPending.forEach(p => {
    const m = p.metrics || {};
    aggTotalMembership += parseInt(m["Total membership"] || "0") || 0;
    aggAttendance += parseInt(m["Number of members present"] || "0") || 0;
    aggFirstTimers += parseInt(m["Number of first timers"] || "0") || 0;
    aggNewConverts += parseInt(m["New converts"] || "0") || 0;
    aggOffering += parseInt(m["Cell offering amount (₦)"] || "0") || 0;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(focus, remarks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070112]/90 backdrop-blur-lg p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl p-7 relative bg-[#130626] border border-royal-purple/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 font-sans">
        <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-royal-purple/20 rounded-lg text-lilac">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Collate Cells Weekly Data</h3>
              <p className="text-xs text-lavender/60">Consolidating {coordinatorPending.length} cell report(s)</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Aggregated totals preview */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-lilac">Aggregated Metrics Preview</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                <span className="text-lavender/65 block">Cumulative Attendance</span>
                <p className="text-base font-bold text-emerald-400 mt-1 font-mono">{aggAttendance} members present</p>
              </div>
              <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                <span className="text-lavender/65 block">Cumulative First Guests</span>
                <p className="text-base font-bold text-sky-400 mt-1 font-mono">{aggFirstTimers} first timers</p>
              </div>
              <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                <span className="text-lavender/65 block">Cumulative New Converts</span>
                <p className="text-base font-bold text-purple-400 mt-1 font-mono">{aggNewConverts} converts</p>
              </div>
              <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                <span className="text-lavender/65 block">Total Cell Income</span>
                <p className="text-base font-bold text-amber-400 mt-1 font-mono">₦{aggOffering.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80 ml-1">Weekly Home Cells Focal Point</label>
            <input 
              type="text"
              required
              className="w-full bg-black/45 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-white/20 text-gray-100"
              placeholder="e.g. Focus on Evangelism & Small Groups"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80 ml-1">Consolidated Coordinator Remarks & Prayer Points</label>
            <textarea 
              rows={3}
              required
              className="w-full bg-black/45 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-white/20 text-gray-100"
              placeholder="Aggregate remarks, overall performance overview, prayer requests, or special needs reported across unit cells..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-white/10 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-white/10 rounded-xl text-white text-xs hover:bg-white/5 transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-royal-purple hover:bg-royal-purple/90 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
            >
              {isSubmitting ? "Submitting..." : "Collate & Submit to Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

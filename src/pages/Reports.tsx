import { GlassCard } from "@/components/ui/GlassCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { FileText, CheckCircle2, Clock, ArrowRightCircle, CheckSquare, UploadCloud, Users, Network, Shield, Download } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";
import { BranchReportPreviewModal } from "@/components/ui/BranchReportPreviewModal";
import { WeeklyReportFormModal } from "@/components/ui/WeeklyReportFormModal";
import { ReportService, UnitReport, BranchReportSummary } from "@/services/reportService";

export function Reports() {
  const user = useAppStore(state => state.user);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [livePendingUnits, setLivePendingUnits] = useState<UnitReport[]>([]);
  const [compiledSummary, setCompiledSummary] = useState<BranchReportSummary | null>(null);

  useEffect(() => {
    if (user?.role === 'BRANCH_ADMIN' && user?.branchName) {
      ReportService.getPendingUnitReports(user.branchName).then(setLivePendingUnits);
      ReportService.compileBranchSummary(user.branchName).then(setCompiledSummary);
    }
  }, [user]);

  // MOCK DATA BASED ON ROLES
  const pendingSubReports = [
    { id: "REP-DEPT-MEDIA", title: "Media Dept Wk3", status: "Pending Your Approval", time: "2 hours ago" },
    { id: "REP-CELL-A2", title: "Cell A2 Wk3", status: "Pending Your Approval", time: "3 hours ago" },
    { id: "REP-IG-TECH", title: "TECH Mountain Wk3", status: "Pending Your Approval", time: "4 hours ago" },
  ];

  const pendingBranchReports = [
    { id: "REP-BR-UYO", title: "Uyo Branch WK3", status: "Pending HQ Approval", time: "2 hours ago" },
    { id: "REP-BR-CALABAR", title: "Calabar Branch WK3", status: "Pending HQ Approval", time: "5 hours ago" },
  ];

  const renderSubBranchView = () => {
    let typeName = "Department";
    if (user?.role === "CELL_LEADER") typeName = "Home Cell";
    if (user?.role === "INTEREST_GROUP_LEADER") typeName = "Interest Group";

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 border-royal-purple/40 bg-royal-purple/5">
           <UploadCloud className="w-12 h-12 text-lilac" />
           <div>
             <h3 className="text-lg font-bold text-white mb-1">Submit Weekly {typeName} Report</h3>
             <p className="text-sm text-lavender/80">Your report will be sent to the {user?.branchName} Branch Admin for review.</p>
           </div>
           <ActionButton onClick={() => setIsWeeklyReportOpen(true)} className="mt-4 gap-2">
             <FileText className="w-4 h-4" /> Start Report
           </ActionButton>
        </GlassCard>

        <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mt-4">Your Recent Submissions</h3>
        <ReportList items={[
          { id: `REP-${user?.role?.substring(0, 4)}-12`, title: `${user?.groupName || user?.deptName} Wk2 Activity`, status: "Approved by Branch", time: "1 week ago", approved: true },
          { id: `REP-${user?.role?.substring(0, 4)}-11`, title: `${user?.groupName || user?.deptName} Wk1 Activity`, status: "Approved by Branch", time: "2 weeks ago", approved: true }
        ]} />
      </div>
      <div className="flex flex-col gap-4">
         <InfoSidebar icon={<Users className="w-6 h-6"/>} title={`${typeName} Pipeline`} desc={`${typeName} Leaders submit operational metrics directly to the Branch Administration for weekly aggregation.`} />
      </div>
    </div>
  )};

  const handleBranchSubmit = async (data: {inflow: number; expenses: number; generalNote: string}) => {
    setIsSubmitting(true);
    try {
      if (user && user.branchName && compiledSummary) {
        await ReportService.approveAndSubmitBranchReport(
           user.branchName,
           user.name,
           compiledSummary,
           data
        );
      }
    } catch(err) {
      console.error(err);
    }
    setIsSubmitting(false);
    setIsPreviewOpen(false);
    // Refresh pending units list
    if (user?.branchName) {
      ReportService.getPendingUnitReports(user.branchName).then(setLivePendingUnits);
    }
  };

  const renderBranchView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Pending Unit Reports</h3>
             <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded-full font-bold">{livePendingUnits.length} Requires Review</span>
           </div>
           <ReportList items={livePendingUnits.map(u => ({
             id: u.id.split('-')[0],
             title: `${u.unit_name} Wk3`,
             status: "Pending Your Approval",
             time: new Date(u.created_at).toLocaleTimeString()
           }))} actions={true} />
           {livePendingUnits.length === 0 && (
             <div className="text-center py-6 text-emerald-400/70 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 opacity-50" />
                <p>No reports pending your review right now!</p>
             </div>
           )}
        </div>

        <GlassCard className="p-8 flex flex-col sm:flex-row items-center justify-between text-left gap-4 mt-4 bg-gradient-to-r from-deep-violet/40 to-royal-purple/20">
           <div>
             <h3 className="text-lg font-bold text-white mb-1">Aggregate & Submit Branch Report</h3>
             <p className="text-sm text-lavender/80">Review all department, cell, and interest group metrics to submit the final {user?.branchName} branch overview to Global HQ.</p>
           </div>
           <ActionButton onClick={() => setIsPreviewOpen(true)} className="whitespace-nowrap gap-2">
             <ArrowRightCircle className="w-4 h-4" /> Preview & Submit
           </ActionButton>
        </GlassCard>
      </div>
      <div className="flex flex-col gap-4">
         <InfoSidebar icon={<Network className="w-6 h-6"/>} title="Branch Pipeline" desc="Branch Admins review and approve all department, cell, and group reports, then aggregate findings into a single Branch Report for HQ." />
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
    
    // Use slightly larger value of finalY
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

  const renderGlobalView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Pending Branch Reports</h3>
             <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded-full font-bold">{pendingBranchReports.length} Requires Review</span>
           </div>
           <ReportList items={pendingBranchReports} actions={true} />
        </div>

        <div>
           <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4 mt-6">Recently Archived & Approved</h3>
           <ReportList items={[
             { id: "REP-BR-HQ", title: "Uyo Branch WK2", status: "Archived & Approved", time: "1 week ago", approved: true },
             { id: "REP-BR-HQ2", title: "Calabar Branch WK2", status: "Archived & Approved", time: "1 week ago", approved: true }
           ]} />
        </div>
      </div>
      <div className="flex flex-col gap-4">
         <InfoSidebar icon={<Shield className="w-6 h-6"/>} title="Global Pipeline" desc="Global Admins receive compiled Branch Reports, feed data into the AI Intelligence engine, and finalize archiving." />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            {user?.role === 'GLOBAL_ADMIN' ? 'Global Intelligence Review' : 
             user?.role === 'BRANCH_ADMIN' ? 'Branch Reporting Pipeline' : 
             'Department Submission'}
          </h1>
          <p className="text-lilac/80 font-medium">Reporting Progression System</p>
        </div>
        
        <ActionButton onClick={generatePDFReport} className="gap-2">
           <Download className="w-4 h-4" /> Print/Export
        </ActionButton>
      </header>

      {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(user?.role || '') && renderSubBranchView()}
      {user?.role === 'BRANCH_ADMIN' && renderBranchView()}
      {user?.role === 'GLOBAL_ADMIN' && renderGlobalView()}

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
        onClose={() => setIsWeeklyReportOpen(false)}
      />
    </div>
  );
}

// Sub-components to keep UI DRY

function ReportList({ items, actions = false }: { items: any[], actions?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((report) => (
         <GlassCard key={report.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 shrink-0 rounded-full bg-royal-purple/20 flex items-center justify-center border border-royal-purple/30">
                  <FileText className="w-4 h-4 text-lilac" />
               </div>
               <div>
                  <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{report.title}</h4>
                  <div className="text-xs text-lavender/60 flex items-center gap-2 mt-1">
                     <span>{report.id}</span>
                     <span className="w-1 h-1 rounded-full bg-white/20" />
                     <span>{report.time}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
               <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center gap-1 ${
                  report.approved ? 'text-emerald-400' : 'text-amber-400'
               }`}>
                  {report.approved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {report.status}
               </span>
               {actions && !report.approved && (
                  <button className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-emerald-500/30 ml-auto">
                     <CheckSquare className="w-3 h-3" /> Approve
                  </button>
               )}
            </div>
         </GlassCard>
      ))}
    </div>
  );
}

function InfoSidebar({ icon, title, desc }: { icon: any, title: string, desc: string }) {
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

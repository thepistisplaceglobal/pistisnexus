import { GlassCard } from "./GlassCard";
import { ArrowRight, FileText, Shield, Network } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Link } from "react-router-dom";

interface ReportingWidgetProps {
  unitType: 'SubBranch' | 'Branch' | 'Global';
}

export function ReportingWidget({ unitType }: ReportingWidgetProps) {
  const user = useAppStore(state => state.user);
  
  if (unitType === 'SubBranch') {
    return (
      <GlassCard className="p-5 flex flex-col gap-3 bg-gradient-to-br from-royal-purple/20 to-transparent border-royal-purple/30 mx-0">
         <h3 className="text-sm font-bold tracking-wide uppercase text-lilac flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> Pipeline Alignment
         </h3>
         <p className="text-sm text-white/80">This unit reports directly to the <strong>{user?.branchName || 'Church'} Branch Administration</strong>.</p>
         <Link to="/reports" className="flex items-center justify-between mt-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group text-sm font-medium text-white">
            Access Reporting Portal
            <ArrowRight className="w-4 h-4 text-lilac group-hover:translate-x-1 transition-transform" />
         </Link>
      </GlassCard>
    );
  }

  if (unitType === 'Branch') {
    return (
      <GlassCard className="p-5 flex flex-col gap-3 bg-gradient-to-br from-royal-purple/20 to-transparent border-royal-purple/30 mx-0">
         <h3 className="text-sm font-bold tracking-wide uppercase text-lilac flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" /> Pipeline Alignment
         </h3>
         <p className="text-sm text-white/80">Branch operations aggregate local unit data (Cells, Groups, Depts) and report directly to <strong>Global HQ Admin</strong>.</p>
         <Link to="/reports" className="flex items-center justify-between mt-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group text-sm font-medium text-white">
            Manage Branch Reports
            <ArrowRight className="w-4 h-4 text-lilac group-hover:translate-x-1 transition-transform" />
         </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 flex flex-col gap-3 bg-gradient-to-br from-royal-purple/20 to-transparent border-royal-purple/30 mx-0">
       <h3 className="text-sm font-bold tracking-wide uppercase text-lilac flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" /> Pipeline Alignment
       </h3>
       <p className="text-sm text-white/80">Global Admin receives compiled Branch Reports to feed into the global intelligence engine.</p>
       <Link to="/reports" className="flex items-center justify-between mt-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group text-sm font-medium text-white">
          Review Global Reports
          <ArrowRight className="w-4 h-4 text-lilac group-hover:translate-x-1 transition-transform" />
       </Link>
    </GlassCard>
  );
}

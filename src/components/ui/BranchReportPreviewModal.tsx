import { GlassCard } from "./GlassCard";
import { ActionButton } from "./ActionButton";
import { X, CheckCircle2, TrendingUp, Users, DollarSign, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { BranchReportSummary } from "@/services/reportService";

interface BranchReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  onSubmit: (data: { inflow: number; expenses: number; generalNote: string }) => void;
  isSubmitting: boolean;
  compiledSummary?: BranchReportSummary | null;
}

export function BranchReportPreviewModal({ isOpen, onClose, branchName, onSubmit, isSubmitting, compiledSummary }: BranchReportPreviewModalProps) {
  const [inflow, setInflow] = useState("0");
  const [expenses, setExpenses] = useState("0");
  const [generalNote, setGeneralNote] = useState("All departments functioned optimally this week. Ready for HQ overview.");

  useEffect(() => {
    if (compiledSummary) {
       setInflow(compiledSummary.totalIncome.toString() || "0");
       setExpenses(compiledSummary.totalExpenses.toString() || "0");
    }
  }, [compiledSummary]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
           initial={{ scale: 0.95, y: 20 }}
           animate={{ scale: 1, y: 0 }}
           exit={{ scale: 0.95, y: 20 }}
           className="w-full max-w-2xl"
        >
          <GlassCard className="p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Branch Report: Final Review
                </h2>
                <p className="text-sm text-lavender/60 mt-1">Add branch financials & notes, then submit to HQ.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/50 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-2">
               <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-lilac font-medium mb-1">
                     <Users className="w-4 h-4" /> Aggregated Total Attendance
                  </div>
                  <span className="text-2xl font-bold text-white">{compiledSummary?.totalAttendance.toLocaleString() || '0'}</span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">From compiled cell & department reports</span>
               </div>

               <div className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                  <div className="flex items-center gap-2 text-lilac font-medium mb-1">
                     <TrendingUp className="w-4 h-4" /> First-Timers & Returnees
                  </div>
                  <div className="flex items-end gap-3 mt-1">
                     <div className="flex flex-col">
                       <span className="text-2xl font-bold text-white">{compiledSummary?.firstTimeGuests.toLocaleString() || '0'}</span>
                       <span className="text-[10px] uppercase font-medium text-emerald-400">First-Time Guests</span>
                     </div>
                     <div className="flex flex-col ml-4">
                       <span className="text-2xl font-bold text-white">{compiledSummary?.returningGuests.toLocaleString() || '0'}</span>
                       <span className="text-[10px] uppercase font-medium text-indigo-400">Returning Guests</span>
                     </div>
                  </div>
                  <span className="text-xs text-lilac/70 mt-3">— Aggregated from Follow-up department metrics</span>
               </div>

               <div className="space-y-4 pt-2 border-t border-white/5">
                 <h4 className="text-sm tracking-wide font-semibold text-lilac uppercase flex items-center gap-2">
                   <DollarSign className="w-4 h-4" /> Financial Summary
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-lavender/70 font-medium">Total Inflow (₦)</label>
                     <input 
                       type="number" 
                       value={inflow}
                       onChange={(e) => setInflow(e.target.value)}
                       className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-royal-purple"
                     />
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-lavender/70 font-medium">Total Expenses (₦)</label>
                     <input 
                       type="number" 
                       value={expenses}
                       onChange={(e) => setExpenses(e.target.value)}
                       className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-royal-purple"
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-3 pt-2 border-t border-white/5">
                 <h4 className="text-sm tracking-wide font-semibold text-lilac uppercase flex items-center gap-2">
                   <FileText className="w-4 h-4" /> General Branch Report Note
                 </h4>
                 <textarea 
                   rows={3}
                   value={generalNote}
                   onChange={(e) => setGeneralNote(e.target.value)}
                   placeholder="Enter any necessary general summary..."
                   className="w-full bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-royal-purple resize-none"
                 />
               </div>

               <div className="space-y-3 pt-2 border-t border-white/5">
                 <h4 className="text-sm tracking-wide font-semibold text-lilac uppercase">Departmental Summary (Auto)</h4>
                 <div className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg p-3 text-sm text-white/80 space-y-2">
                   {compiledSummary?.departmentStatus.map((dept, idx) => (
                     <div key={idx} className="flex justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                       <span>{dept.name}</span>
                       <span className={`font-medium ${dept.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                         {dept.verified ? 'Verified (Included)' : 'Pending Data'}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="space-y-3 pt-2 border-t border-white/5">
                 <h4 className="text-sm tracking-wide font-semibold text-lilac uppercase">Cell Metrics Tracker</h4>
                 <div className="bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg p-3 text-sm text-white/80">
                   <p className="flex justify-between">
                     <span>Cells that Submitted Metrics:</span>
                     <span className="font-bold text-emerald-400">{compiledSummary?.cellsStatus.submitted} / {compiledSummary?.cellsStatus.total}</span>
                   </p>
                 </div>
               </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
               <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                 Cancel
               </button>
               <ActionButton onClick={() => onSubmit({ inflow: Number(inflow), expenses: Number(expenses), generalNote })} disabled={isSubmitting}>
                 {isSubmitting ? "Submitting..." : "Confirm & Submit to HQ"}
               </ActionButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
